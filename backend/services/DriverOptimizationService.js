const mongoose = require('mongoose');
const redis = require('../utils/redis');
const { ValidationError } = require('../utils/errors');
const axios = require('axios');

class DriverOptimizationService {
    constructor() {
        this.redis = redis.createClient();
        this.HEATMAP_TTL = 300; // 5 minutes
        this.IDLE_THRESHOLD = 270; // 4.5 minutes in seconds
        this.EARNINGS_TTL = 86400; // 24 hours
    }

    /**
     * Generate live demand heatmap
     */
    async generateHeatmap(location, radius) {
        try {
            const cacheKey = `heatmap:${location.lat}:${location.lng}:${radius}`;
            const cached = await this.redis.get(cacheKey);
            if (cached) return JSON.parse(cached);

            // Gather data points for heatmap
            const [activeRides, pendingRequests, events, venues] = await Promise.all([
                this.getActiveRides(location, radius),
                this.getPendingRequests(location, radius),
                this.getNearbyEvents(location, radius),
                this.getPopularVenues(location, radius)
            ]);

            // Calculate demand scores for each area
            const heatmapData = this.calculateDemandScores({
                activeRides,
                pendingRequests,
                events,
                venues
            });

            // Add historical demand patterns
            const historicalData = await this.getHistoricalDemand(location, radius);
            const enrichedHeatmap = this.enrichHeatmapWithHistoricalData(heatmapData, historicalData);

            // Cache the result
            await this.redis.setex(
                cacheKey,
                this.HEATMAP_TTL,
                JSON.stringify(enrichedHeatmap)
            );

            return enrichedHeatmap;
        } catch (error) {
            console.error('Failed to generate heatmap:', error);
            throw new ValidationError('Failed to generate demand heatmap');
        }
    }

    /**
     * Handle idle driver optimization
     */
    async handleIdleDriver(driverId, location) {
        try {
            const suggestions = {
                rides: [],
                deliveries: [],
                gasStops: []
            };

            // Get nearby high-paying rides
            const nearbyRides = await this.getNearbyRides(location);
            suggestions.rides = nearbyRides
                .sort((a, b) => b.estimatedEarnings - a.estimatedEarnings)
                .slice(0, 3);

            // Get nearby delivery opportunities
            if (suggestions.rides.length < 2) {
                const deliveries = await this.getNearbyDeliveries(location);
                suggestions.deliveries = deliveries
                    .sort((a, b) => b.estimatedEarnings - a.estimatedEarnings)
                    .slice(0, 2);
            }

            // Check if gas level is below threshold and suggest stops
            const driverStatus = await this.getDriverStatus(driverId);
            if (driverStatus.gasLevel < 30) {
                suggestions.gasStops = await this.getNearbyGasStations(location);
            }

            return {
                suggestions,
                demandHeatmap: await this.generateHeatmap(location, 5), // 5km radius
                incentives: await this.getAvailableIncentives(driverId, location)
            };
        } catch (error) {
            console.error('Failed to handle idle driver:', error);
            throw new ValidationError('Failed to generate optimization suggestions');
        }
    }

    /**
     * Implement ride stacking for a driver
     */
    async stackNextRide(driverId, currentRideId) {
        try {
            const [currentRide, driverPreferences] = await Promise.all([
                this.getRideDetails(currentRideId),
                this.getDriverPreferences(driverId)
            ]);

            // Calculate estimated completion time
            const estimatedCompletion = this.calculateEstimatedCompletion(currentRide);
            
            // Find potential next rides
            const nextRides = await this.findPotentialNextRides({
                dropoffLocation: currentRide.dropoffLocation,
                availableTime: estimatedCompletion,
                driverPreferences
            });

            // Score and rank rides
            const scoredRides = nextRides.map(ride => ({
                ...ride,
                score: this.scoreRideMatch(ride, driverPreferences)
            })).sort((a, b) => b.score - a.score);

            // Select best match
            const bestMatch = scoredRides[0];
            if (bestMatch && bestMatch.score > 0.7) {
                await this.preassignRide(bestMatch.id, driverId);
                return {
                    success: true,
                    nextRide: bestMatch,
                    estimatedWaitTime: this.calculateWaitTime(
                        currentRide.dropoffLocation,
                        bestMatch.pickupLocation
                    )
                };
            }

            return { success: false, reason: 'No suitable rides found' };
        } catch (error) {
            console.error('Failed to stack next ride:', error);
            throw new ValidationError('Failed to find next ride');
        }
    }

    /**
     * Calculate demand scores for heatmap
     */
    calculateDemandScores(data) {
        const { activeRides, pendingRequests, events, venues } = data;
        const heatmapGrid = {};

        // Process active rides
        activeRides.forEach(ride => {
            const gridKey = this.getGridKey(ride.location);
            heatmapGrid[gridKey] = (heatmapGrid[gridKey] || 0) + 1;
        });

        // Process pending requests (higher weight)
        pendingRequests.forEach(request => {
            const gridKey = this.getGridKey(request.location);
            heatmapGrid[gridKey] = (heatmapGrid[gridKey] || 0) + 2;
        });

        // Process events (weight based on attendance)
        events.forEach(event => {
            const gridKey = this.getGridKey(event.location);
            const weight = this.calculateEventWeight(event);
            heatmapGrid[gridKey] = (heatmapGrid[gridKey] || 0) + weight;
        });

        // Process venues (weight based on popularity and time of day)
        venues.forEach(venue => {
            const gridKey = this.getGridKey(venue.location);
            const weight = this.calculateVenueWeight(venue);
            heatmapGrid[gridKey] = (heatmapGrid[gridKey] || 0) + weight;
        });

        return this.normalizeHeatmapScores(heatmapGrid);
    }

    /**
     * Score ride match based on driver preferences
     */
    scoreRideMatch(ride, preferences) {
        let score = 0;
        const weights = {
            distance: 0.3,
            earnings: 0.3,
            direction: 0.2,
            riderRating: 0.2
        };

        // Score based on distance preference
        if (ride.distance <= preferences.maxDistance) {
            score += weights.distance;
        } else {
            score += weights.distance * (preferences.maxDistance / ride.distance);
        }

        // Score based on earnings potential
        if (ride.estimatedEarnings >= preferences.minEarnings) {
            score += weights.earnings;
        } else {
            score += weights.earnings * (ride.estimatedEarnings / preferences.minEarnings);
        }

        // Score based on direction preference
        if (preferences.preferredDirection) {
            const directionMatch = this.calculateDirectionMatch(
                ride.dropoffLocation,
                preferences.preferredDirection
            );
            score += weights.direction * directionMatch;
        } else {
            score += weights.direction;
        }

        // Score based on rider rating
        if (ride.riderRating >= 4.5) {
            score += weights.riderRating;
        } else {
            score += weights.riderRating * (ride.riderRating / 5);
        }

        return score;
    }

    /**
     * Get grid key for heatmap location
     */
    getGridKey(location) {
        const precision = 3; // ~100m precision
        const lat = Number(location.lat).toFixed(precision);
        const lng = Number(location.lng).toFixed(precision);
        return `${lat}:${lng}`;
    }

    /**
     * Calculate event weight for heatmap
     */
    calculateEventWeight(event) {
        const baseWeight = 3;
        const attendanceWeight = Math.min(event.expectedAttendance / 1000, 5);
        const timeWeight = this.calculateTimeBasedWeight(event.startTime, event.endTime);
        return baseWeight + attendanceWeight + timeWeight;
    }

    /**
     * Calculate venue weight for heatmap
     */
    calculateVenueWeight(venue) {
        const baseWeight = 1;
        const popularityWeight = venue.popularityScore || 0;
        const timeWeight = this.calculateTimeBasedWeight(venue.openTime, venue.closeTime);
        return baseWeight + popularityWeight + timeWeight;
    }

    /**
     * Calculate time-based weight for venues and events
     */
    calculateTimeBasedWeight(startTime, endTime) {
        const now = new Date();
        const start = new Date(startTime);
        const end = new Date(endTime);

        if (now < start) {
            // Event/venue hasn't started
            const hoursUntilStart = (start - now) / (1000 * 60 * 60);
            return Math.max(0, 2 - (hoursUntilStart / 2));
        } else if (now > end) {
            // Event/venue has ended
            return 0;
        } else {
            // Event/venue is ongoing
            return 2;
        }
    }

    /**
     * Generate earnings plan based on driver's goal
     */
    async generateEarningsPlan({ driverId, dailyGoal, startTime, endTime }) {
        try {
            const [driverStats, marketData] = await Promise.all([
                this.getDriverStats(driverId),
                this.getMarketData()
            ]);

            // Calculate required rides based on average earnings
            const avgEarningsPerRide = marketData.avgEarningsPerRide || 15;
            const estimatedRides = Math.ceil(dailyGoal / avgEarningsPerRide);

            // Get optimal hours based on historical data
            const optimalHours = await this.getOptimalHours({
                driverId,
                startTime,
                endTime,
                requiredRides: estimatedRides
            });

            // Generate hourly breakdown
            const hourlyPlan = this.generateHourlyPlan({
                optimalHours,
                dailyGoal,
                estimatedRides
            });

            // Cache the plan
            const cacheKey = `earnings_plan:${driverId}`;
            await this.redis.setex(
                cacheKey,
                this.EARNINGS_TTL,
                JSON.stringify({
                    dailyGoal,
                    hourlyPlan,
                    createdAt: new Date()
                })
            );

            return {
                dailyGoal,
                requiredRides: estimatedRides,
                optimalHours,
                hourlyPlan,
                estimatedCompletionTime: this.calculateEstimatedCompletion({
                    startTime,
                    estimatedRides,
                    optimalHours
                })
            };
        } catch (error) {
            console.error('Failed to generate earnings plan:', error);
            throw new ValidationError('Failed to generate earnings plan');
        }
    }

    /**
     * Get driver's earnings progress
     */
    async getEarningsProgress(driverId) {
        try {
            const [currentEarnings, plan] = await Promise.all([
                this.getCurrentEarnings(driverId),
                this.getCachedEarningsPlan(driverId)
            ]);

            if (!plan) {
                throw new ValidationError('No active earnings plan found');
            }

            const progress = {
                currentEarnings: currentEarnings.total,
                dailyGoal: plan.dailyGoal,
                remainingAmount: plan.dailyGoal - currentEarnings.total,
                completedRides: currentEarnings.rides,
                remainingRides: plan.requiredRides - currentEarnings.rides,
                nextSteps: []
            };

            // Generate next steps based on progress
            if (progress.remainingAmount > 0) {
                progress.nextSteps = await this.generateNextSteps({
                    driverId,
                    remainingAmount: progress.remainingAmount,
                    remainingRides: progress.remainingRides
                });
            }

            return progress;
        } catch (error) {
            console.error('Failed to get earnings progress:', error);
            throw error;
        }
    }

    /**
     * Get earnings insights and tips
     */
    async getEarningsInsights({ driverId, location }) {
        try {
            const [currentEarnings, nearbyOpportunities] = await Promise.all([
                this.getCurrentEarnings(driverId),
                this.getNearbyOpportunities(location)
            ]);

            const insights = {
                currentPace: this.calculateEarningsPace(currentEarnings),
                opportunities: [],
                tips: []
            };

            // Add high-earning opportunities
            insights.opportunities = nearbyOpportunities
                .filter(opp => opp.estimatedEarnings > currentEarnings.averagePerRide)
                .map(opp => ({
                    type: opp.type,
                    location: opp.location,
                    estimatedEarnings: opp.estimatedEarnings,
                    reason: opp.reason
                }));

            // Generate personalized tips
            insights.tips = this.generateEarningsTips({
                currentEarnings,
                opportunities: nearbyOpportunities,
                driverStats: await this.getDriverStats(driverId)
            });

            return insights;
        } catch (error) {
            console.error('Failed to get earnings insights:', error);
            throw error;
        }
    }

    /**
     * Get surge pricing alerts
     */
    async getSurgeAlerts({ driverId, location, radius }) {
        try {
            const alerts = [];
            const surgeZones = await this.getSurgeZones(location, radius);

            // Process each surge zone
            for (const zone of surgeZones) {
                const estimatedEarnings = await this.calculateSurgeEarnings(zone);
                if (estimatedEarnings.multiplier > 1.2) { // Only alert for significant surges
                    alerts.push({
                        location: zone.location,
                        multiplier: estimatedEarnings.multiplier,
                        estimatedEarnings: estimatedEarnings.amount,
                        duration: zone.duration,
                        distance: this.calculateDistance(location, zone.location),
                        travelTime: await this.estimateTravelTime(location, zone.location)
                    });
                }
            }

            // Sort by potential earnings and distance
            return alerts.sort((a, b) => {
                const aScore = a.estimatedEarnings / (a.travelTime || 1);
                const bScore = b.estimatedEarnings / (b.travelTime || 1);
                return bScore - aScore;
            });
        } catch (error) {
            console.error('Failed to get surge alerts:', error);
            throw error;
        }
    }

    /**
     * Update auto-savings configuration
     */
    async updateAutoSavingsConfig(driverId, config) {
        try {
            const { taxPercentage, vacationPercentage, goalsPercentage } = config;
            
            // Validate percentages
            const total = (taxPercentage || 0) + (vacationPercentage || 0) + (goalsPercentage || 0);
            if (total > 100) {
                throw new ValidationError('Total savings percentage cannot exceed 100%');
            }

            // Update driver's savings configuration
            await this.updateDriverConfig(driverId, {
                autoSavings: {
                    tax: taxPercentage || 0,
                    vacation: vacationPercentage || 0,
                    goals: goalsPercentage || 0,
                    updatedAt: new Date()
                }
            });

            return {
                driverId,
                autoSavings: {
                    tax: taxPercentage || 0,
                    vacation: vacationPercentage || 0,
                    goals: goalsPercentage || 0
                }
            };
        } catch (error) {
            console.error('Failed to update auto-savings config:', error);
            throw error;
        }
    }

    /**
     * Generate next steps for reaching earnings goal
     */
    async generateNextSteps({ driverId, remainingAmount, remainingRides }) {
        const steps = [];
        const [currentLocation, driverPreferences] = await Promise.all([
            this.getDriverLocation(driverId),
            this.getDriverPreferences(driverId)
        ]);

        // Get nearby opportunities
        const opportunities = await this.getNearbyOpportunities(currentLocation);
        
        // Add high-paying ride opportunities
        const highPayingRides = opportunities
            .filter(opp => opp.type === 'ride' && opp.estimatedEarnings > remainingAmount / remainingRides)
            .slice(0, 3);
        
        if (highPayingRides.length > 0) {
            steps.push({
                type: 'rides',
                message: `Take these high-paying rides to reach your goal faster:`,
                opportunities: highPayingRides
            });
        }

        // Check surge zones
        const surgeZones = await this.getSurgeZones(currentLocation, 10);
        if (surgeZones.length > 0) {
            steps.push({
                type: 'surge',
                message: `Head to surge zones for increased earnings:`,
                zones: surgeZones.slice(0, 2)
            });
        }

        // Add alternative earning opportunities if needed
        if (steps.length < 2) {
            const alternatives = opportunities
                .filter(opp => opp.type !== 'ride')
                .sort((a, b) => b.estimatedEarnings - a.estimatedEarnings)
                .slice(0, 2);

            if (alternatives.length > 0) {
                steps.push({
                    type: 'alternatives',
                    message: `Consider these alternative opportunities:`,
                    opportunities: alternatives
                });
            }
        }

        return steps;
    }

    /**
     * Calculate earnings pace
     */
    calculateEarningsPace(earnings) {
        const now = new Date();
        const startTime = new Date(earnings.startTime);
        const hoursWorked = (now - startTime) / (1000 * 60 * 60);
        
        return {
            hourlyRate: earnings.total / hoursWorked,
            projectedDaily: (earnings.total / hoursWorked) * 8, // Based on 8-hour day
            completedRides: earnings.rides,
            averagePerRide: earnings.total / earnings.rides
        };
    }

    /**
     * Generate earnings tips based on driver's performance
     */
    generateEarningsTips({ currentEarnings, opportunities, driverStats }) {
        const tips = [];

        // Analyze earnings pattern
        if (currentEarnings.averagePerRide < driverStats.avgEarningsPerRide) {
            tips.push({
                type: 'improvement',
                message: 'Your average earnings per ride are below your usual. Consider:',
                suggestions: [
                    'Focus on surge pricing zones',
                    'Accept longer trips for better earnings',
                    'Maintain a high acceptance rate for better opportunities'
                ]
            });
        }

        // Check for missed opportunities
        const missedSurges = opportunities.filter(
            opp => opp.type === 'surge' && opp.estimatedEarnings > currentEarnings.averagePerRide * 1.5
        );

        if (missedSurges.length > 0) {
            tips.push({
                type: 'opportunity',
                message: 'You\'re missing out on surge pricing zones:',
                locations: missedSurges.map(surge => ({
                    area: surge.location,
                    potential: surge.estimatedEarnings
                }))
            });
        }

        // Add time-based tips
        const currentHour = new Date().getHours();
        if (driverStats.bestHours && !driverStats.bestHours.includes(currentHour)) {
            tips.push({
                type: 'timing',
                message: 'Switch to these hours for better earnings:',
                hours: driverStats.bestHours.map(hour => ({
                    time: hour,
                    avgEarnings: driverStats.hourlyEarnings[hour]
                }))
            });
        }

        return tips;
    }
}

module.exports = new DriverOptimizationService(); 