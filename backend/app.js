const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const admin = require('firebase-admin');
const config = require('./config');
const { trackError } = require('./monitoring/errorMonitor');
const healthCheck = require('./monitoring/healthCheck');
const performanceMonitor = require('./monitoring/performanceMonitor');

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert({
    projectId: config.firebase.projectId,
    clientEmail: config.firebase.clientEmail,
    privateKey: config.firebase.privateKey.replace(/\\n/g, '\n'),
  }),
  storageBucket: config.firebase.storageBucket,
});

// Import routes
const userRoutes = require('./routes/users');
const businessRoutes = require('./routes/business');
const orderRoutes = require('./routes/orders');
const notificationRoutes = require('./routes/notifications');
const gamificationRoutes = require('./routes/gamification');
const challengeRoutes = require('./routes/challenges');
const healthRoutes = require('./routes/health');

// Initialize Express app
const app = express();

// Security middleware
app.use(helmet());
app.use(cors({
  origin: config.cors.allowedOrigins,
  credentials: true
}));

// Performance middleware
app.use(compression());
app.use(morgan('combined'));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use('/api/', limiter);

// Body parser middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/users', userRoutes);
app.use('/api/business', businessRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/gamification', gamificationRoutes);
app.use('/api/challenges', challengeRoutes);
app.use('/api/health', healthRoutes);

// Health check routes (no rate limiting)
app.get('/health', async (req, res) => {
  const status = await healthCheck.runChecks();
  res.json(status);
});

// Error handling middleware
app.use((err, req, res, next) => {
  trackError(err, { route: req.path, method: req.method });
  res.status(err.statusCode || 500).json({
    message: err.message || 'Internal Server Error',
    ...(config.env === 'development' && { stack: err.stack })
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Connect to MongoDB
mongoose.connect(config.mongoUri)
  .then(() => {
    console.log('Connected to MongoDB');
    // Start the server
    const PORT = config.port;
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

module.exports = app; 