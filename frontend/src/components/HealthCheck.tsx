import React, { useEffect, useState } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

interface ServiceStatus {
    status: string;
    message: string;
    timestamp: number;
}

interface SystemInfo {
    memory: {
        total: number;
        free: number;
        max: number;
    };
    cpu: {
        processors: number;
    };
    java: {
        version: string;
        vendor: string;
    };
    os: {
        name: string;
        version: string;
        arch: string;
    };
}

interface ApplicationInfo {
    profile: string;
    startTime: string;
    workingDir: string;
}

interface HealthStatus {
    status: string;
    services: Record<string, ServiceStatus>;
    system: SystemInfo;
    application: ApplicationInfo;
    timestamp: number;
    responseTime: string;
}

const HealthCheck: React.FC = () => {
    const [health, setHealth] = useState<HealthStatus | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const checkHealth = async () => {
            try {
                setLoading(true);
                // Check backend health
                const response = await fetch('/api/health');
                const data = await response.json();
                setHealth(data);
                setError(null);

                // Check frontend Firebase
                try {
                    const auth = getAuth();
                    if (auth) {
                        setHealth(prev => ({
                            ...prev!,
                            services: {
                                ...prev!.services,
                                'frontend-firebase': {
                                    status: 'healthy',
                                    message: 'Frontend Firebase initialized successfully',
                                    timestamp: Date.now()
                                }
                            }
                        }));
                    }
                } catch (e) {
                    setHealth(prev => ({
                        ...prev!,
                        services: {
                            ...prev!.services,
                            'frontend-firebase': {
                                status: 'unhealthy',
                                message: `Frontend Firebase error: ${e}`,
                                timestamp: Date.now()
                            }
                        }
                    }));
                }
            } catch (e) {
                setError(`Health check failed: ${e}`);
            } finally {
                setLoading(false);
            }
        };

        checkHealth();
        // Set up periodic health checks
        const interval = setInterval(checkHealth, 30000); // Check every 30 seconds
        return () => clearInterval(interval);
    }, []);

    if (loading) {
        return (
            <div className="p-4">
                <div className="animate-pulse">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-4 bg-red-100 text-red-700 rounded-lg">
                <h2 className="font-bold">System Health Error</h2>
                <p>{error}</p>
            </div>
        );
    }

    if (!health) {
        return null;
    }

    const formatBytes = (bytes: number) => {
        const units = ['B', 'KB', 'MB', 'GB'];
        let value = bytes;
        let unitIndex = 0;
        while (value >= 1024 && unitIndex < units.length - 1) {
            value /= 1024;
            unitIndex++;
        }
        return `${value.toFixed(2)} ${units[unitIndex]}`;
    };

    return (
        <div className="p-4 space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold">System Health Status</h2>
                <span className="text-sm text-gray-500">
                    Response time: {health.responseTime}
                </span>
            </div>

            {/* Overall Status */}
            <div className={`p-3 rounded-lg ${
                health.status === 'UP' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
            }`}>
                <p className="font-semibold">
                    Overall Status: {health.status}
                </p>
            </div>

            {/* Services Status */}
            <div className="space-y-2">
                <h3 className="font-semibold">Services</h3>
                {Object.entries(health.services).map(([service, status]) => (
                    <div
                        key={service}
                        className={`p-2 rounded ${
                            status.status === 'healthy' ? 'bg-green-50' : 'bg-red-50'
                        }`}
                    >
                        <p className="font-medium">{service}</p>
                        <p className="text-sm">{status.message}</p>
                        <p className="text-xs text-gray-500">
                            Last checked: {new Date(status.timestamp).toLocaleString()}
                        </p>
                    </div>
                ))}
            </div>

            {/* System Information */}
            <div className="space-y-2">
                <h3 className="font-semibold">System Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Memory */}
                    <div className="p-2 bg-gray-50 rounded">
                        <h4 className="font-medium">Memory</h4>
                        <div className="text-sm space-y-1">
                            <p>Total: {formatBytes(health.system.memory.total)}</p>
                            <p>Free: {formatBytes(health.system.memory.free)}</p>
                            <p>Max: {formatBytes(health.system.memory.max)}</p>
                        </div>
                    </div>

                    {/* CPU */}
                    <div className="p-2 bg-gray-50 rounded">
                        <h4 className="font-medium">CPU</h4>
                        <p className="text-sm">Processors: {health.system.cpu.processors}</p>
                    </div>

                    {/* Java */}
                    <div className="p-2 bg-gray-50 rounded">
                        <h4 className="font-medium">Java</h4>
                        <div className="text-sm">
                            <p>Version: {health.system.java.version}</p>
                            <p>Vendor: {health.system.java.vendor}</p>
                        </div>
                    </div>

                    {/* OS */}
                    <div className="p-2 bg-gray-50 rounded">
                        <h4 className="font-medium">Operating System</h4>
                        <div className="text-sm">
                            <p>{health.system.os.name} {health.system.os.version}</p>
                            <p>Architecture: {health.system.os.arch}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Application Information */}
            <div className="space-y-2">
                <h3 className="font-semibold">Application Information</h3>
                <div className="p-2 bg-gray-50 rounded">
                    <p className="text-sm">Profile: {health.application.profile}</p>
                    <p className="text-sm">Working Directory: {health.application.workingDir}</p>
                </div>
            </div>

            <div className="text-xs text-gray-500">
                Last updated: {new Date(health.timestamp).toLocaleString()}
            </div>
        </div>
    );
};

export default HealthCheck; 