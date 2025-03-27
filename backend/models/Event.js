const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        required: true
    },
    category: {
        type: String,
        required: true,
        enum: ['Nightlife', 'Dining', 'Festivals', 'Cruise', 'Theme Parks', 'Concerts', 'Sports', 'Arts', 'Other']
    },
    location: {
        type: {
            type: String,
            enum: ['Point'],
            required: true
        },
        coordinates: {
            type: [Number],
            required: true
        },
        address: {
            type: String,
            required: true
        }
    },
    startTime: {
        type: Date,
        required: true
    },
    endTime: {
        type: Date,
        required: true
    },
    images: [{
        url: String,
        caption: String
    }],
    pricing: {
        basePrice: {
            type: Number,
            required: true
        },
        currency: {
            type: String,
            default: 'USD'
        },
        discounts: [{
            type: {
                type: String,
                enum: ['early_bird', 'group', 'flash', 'loyalty']
            },
            amount: Number,
            validUntil: Date
        }]
    },
    perks: [{
        type: String,
        required: true
    }],
    ownerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    status: {
        type: String,
        enum: ['draft', 'active', 'cancelled', 'completed'],
        default: 'draft'
    },
    viewCount: {
        type: Number,
        default: 0
    },
    bookingCount: {
        type: Number,
        default: 0
    },
    revenue: {
        type: Number,
        default: 0
    },
    averageRating: {
        type: Number,
        default: 0
    },
    ratings: [{
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        rating: Number,
        review: String,
        createdAt: {
            type: Date,
            default: Date.now
        }
    }],
    popularTimeSlots: [{
        time: Date,
        bookingCount: Number
    }],
    nftTickets: [{
        tokenId: String,
        ownerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        mintedAt: Date
    }],
    liveStream: {
        isActive: {
            type: Boolean,
            default: false
        },
        url: String,
        startTime: Date,
        endTime: Date
    },
    partnerCollabs: [{
        partnerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        discount: Number,
        description: String
    }],
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Indexes for efficient querying
eventSchema.index({ location: '2dsphere' });
eventSchema.index({ startTime: 1 });
eventSchema.index({ category: 1 });
eventSchema.index({ status: 1 });
eventSchema.index({ ownerId: 1 });

// Update the updatedAt timestamp before saving
eventSchema.pre('save', function(next) {
    this.updatedAt = new Date();
    next();
});

// Virtual for calculating remaining spots
eventSchema.virtual('remainingSpots').get(function() {
    return this.maxCapacity - this.bookingCount;
});

// Method to check if event is fully booked
eventSchema.methods.isFullyBooked = function() {
    return this.bookingCount >= this.maxCapacity;
};

// Method to update event analytics
eventSchema.methods.updateAnalytics = async function(bookingAmount) {
    this.bookingCount += 1;
    this.revenue += bookingAmount;
    this.averageRating = this.ratings.reduce((acc, curr) => acc + curr.rating, 0) / this.ratings.length;
    await this.save();
};

const Event = mongoose.model('Event', eventSchema);

module.exports = Event; 