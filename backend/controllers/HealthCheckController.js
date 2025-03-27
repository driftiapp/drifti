const HealthCheckService = require('../services/HealthCheckService');

class HealthCheckController {
    async getHealth(req, res) {
        try {
            const isHealthCheck = req.headers['x-health-check'] === 'true';
            const healthStatus = await HealthCheckService.runHealthCheck();
            
            // For internal health checks, return detailed status
            if (isHealthCheck) {
                const [metrics, migrations, loadBalancing] = await Promise.all([
                    HealthCheckService.getSystemMetrics(),
                    HealthCheckService.checkDatabaseMigrations(),
                    HealthCheckService.checkLoadBalancing()
                ]);

                return res.json({
                    status: Object.values(healthStatus).every(status => status) ? 'healthy' : 'unhealthy',
                    components: healthStatus,
                    metrics,
                    migrations,
                    loadBalancing,
                    timestamp: new Date()
                });
            }

            // For external health checks, return simple status
            const isHealthy = Object.values(healthStatus).every(status => status);
            res.status(isHealthy ? 200 : 503).json({
                status: isHealthy ? 'healthy' : 'unhealthy',
                timestamp: new Date()
            });
        } catch (error) {
            console.error('Health check failed:', error);
            res.status(503).json({
                status: 'unhealthy',
                error: 'Health check failed',
                timestamp: new Date()
            });
        }
    }

    async getMetrics(req, res) {
        try {
            // Only allow admin users to access detailed metrics
            if (!req.user?.isAdmin) {
                return res.status(403).json({
                    error: 'Access denied',
                    message: 'Only administrators can view detailed metrics'
                });
            }

            const metrics = await HealthCheckService.getSystemMetrics();
            res.json(metrics);
        } catch (error) {
            console.error('Error fetching metrics:', error);
            res.status(500).json({
                error: 'Internal server error',
                message: 'Failed to fetch system metrics'
            });
        }
    }

    async getMigrationStatus(req, res) {
        try {
            // Only allow admin users to access migration status
            if (!req.user?.isAdmin) {
                return res.status(403).json({
                    error: 'Access denied',
                    message: 'Only administrators can view migration status'
                });
            }

            const migrationStatus = await HealthCheckService.checkDatabaseMigrations();
            res.json(migrationStatus);
        } catch (error) {
            console.error('Error checking migrations:', error);
            res.status(500).json({
                error: 'Internal server error',
                message: 'Failed to check migration status'
            });
        }
    }

    async getLoadBalancingStatus(req, res) {
        try {
            // Only allow admin users to access load balancing status
            if (!req.user?.isAdmin) {
                return res.status(403).json({
                    error: 'Access denied',
                    message: 'Only administrators can view load balancing status'
                });
            }

            const loadBalancingStatus = await HealthCheckService.checkLoadBalancing();
            res.json(loadBalancingStatus);
        } catch (error) {
            console.error('Error checking load balancing:', error);
            res.status(500).json({
                error: 'Internal server error',
                message: 'Failed to check load balancing status'
            });
        }
    }

    async startMonitoring(req, res) {
        try {
            // Only allow admin users to start monitoring
            if (!req.user?.isAdmin) {
                return res.status(403).json({
                    error: 'Access denied',
                    message: 'Only administrators can start system monitoring'
                });
            }

            await HealthCheckService.startMonitoring();
            res.json({
                status: 'success',
                message: 'System monitoring started successfully'
            });
        } catch (error) {
            console.error('Error starting monitoring:', error);
            res.status(500).json({
                error: 'Internal server error',
                message: 'Failed to start system monitoring'
            });
        }
    }
}

module.exports = new HealthCheckController(); 