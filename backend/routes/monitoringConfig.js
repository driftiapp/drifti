const express = require('express');
const router = express.Router();
const fs = require('fs').promises;
const path = require('path');

const CONFIG_FILE = path.join(__dirname, '../data/monitoring_config.json');
const CONFIG_HISTORY_DIR = path.join(__dirname, '../data/config_history');

// Ensure config directory exists
const ensureConfigDir = async () => {
    const dir = path.dirname(CONFIG_FILE);
    try {
        await fs.access(dir);
    } catch {
        await fs.mkdir(dir, { recursive: true });
    }
};

// Ensure history directory exists
const ensureHistoryDir = async () => {
    try {
        await fs.access(CONFIG_HISTORY_DIR);
    } catch {
        await fs.mkdir(CONFIG_HISTORY_DIR, { recursive: true });
    }
};

// Load configuration
router.get('/', async (req, res) => {
    try {
        await ensureConfigDir();
        try {
            const data = await fs.readFile(CONFIG_FILE, 'utf8');
            res.json(JSON.parse(data));
        } catch (error) {
            // If file doesn't exist or is invalid, return empty config
            res.json({});
        }
    } catch (error) {
        console.error('Error loading config:', error);
        res.status(500).json({ error: 'Failed to load configuration' });
    }
});

// Save configuration
router.post('/', async (req, res) => {
    try {
        await ensureConfigDir();
        await ensureHistoryDir();

        // Add version and timestamp if not present
        const configToSave = {
            ...req.body,
            version: req.body.version || '1.0.0',
            lastModified: new Date().toISOString()
        };

        // Save current config
        await fs.writeFile(CONFIG_FILE, JSON.stringify(configToSave, null, 2));

        // Save to history
        const historyFile = path.join(CONFIG_HISTORY_DIR, `${Date.now()}.json`);
        await fs.writeFile(historyFile, JSON.stringify(configToSave, null, 2));

        res.json({ success: true, config: configToSave });
    } catch (error) {
        console.error('Error saving config:', error);
        res.status(500).json({ error: 'Failed to save configuration' });
    }
});

// Get configuration history
router.get('/history', async (req, res) => {
    try {
        await ensureHistoryDir();
        const files = await fs.readdir(CONFIG_HISTORY_DIR);
        const history = await Promise.all(
            files
                .filter(file => file.endsWith('.json'))
                .map(async file => {
                    const data = await fs.readFile(path.join(CONFIG_HISTORY_DIR, file), 'utf8');
                    return JSON.parse(data);
                })
        );
        res.json(history.sort((a, b) => new Date(b.lastModified) - new Date(a.lastModified)));
    } catch (error) {
        console.error('Error loading config history:', error);
        res.status(500).json({ error: 'Failed to load configuration history' });
    }
});

// Rollback to specific version
router.post('/rollback/:timestamp', async (req, res) => {
    try {
        await ensureHistoryDir();
        const historyFile = path.join(CONFIG_HISTORY_DIR, `${req.params.timestamp}.json`);
        
        try {
            const data = await fs.readFile(historyFile, 'utf8');
            const configToRestore = JSON.parse(data);
            
            // Save as current config
            await fs.writeFile(CONFIG_FILE, JSON.stringify(configToRestore, null, 2));
            
            res.json({ success: true, config: configToRestore });
        } catch (error) {
            res.status(404).json({ error: 'Configuration version not found' });
        }
    } catch (error) {
        console.error('Error rolling back config:', error);
        res.status(500).json({ error: 'Failed to rollback configuration' });
    }
});

// Compare two versions
router.get('/compare/:timestamp1/:timestamp2', async (req, res) => {
    try {
        await ensureHistoryDir();
        const file1 = path.join(CONFIG_HISTORY_DIR, `${req.params.timestamp1}.json`);
        const file2 = path.join(CONFIG_HISTORY_DIR, `${req.params.timestamp2}.json`);
        
        try {
            const [data1, data2] = await Promise.all([
                fs.readFile(file1, 'utf8'),
                fs.readFile(file2, 'utf8')
            ]);
            
            const config1 = JSON.parse(data1);
            const config2 = JSON.parse(data2);
            
            const diff = getConfigDiff(config1, config2);
            res.json(diff);
        } catch (error) {
            res.status(404).json({ error: 'One or both configuration versions not found' });
        }
    } catch (error) {
        console.error('Error comparing configs:', error);
        res.status(500).json({ error: 'Failed to compare configurations' });
    }
});

// Reset configuration to defaults
router.post('/reset', async (req, res) => {
    try {
        await ensureConfigDir();
        const defaultConfig = {
            version: '1.0.0',
            thresholds: {
                cpu: 0.8,
                memory: 0.85,
                latency: 1000
            },
            alerts: {
                email: true,
                slack: false,
                browser: true
            },
            autoScaling: {
                enabled: false,
                minInstances: 1,
                maxInstances: 5,
                scaleUpThreshold: 0.8,
                scaleDownThreshold: 0.3
            },
            display: {
                showP95: true,
                showP99: true,
                historicalDataPoints: 50
            }
        };
        await fs.writeFile(CONFIG_FILE, JSON.stringify(defaultConfig, null, 2));
        res.json({ success: true });
    } catch (error) {
        console.error('Error resetting config:', error);
        res.status(500).json({ error: 'Failed to reset configuration' });
    }
});

function getConfigDiff(config1, config2) {
    const diff = {
        added: {},
        removed: {},
        modified: {}
    };

    // Compare thresholds
    compareObjects(config1.thresholds, config2.thresholds, 'thresholds', diff);
    
    // Compare alerts
    compareObjects(config1.alerts, config2.alerts, 'alerts', diff);
    
    // Compare autoScaling
    compareObjects(config1.autoScaling, config2.autoScaling, 'autoScaling', diff);
    
    // Compare display
    compareObjects(config1.display, config2.display, 'display', diff);

    return diff;
}

function compareObjects(obj1, obj2, path, diff) {
    for (const key in obj1) {
        if (!(key in obj2)) {
            diff.removed[`${path}.${key}`] = obj1[key];
        } else if (obj1[key] !== obj2[key]) {
            diff.modified[`${path}.${key}`] = {
                old: obj1[key],
                new: obj2[key]
            };
        }
    }

    for (const key in obj2) {
        if (!(key in obj1)) {
            diff.added[`${path}.${key}`] = obj2[key];
        }
    }
}

module.exports = router; 