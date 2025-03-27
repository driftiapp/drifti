const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    required: true
  },
  contentType: {
    type: String,
    enum: ['text', 'image', 'location'],
    default: 'text'
  },
  metadata: {
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point'
      },
      coordinates: {
        type: [Number],
        default: [0, 0]
      }
    },
    imageUrl: String
  },
  status: {
    delivered: {
      type: Boolean,
      default: false
    },
    read: {
      type: Boolean,
      default: false
    },
    deliveredAt: Date,
    readAt: Date
  }
}, {
  timestamps: true
});

const chatSchema = new mongoose.Schema({
  order: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: true
  },
  participants: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    role: {
      type: String,
      enum: ['user', 'driver'],
      required: true
    },
    lastRead: {
      type: Date,
      default: Date.now
    }
  }],
  messages: [messageSchema],
  status: {
    type: String,
    enum: ['active', 'archived'],
    default: 'active'
  },
  metadata: {
    type: Map,
    of: String
  },
  lastMessage: {
    content: String,
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    timestamp: Date
  }
}, {
  timestamps: true
});

// Create indexes for common queries
chatSchema.index({ order: 1 });
chatSchema.index({ 'participants.user': 1 });
chatSchema.index({ status: 1 });
chatSchema.index({ createdAt: -1 });

// Add message to chat
chatSchema.methods.addMessage = async function(messageData) {
  const message = {
    ...messageData,
    status: {
      delivered: false,
      read: false
    }
  };
  
  this.messages.push(message);
  this.lastMessage = {
    content: message.content,
    sender: message.sender,
    timestamp: new Date()
  };
  
  return this.save();
};

// Mark messages as read
chatSchema.methods.markMessagesAsRead = async function(userId) {
  const participant = this.participants.find(p => p.user.toString() === userId.toString());
  if (participant) {
    participant.lastRead = new Date();
    
    this.messages.forEach(message => {
      if (message.sender.toString() !== userId.toString() && !message.status.read) {
        message.status.read = true;
        message.status.readAt = new Date();
      }
    });
    
    await this.save();
  }
  return this;
};

// Get unread messages count
chatSchema.methods.getUnreadCount = function(userId) {
  const participant = this.participants.find(p => p.user.toString() === userId.toString());
  if (!participant) return 0;
  
  return this.messages.filter(message => 
    message.sender.toString() !== userId.toString() && 
    (!message.status.read || message.createdAt > participant.lastRead)
  ).length;
};

const Chat = mongoose.model('Chat', chatSchema);

module.exports = Chat; 