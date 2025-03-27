require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const Order = require('../models/Order');
const Transaction = require('../models/Transaction');
const Notification = require('../models/Notification');
const Chat = require('../models/Chat');

async function initializeDatabase() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Clear existing data
    await Promise.all([
      User.deleteMany({}),
      Order.deleteMany({}),
      Transaction.deleteMany({}),
      Notification.deleteMany({}),
      Chat.deleteMany({})
    ]);
    console.log('Cleared existing data');

    // Create test users
    const users = await User.create([
      {
        email: 'user@example.com',
        password: 'password123',
        name: 'John Doe',
        role: 'user',
        phoneNumber: '+1234567890',
        isVerified: true
      },
      {
        email: 'driver@example.com',
        password: 'password123',
        name: 'Jane Smith',
        role: 'driver',
        phoneNumber: '+1234567891',
        isVerified: true
      },
      {
        email: 'admin@example.com',
        password: 'password123',
        name: 'Admin User',
        role: 'admin',
        phoneNumber: '+1234567892',
        isVerified: true
      }
    ]);
    console.log('Created test users');

    // Create test orders
    const orders = await Order.create([
      {
        user: users[0]._id,
        driver: users[1]._id,
        status: 'completed',
        pickup: {
          location: {
            type: 'Point',
            coordinates: [-73.9857, 40.7484] // NYC
          },
          address: {
            street: '350 5th Ave',
            city: 'New York',
            state: 'NY',
            zipCode: '10118',
            country: 'USA'
          }
        },
        dropoff: {
          location: {
            type: 'Point',
            coordinates: [-73.9632, 40.7794] // Central Park
          },
          address: {
            street: 'Central Park',
            city: 'New York',
            state: 'NY',
            zipCode: '10022',
            country: 'USA'
          }
        },
        distance: 5.2,
        duration: 15,
        price: {
          amount: 25.50,
          currency: 'USD'
        },
        paymentMethod: 'card',
        paymentStatus: 'completed',
        rating: {
          user: {
            rating: 5,
            comment: 'Great driver!',
            createdAt: new Date()
          },
          driver: {
            rating: 4,
            comment: 'Nice passenger',
            createdAt: new Date()
          }
        },
        timestamps: {
          created: new Date(Date.now() - 3600000),
          accepted: new Date(Date.now() - 3300000),
          started: new Date(Date.now() - 3000000),
          completed: new Date(Date.now() - 2700000)
        }
      }
    ]);
    console.log('Created test orders');

    // Create test transactions
    const transactions = await Transaction.create([
      {
        user: users[0]._id,
        order: orders[0]._id,
        type: 'payment',
        amount: 25.50,
        currency: 'USD',
        status: 'completed',
        paymentMethod: 'card',
        paymentDetails: {
          cardLast4: '4242',
          cardBrand: 'visa',
          transactionId: 'ch_123456',
          receiptUrl: 'https://stripe.com/receipt'
        },
        description: 'Payment for ride'
      }
    ]);
    console.log('Created test transactions');

    // Create test notifications
    await Notification.create([
      {
        user: users[0]._id,
        title: 'Ride Completed',
        message: 'Your ride has been completed. Rate your experience!',
        type: 'order',
        priority: 'high',
        data: {
          order: orders[0]._id
        },
        channels: ['push', 'in_app']
      },
      {
        user: users[1]._id,
        title: 'Payment Received',
        message: 'You received a payment of $25.50',
        type: 'payment',
        priority: 'medium',
        data: {
          transaction: transactions[0]._id
        },
        channels: ['push', 'email', 'in_app']
      }
    ]);
    console.log('Created test notifications');

    // Create test chat
    await Chat.create({
      order: orders[0]._id,
      participants: [
        {
          user: users[0]._id,
          role: 'user'
        },
        {
          user: users[1]._id,
          role: 'driver'
        }
      ],
      messages: [
        {
          sender: users[0]._id,
          content: 'Hi, I\'m waiting at the entrance',
          contentType: 'text',
          status: {
            delivered: true,
            read: true,
            deliveredAt: new Date(Date.now() - 3300000),
            readAt: new Date(Date.now() - 3200000)
          }
        },
        {
          sender: users[1]._id,
          content: 'I\'ll be there in 2 minutes',
          contentType: 'text',
          status: {
            delivered: true,
            read: true,
            deliveredAt: new Date(Date.now() - 3100000),
            readAt: new Date(Date.now() - 3000000)
          }
        }
      ],
      lastMessage: {
        content: 'I\'ll be there in 2 minutes',
        sender: users[1]._id,
        timestamp: new Date(Date.now() - 3100000)
      }
    });
    console.log('Created test chat');

    console.log('Database initialization completed successfully!');
  } catch (error) {
    console.error('Error initializing database:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run if this file is executed directly
if (require.main === module) {
  initializeDatabase();
}

module.exports = initializeDatabase; 