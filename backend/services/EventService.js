const mongoose = require('mongoose');
const Redis = require('ioredis');
const { Configuration, OpenAIApi } = require('openai');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

class EventService {
    constructor() {
        this.redis = new Redis(process.env.REDIS_URL);
        this.openai = new OpenAIApi(
            new Configuration({
                apiKey: process.env.OPENAI_API_KEY,
            })
        );
    }

    async createEvent(eventData) {
        try {
            // Generate AI-enhanced description and pricing suggestions
            const aiSuggestions = await this.generateAISuggestions(eventData);
            
            // Create event with AI suggestions
            const event = await mongoose.model('Event').create({
                ...eventData,
                description: aiSuggestions.description,
                suggestedPrice: aiSuggestions.suggestedPrice,
                category: eventData.category,
                location: eventData.location,
                startTime: eventData.startTime,
                endTime: eventData.endTime,
                images: eventData.images,
                perks: eventData.perks,
                ownerId: eventData.ownerId,
                status: 'active',
                createdAt: new Date(),
                updatedAt: new Date()
            });

            // Set up dynamic pricing in Redis
            await this.setupDynamicPricing(event._id, eventData.basePrice);

            // Set up flash deals if specified
            if (eventData.flashDeal) {
                await this.createFlashDeal(event._id, eventData.flashDeal);
            }

            return event;
        } catch (error) {
            console.error('Error creating event:', error);
            throw error;
        }
    }

    async generateAISuggestions(eventData) {
        try {
            const prompt = `Generate an engaging description and pricing suggestion for an event with the following details:
                Title: ${eventData.title}
                Category: ${eventData.category}
                Base Price: ${eventData.basePrice}
                Location: ${eventData.location}
                Time: ${eventData.startTime}
                Perks: ${eventData.perks.join(', ')}`;

            const response = await this.openai.createCompletion({
                model: "text-davinci-003",
                prompt: prompt,
                max_tokens: 200,
                temperature: 0.7
            });

            const suggestions = response.data.choices[0].text.trim().split('\n');
            return {
                description: suggestions[0],
                suggestedPrice: parseFloat(suggestions[1]) || eventData.basePrice
            };
        } catch (error) {
            console.error('Error generating AI suggestions:', error);
            return {
                description: eventData.description || '',
                suggestedPrice: eventData.basePrice
            };
        }
    }

    async setupDynamicPricing(eventId, basePrice) {
        const key = `event:pricing:${eventId}`;
        await this.redis.hset(key, {
            basePrice,
            currentPrice: basePrice,
            lastUpdated: Date.now()
        });
    }

    async createFlashDeal(eventId, dealData) {
        const key = `event:flashdeal:${eventId}`;
        await this.redis.hset(key, {
            discount: dealData.discount,
            duration: dealData.duration,
            startTime: Date.now(),
            endTime: Date.now() + (dealData.duration * 60 * 60 * 1000)
        });
    }

    async getEventDetails(eventId) {
        try {
            const event = await mongoose.model('Event').findById(eventId);
            if (!event) throw new Error('Event not found');

            // Get current dynamic pricing
            const pricing = await this.redis.hgetall(`event:pricing:${eventId}`);
            const flashDeal = await this.redis.hgetall(`event:flashdeal:${eventId}`);

            return {
                ...event.toObject(),
                currentPrice: pricing.currentPrice,
                flashDeal: flashDeal.discount ? {
                    discount: flashDeal.discount,
                    endTime: flashDeal.endTime
                } : null
            };
        } catch (error) {
            console.error('Error getting event details:', error);
            throw error;
        }
    }

    async updateEventPricing(eventId, newPrice) {
        try {
            const key = `event:pricing:${eventId}`;
            await this.redis.hset(key, {
                currentPrice: newPrice,
                lastUpdated: Date.now()
            });
        } catch (error) {
            console.error('Error updating event pricing:', error);
            throw error;
        }
    }

    async getNearbyEvents(location, radius = 10) {
        try {
            return await mongoose.model('Event').find({
                location: {
                    $near: {
                        $geometry: {
                            type: 'Point',
                            coordinates: [location.longitude, location.latitude]
                        },
                        $maxDistance: radius * 1000 // Convert km to meters
                    }
                },
                status: 'active',
                startTime: { $gte: new Date() }
            }).sort({ startTime: 1 });
        } catch (error) {
            console.error('Error getting nearby events:', error);
            throw error;
        }
    }

    async getTrendingEvents() {
        try {
            // Get events with most views/bookings in the last 24 hours
            return await mongoose.model('Event').find({
                status: 'active',
                startTime: { $gte: new Date() }
            })
            .sort({ viewCount: -1, bookingCount: -1 })
            .limit(10);
        } catch (error) {
            console.error('Error getting trending events:', error);
            throw error;
        }
    }

    async createNFTTicket(eventId, userId) {
        try {
            // Create Stripe payment intent for NFT ticket
            const paymentIntent = await stripe.paymentIntents.create({
                amount: 1000, // Amount in cents
                currency: 'usd',
                metadata: {
                    eventId,
                    userId,
                    type: 'nft_ticket'
                }
            });

            // Here you would integrate with your NFT minting service
            // For now, we'll just return the payment intent
            return paymentIntent;
        } catch (error) {
            console.error('Error creating NFT ticket:', error);
            throw error;
        }
    }

    async getSurpriseEvent(preferences) {
        try {
            const events = await mongoose.model('Event').find({
                status: 'active',
                startTime: { $gte: new Date() },
                category: { $in: preferences.categories },
                'pricing.basePrice': { $lte: preferences.maxBudget }
            });

            if (events.length === 0) {
                throw new Error('No matching events found');
            }

            // Randomly select an event
            const randomIndex = Math.floor(Math.random() * events.length);
            return events[randomIndex];
        } catch (error) {
            console.error('Error getting surprise event:', error);
            throw error;
        }
    }

    async updateEventViews(eventId) {
        try {
            await mongoose.model('Event').findByIdAndUpdate(
                eventId,
                { $inc: { viewCount: 1 } }
            );
        } catch (error) {
            console.error('Error updating event views:', error);
            throw error;
        }
    }

    async getEventAnalytics(eventId) {
        try {
            const event = await mongoose.model('Event').findById(eventId);
            if (!event) throw new Error('Event not found');

            return {
                totalViews: event.viewCount,
                totalBookings: event.bookingCount,
                revenue: event.revenue,
                averageRating: event.averageRating,
                popularTimeSlots: event.popularTimeSlots
            };
        } catch (error) {
            console.error('Error getting event analytics:', error);
            throw error;
        }
    }
}

module.exports = new EventService(); 