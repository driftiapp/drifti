const systemMonitor = new SystemMonitor({
    heartbeatInterval: 5000,
    failureThreshold: 0.5
});

const performanceMonitor = new PerformanceMonitor({
    collectionInterval: 1000,
    memoryThreshold: 0.8,
    cpuThreshold: 0.7
});

performanceMonitor.on('warning', handleWarning);
performanceMonitor.on('metrics', handleMetrics);

const startTime = Date.now();
try {
    const result = await operation();
    performanceMonitor.recordLatency(Date.now() - startTime);
    performanceMonitor.recordRequest(true);
} catch (error) {
    performanceMonitor.recordRequest(false);
}

const { MonitoringWebSocketServer } = require('./websocket/monitoringServer');

// After creating your HTTP server
const monitoringServer = new MonitoringWebSocketServer(server);
monitoringServer.start();

import MonitoringDashboard from './components/MonitoringDashboard';

// In your app or admin panel
<MonitoringDashboard />

// In the dashboard
const handleConfigUpdate = (newConfig) => {
    setConfig(newConfig);
    if (ws.current?.readyState === WebSocket.OPEN) {
        ws.current.send(JSON.stringify({
            type: 'config_update',
            config: newConfig
        }));
    }
};

ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    if (data.type === 'auto_scaling') {
        console.log(`Auto-scaling triggered: ${data.action}`);
        // Handle scaling action
    }
};

const updateDisplayOptions = (options) => {
    setConfig(prev => ({
        ...prev,
        display: { ...prev.display, ...options }
    }));
};

const monitoringConfigRouter = require('./routes/monitoringConfig');
app.use('/api/monitoring/config', monitoringConfigRouter);

import { configStorage } from '../utils/configStorage';

// In your component
useEffect(() => {
    const loadConfig = async () => {
        const savedConfig = await configStorage.loadConfig();
        setConfig(savedConfig);
    };
    loadConfig();
}, []);

useEffect(() => {
    const saveConfig = async () => {
        await configStorage.saveConfig(config);
    };
    saveConfig();
}, [config]); 