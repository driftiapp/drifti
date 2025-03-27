const BusinessStatsService = require('../services/BusinessStatsService');
const { validateDateRange } = require('../utils/validators');

class BusinessStatsController {
    async getStats(req, res) {
        try {
            const { businessId } = req.params;
            const { range = 'week' } = req.query;

            // Validate date range
            if (!validateDateRange(range)) {
                return res.status(400).json({
                    error: 'Invalid date range',
                    message: 'Date range must be one of: today, week, month, year'
                });
            }

            // Check if user has permission to access this business's stats
            if (!req.user.businesses.includes(businessId) && !req.user.isAdmin) {
                return res.status(403).json({
                    error: 'Access denied',
                    message: 'You do not have permission to view these statistics'
                });
            }

            const stats = await BusinessStatsService.getBusinessStats(businessId, range);
            res.json(stats);
        } catch (error) {
            console.error('Error fetching business stats:', error);
            res.status(500).json({
                error: 'Internal server error',
                message: 'Failed to fetch business statistics'
            });
        }
    }

    async getSalesData(req, res) {
        try {
            const { businessId } = req.params;
            const { range = 'week' } = req.query;

            // Validate date range
            if (!validateDateRange(range)) {
                return res.status(400).json({
                    error: 'Invalid date range',
                    message: 'Date range must be one of: today, week, month, year'
                });
            }

            // Check permissions
            if (!req.user.businesses.includes(businessId) && !req.user.isAdmin) {
                return res.status(403).json({
                    error: 'Access denied',
                    message: 'You do not have permission to view these statistics'
                });
            }

            const salesData = await BusinessStatsService.getSalesData(businessId, range);
            res.json(salesData);
        } catch (error) {
            console.error('Error fetching sales data:', error);
            res.status(500).json({
                error: 'Internal server error',
                message: 'Failed to fetch sales data'
            });
        }
    }

    async getBusinessMetrics(req, res) {
        try {
            const { businessId } = req.params;

            // Check permissions
            if (!req.user.businesses.includes(businessId) && !req.user.isAdmin) {
                return res.status(403).json({
                    error: 'Access denied',
                    message: 'You do not have permission to view these metrics'
                });
            }

            const metrics = await BusinessStatsService.getBusinessMetrics(businessId);
            res.json(metrics);
        } catch (error) {
            console.error('Error fetching business metrics:', error);
            res.status(500).json({
                error: 'Internal server error',
                message: 'Failed to fetch business metrics'
            });
        }
    }

    async getInventoryStats(req, res) {
        try {
            const { businessId } = req.params;

            // Check permissions
            if (!req.user.businesses.includes(businessId) && !req.user.isAdmin) {
                return res.status(403).json({
                    error: 'Access denied',
                    message: 'You do not have permission to view inventory statistics'
                });
            }

            const inventoryStats = await BusinessStatsService.getInventoryStats(businessId);
            res.json(inventoryStats);
        } catch (error) {
            console.error('Error fetching inventory stats:', error);
            res.status(500).json({
                error: 'Internal server error',
                message: 'Failed to fetch inventory statistics'
            });
        }
    }

    async exportStats(req, res) {
        try {
            const { businessId } = req.params;
            const { range = 'month', format = 'csv' } = req.query;

            // Check permissions
            if (!req.user.businesses.includes(businessId) && !req.user.isAdmin) {
                return res.status(403).json({
                    error: 'Access denied',
                    message: 'You do not have permission to export these statistics'
                });
            }

            // Get all stats
            const [stats, salesData, metrics] = await Promise.all([
                BusinessStatsService.getBusinessStats(businessId, range),
                BusinessStatsService.getSalesData(businessId, range),
                BusinessStatsService.getBusinessMetrics(businessId)
            ]);

            // Format data based on requested format
            let exportData;
            if (format === 'csv') {
                exportData = this.formatStatsAsCSV({ stats, salesData, metrics });
                res.header('Content-Type', 'text/csv');
                res.header('Content-Disposition', `attachment; filename=business-stats-${range}.csv`);
            } else {
                exportData = { stats, salesData, metrics };
                res.header('Content-Type', 'application/json');
                res.header('Content-Disposition', `attachment; filename=business-stats-${range}.json`);
            }

            res.send(exportData);
        } catch (error) {
            console.error('Error exporting stats:', error);
            res.status(500).json({
                error: 'Internal server error',
                message: 'Failed to export statistics'
            });
        }
    }

    formatStatsAsCSV(data) {
        // Convert the stats data to CSV format
        const { stats, salesData, metrics } = data;
        
        let csv = 'Date,Revenue,Orders,Customers\n';
        
        // Add daily data
        salesData.labels.forEach((date, index) => {
            csv += `${date},${salesData.datasets[0].data[index]},${salesData.datasets[1].data[index]}\n`;
        });

        // Add summary data
        csv += '\nSummary Statistics\n';
        csv += `Total Revenue,${stats.revenue}\n`;
        csv += `Total Orders,${stats.orders}\n`;
        csv += `Average Order Value,${stats.avgOrderValue}\n`;
        csv += `Customer Satisfaction,${metrics.customerSatisfaction.averageSatisfaction}\n`;
        csv += `Completion Rate,${metrics.performance.completionRate}%\n`;

        return csv;
    }
}

module.exports = new BusinessStatsController(); 