const { validationResult } = require('express-validator');
const { ValidationError } = require('../utils/errors');

// Validate component ID
exports.validateComponentId = (req, res, next) => {
    const { componentId } = req.params;
    
    if (!componentId) {
        return res.status(400).json({ message: 'Component ID is required' });
    }
    
    // Add any additional validation rules here
    // For example, checking if the ID exists in the database
    
    next();
};

// Validate prediction parameters
exports.validatePredictionParams = (req, res, next) => {
    const { steps, externalData } = req.body;
    
    if (!steps || steps < 1) {
        return res.status(400).json({ message: 'Valid steps parameter is required' });
    }
    
    // Validate external data if provided
    if (externalData) {
        const { holidays, weather, userTraffic, systemLoad } = externalData;
        
        if (holidays && !Array.isArray(holidays)) {
            return res.status(400).json({ message: 'Holidays must be an array' });
        }
        
        if (weather && !Array.isArray(weather)) {
            return res.status(400).json({ message: 'Weather data must be an array' });
        }
        
        if (userTraffic && !Array.isArray(userTraffic)) {
            return res.status(400).json({ message: 'User traffic data must be an array' });
        }
        
        if (systemLoad && !Array.isArray(systemLoad)) {
            return res.status(400).json({ message: 'System load data must be an array' });
        }
    }
    
    next();
};

// Validate time range parameters
exports.validateTimeRange = (req, res, next) => {
    const { startTime, endTime } = req.query;
    
    if (startTime) {
        const start = new Date(startTime);
        if (isNaN(start.getTime())) {
            return res.status(400).json({ message: 'Invalid start time format' });
        }
    }
    
    if (endTime) {
        const end = new Date(endTime);
        if (isNaN(end.getTime())) {
            return res.status(400).json({ message: 'Invalid end time format' });
        }
    }
    
    if (startTime && endTime) {
        const start = new Date(startTime);
        const end = new Date(endTime);
        if (start > end) {
            return res.status(400).json({ message: 'Start time must be before end time' });
        }
    }
    
    next();
};

// Validate model configuration
exports.validateModelConfig = (req, res, next) => {
    const { config } = req.body;
    
    if (!config) {
        return res.status(400).json({ message: 'Model configuration is required' });
    }
    
    const { arima, xgb, features } = config;
    
    // Validate ARIMA configuration
    if (arima) {
        const { p, d, q, P, D, Q, s } = arima;
        
        if (p !== undefined && (p < 0 || !Number.isInteger(p))) {
            return res.status(400).json({ message: 'Invalid ARIMA p parameter' });
        }
        
        if (d !== undefined && (d < 0 || !Number.isInteger(d))) {
            return res.status(400).json({ message: 'Invalid ARIMA d parameter' });
        }
        
        if (q !== undefined && (q < 0 || !Number.isInteger(q))) {
            return res.status(400).json({ message: 'Invalid ARIMA q parameter' });
        }
        
        if (P !== undefined && (P < 0 || !Number.isInteger(P))) {
            return res.status(400).json({ message: 'Invalid ARIMA P parameter' });
        }
        
        if (D !== undefined && (D < 0 || !Number.isInteger(D))) {
            return res.status(400).json({ message: 'Invalid ARIMA D parameter' });
        }
        
        if (Q !== undefined && (Q < 0 || !Number.isInteger(Q))) {
            return res.status(400).json({ message: 'Invalid ARIMA Q parameter' });
        }
        
        if (s !== undefined && (s < 0 || !Number.isInteger(s))) {
            return res.status(400).json({ message: 'Invalid ARIMA s parameter' });
        }
    }
    
    // Validate XGBoost configuration
    if (xgb) {
        const { maxDepth, learningRate, nEstimators } = xgb;
        
        if (maxDepth !== undefined && (maxDepth < 1 || !Number.isInteger(maxDepth))) {
            return res.status(400).json({ message: 'Invalid XGBoost maxDepth parameter' });
        }
        
        if (learningRate !== undefined && (learningRate <= 0 || learningRate > 1)) {
            return res.status(400).json({ message: 'Invalid XGBoost learningRate parameter' });
        }
        
        if (nEstimators !== undefined && (nEstimators < 1 || !Number.isInteger(nEstimators))) {
            return res.status(400).json({ message: 'Invalid XGBoost nEstimators parameter' });
        }
    }
    
    // Validate feature configuration
    if (features) {
        const { maxLags, holidayWindow, weatherWindow } = features;
        
        if (maxLags !== undefined && (maxLags < 1 || !Number.isInteger(maxLags))) {
            return res.status(400).json({ message: 'Invalid maxLags parameter' });
        }
        
        if (holidayWindow !== undefined && (holidayWindow < 1 || !Number.isInteger(holidayWindow))) {
            return res.status(400).json({ message: 'Invalid holidayWindow parameter' });
        }
        
        if (weatherWindow !== undefined && (weatherWindow < 1 || !Number.isInteger(weatherWindow))) {
            return res.status(400).json({ message: 'Invalid weatherWindow parameter' });
        }
    }
    
    next();
};

// Handle validation errors
exports.handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    next();
};

const validateUserRegistration = (req, res, next) => {
  const { email, password, name, phoneNumber } = req.body;

  // Email validation
  if (!email || !email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
    throw new ValidationError('Invalid email format');
  }

  // Password validation
  if (!password || password.length < 6) {
    throw new ValidationError('Password must be at least 6 characters long');
  }

  // Name validation
  if (!name || name.trim().length < 2) {
    throw new ValidationError('Name must be at least 2 characters long');
  }

  // Phone number validation (basic format)
  if (!phoneNumber || !phoneNumber.match(/^\+?[1-9]\d{1,14}$/)) {
    throw new ValidationError('Invalid phone number format');
  }

  next();
};

const validateUserUpdate = (req, res, next) => {
  const { name, phoneNumber, preferences, location } = req.body;

  // Name validation
  if (name && name.trim().length < 2) {
    throw new ValidationError('Name must be at least 2 characters long');
  }

  // Phone number validation
  if (phoneNumber && !phoneNumber.match(/^\+?[1-9]\d{1,14}$/)) {
    throw new ValidationError('Invalid phone number format');
  }

  // Preferences validation
  if (preferences) {
    if (preferences.language && !['en', 'es', 'fr'].includes(preferences.language)) {
      throw new ValidationError('Invalid language preference');
    }

    if (preferences.theme && !['light', 'dark'].includes(preferences.theme)) {
      throw new ValidationError('Invalid theme preference');
    }

    if (preferences.notifications) {
      const { email, push, sms } = preferences.notifications;
      if (typeof email !== 'boolean' || typeof push !== 'boolean' || typeof sms !== 'boolean') {
        throw new ValidationError('Invalid notification preferences');
      }
    }
  }

  // Location validation
  if (location) {
    if (!location.coordinates || !Array.isArray(location.coordinates) || location.coordinates.length !== 2) {
      throw new ValidationError('Invalid location coordinates');
    }

    const [longitude, latitude] = location.coordinates;
    if (longitude < -180 || longitude > 180 || latitude < -90 || latitude > 90) {
      throw new ValidationError('Invalid location coordinates range');
    }
  }

  next();
};

const validateOrderCreation = (req, res, next) => {
  const { pickup, dropoff, items, paymentMethod } = req.body;

  // Validate pickup location
  if (!pickup || !pickup.location || !pickup.location.coordinates) {
    throw new ValidationError('Pickup location is required');
  }

  if (!Array.isArray(pickup.location.coordinates) || pickup.location.coordinates.length !== 2) {
    throw new ValidationError('Invalid pickup coordinates');
  }

  const [pickupLon, pickupLat] = pickup.location.coordinates;
  if (pickupLon < -180 || pickupLon > 180 || pickupLat < -90 || pickupLat > 90) {
    throw new ValidationError('Invalid pickup coordinates range');
  }

  // Validate dropoff location
  if (!dropoff || !dropoff.location || !dropoff.location.coordinates) {
    throw new ValidationError('Dropoff location is required');
  }

  if (!Array.isArray(dropoff.location.coordinates) || dropoff.location.coordinates.length !== 2) {
    throw new ValidationError('Invalid dropoff coordinates');
  }

  const [dropoffLon, dropoffLat] = dropoff.location.coordinates;
  if (dropoffLon < -180 || dropoffLon > 180 || dropoffLat < -90 || dropoffLat > 90) {
    throw new ValidationError('Invalid dropoff coordinates range');
  }

  // Validate items
  if (!Array.isArray(items) || items.length === 0) {
    throw new ValidationError('At least one item is required');
  }

  items.forEach((item, index) => {
    if (!item.name || !item.quantity || !item.price) {
      throw new ValidationError(`Invalid item at index ${index}`);
    }

    if (item.quantity < 1) {
      throw new ValidationError(`Invalid quantity for item at index ${index}`);
    }

    if (item.price < 0) {
      throw new ValidationError(`Invalid price for item at index ${index}`);
    }
  });

  // Validate payment method
  if (!paymentMethod || !['cash', 'card', 'wallet'].includes(paymentMethod)) {
    throw new ValidationError('Invalid payment method');
  }

  next();
};

const validateOrderUpdate = (req, res, next) => {
  const { status, cancelReason } = req.body;

  // Validate status
  if (!status || !['pending', 'accepted', 'in_progress', 'completed', 'cancelled'].includes(status)) {
    throw new ValidationError('Invalid status');
  }

  // Validate cancel reason if status is cancelled
  if (status === 'cancelled' && !cancelReason) {
    throw new ValidationError('Cancel reason is required when cancelling an order');
  }

  if (cancelReason && typeof cancelReason !== 'string') {
    throw new ValidationError('Cancel reason must be a string');
  }

  next();
};

const validatePaymentMethod = (req, res, next) => {
  const { paymentMethodId } = req.body;

  if (!paymentMethodId) {
    throw new ValidationError('Payment method ID is required');
  }

  if (typeof paymentMethodId !== 'string') {
    throw new ValidationError('Invalid payment method ID format');
  }

  next();
};

module.exports = {
  validateUserRegistration,
  validateUserUpdate,
  validateOrderCreation,
  validateOrderUpdate,
  validatePaymentMethod
}; 