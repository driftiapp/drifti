const mongoose = require('mongoose');

const businessShowcaseSchema = new mongoose.Schema({
    businessType: {
        type: String,
        required: true,
        enum: [
            'hotel',
            'restaurant',
            'liquor_store',
            'cannabis_dispensary',
            'smoke_shop',
            'pharmacy',
            'rideshare',
            'courier'
        ]
    },
    name: {
        type: String,
        required: true
    },
    price: {
        type: Number,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    features: [{
        name: String,
        description: String,
        type: {
            type: String,
            enum: ['surprise', 'game_changer', 'vip', 'verification', 'ai']
        }
    }],
    images: [{
        url: String,
        caption: String,
        isPrimary: Boolean
    }],
    verification: {
        required: Boolean,
        type: {
            type: String,
            enum: ['lab_report', 'coa', 'none']
        },
        description: String
    },
    aiFeatures: [{
        name: String,
        description: String,
        type: {
            type: String,
            enum: ['mood_mode', 'smart_refill', 'best_seller', 'destination_picker']
        }
    }],
    rewards: {
        type: {
            type: String,
            enum: ['vip_club', 'spin_wheel', 'mystery_bonus', 'cashback']
        },
        description: String,
        threshold: Number,
        frequency: String
    },
    metrics: {
        views: {
            type: Number,
            default: 0
        },
        conversions: {
            type: Number,
            default: 0
        },
        averageRating: {
            type: Number,
            default: 0
        }
    },
    isActive: {
        type: Boolean,
        default: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Indexes for efficient querying
businessShowcaseSchema.index({ businessType: 1, isActive: 1 });
businessShowcaseSchema.index({ 'metrics.views': -1 });
businessShowcaseSchema.index({ 'metrics.conversions': -1 });

// Pre-save middleware to update timestamps
businessShowcaseSchema.pre('save', function(next) {
    this.updatedAt = new Date();
    next();
});

// Method to increment views
businessShowcaseSchema.methods.incrementViews = async function() {
    this.metrics.views += 1;
    await this.save();
};

// Method to record conversion
businessShowcaseSchema.methods.recordConversion = async function() {
    this.metrics.conversions += 1;
    await this.save();
};

// Method to update rating
businessShowcaseSchema.methods.updateRating = async function(newRating) {
    const currentTotal = this.metrics.averageRating * this.metrics.conversions;
    this.metrics.conversions += 1;
    this.metrics.averageRating = (currentTotal + newRating) / this.metrics.conversions;
    await this.save();
};

// Static method to get showcase by business type
businessShowcaseSchema.statics.getShowcaseByType = async function(businessType) {
    return this.findOne({ businessType, isActive: true });
};

// Static method to get all active showcases
businessShowcaseSchema.statics.getAllActiveShowcases = async function() {
    return this.find({ isActive: true }).sort({ 'metrics.views': -1 });
};

const BusinessShowcase = mongoose.model('BusinessShowcase', businessShowcaseSchema);

module.exports = BusinessShowcase; 