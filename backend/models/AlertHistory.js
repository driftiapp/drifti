const mongoose = require('mongoose');

const alertHistorySchema = new mongoose.Schema({
    component: {
        type: String,
        required: true,
        enum: ['mongodb', 'firebase', 'stripe', 'redis', 'api', 'email', 'cdn', 'thirdParty', 'backups']
    },
    type: {
        type: String,
        required: true,
        enum: ['failure', 'recovery', 'warning']
    },
    status: {
        type: String,
        required: true
    },
    error: {
        type: String
    },
    environment: {
        type: String,
        required: true
    },
    timestamp: {
        type: Date,
        default: Date.now
    },
    metadata: {
        type: mongoose.Schema.Types.Mixed
    }
});

// Indexes for efficient querying
alertHistorySchema.index({ component: 1, timestamp: -1 });
alertHistorySchema.index({ type: 1, timestamp: -1 });
alertHistorySchema.index({ environment: 1, timestamp: -1 });

// Static methods for querying
alertHistorySchema.statics.getRecentAlerts = function(limit = 100) {
    return this.find()
        .sort({ timestamp: -1 })
        .limit(limit);
};

alertHistorySchema.statics.getComponentAlerts = function(component, limit = 50) {
    return this.find({ component })
        .sort({ timestamp: -1 })
        .limit(limit);
};

alertHistorySchema.statics.getAlertsByType = function(type, limit = 50) {
    return this.find({ type })
        .sort({ timestamp: -1 })
        .limit(limit);
};

alertHistorySchema.statics.getAlertsByTimeRange = function(startTime, endTime) {
    return this.find({
        timestamp: {
            $gte: startTime,
            $lte: endTime
        }
    }).sort({ timestamp: -1 });
};

// Instance methods
alertHistorySchema.methods.toJSON = function() {
    const obj = this.toObject();
    obj.id = obj._id;
    delete obj._id;
    delete obj.__v;
    return obj;
};

module.exports = mongoose.model('AlertHistory', alertHistorySchema); 