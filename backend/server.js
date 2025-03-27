require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const admin = require('firebase-admin');
const config = require('./config');
const mongoose = require('mongoose');
const Sentry = require('@sentry/node');
const { ProfilingIntegration } = require('@sentry/profiling-node');
const { connectDB, checkConnection } = require('./utils/db');
const { trackError } = require('./monitoring/errorMonitor');
const routes = require('./routes');
const socket = require('./socket');

// Initialize Sentry
Sentry.init({
  dsn: config.sentry.dsn,
  environment: config.sentry.environment,
  integrations: [
    new ProfilingIntegration(),
  ],
  tracesSampleRate: 1.0,
  profilesSampleRate: 1.0,
});

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert({
    projectId: config.firebase.projectId,
    clientEmail: config.firebase.clientEmail,
    privateKey: config.firebase.privateKey.replace(/\\n/g, '\n'),
  }),
  storageBucket: config.firebase.storageBucket
});

// Initialize Express app
const app = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Routes
app.use('/api', routes);

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    const dbStatus = await checkConnection();
    res.json({
      status: 'ok',
      timestamp: new Date(),
      database: dbStatus,
      uptime: process.uptime(),
    });
  } catch (error) {
    trackError(error, { action: 'health_check' });
    res.status(500).json({
      status: 'error',
      error: error.message,
      timestamp: new Date(),
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  trackError(err, { action: 'api_error' });
  console.error(err.stack);
  res.status(500).json({
    status: 'error',
    message: 'Internal Server Error',
    timestamp: new Date(),
  });
});

// Start server
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, async () => {
  try {
    // Connect to MongoDB
    await connectDB();
    
    // Initialize Socket.IO
    socket.init(server);
    
    console.log(`Server running on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV}`);
  } catch (error) {
    trackError(error, { action: 'server_startup' });
    console.error('Failed to start server:', error);
    process.exit(1);
  }
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    console.log('Server closed');
    mongoose.connection.close(false, () => {
      console.log('MongoDB connection closed');
      process.exit(0);
    });
  });
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Promise Rejection:', err);
  Sentry.captureException(err);
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  Sentry.captureException(err);
  process.exit(1);
}); 