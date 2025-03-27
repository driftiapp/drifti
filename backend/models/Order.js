const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  driver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'in_progress', 'completed', 'cancelled'],
    default: 'pending'
  },
  pickup: {
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point'
      },
      coordinates: {
        type: [Number],
        required: true
      }
    },
    address: {
      street: String,
      city: String,
      state: String,
      zipCode: String,
      country: String
    }
  },
  dropoff: {
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point'
      },
      coordinates: {
        type: [Number],
        required: true
      }
    },
    address: {
      street: String,
      city: String,
      state: String,
      zipCode: String,
      country: String
    }
  },
  distance: {
    type: Number,
    required: true
  },
  duration: {
    type: Number,
    required: true
  },
  price: {
    amount: {
      type: Number,
      required: true
    },
    currency: {
      type: String,
      default: 'USD'
    }
  },
  paymentMethod: {
    type: String,
    enum: ['cash', 'card', 'wallet'],
    required: true
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'refunded'],
    default: 'pending'
  },
  rating: {
    user: {
      rating: {
        type: Number,
        min: 1,
        max: 5
      },
      comment: String,
      createdAt: Date
    },
    driver: {
      rating: {
        type: Number,
        min: 1,
        max: 5
      },
      comment: String,
      createdAt: Date
    }
  },
  cancelReason: {
    by: {
      type: String,
      enum: ['user', 'driver', 'system']
    },
    reason: String,
    createdAt: Date
  },
  route: {
    type: {
      type: String,
      enum: ['LineString'],
      default: 'LineString'
    },
    coordinates: {
      type: [[Number]],
      default: []
    }
  },
  timestamps: {
    created: {
      type: Date,
      default: Date.now
    },
    accepted: Date,
    started: Date,
    completed: Date,
    cancelled: Date
  }
}, {
  timestamps: true
});

// Create indexes for common queries
orderSchema.index({ user: 1, status: 1 });
orderSchema.index({ driver: 1, status: 1 });
orderSchema.index({ 'pickup.location': '2dsphere' });
orderSchema.index({ 'dropoff.location': '2dsphere' });
orderSchema.index({ 'timestamps.created': -1 });

// Calculate price based on distance and duration
orderSchema.methods.calculatePrice = function() {
  const BASE_PRICE = 5; // Base fare
  const PRICE_PER_KM = 1.5; // Price per kilometer
  const PRICE_PER_MINUTE = 0.5; // Price per minute
  
  const distancePrice = this.distance * PRICE_PER_KM;
  const durationPrice = this.duration * PRICE_PER_MINUTE;
  
  this.price.amount = BASE_PRICE + distancePrice + durationPrice;
  return this.price.amount;
};

const Order = mongoose.model('Order', orderSchema);

module.exports = Order; 