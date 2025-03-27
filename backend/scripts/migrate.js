const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: '.env.production' });

// Import models
const User = require('../models/User');
const Event = require('../models/Event');
const Reservation = require('../models/Reservation');
const Payment = require('../models/Payment');

// Migration functions
const migrations = {
    // Add indexes for better query performance
    async addIndexes() {
        console.log('Adding database indexes...');
        
        // User indexes
        await User.collection.createIndex({ email: 1 }, { unique: true });
        await User.collection.createIndex({ phoneNumber: 1 }, { unique: true });
        
        // Event indexes
        await Event.collection.createIndex({ title: 'text', description: 'text' });
        await Event.collection.createIndex({ category: 1 });
        await Event.collection.createIndex({ startTime: 1 });
        await Event.collection.createIndex({ location: '2dsphere' });
        
        // Reservation indexes
        await Reservation.collection.createIndex({ eventId: 1 });
        await Reservation.collection.createIndex({ userId: 1 });
        await Reservation.collection.createIndex({ status: 1 });
        
        // Payment indexes
        await Payment.collection.createIndex({ reservationId: 1 });
        await Payment.collection.createIndex({ status: 1 });
        await Payment.collection.createIndex({ createdAt: 1 });
        
        console.log('Database indexes added successfully');
    },

    // Add new fields to existing collections
    async addNewFields() {
        console.log('Adding new fields to collections...');
        
        // Add lastLoginAt to users
        await User.updateMany(
            { lastLoginAt: { $exists: false } },
            { $set: { lastLoginAt: new Date() } }
        );
        
        // Add viewCount to events
        await Event.updateMany(
            { viewCount: { $exists: false } },
            { $set: { viewCount: 0 } }
        );
        
        // Add cancellationReason to reservations
        await Reservation.updateMany(
            { cancellationReason: { $exists: false } },
            { $set: { cancellationReason: null } }
        );
        
        console.log('New fields added successfully');
    },

    // Update existing data
    async updateExistingData() {
        console.log('Updating existing data...');
        
        // Update event statuses to include 'cancelled'
        await Event.updateMany(
            { status: { $exists: false } },
            { $set: { status: 'active' } }
        );
        
        // Update reservation statuses to include 'cancelled'
        await Reservation.updateMany(
            { status: { $exists: false } },
            { $set: { status: 'pending' } }
        );
        
        // Update payment statuses to include 'refunded'
        await Payment.updateMany(
            { status: { $exists: false } },
            { $set: { status: 'pending' } }
        );
        
        console.log('Existing data updated successfully');
    }
};

// Main migration function
const migrate = async () => {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        console.log('Connected to MongoDB');

        // Run migrations
        await migrations.addIndexes();
        await migrations.addNewFields();
        await migrations.updateExistingData();

        console.log('All migrations completed successfully! 🎉');
        process.exit(0);
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected from MongoDB');
    }
};

// Run migrations
migrate(); 