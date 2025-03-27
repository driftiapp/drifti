const Agreement = require('../models/Agreement');
const AgreementAcceptance = require('../models/AgreementAcceptance');
const { ValidationError } = require('../utils/errors');

class AgreementService {
    /**
     * Create a new agreement version
     */
    async createAgreement(agreementData) {
        const { type, version } = agreementData;

        // Check if version already exists
        const exists = await Agreement.versionExists(type, version);
        if (exists) {
            throw new ValidationError(`Agreement version ${version} already exists for type ${type}`);
        }

        // Create new agreement
        const agreement = new Agreement(agreementData);
        await agreement.save();

        // Deactivate previous agreements of the same type
        await Agreement.updateMany(
            { 
                type, 
                _id: { $ne: agreement._id },
                isActive: true 
            },
            { 
                $set: { 
                    isActive: false,
                    expirationDate: new Date()
                }
            }
        );

        return agreement;
    }

    /**
     * Record user's acceptance of an agreement
     */
    async recordAcceptance(userId, agreementId, acceptanceData) {
        const agreement = await Agreement.findById(agreementId);
        if (!agreement || !agreement.isActive) {
            throw new ValidationError('Agreement not found or inactive');
        }

        const acceptance = new AgreementAcceptance({
            userId,
            agreementId,
            agreementType: agreement.type,
            agreementVersion: agreement.version,
            ...acceptanceData
        });

        await acceptance.save();
        return acceptance;
    }

    /**
     * Check if user needs to accept any agreements
     */
    async checkRequiredAgreements(userId, businessTypes = ['general']) {
        const required = [];

        for (const type of businessTypes) {
            const hasAccepted = await AgreementAcceptance.hasAcceptedLatest(userId, type);
            if (!hasAccepted) {
                const agreement = await Agreement.getLatestByType(type);
                if (agreement) {
                    required.push({
                        type,
                        agreementId: agreement._id,
                        version: agreement.version,
                        requiredFields: agreement.requiredFields
                    });
                }
            }
        }

        return required;
    }

    /**
     * Get agreement content by ID
     */
    async getAgreementContent(agreementId) {
        const agreement = await Agreement.findById(agreementId);
        if (!agreement) {
            throw new ValidationError('Agreement not found');
        }
        return agreement;
    }

    /**
     * Get user's agreement acceptance history
     */
    async getUserAcceptanceHistory(userId) {
        return AgreementAcceptance.getUserAcceptances(userId);
    }

    /**
     * Invalidate user's agreement acceptance
     */
    async invalidateAcceptance(acceptanceId, reason) {
        const acceptance = await AgreementAcceptance.findById(acceptanceId);
        if (!acceptance) {
            throw new ValidationError('Acceptance record not found');
        }
        await acceptance.invalidate(reason);
        return acceptance;
    }

    /**
     * Get all active agreements by types
     */
    async getActiveAgreements(types = []) {
        const query = { isActive: true };
        if (types.length > 0) {
            query.type = { $in: types };
        }
        return Agreement.find(query).sort({ type: 1, effectiveDate: -1 });
    }

    /**
     * Check if store type requires specific agreements
     */
    async getRequiredAgreementsForStoreType(storeType) {
        const typeMap = {
            'liquor_store': ['general', 'liquor_store'],
            'restaurant': ['general', 'restaurant'],
            'pharmacy': ['general', 'pharmacy'],
            'grocery': ['general', 'grocery']
        };

        return typeMap[storeType] || ['general'];
    }
}

module.exports = new AgreementService(); 