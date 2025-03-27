const express = require('express');
const router = express.Router();
const EventService = require('../services/EventService');
const EventNFTService = require('../services/EventNFTService');
const LiveStreamService = require('../services/LiveStreamService');
const auth = require('../middleware/auth');
const upload = require('../middleware/upload');

// Create a new event
router.post('/', auth, upload.array('images', 5), async (req, res) => {
    try {
        const eventData = {
            ...req.body,
            ownerId: req.user.id,
            images: req.files ? req.files.map(file => ({
                url: file.path,
                caption: file.originalname
            })) : []
        };
        const event = await EventService.createEvent(eventData);
        res.status(201).json(event);
    } catch (error) {
        console.error('Error creating event:', error);
        res.status(500).json({ message: 'Error creating event' });
    }
});

// Get event details
router.get('/:eventId', async (req, res) => {
    try {
        const event = await EventService.getEventDetails(req.params.eventId);
        if (!event) {
            return res.status(404).json({ message: 'Event not found' });
        }
        res.json(event);
    } catch (error) {
        console.error('Error fetching event:', error);
        res.status(500).json({ message: 'Error fetching event' });
    }
});

// Get nearby events
router.get('/nearby', async (req, res) => {
    try {
        const { latitude, longitude, radius = 10 } = req.query;
        const events = await EventService.getNearbyEvents(
            [parseFloat(latitude), parseFloat(longitude)],
            parseInt(radius)
        );
        res.json(events);
    } catch (error) {
        console.error('Error fetching nearby events:', error);
        res.status(500).json({ message: 'Error fetching nearby events' });
    }
});

// Get trending events
router.get('/trending', async (req, res) => {
    try {
        const events = await EventService.getTrendingEvents();
        res.json(events);
    } catch (error) {
        console.error('Error fetching trending events:', error);
        res.status(500).json({ message: 'Error fetching trending events' });
    }
});

// Create NFT ticket
router.post('/:eventId/nft-ticket', auth, async (req, res) => {
    try {
        const { ticketType } = req.body;
        const result = await EventNFTService.createNFTTicket(
            req.params.eventId,
            req.user.id,
            ticketType
        );
        res.json(result);
    } catch (error) {
        console.error('Error creating NFT ticket:', error);
        res.status(500).json({ message: 'Error creating NFT ticket' });
    }
});

// Verify NFT ownership
router.get('/:eventId/nft-ticket/:tokenId/verify', auth, async (req, res) => {
    try {
        const isValid = await EventNFTService.verifyNFTOwnership(
            req.params.tokenId,
            req.user.id
        );
        res.json({ isValid });
    } catch (error) {
        console.error('Error verifying NFT ownership:', error);
        res.status(500).json({ message: 'Error verifying NFT ownership' });
    }
});

// Get NFT benefits
router.get('/:eventId/nft-ticket/:tokenId/benefits', auth, async (req, res) => {
    try {
        const benefits = await EventNFTService.getNFTBenefits(req.params.tokenId);
        res.json(benefits);
    } catch (error) {
        console.error('Error getting NFT benefits:', error);
        res.status(500).json({ message: 'Error getting NFT benefits' });
    }
});

// Get surprise event
router.get('/surprise', auth, async (req, res) => {
    try {
        const event = await EventService.getSurpriseEvent(req.query);
        res.json(event);
    } catch (error) {
        console.error('Error fetching surprise event:', error);
        res.status(500).json({ message: 'Error fetching surprise event' });
    }
});

// Update event views
router.post('/:eventId/view', async (req, res) => {
    try {
        await EventService.updateEventViews(req.params.eventId);
        res.json({ message: 'View count updated' });
    } catch (error) {
        console.error('Error updating view count:', error);
        res.status(500).json({ message: 'Error updating view count' });
    }
});

// Get event analytics
router.get('/:eventId/analytics', auth, async (req, res) => {
    try {
        const analytics = await EventService.getEventAnalytics(req.params.eventId);
        res.json(analytics);
    } catch (error) {
        console.error('Error fetching event analytics:', error);
        res.status(500).json({ message: 'Error fetching event analytics' });
    }
});

// Setup dynamic pricing
router.post('/:eventId/pricing', auth, async (req, res) => {
    try {
        const { basePrice } = req.body;
        const pricing = await EventService.setupDynamicPricing(
            req.params.eventId,
            basePrice
        );
        res.json(pricing);
    } catch (error) {
        console.error('Error setting up dynamic pricing:', error);
        res.status(500).json({ message: 'Error setting up dynamic pricing' });
    }
});

// Create flash deal
router.post('/:eventId/flash-deal', auth, async (req, res) => {
    try {
        const deal = await EventService.createFlashDeal(
            req.params.eventId,
            req.body
        );
        res.json(deal);
    } catch (error) {
        console.error('Error creating flash deal:', error);
        res.status(500).json({ message: 'Error creating flash deal' });
    }
});

// Create live stream
router.post('/:eventId/live-stream', auth, async (req, res) => {
    try {
        const stream = await LiveStreamService.createLiveStream(
            req.params.eventId,
            req.user.id
        );
        res.json(stream);
    } catch (error) {
        console.error('Error creating live stream:', error);
        res.status(500).json({ message: 'Error creating live stream' });
    }
});

// End live stream
router.post('/:eventId/live-stream/end', auth, async (req, res) => {
    try {
        const result = await LiveStreamService.endLiveStream(req.params.eventId);
        res.json(result);
    } catch (error) {
        console.error('Error ending live stream:', error);
        res.status(500).json({ message: 'Error ending live stream' });
    }
});

// Get live stream status
router.get('/:eventId/live-stream/status', async (req, res) => {
    try {
        const status = await LiveStreamService.getLiveStreamStatus(req.params.eventId);
        res.json(status);
    } catch (error) {
        console.error('Error getting live stream status:', error);
        res.status(500).json({ message: 'Error getting live stream status' });
    }
});

// Get stream token
router.get('/:eventId/live-stream/token', auth, async (req, res) => {
    try {
        const token = await LiveStreamService.generateStreamToken(
            req.params.eventId,
            req.user.id
        );
        res.json(token);
    } catch (error) {
        console.error('Error generating stream token:', error);
        res.status(500).json({ message: 'Error generating stream token' });
    }
});

// Get stream analytics
router.get('/:eventId/live-stream/analytics', auth, async (req, res) => {
    try {
        const analytics = await LiveStreamService.getStreamAnalytics(req.params.eventId);
        res.json(analytics);
    } catch (error) {
        console.error('Error getting stream analytics:', error);
        res.status(500).json({ message: 'Error getting stream analytics' });
    }
});

module.exports = router; 