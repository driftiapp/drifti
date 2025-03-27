const mongoose = require('mongoose');
const redis = require('../utils/redis');
const { ValidationError } = require('../utils/errors');
const axios = require('axios');
const moment = require('moment-timezone');

class NotificationService {
    constructor() {
        this.redis = redis.createClient();
        this.NOTIFICATION_TTL = 86400; // 24 hours
        this.GAME_CACHE_TTL = 3600; // 1 hour
    }

    /**
     * Generate personalized holiday greeting
     */
    async generateHolidayGreeting(userId, holiday) {
        try {
            const [userPrefs, userStats] = await Promise.all([
                this.getUserPreferences(userId),
                this.getUserStats(userId)
            ]);

            const greeting = {
                type: 'holiday',
                holiday,
                message: '',
                offers: [],
                actions: []
            };

            switch (holiday.toLowerCase()) {
                case 'ramadan':
                    const prayerTimes = await this.getPrayerTimes(userPrefs.location);
                    greeting.message = `🌙 Ramadan Mubarak! May your month be filled with peace and blessings.`;
                    greeting.offers = await this.getRamadanOffers(userPrefs.location);
                    greeting.actions = [
                        {
                            type: 'prayer_reminder',
                            data: prayerTimes
                        },
                        {
                            type: 'halal_restaurants',
                            data: await this.getNearbyHalalRestaurants(userPrefs.location)
                        },
                        {
                            type: 'charity',
                            data: await this.getCharityOpportunities()
                        }
                    ];
                    break;

                case 'christmas':
                    greeting.message = `🎄 Merry Christmas! Enjoy the holiday spirit with a free ride to your celebration!`;
                    greeting.offers = [
                        {
                            type: 'free_ride',
                            code: await this.generatePromoCode(userId, 'XMAS2024'),
                            expires: moment().endOf('day').toDate()
                        }
                    ];
                    break;

                case 'new_year':
                    greeting.message = `🎇 Happy New Year! Let's make ${new Date().getFullYear()} amazing!`;
                    greeting.offers = [
                        {
                            type: 'discount',
                            amount: 50,
                            code: await this.generatePromoCode(userId, 'NEWYEAR50'),
                            expires: moment().add(1, 'day').endOf('day').toDate()
                        }
                    ];
                    break;

                // Add more holidays as needed
            }

            // Store greeting in cache for quick access
            const cacheKey = `greeting:${userId}:${holiday}`;
            await this.redis.setex(
                cacheKey,
                this.NOTIFICATION_TTL,
                JSON.stringify(greeting)
            );

            return greeting;
        } catch (error) {
            console.error('Failed to generate holiday greeting:', error);
            throw new ValidationError('Failed to generate greeting');
        }
    }

    /**
     * Generate game night alert
     */
    async generateGameAlert(userId) {
        try {
            const [userPrefs, location] = await Promise.all([
                this.getUserPreferences(userId),
                this.getUserLocation(userId)
            ]);

            // Get upcoming games based on user preferences
            const games = await this.getUpcomingGames(userPrefs.sportsPreferences);
            
            // Filter relevant games
            const relevantGames = games.filter(game => 
                this.isGameRelevant(game, userPrefs.sportsPreferences)
            );

            if (relevantGames.length === 0) return null;

            // Get nearby sports venues
            const venues = await this.getNearbyVenues(location, 'sports_bar');

            // Generate personalized alerts
            const alerts = await Promise.all(relevantGames.map(async game => {
                const [ridePrice, restaurants] = await Promise.all([
                    this.estimateRidePrice(location, venues[0].location),
                    this.getNearbyRestaurants(location, game.startTime)
                ]);

                return {
                    type: 'game_alert',
                    game: {
                        title: game.title,
                        time: game.startTime,
                        league: game.league
                    },
                    venues: venues.slice(0, 3).map(venue => ({
                        name: venue.name,
                        distance: venue.distance,
                        rating: venue.rating,
                        promos: venue.currentPromotions
                    })),
                    actions: [
                        {
                            type: 'book_ride',
                            venue: venues[0],
                            estimatedPrice: ridePrice
                        },
                        {
                            type: 'order_food',
                            restaurants: restaurants
                        }
                    ]
                };
            }));

            // Cache alerts
            const cacheKey = `game_alerts:${userId}`;
            await this.redis.setex(
                cacheKey,
                this.GAME_CACHE_TTL,
                JSON.stringify(alerts)
            );

            return alerts;
        } catch (error) {
            console.error('Failed to generate game alerts:', error);
            throw new ValidationError('Failed to generate game alerts');
        }
    }

    /**
     * Check if a game is relevant based on user preferences
     */
    isGameRelevant(game, preferences) {
        // Check if it's a major event
        if (game.isMajorEvent) return true;

        // Check if it matches user's favorite teams
        if (preferences.teams?.some(team => 
            game.teams.includes(team)
        )) return true;

        // Check if it matches user's favorite sports
        if (preferences.sports?.includes(game.sport)) return true;

        return false;
    }

    /**
     * Get prayer times for a location
     */
    async getPrayerTimes(location) {
        try {
            const { data } = await axios.get(
                `${process.env.PRAYER_TIMES_API}/timings`, {
                    params: {
                        latitude: location.lat,
                        longitude: location.lng,
                        method: 2 // ISNA calculation method
                    }
                }
            );

            return data.data.timings;
        } catch (error) {
            console.error('Failed to get prayer times:', error);
            return null;
        }
    }

    /**
     * Get nearby halal restaurants
     */
    async getNearbyHalalRestaurants(location) {
        try {
            const restaurants = await this.searchNearbyPlaces(location, {
                type: 'restaurant',
                keyword: 'halal'
            });

            return restaurants.map(restaurant => ({
                name: restaurant.name,
                distance: restaurant.distance,
                rating: restaurant.rating,
                isOpen: restaurant.opening_hours?.open_now,
                delivery: restaurant.delivery || false
            }));
        } catch (error) {
            console.error('Failed to get halal restaurants:', error);
            return [];
        }
    }

    /**
     * Get charity opportunities
     */
    async getCharityOpportunities() {
        try {
            const charities = await this.getLocalCharities();
            return charities.map(charity => ({
                name: charity.name,
                cause: charity.cause,
                donationLink: charity.donationUrl,
                matchingOffer: charity.matchingOffer
            }));
        } catch (error) {
            console.error('Failed to get charity opportunities:', error);
            return [];
        }
    }

    /**
     * Generate a unique promo code
     */
    async generatePromoCode(userId, prefix) {
        const uniqueId = Math.random().toString(36).substr(2, 6).toUpperCase();
        const code = `${prefix}_${uniqueId}`;
        
        // Store promo code in database
        await this.storePromoCode(userId, code);
        
        return code;
    }
}

module.exports = new NotificationService(); 