const mongoose = require('mongoose');
const { trackError } = require('../monitoring/errorMonitor');
const dbConfig = require('../config/database');

// Connection event handlers
const setupConnectionHandlers = () => {
  mongoose.connection.on('connected', () => {
    console.log('MongoDB Connected Successfully');
  });

  mongoose.connection.on('error', (err) => {
    console.error('MongoDB Connection Error:', err);
    trackError(err, { action: 'mongodb_connection_error' });
  });

  mongoose.connection.on('disconnected', () => {
    console.log('MongoDB Disconnected');
  });

  mongoose.connection.on('reconnected', () => {
    console.log('MongoDB Reconnected');
  });

  process.on('SIGINT', async () => {
    try {
      await mongoose.connection.close();
      console.log('MongoDB Connection Closed Through App Termination');
      process.exit(0);
    } catch (err) {
      console.error('Error During MongoDB Connection Closure:', err);
      process.exit(1);
    }
  });
};

// Connect to MongoDB with retry logic
const connectDB = async (retries = 5, interval = 5000) => {
  try {
    const conn = await mongoose.connect(dbConfig.uri, dbConfig.options);
    
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    console.log(`Database Name: ${conn.connection.name}`);
    console.log(`Connection Pool Size: ${conn.connection.client.topology.s.pool.size}`);
    
    setupConnectionHandlers();
    
    // Ensure indexes are created
    await Promise.all([
      mongoose.model('Order').ensureIndexes(),
      mongoose.model('User').ensureIndexes(),
      mongoose.model('Transaction').ensureIndexes(),
      mongoose.model('Notification').ensureIndexes(),
      mongoose.model('Chat').ensureIndexes(),
    ]);
    
    console.log('Database Indexes Created Successfully');
    
  } catch (error) {
    console.error(`MongoDB Connection Error: ${error.message}`);
    trackError(error, { action: 'connectDB' });
    
    if (retries > 0) {
      console.log(`Retrying connection in ${interval/1000} seconds... (${retries} attempts remaining)`);
      await new Promise(resolve => setTimeout(resolve, interval));
      return connectDB(retries - 1, interval);
    }
    
    console.error('Max retries reached. Exiting application...');
    process.exit(1);
  }
};

// Health check function
const checkConnection = async () => {
  try {
    const state = mongoose.connection.readyState;
    const states = {
      0: 'disconnected',
      1: 'connected',
      2: 'connecting',
      3: 'disconnecting',
    };
    
    return {
      status: state === 1 ? 'healthy' : 'unhealthy',
      state: states[state],
      timestamp: new Date(),
    };
  } catch (error) {
    trackError(error, { action: 'checkConnection' });
    return {
      status: 'error',
      error: error.message,
      timestamp: new Date(),
    };
  }
};

module.exports = {
  connectDB,
  checkConnection,
}; 