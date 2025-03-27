const axios = require('axios');
const config = require('../config');
const { createHash } = require('crypto');
const Business = require('../models/Business');
const Driver = require('../models/Driver');
const DocumentService = require('./DocumentService');
const VerificationProgress = require('../models/VerificationProgress');

class VerificationService {
    constructor() {
        this.documentService = new DocumentService();
    }

    async verifyBusiness(businessData, documents, metadata = {}) {
        try {
            // Create or get verification progress
            let progress = await VerificationProgress.findOne({
                userId: businessData.userId,
                type: 'business'
            });

            if (!progress) {
                progress = new VerificationProgress({
                    userId: businessData.userId,
                    type: 'business',
                    metadata
                });
            }

            // Check if we can retry verification
            if (!progress.canRetry()) {
                return {
                    status: 'pending',
                    nextRetryAt: progress.nextRetryAt,
                    message: 'Please wait before retrying verification'
                };
            }

            const verificationDetails = {
                businessRegistrationVerified: false,
                einVerified: false,
                addressVerified: false,
                documentsVerified: false,
                categorySpecificVerified: false
            };

            let trustScore = 0;
            const flags = [];

            // Update basic info progress
            await progress.updateProgress('basicInfo', {
                completed: true
            });

            // 1. Verify business registration with OpenCorporates
            const registrationResult = await this.verifyBusinessRegistration(businessData);
            verificationDetails.businessRegistrationVerified = registrationResult.verified;
            trustScore += registrationResult.verified ? 30 : 0;
            if (registrationResult.flags) flags.push(...registrationResult.flags);

            // 2. Verify EIN with IRS
            const einResult = await this.verifyEIN(businessData);
            verificationDetails.einVerified = einResult.valid;
            trustScore += einResult.valid ? 20 : 0;
            if (!einResult.valid) flags.push('ein_verification_failed');

            // 3. Verify address with Google My Business
            const addressResult = await this.verifyBusinessAddress(businessData);
            verificationDetails.addressVerified = addressResult.verified;
            trustScore += addressResult.verified ? 15 : 0;
            if (addressResult.flags) flags.push(...addressResult.flags);

            // Update verification progress
            await progress.updateProgress('verification', {
                completed: true,
                trustScore,
                flags
            });

            // 4. Verify uploaded documents
            if (documents && Object.keys(documents).length > 0) {
                const documentsResult = await this.verifyBusinessDocuments(documents);
                verificationDetails.documentsVerified = documentsResult.verified;
                trustScore += documentsResult.verified ? 20 : 0;
                if (documentsResult.flags) flags.push(...documentsResult.flags);

                // Update documents progress
                await progress.updateProgress('documents', {
                    completed: true,
                    uploadedDocs: Object.keys(documents),
                    missingDocs: documentsResult.missingDocs
                });
            }

            // 5. Category-specific verification
            if (businessData.businessType === 'liquor_store') {
                const liquorLicenseResult = await this.verifyLiquorLicense(documents.liquorLicense);
                verificationDetails.categorySpecificVerified = liquorLicenseResult.valid;
                verificationDetails.liquorLicenseVerified = liquorLicenseResult.valid;
                trustScore += liquorLicenseResult.valid ? 15 : 0;
                if (!liquorLicenseResult.valid) flags.push('liquor_license_verification_failed');
            } else {
                verificationDetails.categorySpecificVerified = true;
                trustScore += 15;
            }

            // Determine verification status
            const status = this.determineBusinessStatus(trustScore, flags);

            // Update final progress status
            progress.status = status;
            progress.verificationDetails = verificationDetails;
            if (status === 'approved') {
                progress.currentStep = 'completed';
                progress.completedAt = new Date();
            }
            await progress.save();

            return {
                status,
                trustScore,
                flags: flags.length > 0 ? flags : undefined,
                verificationDetails,
                progress: {
                    currentStep: progress.currentStep,
                    completedSteps: Object.entries(progress.progress)
                        .filter(([_, step]) => step.completed)
                        .map(([name]) => name)
                }
            };
        } catch (error) {
            console.error('Business verification error:', error);
            throw new Error('Business verification failed');
        }
    }

    async verifyDriver(driverData, documents, metadata = {}) {
        try {
            // Create or get verification progress
            let progress = await VerificationProgress.findOne({
                userId: driverData.userId,
                type: 'driver'
            });

            if (!progress) {
                progress = new VerificationProgress({
                    userId: driverData.userId,
                    type: 'driver',
                    metadata
                });
            }

            // Check if we can retry verification
            if (!progress.canRetry()) {
                return {
                    status: 'pending',
                    nextRetryAt: progress.nextRetryAt,
                    message: 'Please wait before retrying verification'
                };
            }

            const verificationDetails = {
                identityVerified: false,
                driverRecordVerified: false,
                backgroundCheckPassed: false,
                documentsVerified: false
            };

            const flags = [];

            // Update basic info progress
            await progress.updateProgress('basicInfo', {
                completed: true
            });

            // 1. Verify identity with ID.me
            const identityResult = await this.verifyDriverIdentity(driverData);
            verificationDetails.identityVerified = identityResult.verified;
            if (!identityResult.verified) flags.push('identity_verification_failed');

            // 2. Check driving record with DMV
            const drivingRecord = await this.checkDrivingRecord(driverData);
            verificationDetails.driverRecordVerified = drivingRecord.valid;
            if (drivingRecord.violations?.length > 0) {
                flags.push('driving_record_issues');
                if (this.hasSerousViolations(drivingRecord.violations)) {
                    await this.handleRejection(progress, 'Serious driving violations found');
                    return {
                        status: 'rejected',
                        reason: 'Serious driving violations found',
                        verificationDetails
                    };
                }
            }

            // 3. Run background check with Checkr
            const backgroundCheck = await this.runBackgroundCheck(driverData);
            verificationDetails.backgroundCheckPassed = backgroundCheck.status === 'clear';
            if (backgroundCheck.status === 'consider') {
                if (this.hasDisqualifyingOffenses(backgroundCheck)) {
                    await this.handleRejection(progress, `Disqualifying offense found: ${backgroundCheck.criminal_records[0].type}`);
                    return {
                        status: 'rejected',
                        reason: `Disqualifying offense found: ${backgroundCheck.criminal_records[0].type}`,
                        verificationDetails
                    };
                }
                flags.push('background_check_issues');
            }

            // Update verification progress
            await progress.updateProgress('verification', {
                completed: true,
                flags
            });

            // 4. Verify uploaded documents
            if (documents && Object.keys(documents).length > 0) {
                const documentsResult = await this.verifyDriverDocuments(documents);
                verificationDetails.documentsVerified = documentsResult.verified;
                if (!documentsResult.verified) flags.push('document_verification_failed');

                // Update documents progress
                await progress.updateProgress('documents', {
                    completed: true,
                    uploadedDocs: Object.keys(documents),
                    missingDocs: documentsResult.missingDocs
                });
            }

            // Determine verification status
            const status = flags.length === 0 ? 'approved' : 'manual_review';

            // Update final progress status
            progress.status = status;
            progress.verificationDetails = verificationDetails;
            if (status === 'approved') {
                progress.currentStep = 'completed';
                progress.completedAt = new Date();
            }
            await progress.save();

            return {
                status,
                flags: flags.length > 0 ? flags : undefined,
                verificationDetails,
                progress: {
                    currentStep: progress.currentStep,
                    completedSteps: Object.entries(progress.progress)
                        .filter(([_, step]) => step.completed)
                        .map(([name]) => name)
                }
            };
        } catch (error) {
            console.error('Driver verification error:', error);
            throw new Error('Driver verification failed');
        }
    }

    async verifyDriverInterview(interviewData) {
        try {
            // Get verification progress
            const progress = await VerificationProgress.findOne({
                userId: interviewData.userId,
                type: 'driver'
            });

            if (!progress) {
                throw new Error('No verification process found for this driver');
            }

            const confidenceScore = await this.calculateInterviewConfidence(interviewData);
            const interviewPassed = confidenceScore >= config.verification.driver.interview.minConfidenceScore;

            // Update interview progress
            await progress.updateProgress('interview', {
                completed: true,
                confidenceScore,
                attempts: (progress.progress.interview.attempts || 0) + 1
            });

            if (interviewPassed) {
                progress.currentStep = 'completed';
                progress.completedAt = new Date();
                await progress.save();
            }

            return {
                interviewPassed,
                confidenceScore,
                details: {
                    addressVerified: this.verifyAddressHistory(interviewData.questions),
                    vehicleInfoVerified: this.verifyVehicleInfo(interviewData.questions),
                    facialRecognitionPassed: interviewData.facialRecognition.matchScore >= config.verification.driver.interview.facialRecognitionThreshold
                },
                progress: {
                    currentStep: progress.currentStep,
                    completedSteps: Object.entries(progress.progress)
                        .filter(([_, step]) => step.completed)
                        .map(([name]) => name)
                }
            };
        } catch (error) {
            console.error('Interview verification error:', error);
            throw new Error('Interview verification failed');
        }
    }

    async handleRejection(progress, reason) {
        progress.status = 'rejected';
        progress.currentStep = 'completed';
        progress.completedAt = new Date();
        await progress.save();
    }

    // Private helper methods
    async verifyBusinessRegistration(businessData) {
        try {
            const response = await axios.get('https://api.opencorporates.com/v0.4/companies/search', {
                params: {
                    q: businessData.businessName,
                    jurisdiction_code: 'us',
                    api_token: config.openCorporates.apiKey
                }
            });

            const company = response.data.results?.company;
            if (!company) return { verified: false, flags: ['business_not_found'] };

            const addressMatch = this.compareAddresses(
                company.registered_address,
                businessData.businessAddress
            );

            return {
                verified: company.status === 'Active' && addressMatch,
                flags: !addressMatch ? ['address_mismatch'] : undefined
            };
        } catch (error) {
            console.error('Business registration verification error:', error);
            return { verified: false, flags: ['registration_verification_failed'] };
        }
    }

    async verifyEIN(businessData) {
        try {
            const response = await axios.post('https://api.irs.gov/verify_ein', {
                ein: businessData.ein,
                business_name: businessData.businessName,
                api_key: config.irs.apiKey
            });

            return {
                valid: response.data.valid && response.data.business_name_match,
                details: response.data
            };
        } catch (error) {
            console.error('EIN verification error:', error);
            return { valid: false };
        }
    }

    async verifyBusinessAddress(businessData) {
        try {
            const response = await axios.get('https://mybusiness.googleapis.com/v4/accounts', {
                headers: { Authorization: `Bearer ${config.google.apiKey}` },
                params: { businessAddress: businessData.businessAddress }
            });

            const flags = response.data.suspiciousFlags || [];
            return {
                verified: flags.length === 0,
                flags: flags.map(flag => `address_${flag}`)
            };
        } catch (error) {
            console.error('Address verification error:', error);
            return { verified: false, flags: ['address_verification_failed'] };
        }
    }

    async verifyDriverIdentity(driverData) {
        try {
            const response = await axios.post('https://api.id.me/verify', {
                ssn_last4: driverData.ssn,
                name: driverData.name,
                api_key: config.idMe.apiKey
            });

            return {
                verified: response.data.verified && response.data.identity_score >= 0.9,
                score: response.data.identity_score
            };
        } catch (error) {
            console.error('Identity verification error:', error);
            return { verified: false };
        }
    }

    async checkDrivingRecord(driverData) {
        try {
            const response = await axios.get('https://api.dmv.gov/driver_record', {
                headers: { Authorization: `Bearer ${config.dmv.apiKey}` },
                params: { license_number: driverData.driversLicense }
            });

            return {
                valid: response.data.valid,
                violations: response.data.violations,
                accidents: response.data.accidents,
                status: response.data.status
            };
        } catch (error) {
            console.error('Driving record check error:', error);
            return { valid: false };
        }
    }

    async runBackgroundCheck(driverData) {
        try {
            const response = await axios.post('https://api.checkr.com/screenings', {
                type: 'driver',
                candidate: {
                    name: driverData.name,
                    ssn_last4: driverData.ssn,
                    email: driverData.email
                },
                api_key: config.checkr.apiKey
            });

            return response.data;
        } catch (error) {
            console.error('Background check error:', error);
            throw new Error('Background check failed');
        }
    }

    determineBusinessStatus(trustScore, flags) {
        if (trustScore >= 85 && flags.length === 0) return 'approved';
        if (trustScore < 50 || flags.includes('fraud_suspected')) return 'rejected';
        return 'manual_review';
    }

    hasSerousViolations(violations) {
        const seriousOffenses = ['DUI', 'reckless_driving', 'license_suspension'];
        return violations.some(v => seriousOffenses.includes(v.type));
    }

    hasDisqualifyingOffenses(backgroundCheck) {
        const disqualifyingOffenses = ['DUI', 'felony', 'violent_crime', 'sexual_offense'];
        return backgroundCheck.criminal_records.some(record =>
            disqualifyingOffenses.includes(record.type)
        );
    }

    async calculateInterviewConfidence(interviewData) {
        // Implement AI-based confidence calculation
        const addressScore = this.verifyAddressHistory(interviewData.questions) ? 0.4 : 0;
        const vehicleScore = this.verifyVehicleInfo(interviewData.questions) ? 0.3 : 0;
        const facialScore = interviewData.facialRecognition.matchScore * 0.3;

        return addressScore + vehicleScore + facialScore;
    }

    verifyAddressHistory(questions) {
        const addressQuestion = questions.find(q => 
            q.question.toLowerCase().includes('previous address')
        );
        return addressQuestion && addressQuestion.answer.length > 10;
    }

    verifyVehicleInfo(questions) {
        const vehicleQuestion = questions.find(q =>
            q.question.toLowerCase().includes('vehicle')
        );
        return vehicleQuestion && vehicleQuestion.answer.length > 0;
    }

    compareAddresses(addr1, addr2) {
        // Implement fuzzy address comparison
        const normalize = addr => addr.toLowerCase().replace(/[^a-z0-9]/g, '');
        return normalize(addr1) === normalize(addr2);
    }
}

module.exports = new VerificationService(); 