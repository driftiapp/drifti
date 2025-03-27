const mongoose = require('mongoose');

const agreementSchema = new mongoose.Schema({
    type: {
        type: String,
        required: true,
        enum: ['general', 'liquor_store', 'restaurant', 'pharmacy', 'grocery'],
        index: true
    },
    version: {
        type: String,
        required: true,
        index: true
    },
    content: {
        type: String,
        required: true
    },
    isActive: {
        type: Boolean,
        default: true,
        index: true
    },
    effectiveDate: {
        type: Date,
        required: true,
        index: true
    },
    expirationDate: {
        type: Date,
        index: true
    },
    requiredFields: [{
        type: String,
        enum: ['name', 'dob', 'address', 'phone', 'email', 'license_number']
    }],
    metadata: {
        jurisdiction: String,
        regulatoryReferences: [String],
        specialRequirements: [String]
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Middleware to update the updatedAt timestamp
agreementSchema.pre('save', function(next) {
    this.updatedAt = new Date();
    next();
});

// Static method to get the latest active agreement by type
agreementSchema.statics.getLatestByType = async function(type) {
    return this.findOne({ type, isActive: true })
        .sort({ effectiveDate: -1 })
        .exec();
};

// Static method to check if a version exists for a type
agreementSchema.statics.versionExists = async function(type, version) {
    const count = await this.countDocuments({ type, version });
    return count > 0;
};

// Instance method to deactivate agreement
agreementSchema.methods.deactivate = async function() {
    this.isActive = false;
    this.expirationDate = new Date();
    await this.save();
};

const Agreement = mongoose.model('Agreement', agreementSchema);

module.exports = Agreement; 