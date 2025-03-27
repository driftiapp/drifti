const mongoose = require('mongoose');

const achievementSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true
  },
  description: {
    type: String,
    required: true
  },
  icon: {
    type: String,
    required: true
  },
  requiredPoints: {
    type: Number,
    required: true
  },
  rewardPoints: {
    type: Number,
    required: true
  },
  category: {
    type: String,
    enum: ['delivery', 'social', 'special'],
    required: true
  },
  isSecret: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt timestamp before saving
achievementSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('Achievement', achievementSchema); 