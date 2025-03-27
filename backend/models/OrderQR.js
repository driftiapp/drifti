const mongoose = require('mongoose');

const orderQRSchema = new mongoose.Schema({
    orderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Order',
        required: true
    },
    storeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Store',
        required: true
    },
    driverId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    qrCode: {
        type: String,
        required: true,
        unique: true
    },
    pickupCode: {
        type: String,
        required: true,
        unique: true
    },
    status: {
        type: String,
        enum: ['pending', 'scanned', 'completed', 'cancelled'],
        default: 'pending'
    },
    scannedAt: Date,
    completedAt: Date,
    expiresAt: {
        type: Date,
        required: true
    },
    scanHistory: [{
        scannedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        role: {
            type: String,
            enum: ['store', 'driver'],
            required: true
        },
        timestamp: {
            type: Date,
            default: Date.now
        },
        location: {
            type: {
                type: String,
                enum: ['Point'],
                default: 'Point'
            },
            coordinates: {
                type: [Number],
                required: true
            }
        }
    }],
    metadata: {
        type: Map,
        of: mongoose.Schema.Types.Mixed
    }
}, {
    timestamps: true
});

// Indexes for efficient queries
orderQRSchema.index({ orderId: 1 }, { unique: true });
orderQRSchema.index({ qrCode: 1 }, { unique: true });
orderQRSchema.index({ pickupCode: 1 }, { unique: true });
orderQRSchema.index({ status: 1 });
orderQRSchema.index({ storeId: 1, status: 1 });
orderQRSchema.index({ driverId: 1, status: 1 });
orderQRSchema.index({ expiresAt: 1 });

// Methods to manage QR codes
orderQRSchema.methods = {
    async scan(userId, role, location) {
        // Add scan to history
        this.scanHistory.push({
            scannedBy: userId,
            role,
            location: {
                type: 'Point',
                coordinates: [location.longitude, location.latitude]
            }
        });

        // Update status
        if (this.status === 'pending') {
            this.status = 'scanned';
            this.scannedAt = new Date();
        }

        await this.save();
        return this;
    },

    async complete(userId, role, location) {
        // Add final scan to history
        this.scanHistory.push({
            scannedBy: userId,
            role,
            location: {
                type: 'Point',
                coordinates: [location.longitude, location.latitude]
            }
        });

        this.status = 'completed';
        this.completedAt = new Date();
        await this.save();
        return this;
    },

    async cancel() {
        this.status = 'cancelled';
        await this.save();
        return this;
    },

    isExpired() {
        return new Date() > this.expiresAt;
    },

    toPublicJSON() {
        return {
            orderId: this.orderId,
            storeId: this.storeId,
            driverId: this.driverId,
            status: this.status,
            pickupCode: this.pickupCode,
            scannedAt: this.scannedAt,
            completedAt: this.completedAt,
            expiresAt: this.expiresAt
        };
    }
};

// Static methods for QR code management
orderQRSchema.statics = {
    async findByCode(code) {
        return this.findOne({
            $or: [{ qrCode: code }, { pickupCode: code }]
        });
    },

    async getPendingPickups(storeId) {
        return this.find({
            storeId,
            status: { $in: ['pending', 'scanned'] }
        })
        .populate('orderId')
        .populate('driverId', 'name phone');
    },

    async getDriverPickups(driverId) {
        return this.find({
            driverId,
            status: { $in: ['pending', 'scanned'] }
        })
        .populate('orderId')
        .populate('storeId', 'name address');
    },

    async cleanupExpired() {
        return this.updateMany(
            {
                status: { $in: ['pending', 'scanned'] },
                expiresAt: { $lt: new Date() }
            },
            {
                $set: { status: 'cancelled' }
            }
        );
    }
};

const OrderQR = mongoose.model('OrderQR', orderQRSchema);

module.exports = OrderQR; 