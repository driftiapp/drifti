const Inventory = require('../models/Inventory');
const Store = require('../models/Store');
const Order = require('../models/Order');
const NotificationService = require('./NotificationService');
const AIService = require('./AIService');

class InventoryService {
    constructor() {
        this.notificationService = new NotificationService();
        this.aiService = new AIService();
    }

    async createInventoryItem(storeId, itemData) {
        const inventory = new Inventory({
            storeId,
            itemId: itemData.itemId,
            currentQuantity: itemData.quantity,
            minThreshold: itemData.minThreshold,
            maxThreshold: itemData.maxThreshold,
            unit: itemData.unit,
            lastVerified: new Date(),
            autoDisable: itemData.autoDisable ?? true
        });

        await inventory.save();
        await this.updateAIPredictions(inventory._id);
        return inventory;
    }

    async updateStock(inventoryId, quantity, changeType, reason, userId, orderId = null) {
        const inventory = await Inventory.findById(inventoryId);
        if (!inventory) {
            throw new Error('Inventory not found');
        }

        await inventory.updateStock(quantity, changeType, reason, userId, orderId);

        // Send notifications if needed
        if (inventory.status === 'low_stock') {
            await this.notificationService.sendLowStockAlert(inventory);
        } else if (inventory.status === 'out_of_stock') {
            await this.notificationService.sendOutOfStockAlert(inventory);
        }

        // Update AI predictions
        await this.updateAIPredictions(inventoryId);

        return inventory;
    }

    async verifyStoreInventory(storeId, userId) {
        const items = await Inventory.find({ storeId });
        const verificationPromises = items.map(item => item.verifyStock(userId));
        await Promise.all(verificationPromises);

        // Update store's last inventory check
        await Store.findByIdAndUpdate(storeId, {
            lastInventoryCheck: new Date()
        });

        return items;
    }

    async checkStoreInventoryCompliance(storeId) {
        const store = await Store.findById(storeId);
        const lastCheck = store.lastInventoryCheck;
        const now = new Date();

        // Check if inventory was verified in the last 24 hours
        if (!lastCheck || (now - lastCheck) > 24 * 60 * 60 * 1000) {
            return {
                compliant: false,
                reason: 'Inventory not verified in the last 24 hours',
                lastCheck
            };
        }

        // Check for any disabled or out of stock items
        const problematicItems = await Inventory.find({
            storeId,
            status: { $in: ['disabled', 'out_of_stock'] }
        });

        return {
            compliant: problematicItems.length === 0,
            reason: problematicItems.length > 0 ? 'Store has out of stock items' : null,
            problematicItems: problematicItems.length,
            lastCheck
        };
    }

    async handleOrderCreation(orderId) {
        const order = await Order.findById(orderId).populate('items.itemId');
        
        // Update inventory for each item
        for (const item of order.items) {
            const inventory = await Inventory.findOne({
                storeId: order.storeId,
                itemId: item.itemId
            });

            if (!inventory) {
                throw new Error(`Inventory not found for item ${item.itemId}`);
            }

            // Check if we have enough stock
            if (inventory.currentQuantity < item.quantity) {
                throw new Error(`Insufficient stock for item ${item.itemId.name}`);
            }

            // Reduce inventory
            await this.updateStock(
                inventory._id,
                inventory.currentQuantity - item.quantity,
                'order',
                'Order placed',
                order.userId,
                orderId
            );
        }
    }

    async handleOrderCancellation(orderId) {
        const order = await Order.findById(orderId).populate('items.itemId');
        
        // Restore inventory for each item
        for (const item of order.items) {
            const inventory = await Inventory.findOne({
                storeId: order.storeId,
                itemId: item.itemId
            });

            if (inventory) {
                await this.updateStock(
                    inventory._id,
                    inventory.currentQuantity + item.quantity,
                    'system_adjustment',
                    'Order cancelled',
                    order.userId,
                    orderId
                );
            }
        }
    }

    async updateAIPredictions(inventoryId) {
        const inventory = await Inventory.findById(inventoryId)
            .populate('itemId')
            .populate('storeId');

        // Get historical data
        const orderHistory = await Order.find({
            storeId: inventory.storeId,
            'items.itemId': inventory.itemId,
            status: 'completed',
            createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
        });

        // Generate AI predictions
        const predictions = await this.aiService.generateInventoryPredictions({
            inventory,
            orderHistory,
            seasonalFactors: true,
            weatherImpact: true
        });

        await inventory.updateAIPredictions(predictions);
        return predictions;
    }

    async getInventoryAnalytics(storeId, period = 30) {
        const startDate = new Date(Date.now() - period * 24 * 60 * 60 * 1000);
        
        const inventory = await Inventory.find({ storeId });
        const orderHistory = await Order.find({
            storeId,
            createdAt: { $gte: startDate }
        });

        return {
            totalItems: inventory.length,
            lowStockItems: inventory.filter(i => i.status === 'low_stock').length,
            outOfStockItems: inventory.filter(i => i.status === 'out_of_stock').length,
            disabledItems: inventory.filter(i => i.status === 'disabled').length,
            averageTurnover: await this.calculateAverageTurnover(inventory, orderHistory),
            topSellingItems: await this.getTopSellingItems(storeId, period),
            stockoutRate: await this.calculateStockoutRate(inventory, period),
            predictions: await this.getStorePredictions(inventory)
        };
    }

    async calculateAverageTurnover(inventory, orders) {
        // Implementation for calculating average inventory turnover
        // Based on orders and inventory history
    }

    async getTopSellingItems(storeId, period) {
        // Implementation for getting top selling items
        // Based on order history
    }

    async calculateStockoutRate(inventory, period) {
        // Implementation for calculating stockout rate
        // Based on inventory history
    }

    async getStorePredictions(inventory) {
        // Implementation for getting store-wide predictions
        // Based on AI predictions for individual items
    }
}

module.exports = new InventoryService(); 