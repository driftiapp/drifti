const mongoose = require('mongoose');

const agreementAcceptanceSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    agreementId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Agreement',
        required: true,
        index: true
    },
    agreementType: {
        type: String,
        required: true,
        index: true
    },
    agreementVersion: {
        type: String,
        required: true
    },
    acceptedAt: {
        type: Date,
        default: Date.now,
        index: true
    },
    ipAddress: {
        type: String,
        required: true
    },
    userAgent: {
        type: String,
        required: true
    },
    providedFields: {
        type: Map,
        of: String,
        required: true
    },
    signature: {
        type: String,
        required: true
    },
    isValid: {
        type: Boolean,
        default: true,
        index: true
    },
    metadata: {
        deviceInfo: Object,
        geoLocation: {
            latitude: Number,
            longitude: Number
        },
        additionalInfo: Object
    }
});

// Compound index for quick lookups
agreementAcceptanceSchema.index({ userId: 1, agreementType: 1, agreementVersion: 1 });

// Static method to check if user has accepted latest agreement
agreementAcceptanceSchema.statics.hasAcceptedLatest = async function(userId, agreementType) {
    const Agreement = mongoose.model('Agreement');
    const latestAgreement = await Agreement.getLatestByType(agreementType);
    
    if (!latestAgreement) {
        throw new Error(`No active agreement found for type: ${agreementType}`);
    }

    const acceptance = await this.findOne({
        userId,
        agreementType,
        agreementVersion: latestAgreement.version,
        isValid: true
    });

    return !!acceptance;
};

// Static method to get all valid acceptances for a user
agreementAcceptanceSchema.statics.getUserAcceptances = async function(userId) {
    return this.find({
        userId,
        isValid: true
    })
    .sort({ acceptedAt: -1 })
    .populate('agreementId', 'type version effectiveDate')
    .exec();
};

// Instance method to invalidate acceptance
agreementAcceptanceSchema.methods.invalidate = async function(reason) {
    this.isValid = false;
    this.metadata.invalidationReason = reason;
    this.metadata.invalidatedAt = new Date();
    await this.save();
};

// Pre-save middleware to ensure required fields match agreement requirements
agreementAcceptanceSchema.pre('save', async function(next) {
    if (this.isNew) {
        const Agreement = mongoose.model('Agreement');
        const agreement = await Agreement.findById(this.agreementId);
        
        if (!agreement) {
            return next(new Error('Referenced agreement not found'));
        }

        // Verify all required fields are provided
        const missingFields = agreement.requiredFields.filter(
            field => !this.providedFields.has(field)
        );

        if (missingFields.length > 0) {
            return next(new Error(`Missing required fields: ${missingFields.join(', ')}`));
        }
    }
    next();
});

const AgreementAcceptance = mongoose.model('AgreementAcceptance', agreementAcceptanceSchema);

module.exports = AgreementAcceptance; 