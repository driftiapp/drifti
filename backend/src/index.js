const express = require('express');
const cors = require('cors');
const { connectDB, sequelize } = require('./config/database');
const { initializeFirebase, getFirebaseApp } = require('./config/firebase');
const User = require('./models/User');
const metricsRoutes = require('./routes/metrics');
const testRoutes = require('./routes/test');

const app = express();
const PORT = process.env.PORT || 3001;

// Increase timeouts to prevent connection issues
const server = require('http').createServer(app);
server.keepAliveTimeout = 120000; // 120 seconds
server.headersTimeout = 120000; // 120 seconds

// Middleware
app.use(cors());
app.use(express.json());

// Initialize Firebase Admin (similar to FirebaseApp.initializeApp(options))
initializeFirebase();

// Get Firebase App instance (similar to FirebaseApp.getInstance())
const firebaseApp = getFirebaseApp();
console.log('Firebase App initialized with project:', firebaseApp.options.projectId);

// Connect to TimescaleDB
connectDB();

// Sync database with safe options
sequelize.sync({ alter: false }).then(() => {
  console.log('Database synced successfully');
}).catch(error => {
  console.error('Error syncing database:', error);
});

// Routes
app.use('/api/metrics', metricsRoutes);
app.use('/api/test', testRoutes);

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    // Test database connection
    await sequelize.authenticate();
    
    // Get Firebase app status
    const firebaseStatus = firebaseApp ? 'initialized' : 'not initialized';
    
    res.json({ 
      status: 'ok',
      database: 'connected',
      firebase: firebaseStatus,
      projectId: firebaseApp.options.projectId
    });
  } catch (error) {
    res.status(500).json({ 
      status: 'error',
      database: 'disconnected',
      firebase: 'error',
      error: error.message
    });
  }
});

// Start server
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on port ${PORT}`);
});

// Handle process termination
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Closing HTTP server...');
  server.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received. Closing HTTP server...');
  server.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
}); 