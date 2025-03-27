const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const RiskRewardService = require('../services/RiskRewardService');
const { ValidationError } = require('../utils/errors');

// Create risk-reward challenge
router.post('/challenge/:challengeId', auth, async (req, res) => {
    try {
        const { betAmount } = req.body;
        if (!betAmount || betAmount <= 0) {
            throw new ValidationError('Invalid bet amount');
        }

        const riskChallenge = await RiskRewardService.createRiskRewardChallenge(
            req.user.id,
            req.params.challengeId,
            betAmount
        );
        res.json(riskChallenge);
    } catch (error) {
        console.error('Failed to create risk challenge:', error);
        res.status(500).json({ error: error.message });
    }
});

// Complete risk-reward challenge
router.post('/challenge/:riskChallengeId/complete', auth, async (req, res) => {
    try {
        const { success } = req.body;
        if (typeof success !== 'boolean') {
            throw new ValidationError('Success status is required');
        }

        const result = await RiskRewardService.completeRiskChallenge(
            req.user.id,
            req.params.riskChallengeId,
            success
        );
        res.json(result);
    } catch (error) {
        console.error('Failed to complete risk challenge:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get user's loot boxes
router.get('/lootboxes', auth, async (req, res) => {
    try {
        const LootBox = require('../models/LootBox');
        const lootBoxes = await LootBox.find({ userId: req.user.id })
            .sort({ createdAt: -1 });
        res.json(lootBoxes);
    } catch (error) {
        console.error('Failed to get loot boxes:', error);
        res.status(500).json({ error: 'Failed to get loot boxes' });
    }
});

// Open loot box
router.post('/lootbox/:lootBoxId/open', auth, async (req, res) => {
    try {
        const lootBox = await RiskRewardService.openLootBox(
            req.user.id,
            req.params.lootBoxId
        );
        res.json(lootBox);
    } catch (error) {
        console.error('Failed to open loot box:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get active risk challenges
router.get('/challenges/active', auth, async (req, res) => {
    try {
        const RiskChallenge = require('../models/RiskChallenge');
        const challenges = await RiskChallenge.find({
            userId: req.user.id,
            status: 'active'
        }).sort({ createdAt: -1 });
        res.json(challenges);
    } catch (error) {
        console.error('Failed to get active risk challenges:', error);
        res.status(500).json({ error: 'Failed to get active risk challenges' });
    }
});

module.exports = router; 