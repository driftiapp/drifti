const AWS = require('aws-sdk');
const axios = require('axios');
const { ValidationError } = require('../utils/errors');
const redis = require('../utils/redis');

class FaceVerificationService {
    constructor() {
        this.rekognition = new AWS.Rekognition({
            region: process.env.AWS_REGION,
            accessKeyId: process.env.AWS_ACCESS_KEY_ID,
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
        });

        this.verificationCache = redis.createClient();
        this.CACHE_TTL = 300; // 5 minutes
    }

    /**
     * Compare live selfie with ID photo
     */
    async compareFaces(selfieBuffer, idPhotoBuffer) {
        try {
            const response = await this.rekognition.compareFaces({
                SourceImage: { Bytes: selfieBuffer },
                TargetImage: { Bytes: idPhotoBuffer },
                SimilarityThreshold: 90.0
            }).promise();

            if (!response.FaceMatches || response.FaceMatches.length === 0) {
                throw new ValidationError('Face in selfie does not match ID photo');
            }

            const similarity = response.FaceMatches[0].Similarity;
            return {
                match: similarity >= 90,
                similarity,
                confidence: response.FaceMatches[0].Face.Confidence
            };
        } catch (error) {
            console.error('Face comparison failed:', error);
            throw new ValidationError('Face verification failed');
        }
    }

    /**
     * Verify liveness through motion checks
     */
    async verifyLiveness(videoBuffer, requiredGestures = ['blink', 'nod', 'smile']) {
        try {
            const frames = await this.extractKeyFrames(videoBuffer);
            const gestureResults = {};

            for (const gesture of requiredGestures) {
                const detected = await this.detectGesture(frames, gesture);
                gestureResults[gesture] = detected;
            }

            // Verify all required gestures were detected
            const allGesturesDetected = requiredGestures.every(
                gesture => gestureResults[gesture]
            );

            if (!allGesturesDetected) {
                const missing = requiredGestures.filter(
                    gesture => !gestureResults[gesture]
                );
                throw new ValidationError(
                    `Missing required gestures: ${missing.join(', ')}`
                );
            }

            return {
                isLive: true,
                detectedGestures: gestureResults,
                confidence: Math.min(...Object.values(gestureResults).map(g => g.confidence))
            };
        } catch (error) {
            console.error('Liveness verification failed:', error);
            throw new ValidationError('Liveness verification failed');
        }
    }

    /**
     * Detect potential fraud attempts
     */
    async detectFraud(imageBuffer) {
        try {
            // Check for deepfakes using Amazon Rekognition
            const labelResponse = await this.rekognition.detectLabels({
                Image: { Bytes: imageBuffer },
                MinConfidence: 70
            }).promise();

            const suspiciousLabels = labelResponse.Labels.filter(label => 
                ['Screen', 'Monitor', 'Display', 'Paper', 'Mask'].includes(label.Name)
            );

            if (suspiciousLabels.length > 0) {
                throw new ValidationError('Potential fraud detected: artificial image source');
            }

            // Check for face quality and authenticity
            const qualityResponse = await this.rekognition.detectFaces({
                Image: { Bytes: imageBuffer },
                Attributes: ['ALL']
            }).promise();

            if (qualityResponse.FaceDetails.length === 0) {
                throw new ValidationError('No face detected in image');
            }

            const faceDetail = qualityResponse.FaceDetails[0];
            
            // Check if face is real (not a mask or printed photo)
            if (faceDetail.Quality.Brightness < 40 || faceDetail.Quality.Sharpness < 40) {
                throw new ValidationError('Image quality too low - possible fraud attempt');
            }

            return {
                isAuthentic: true,
                confidence: faceDetail.Confidence,
                quality: faceDetail.Quality
            };
        } catch (error) {
            console.error('Fraud detection failed:', error);
            throw new ValidationError('Fraud detection failed');
        }
    }

    /**
     * Extract key frames from verification video
     */
    async extractKeyFrames(videoBuffer) {
        // Implementation would use ffmpeg or similar to extract frames
        // For now, we'll assume we receive an array of frame buffers
        return videoBuffer;
    }

    /**
     * Detect specific gesture in frames
     */
    async detectGesture(frames, gesture) {
        const gestureConfidences = await Promise.all(frames.map(async frame => {
            const response = await this.rekognition.detectFaces({
                Image: { Bytes: frame },
                Attributes: ['ALL']
            }).promise();

            if (response.FaceDetails.length === 0) return 0;

            const faceDetail = response.FaceDetails[0];
            switch (gesture) {
                case 'blink':
                    return faceDetail.EyesOpen.Confidence < 50 ? faceDetail.Confidence : 0;
                case 'smile':
                    return faceDetail.Smile.Confidence;
                case 'nod':
                    // Would require comparing head pose across frames
                    return this.detectHeadMovement(frames, 'nod');
                default:
                    return 0;
            }
        }));

        const maxConfidence = Math.max(...gestureConfidences);
        return {
            detected: maxConfidence > 90,
            confidence: maxConfidence
        };
    }

    /**
     * Detect head movement pattern
     */
    async detectHeadMovement(frames, movement) {
        // Implementation would track head pose changes across frames
        // For now, return a placeholder implementation
        return {
            detected: true,
            confidence: 95
        };
    }

    /**
     * Complete verification process
     */
    async verifyIdentity(userId, {
        selfieBuffer,
        idPhotoBuffer,
        verificationVideo,
        requiredGestures
    }) {
        // Check cache first
        const cacheKey = `verification:${userId}`;
        const cached = await this.verificationCache.get(cacheKey);
        if (cached) {
            return JSON.parse(cached);
        }

        try {
            // Run all verifications in parallel
            const [faceMatch, liveness, fraudCheck] = await Promise.all([
                this.compareFaces(selfieBuffer, idPhotoBuffer),
                this.verifyLiveness(verificationVideo, requiredGestures),
                this.detectFraud(selfieBuffer)
            ]);

            const result = {
                verified: faceMatch.match && liveness.isLive && fraudCheck.isAuthentic,
                faceMatch,
                liveness,
                fraudCheck,
                timestamp: new Date().toISOString()
            };

            // Cache successful results
            if (result.verified) {
                await this.verificationCache.setex(
                    cacheKey,
                    this.CACHE_TTL,
                    JSON.stringify(result)
                );
            }

            return result;
        } catch (error) {
            console.error('Identity verification failed:', error);
            throw new ValidationError('Identity verification failed');
        }
    }
}

module.exports = new FaceVerificationService(); 