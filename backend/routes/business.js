const express = require('express');
const router = express.Router();
const { auth, checkRole, verifyBusinessOwnership } = require('../middleware/auth');
const User = require('../models/User');
const { trackError } = require('../monitoring/errorMonitor');
const { NotFoundError, ValidationError } = require('../utils/errors');
const Order = require('../models/Order');

// Get business profile
router.get('/profile', auth, checkRole(['business']), async (req, res) => {
  try {
    const business = await User.findById(req.user.id)
      .select('-__v -password');
    
    if (!business) {
      throw new NotFoundError('Business not found');
    }

    res.json(business);
  } catch (error) {
    trackError(error, { route: 'GET /api/business/profile' });
    res.status(error.statusCode || 500).json({ message: error.message });
  }
});

// Update business profile
router.put('/profile', auth, checkRole(['business']), async (req, res) => {
  try {
    const {
      businessName,
      businessHours,
      address,
      phoneNumber,
      preferences
    } = req.body;

    const business = await User.findById(req.user.id);

    if (!business) {
      throw new NotFoundError('Business not found');
    }

    if (businessName) business.businessName = businessName;
    if (businessHours) business.businessHours = businessHours;
    if (address) business.address = address;
    if (phoneNumber) business.phoneNumber = phoneNumber;
    if (preferences) business.preferences = { ...business.preferences, ...preferences };

    await business.save();
    res.json(business);
  } catch (error) {
    trackError(error, { route: 'PUT /api/business/profile' });
    res.status(error.statusCode || 500).json({ message: error.message });
  }
});

// Get business orders
router.get('/orders', auth, checkRole(['business']), async (req, res) => {
  try {
    const orders = await Order.find({ business: req.user.id })
      .populate('user', 'displayName email')
      .populate('driver', 'displayName email')
      .sort({ createdAt: -1 });

    res.json(orders);
  } catch (error) {
    trackError(error, { route: 'GET /api/business/orders' });
    res.status(error.statusCode || 500).json({ message: error.message });
  }
});

// Update order status
router.put('/orders/:orderId/status', auth, checkRole(['business']), async (req, res) => {
  try {
    const { status } = req.body;
    const order = await Order.findOne({
      _id: req.params.orderId,
      business: req.user.id
    });

    if (!order) {
      throw new NotFoundError('Order not found');
    }

    order.status = status;
    if (status === 'completed') {
      order.actualDeliveryTime = Date.now();
    }

    await order.save();
    res.json(order);
  } catch (error) {
    trackError(error, { route: 'PUT /api/business/orders/:orderId/status' });
    res.status(error.statusCode || 500).json({ message: error.message });
  }
});

module.exports = router; 