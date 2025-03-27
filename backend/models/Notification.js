const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['order', 'payment', 'promo', 'system', 'chat'],
    required: true
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  data: {
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order'
    },
    transaction: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Transaction'
    },
    chat: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Chat'
    }
  },
  status: {
    read: {
      type: Boolean,
      default: false
    },
    delivered: {
      type: Boolean,
      default: false
    },
    deliveredAt: Date,
    readAt: Date
  },
  expiresAt: {
    type: Date,
    default: () => new Date(+new Date() + 30*24*60*60*1000) // 30 days from now
  },
  channels: [{
    type: String,
    enum: ['push', 'email', 'sms', 'in_app'],
    default: ['in_app']
  }],
  metadata: {
    type: Map,
    of: String
  }
}, {
  timestamps: true
});

// Create indexes for common queries
notificationSchema.index({ user: 1, 'status.read': 1 });
notificationSchema.index({ user: 1, type: 1 });
notificationSchema.index({ createdAt: -1 });
notificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL index

// Mark notification as read
notificationSchema.methods.markAsRead = async function() {
  if (!this.status.read) {
    this.status.read = true;
    this.status.readAt = new Date();
    await this.save();
  }
  return this;
};

// Mark notification as delivered
notificationSchema.methods.markAsDelivered = async function() {
  if (!this.status.delivered) {
    this.status.delivered = true;
    this.status.deliveredAt = new Date();
    await this.save();
  }
  return this;
};

const Notification = mongoose.model('Notification', notificationSchema);

module.exports = Notification; 