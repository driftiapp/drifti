const axios = require('axios');
const config = require('../config');
const { createReadStream } = require('fs');
const FormData = require('form-data');

class DocumentService {
    async verifyBusinessDocuments(documents) {
        try {
            const verificationResults = await Promise.all([
                this.verifyDocument(documents.businessLicense, 'business_license'),
                this.verifyDocument(documents.taxCertificate, 'tax_certificate'),
                this.verifyDocument(documents.insuranceCertificate, 'insurance'),
                documents.healthPermit ? this.verifyDocument(documents.healthPermit, 'health_permit') : Promise.resolve({ valid: true })
            ]);

            const flags = verificationResults
                .filter(result => !result.valid)
                .map(result => result.flag);

            return {
                verified: flags.length === 0,
                flags: flags.length > 0 ? flags : undefined,
                details: verificationResults.reduce((acc, result, index) => {
                    const docTypes = ['businessLicense', 'taxCertificate', 'insuranceCertificate', 'healthPermit'];
                    acc[docTypes[index]] = result;
                    return acc;
                }, {})
            };
        } catch (error) {
            console.error('Business documents verification error:', error);
            return { verified: false, flags: ['document_verification_failed'] };
        }
    }

    async verifyDriverDocuments(documents) {
        try {
            const verificationResults = await Promise.all([
                this.verifyDocument(documents.driversLicense, 'drivers_license'),
                this.verifyDocument(documents.insurance, 'vehicle_insurance'),
                this.verifyDocument(documents.vehicleRegistration, 'vehicle_registration'),
                documents.medicalCertificate ? this.verifyDocument(documents.medicalCertificate, 'medical_certificate') : Promise.resolve({ valid: true })
            ]);

            const flags = verificationResults
                .filter(result => !result.valid)
                .map(result => result.flag);

            return {
                verified: flags.length === 0,
                flags: flags.length > 0 ? flags : undefined,
                details: verificationResults.reduce((acc, result, index) => {
                    const docTypes = ['driversLicense', 'insurance', 'vehicleRegistration', 'medicalCertificate'];
                    acc[docTypes[index]] = result;
                    return acc;
                }, {})
            };
        } catch (error) {
            console.error('Driver documents verification error:', error);
            return { verified: false, flags: ['document_verification_failed'] };
        }
    }

    async verifyDocument(document, type) {
        if (!document) {
            return { valid: false, flag: `missing_${type}` };
        }

        try {
            // 1. Check file authenticity
            const authenticityResult = await this.checkFileAuthenticity(document);
            if (!authenticityResult.valid) {
                return { valid: false, flag: `invalid_${type}_file` };
            }

            // 2. Scan for malware
            const malwareResult = await this.scanForMalware(document);
            if (!malwareResult.clean) {
                return { valid: false, flag: `malware_detected_${type}` };
            }

            // 3. Verify document content based on type
            const contentResult = await this.verifyDocumentContent(document, type);
            if (!contentResult.valid) {
                return { valid: false, flag: `invalid_${type}_content` };
            }

            // 4. Check expiration if applicable
            if (contentResult.expirationDate) {
                const isExpired = new Date(contentResult.expirationDate) < new Date();
                if (isExpired) {
                    return { valid: false, flag: `expired_${type}` };
                }
            }

            return {
                valid: true,
                expirationDate: contentResult.expirationDate,
                details: contentResult.details
            };
        } catch (error) {
            console.error(`Document verification error for ${type}:`, error);
            return { valid: false, flag: `verification_failed_${type}` };
        }
    }

    async checkFileAuthenticity(document) {
        try {
            const formData = new FormData();
            formData.append('file', createReadStream(document.path));

            const response = await axios.post('https://api.document-verify.com/check', formData, {
                headers: {
                    ...formData.getHeaders(),
                    'Authorization': `Bearer ${config.documentVerify.apiKey}`
                }
            });

            return {
                valid: response.data.authentic,
                details: response.data
            };
        } catch (error) {
            console.error('File authenticity check error:', error);
            return { valid: false };
        }
    }

    async scanForMalware(document) {
        try {
            const formData = new FormData();
            formData.append('file', createReadStream(document.path));

            const response = await axios.post('https://api.cloudmersive.com/virus/scan/file', formData, {
                headers: {
                    ...formData.getHeaders(),
                    'Apikey': config.cloudmersive.apiKey
                }
            });

            return {
                clean: response.data.cleanResult,
                details: response.data
            };
        } catch (error) {
            console.error('Malware scan error:', error);
            return { clean: false };
        }
    }

    async verifyDocumentContent(document, type) {
        try {
            const formData = new FormData();
            formData.append('file', createReadStream(document.path));
            formData.append('document_type', type);

            const response = await axios.post('https://api.mindee.net/v1/parse', formData, {
                headers: {
                    ...formData.getHeaders(),
                    'Authorization': `Token ${config.mindee.apiKey}`
                }
            });

            const result = this.validateDocumentFields(response.data, type);
            return {
                valid: result.valid,
                expirationDate: result.expirationDate,
                details: result.details
            };
        } catch (error) {
            console.error('Document content verification error:', error);
            return { valid: false };
        }
    }

    validateDocumentFields(data, type) {
        const fields = data.document.inference.prediction;
        const result = { valid: true, details: {} };

        switch (type) {
            case 'drivers_license':
                result.valid = fields.name && fields.license_number && fields.expiration_date;
                result.expirationDate = fields.expiration_date;
                result.details = {
                    name: fields.name,
                    licenseNumber: fields.license_number,
                    state: fields.state,
                    class: fields.license_class
                };
                break;

            case 'vehicle_insurance':
                result.valid = fields.policy_number && fields.expiration_date && fields.coverage_amount;
                result.expirationDate = fields.expiration_date;
                result.details = {
                    policyNumber: fields.policy_number,
                    coverage: fields.coverage_amount,
                    provider: fields.insurance_provider
                };
                break;

            case 'business_license':
                result.valid = fields.license_number && fields.business_name && fields.expiration_date;
                result.expirationDate = fields.expiration_date;
                result.details = {
                    licenseNumber: fields.license_number,
                    businessName: fields.business_name,
                    jurisdiction: fields.jurisdiction
                };
                break;

            // Add more document types as needed
        }

        return result;
    }

    async verifyLiquorLicense(document) {
        if (!document) {
            return { valid: false };
        }

        try {
            const formData = new FormData();
            formData.append('file', createReadStream(document.path));
            formData.append('license_type', 'liquor');

            const response = await axios.post('https://api.license-verify.com/check', formData, {
                headers: {
                    ...formData.getHeaders(),
                    'Authorization': `Bearer ${config.licenseVerify.apiKey}`
                }
            });

            return {
                valid: response.data.valid && new Date(response.data.expiration_date) > new Date(),
                details: response.data
            };
        } catch (error) {
            console.error('Liquor license verification error:', error);
            return { valid: false };
        }
    }
}

module.exports = new DocumentService(); 