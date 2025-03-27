import { z } from 'zod';

// Schema for change metadata
const changeMetadataSchema = z.object({
    description: z.string().min(1),
    author: z.string().min(1),
    tags: z.array(z.string()).optional(),
    approvedBy: z.string().optional(),
    approvedAt: z.string().optional(),
    status: z.enum(['draft', 'pending', 'approved', 'rejected']).default('draft')
});

// Schema for thresholds configuration
const thresholdsSchema = z.object({
    cpu: z.number().min(0).max(1),
    memory: z.number().min(0).max(1),
    latency: z.number().min(0)
});

// Schema for alerts configuration
const alertsSchema = z.object({
    email: z.boolean(),
    slack: z.boolean(),
    browser: z.boolean()
});

// Schema for auto-scaling configuration
const autoScalingSchema = z.object({
    enabled: z.boolean(),
    minInstances: z.number().int().min(1),
    maxInstances: z.number().int().min(1),
    scaleUpThreshold: z.number().min(0).max(1),
    scaleDownThreshold: z.number().min(0).max(1)
});

// Schema for display configuration
const displaySchema = z.object({
    showP95: z.boolean(),
    showP99: z.boolean(),
    historicalDataPoints: z.number().int().min(1)
});

// Main configuration schema
export const configSchema = z.object({
    version: z.string(),
    metadata: changeMetadataSchema,
    thresholds: thresholdsSchema,
    alerts: alertsSchema,
    autoScaling: autoScalingSchema,
    display: displaySchema,
    lastModified: z.string().optional()
});

// Migration functions for different versions
const migrations = {
    '1.0.0': (config) => config, // Base version, no migration needed
    '1.1.0': (config) => ({
        ...config,
        display: {
            ...config.display,
            historicalDataPoints: config.display.historicalDataPoints || 50
        }
    }),
    '1.2.0': (config) => ({
        ...config,
        autoScaling: {
            ...config.autoScaling,
            scaleUpThreshold: config.autoScaling.scaleUpThreshold || 0.8,
            scaleDownThreshold: config.autoScaling.scaleDownThreshold || 0.3
        }
    })
};

// Current version of the configuration
export const CURRENT_VERSION = '1.2.0';

// Validate configuration against schema
export const validateConfig = (config) => {
    try {
        return configSchema.parse(config);
    } catch (error) {
        throw new Error(`Configuration validation failed: ${error.message}`);
    }
};

// Migrate configuration to the latest version
export const migrateConfig = (config) => {
    const currentVersion = config.version || '1.0.0';
    const versionParts = currentVersion.split('.').map(Number);
    const currentParts = CURRENT_VERSION.split('.').map(Number);

    let migratedConfig = { ...config };

    // Apply migrations in sequence
    for (const [version, migration] of Object.entries(migrations)) {
        const migrationParts = version.split('.').map(Number);
        if (
            migrationParts[0] > versionParts[0] ||
            (migrationParts[0] === versionParts[0] && migrationParts[1] > versionParts[1]) ||
            (migrationParts[0] === versionParts[0] && migrationParts[1] === versionParts[1] && migrationParts[2] > versionParts[2])
        ) {
            migratedConfig = migration(migratedConfig);
        }
    }

    // Update version and timestamp
    migratedConfig.version = CURRENT_VERSION;
    migratedConfig.lastModified = new Date().toISOString();

    return migratedConfig;
};

// Generate a default configuration
export const generateDefaultConfig = () => {
    return {
        version: CURRENT_VERSION,
        metadata: {
            description: 'Initial configuration',
            author: 'system',
            status: 'approved'
        },
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
}; 