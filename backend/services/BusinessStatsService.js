const mongoose = require('mongoose');
const { startOfDay, endOfDay, subDays, startOfWeek, startOfMonth, startOfYear } = require('date-fns');

class BusinessStatsService {
    constructor() {
        this.Order = mongoose.model('Order');
        this.Inventory = mongoose.model('Inventory');
        this.Business = mongoose.model('Business');
    }

    async getDateRange(range) {
        const now = new Date();
        switch (range) {
            case 'today':
                return {
                    start: startOfDay(now),
                    end: endOfDay(now),
                    compareStart: startOfDay(subDays(now, 1)),
                    compareEnd: endOfDay(subDays(now, 1))
                };
            case 'week':
                return {
                    start: startOfWeek(now),
                    end: now,
                    compareStart: startOfWeek(subDays(now, 7)),
                    compareEnd: subDays(now, 7)
                };
            case 'month':
                return {
                    start: startOfMonth(now),
                    end: now,
                    compareStart: startOfMonth(subDays(now, 30)),
                    compareEnd: subDays(now, 30)
                };
            case 'year':
                return {
                    start: startOfYear(now),
                    end: now,
                    compareStart: startOfYear(subDays(now, 365)),
                    compareEnd: subDays(now, 365)
                };
            default:
                throw new Error('Invalid date range');
        }
    }

    async getBusinessStats(businessId, range) {
        const dateRange = await this.getDateRange(range);

        const [currentStats, compareStats, topCategories, inventoryStats] = await Promise.all([
            this.getPeriodStats(businessId, dateRange.start, dateRange.end),
            this.getPeriodStats(businessId, dateRange.compareStart, dateRange.compareEnd),
            this.getTopCategories(businessId, dateRange.start, dateRange.end),
            this.getInventoryStats(businessId)
        ]);

        const growth = {
            revenue: ((currentStats.revenue - compareStats.revenue) / compareStats.revenue) * 100,
            orders: ((currentStats.orders - compareStats.orders) / compareStats.orders) * 100,
            customers: ((currentStats.customers - compareStats.customers) / compareStats.customers) * 100
        };

        return {
            ...currentStats,
            growth,
            topCategories,
            ...inventoryStats
        };
    }

    async getPeriodStats(businessId, start, end) {
        const orders = await this.Order.aggregate([
            {
                $match: {
                    businessId: new mongoose.Types.ObjectId(businessId),
                    createdAt: { $gte: start, $lte: end },
                    status: { $in: ['completed', 'delivered'] }
                }
            },
            {
                $group: {
                    _id: null,
                    revenue: { $sum: '$total' },
                    orders: { $sum: 1 },
                    customers: { $addToSet: '$customerId' }
                }
            }
        ]);

        const stats = orders[0] || { revenue: 0, orders: 0, customers: [] };
        return {
            revenue: stats.revenue || 0,
            orders: stats.orders || 0,
            customers: (stats.customers || []).length,
            avgOrderValue: stats.orders ? (stats.revenue / stats.orders) : 0
        };
    }

    async getTopCategories(businessId, start, end) {
        return await this.Order.aggregate([
            {
                $match: {
                    businessId: new mongoose.Types.ObjectId(businessId),
                    createdAt: { $gte: start, $lte: end },
                    status: { $in: ['completed', 'delivered'] }
                }
            },
            { $unwind: '$items' },
            {
                $group: {
                    _id: '$items.category',
                    revenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } },
                    orders: { $sum: 1 }
                }
            },
            {
                $project: {
                    name: '$_id',
                    revenue: 1,
                    orders: 1,
                    _id: 0
                }
            },
            { $sort: { revenue: -1 } },
            { $limit: 5 }
        ]);
    }

    async getInventoryStats(businessId) {
        const inventory = await this.Inventory.aggregate([
            {
                $match: { businessId: new mongoose.Types.ObjectId(businessId) }
            },
            {
                $group: {
                    _id: null,
                    lowStock: {
                        $sum: {
                            $cond: [
                                { $lt: ['$currentQuantity', '$lowStockThreshold'] },
                                1,
                                0
                            ]
                        }
                    },
                    outOfStock: {
                        $sum: {
                            $cond: [
                                { $eq: ['$currentQuantity', 0] },
                                1,
                                0
                            ]
                        }
                    },
                    totalItems: { $sum: 1 }
                }
            }
        ]);

        const pendingDeliveries = await this.Order.countDocuments({
            businessId,
            status: 'in_transit'
        });

        return {
            inventory: inventory[0] || { lowStock: 0, outOfStock: 0, totalItems: 0 },
            pendingDeliveries
        };
    }

    async getSalesData(businessId, range) {
        const dateRange = await this.getDateRange(range);
        
        const salesData = await this.Order.aggregate([
            {
                $match: {
                    businessId: new mongoose.Types.ObjectId(businessId),
                    createdAt: { $gte: dateRange.start, $lte: dateRange.end },
                    status: { $in: ['completed', 'delivered'] }
                }
            },
            {
                $group: {
                    _id: {
                        $dateToString: {
                            format: '%Y-%m-%d',
                            date: '$createdAt'
                        }
                    },
                    revenue: { $sum: '$total' },
                    orders: { $sum: 1 }
                }
            },
            { $sort: { '_id': 1 } }
        ]);

        return {
            labels: salesData.map(item => item._id),
            datasets: [
                {
                    label: 'Revenue',
                    data: salesData.map(item => item.revenue),
                    borderColor: '#4CAF50',
                    fill: false
                },
                {
                    label: 'Orders',
                    data: salesData.map(item => item.orders),
                    borderColor: '#2196F3',
                    fill: false
                }
            ]
        };
    }

    async getBusinessMetrics(businessId) {
        const business = await this.Business.findById(businessId);
        if (!business) {
            throw new Error('Business not found');
        }

        // Calculate business-specific metrics
        const metrics = {
            rating: await this.calculateBusinessRating(businessId),
            performance: await this.calculatePerformanceMetrics(businessId),
            customerSatisfaction: await this.calculateCustomerSatisfaction(businessId)
        };

        return metrics;
    }

    async calculateBusinessRating(businessId) {
        const reviews = await mongoose.model('Review').aggregate([
            {
                $match: { businessId: new mongoose.Types.ObjectId(businessId) }
            },
            {
                $group: {
                    _id: null,
                    averageRating: { $avg: '$rating' },
                    totalReviews: { $sum: 1 }
                }
            }
        ]);

        return reviews[0] || { averageRating: 0, totalReviews: 0 };
    }

    async calculatePerformanceMetrics(businessId) {
        const thirtyDaysAgo = subDays(new Date(), 30);
        
        const metrics = await this.Order.aggregate([
            {
                $match: {
                    businessId: new mongoose.Types.ObjectId(businessId),
                    createdAt: { $gte: thirtyDaysAgo }
                }
            },
            {
                $group: {
                    _id: null,
                    totalOrders: { $sum: 1 },
                    completedOnTime: {
                        $sum: {
                            $cond: [
                                { $eq: ['$status', 'completed'] },
                                1,
                                0
                            ]
                        }
                    },
                    cancelledOrders: {
                        $sum: {
                            $cond: [
                                { $eq: ['$status', 'cancelled'] },
                                1,
                                0
                            ]
                        }
                    }
                }
            }
        ]);

        const performance = metrics[0] || { totalOrders: 0, completedOnTime: 0, cancelledOrders: 0 };
        return {
            ...performance,
            completionRate: performance.totalOrders ? 
                (performance.completedOnTime / performance.totalOrders) * 100 : 0,
            cancellationRate: performance.totalOrders ? 
                (performance.cancelledOrders / performance.totalOrders) * 100 : 0
        };
    }

    async calculateCustomerSatisfaction(businessId) {
        const thirtyDaysAgo = subDays(new Date(), 30);
        
        const satisfaction = await this.Order.aggregate([
            {
                $match: {
                    businessId: new mongoose.Types.ObjectId(businessId),
                    createdAt: { $gte: thirtyDaysAgo },
                    'feedback.rating': { $exists: true }
                }
            },
            {
                $group: {
                    _id: null,
                    averageSatisfaction: { $avg: '$feedback.rating' },
                    totalFeedback: { $sum: 1 },
                    complaints: {
                        $sum: {
                            $cond: [
                                { $lte: ['$feedback.rating', 2] },
                                1,
                                0
                            ]
                        }
                    }
                }
            }
        ]);

        return satisfaction[0] || { 
            averageSatisfaction: 0, 
            totalFeedback: 0,
            complaints: 0
        };
    }
}

module.exports = new BusinessStatsService(); 