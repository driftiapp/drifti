const express = require('express');
const cors = require('cors');
const { connectDB, sequelize } = require('./config/database');
const User = require('./models/User');
const metricsRoutes = require('./routes/metrics');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

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

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    // Test database connection
    await sequelize.authenticate();
    res.json({ 
      status: 'ok',
      database: 'connected'
    });
  } catch (error) {
    res.status(500).json({ 
      status: 'error',
      database: 'disconnected',
      error: error.message
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
}); 