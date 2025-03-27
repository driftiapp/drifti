const mongoose = require('mongoose');

const inventoryHistorySchema = new mongoose.Schema({
    previousQuantity: {
        type: Number,
        required: true
    },
    newQuantity: {
        type: Number,
        required: true
    },
    changeType: {
        type: String,
        enum: ['manual', 'order', 'restock', 'system_adjustment'],
        required: true
    },
    reason: {
        type: String,
        required: true
    },
    orderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Order'
    },
    updatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    timestamp: {
        type: Date,
        default: Date.now
    }
});

const inventoryAlertSchema = new mongoose.Schema({
    type: {
        type: String,
        enum: ['low_stock', 'out_of_stock', 'restock_suggestion'],
        required: true
    },
    message: {
        type: String,
        required: true
    },
    threshold: {
        type: Number
    },
    isResolved: {
        type: Boolean,
        default: false
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    resolvedAt: Date
});

const inventorySchema = new mongoose.Schema({
    storeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Store',
        required: true
    },
    itemId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Item',
        required: true
    },
    currentQuantity: {
        type: Number,
        required: true,
        min: 0
    },
    minThreshold: {
        type: Number,
        required: true,
        min: 0
    },
    maxThreshold: {
        type: Number,
        required: true
    },
    unit: {
        type: String,
        required: true
    },
    lastUpdated: {
        type: Date,
        default: Date.now
    },
    lastVerified: {
        type: Date,
        required: true
    },
    status: {
        type: String,
        enum: ['in_stock', 'low_stock', 'out_of_stock', 'disabled'],
        default: 'in_stock'
    },
    autoDisable: {
        type: Boolean,
        default: true
    },
    alerts: [inventoryAlertSchema],
    history: [inventoryHistorySchema],
    aiPredictions: {
        nextRestockDate: Date,
        suggestedQuantity: Number,
        confidence: Number,
        factors: [{
            name: String,
            impact: Number
        }]
    },
    metadata: {
        type: Map,
        of: mongoose.Schema.Types.Mixed
    }
}, {
    timestamps: true
});

// Indexes for efficient queries
inventorySchema.index({ storeId: 1, itemId: 1 }, { unique: true });
inventorySchema.index({ status: 1 });
inventorySchema.index({ currentQuantity: 1 });
inventorySchema.index({ lastVerified: 1 });

// Update lastUpdated timestamp before saving
inventorySchema.pre('save', function(next) {
    this.lastUpdated = new Date();
    next();
});

// Methods to manage inventory
inventorySchema.methods = {
    async updateStock(quantity, changeType, reason, userId, orderId = null) {
        const previousQuantity = this.currentQuantity;
        this.currentQuantity = Math.max(0, quantity);

        // Add to history
        this.history.push({
            previousQuantity,
            newQuantity: this.currentQuantity,
            changeType,
            reason,
            orderId,
            updatedBy: userId
        });

        // Update status based on thresholds
        if (this.currentQuantity === 0) {
            this.status = 'out_of_stock';
            if (this.autoDisable) {
                this.status = 'disabled';
            }
            this.addAlert('out_of_stock', 'Item is out of stock');
        } else if (this.currentQuantity <= this.minThreshold) {
            this.status = 'low_stock';
            this.addAlert('low_stock', `Stock below minimum threshold (${this.minThreshold})`);
        } else {
            this.status = 'in_stock';
        }

        await this.save();
        return this;
    },

    addAlert(type, message, threshold = null) {
        this.alerts.push({
            type,
            message,
            threshold,
            isResolved: false
        });
    },

    async verifyStock(userId) {
        this.lastVerified = new Date();
        this.history.push({
            previousQuantity: this.currentQuantity,
            newQuantity: this.currentQuantity,
            changeType: 'system_adjustment',
            reason: 'Stock verification',
            updatedBy: userId
        });
        await this.save();
        return this;
    },

    async updateAIPredictions(predictions) {
        this.aiPredictions = predictions;
        await this.save();
        return this;
    }
};

// Static methods for inventory management
inventorySchema.statics = {
    async getStoreInventory(storeId) {
        return this.find({ storeId }).populate('itemId');
    },

    async getLowStockItems(storeId) {
        return this.find({
            storeId,
            status: 'low_stock'
        }).populate('itemId');
    },

    async getOutOfStockItems(storeId) {
        return this.find({
            storeId,
            status: { $in: ['out_of_stock', 'disabled'] }
        }).populate('itemId');
    },

    async getNeedsVerificationItems(storeId, hoursThreshold = 24) {
        const threshold = new Date(Date.now() - hoursThreshold * 60 * 60 * 1000);
        return this.find({
            storeId,
            lastVerified: { $lt: threshold }
        }).populate('itemId');
    }
};

const Inventory = mongoose.model('Inventory', inventorySchema);

module.exports = Inventory; 