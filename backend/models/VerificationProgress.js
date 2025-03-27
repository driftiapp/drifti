const mongoose = require('mongoose');

const verificationProgressSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    type: {
        type: String,
        enum: ['business', 'driver'],
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'in_progress', 'manual_review', 'approved', 'rejected'],
        default: 'pending'
    },
    progress: {
        basicInfo: {
            completed: { type: Boolean, default: false },
            errors: [String],
            updatedAt: Date
        },
        documents: {
            completed: { type: Boolean, default: false },
            uploadedDocs: [String],
            missingDocs: [String],
            errors: [String],
            updatedAt: Date
        },
        verification: {
            completed: { type: Boolean, default: false },
            trustScore: Number,
            flags: [String],
            errors: [String],
            updatedAt: Date
        },
        interview: {
            completed: { type: Boolean, default: false },
            confidenceScore: Number,
            attempts: Number,
            errors: [String],
            updatedAt: Date
        }
    },
    verificationDetails: {
        businessRegistrationVerified: Boolean,
        einVerified: Boolean,
        addressVerified: Boolean,
        documentsVerified: Boolean,
        categorySpecificVerified: Boolean,
        identityVerified: Boolean,
        driverRecordVerified: Boolean,
        backgroundCheckPassed: Boolean
    },
    currentStep: {
        type: String,
        enum: ['basic_info', 'document_upload', 'verification', 'interview', 'completed'],
        default: 'basic_info'
    },
    retryCount: {
        type: Number,
        default: 0
    },
    nextRetryAt: Date,
    expiresAt: Date,
    completedAt: Date,
    metadata: {
        ipAddress: String,
        userAgent: String,
        deviceId: String,
        location: {
            city: String,
            country: String,
            coordinates: {
                type: [Number],
                index: '2dsphere'
            }
        }
    }
}, {
    timestamps: true
});

// Indexes for efficient queries
verificationProgressSchema.index({ userId: 1, type: 1 }, { unique: true });
verificationProgressSchema.index({ status: 1, currentStep: 1 });
verificationProgressSchema.index({ 'metadata.location.coordinates': '2dsphere' });

// Methods
verificationProgressSchema.methods.updateProgress = async function(step, data) {
    const now = new Date();
    this.progress[step].completed = true;
    this.progress[step].updatedAt = now;
    
    Object.assign(this.progress[step], data);

    // Update current step
    const steps = ['basic_info', 'document_upload', 'verification', 'interview'];
    const currentIndex = steps.indexOf(this.currentStep);
    if (currentIndex < steps.length - 1) {
        this.currentStep = steps[currentIndex + 1];
    }

    // Check if all steps are completed
    const allCompleted = Object.values(this.progress).every(step => step.completed);
    if (allCompleted) {
        this.currentStep = 'completed';
        this.completedAt = now;
    }

    await this.save();
    return this;
};

verificationProgressSchema.methods.addError = async function(step, error) {
    if (!this.progress[step].errors) {
        this.progress[step].errors = [];
    }
    this.progress[step].errors.push(error);
    this.retryCount += 1;
    
    // Implement exponential backoff for retries
    if (this.retryCount > 0) {
        const backoffMinutes = Math.min(Math.pow(2, this.retryCount - 1) * 15, 1440); // Max 24 hours
        this.nextRetryAt = new Date(Date.now() + backoffMinutes * 60000);
    }

    await this.save();
    return this;
};

verificationProgressSchema.methods.canRetry = function() {
    if (!this.nextRetryAt) return true;
    return Date.now() >= this.nextRetryAt.getTime();
};

// Statics
verificationProgressSchema.statics.findPending = function() {
    return this.find({
        status: 'pending',
        nextRetryAt: { $lte: new Date() }
    }).sort({ createdAt: 1 });
};

verificationProgressSchema.statics.findExpiring = function(days = 30) {
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + days);
    
    return this.find({
        status: 'approved',
        expiresAt: { $lte: expiryDate }
    }).sort({ expiresAt: 1 });
};

// Middleware
verificationProgressSchema.pre('save', function(next) {
    // Set expiration date if not set
    if (!this.expiresAt && this.status === 'approved') {
        const expiryDays = this.type === 'business' ? 365 : 180; // 1 year for business, 6 months for drivers
        this.expiresAt = new Date();
        this.expiresAt.setDate(this.expiresAt.getDate() + expiryDays);
    }
    next();
});

const VerificationProgress = mongoose.model('VerificationProgress', verificationProgressSchema);

module.exports = VerificationProgress; 