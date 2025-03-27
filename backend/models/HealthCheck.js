const mongoose = require('mongoose');

const healthCheckSchema = new mongoose.Schema({
    timestamp: {
        type: Date,
        required: true,
        default: Date.now
    },
    status: {
        type: String,
        enum: ['healthy', 'unhealthy'],
        required: true
    },
    components: {
        mongodb: Boolean,
        firebase: Boolean,
        stripe: Boolean,
        redis: Boolean,
        api: Boolean
    },
    metrics: {
        uptime: Number,
        memoryUsage: {
            heapTotal: Number,
            heapUsed: Number,
            external: Number,
            rss: Number
        },
        cpuUsage: {
            user: Number,
            system: Number
        }
    },
    migrations: {
        status: {
            type: String,
            enum: ['ok', 'warning', 'error']
        },
        pendingCount: Number,
        migrations: [String]
    },
    loadBalancing: {
        status: {
            type: String,
            enum: ['ok', 'warning', 'error']
        },
        servers: [{
            server: String,
            status: String,
            responseTime: Number,
            load: Number
        }]
    },
    errors: [{
        component: String,
        message: String,
        stack: String
    }]
}, {
    timestamps: true
});

// Indexes
healthCheckSchema.index({ timestamp: -1 });
healthCheckSchema.index({ status: 1, timestamp: -1 });
healthCheckSchema.index({ 'components.mongodb': 1 });
healthCheckSchema.index({ 'components.firebase': 1 });
healthCheckSchema.index({ 'components.stripe': 1 });
healthCheckSchema.index({ 'components.redis': 1 });
healthCheckSchema.index({ 'components.api': 1 });

// Methods
healthCheckSchema.methods.addError = function(component, error) {
    this.errors.push({
        component,
        message: error.message,
        stack: error.stack
    });
};

// Statics
healthCheckSchema.statics.getLatestStatus = function() {
    return this.findOne().sort({ timestamp: -1 });
};

healthCheckSchema.statics.getStatusHistory = function(hours = 24) {
    const since = new Date();
    since.setHours(since.getHours() - hours);

    return this.find({
        timestamp: { $gte: since }
    }).sort({ timestamp: 1 });
};

healthCheckSchema.statics.getComponentHistory = function(component, hours = 24) {
    const since = new Date();
    since.setHours(since.getHours() - hours);

    return this.find({
        timestamp: { $gte: since },
        [`components.${component}`]: { $exists: true }
    }).select(`timestamp components.${component}`).sort({ timestamp: 1 });
};

// Clean up old records (keep last 30 days)
healthCheckSchema.statics.cleanup = function() {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    return this.deleteMany({
        timestamp: { $lt: thirtyDaysAgo }
    });
};

// Virtual for overall health status
healthCheckSchema.virtual('isHealthy').get(function() {
    return Object.values(this.components).every(status => status);
});

// Pre-save middleware
healthCheckSchema.pre('save', function(next) {
    // Set status based on components
    this.status = Object.values(this.components).every(status => status)
        ? 'healthy'
        : 'unhealthy';
    next();
});

const HealthCheck = mongoose.model('HealthCheck', healthCheckSchema);

module.exports = HealthCheck; 