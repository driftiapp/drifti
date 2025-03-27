const AlertService = require('../services/AlertService');
const auth = require('../middleware/auth');

class AlertController {
    async getRecentAlerts(req, res) {
        try {
            const limit = parseInt(req.query.limit) || 100;
            const alerts = await AlertService.getRecentAlerts(limit);
            res.json(alerts);
        } catch (error) {
            console.error('Error fetching recent alerts:', error);
            res.status(500).json({
                error: 'Internal server error',
                message: 'Failed to fetch recent alerts'
            });
        }
    }

    async getComponentAlerts(req, res) {
        try {
            const { component } = req.params;
            const limit = parseInt(req.query.limit) || 50;
            const alerts = await AlertService.getComponentAlerts(component, limit);
            res.json(alerts);
        } catch (error) {
            console.error('Error fetching component alerts:', error);
            res.status(500).json({
                error: 'Internal server error',
                message: 'Failed to fetch component alerts'
            });
        }
    }

    async getAlertsByType(req, res) {
        try {
            const { type } = req.params;
            const limit = parseInt(req.query.limit) || 50;
            const alerts = await AlertService.getAlertsByType(type, limit);
            res.json(alerts);
        } catch (error) {
            console.error('Error fetching alerts by type:', error);
            res.status(500).json({
                error: 'Internal server error',
                message: 'Failed to fetch alerts by type'
            });
        }
    }

    async getAlertsByTimeRange(req, res) {
        try {
            const { startTime, endTime } = req.query;
            if (!startTime || !endTime) {
                return res.status(400).json({
                    error: 'Bad request',
                    message: 'startTime and endTime are required'
                });
            }

            const alerts = await AlertService.getAlertsByTimeRange(
                new Date(startTime),
                new Date(endTime)
            );
            res.json(alerts);
        } catch (error) {
            console.error('Error fetching alerts by time range:', error);
            res.status(500).json({
                error: 'Internal server error',
                message: 'Failed to fetch alerts by time range'
            });
        }
    }

    async getAlertStats(req, res) {
        try {
            const stats = await AlertService.getAlertStats();
            res.json(stats);
        } catch (error) {
            console.error('Error fetching alert stats:', error);
            res.status(500).json({
                error: 'Internal server error',
                message: 'Failed to fetch alert statistics'
            });
        }
    }
}

module.exports = new AlertController(); 