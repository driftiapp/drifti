const mongoose = require('mongoose');
const Event = require('../models/Event');
const { createClient } = require('@livepeer/sdk');

class LiveStreamService {
    constructor() {
        this.livepeer = createClient({
            apiKey: process.env.LIVEPEER_API_KEY
        });
    }

    async createLiveStream(eventId, userId) {
        try {
            const event = await Event.findById(eventId);
            if (!event) {
                throw new Error('Event not found');
            }

            // Create Livepeer stream
            const stream = await this.livepeer.stream.create({
                name: `${event.title} - Live Preview`,
                playbackPolicy: {
                    type: 'jwt'
                }
            });

            // Update event with live stream details
            await Event.findByIdAndUpdate(eventId, {
                'liveStream.isActive': true,
                'liveStream.url': stream.playbackUrl,
                'liveStream.startTime': new Date(),
                'liveStream.streamKey': stream.streamKey
            });

            return {
                playbackUrl: stream.playbackUrl,
                streamKey: stream.streamKey
            };
        } catch (error) {
            console.error('Error creating live stream:', error);
            throw error;
        }
    }

    async endLiveStream(eventId) {
        try {
            const event = await Event.findById(eventId);
            if (!event) {
                throw new Error('Event not found');
            }

            // End Livepeer stream
            if (event.liveStream?.streamKey) {
                await this.livepeer.stream.delete(event.liveStream.streamKey);
            }

            // Update event
            await Event.findByIdAndUpdate(eventId, {
                'liveStream.isActive': false,
                'liveStream.endTime': new Date()
            });

            return { success: true };
        } catch (error) {
            console.error('Error ending live stream:', error);
            throw error;
        }
    }

    async getLiveStreamStatus(eventId) {
        try {
            const event = await Event.findById(eventId);
            if (!event) {
                throw new Error('Event not found');
            }

            if (!event.liveStream?.isActive) {
                return { isActive: false };
            }

            // Get stream status from Livepeer
            const stream = await this.livepeer.stream.get(event.liveStream.streamKey);
            
            return {
                isActive: true,
                playbackUrl: event.liveStream.url,
                viewers: stream.viewers,
                duration: stream.duration,
                startTime: event.liveStream.startTime
            };
        } catch (error) {
            console.error('Error getting live stream status:', error);
            throw error;
        }
    }

    async generateStreamToken(eventId, userId) {
        try {
            const event = await Event.findById(eventId);
            if (!event) {
                throw new Error('Event not found');
            }

            // Generate JWT token for stream access
            const token = await this.livepeer.stream.generateToken(
                event.liveStream.streamKey,
                {
                    userId,
                    eventId,
                    expiresIn: 3600 // 1 hour
                }
            );

            return { token };
        } catch (error) {
            console.error('Error generating stream token:', error);
            throw error;
        }
    }

    async getStreamAnalytics(eventId) {
        try {
            const event = await Event.findById(eventId);
            if (!event) {
                throw new Error('Event not found');
            }

            if (!event.liveStream?.streamKey) {
                return { error: 'No live stream found' };
            }

            // Get analytics from Livepeer
            const analytics = await this.livepeer.stream.getAnalytics(event.liveStream.streamKey);

            return {
                totalViewers: analytics.totalViewers,
                peakViewers: analytics.peakViewers,
                averageWatchTime: analytics.averageWatchTime,
                totalWatchTime: analytics.totalWatchTime,
                streamDuration: analytics.streamDuration
            };
        } catch (error) {
            console.error('Error getting stream analytics:', error);
            throw error;
        }
    }
}

module.exports = new LiveStreamService(); 