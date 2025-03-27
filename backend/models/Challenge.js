const mongoose = require('mongoose');

const challengeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true
  },
  description: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['delivery', 'social', 'special'],
    required: true
  },
  target: {
    type: Number,
    required: true
  },
  unit: {
    type: String,
    required: true
  },
  rewardPoints: {
    type: Number,
    required: true
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  requirements: {
    minLevel: {
      type: Number,
      default: 1
    },
    previousChallenges: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Challenge'
    }]
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Index for active challenges
challengeSchema.index({ isActive: 1, startDate: 1, endDate: 1 });

module.exports = mongoose.model('Challenge', challengeSchema); 