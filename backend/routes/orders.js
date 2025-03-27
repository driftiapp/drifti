const express = require('express');
const router = express.Router();
const { auth, checkRole } = require('../middleware/auth');
const Order = require('../models/Order');
const User = require('../models/User');
const { trackError } = require('../monitoring/errorMonitor');
const { NotFoundError, ValidationError, AuthenticationError } = require('../utils/errors');
const { validateOrderCreation, validateOrderUpdate } = require('../middleware/validation');
const { calculateDistance } = require('../utils/helpers');
const { sendOrderConfirmation, sendOrderStatusUpdate } = require('../services/emailService');

// Get all orders (admin only)
router.get('/', auth, checkRole('admin'), async (req, res) => {
  try {
    const { page = 1, limit = 10, status, startDate, endDate, search } = req.query;
    const query = {};

    if (status) {
      query.status = status;
    }

    if (startDate || endDate) {
      query['timestamps.created'] = {};
      if (startDate) query['timestamps.created'].$gte = new Date(startDate);
      if (endDate) query['timestamps.created'].$lte = new Date(endDate);
    }

    if (search) {
      query.$or = [
        { 'pickup.address.street': { $regex: search, $options: 'i' } },
        { 'dropoff.address.street': { $regex: search, $options: 'i' } }
      ];
    }

    const orders = await Order.find(query)
      .populate('user', 'name email phoneNumber')
      .populate('driver', 'name email phoneNumber')
      .sort({ 'timestamps.created': -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Order.countDocuments(query);

    res.json({
      orders,
      totalPages: Math.ceil(total / limit),
      currentPage: page
    });
  } catch (error) {
    trackError(error, { route: 'GET /api/orders' });
    res.status(error.statusCode || 500).json({ message: error.message });
  }
});

// Get user's orders
router.get('/my-orders', auth, async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const query = { user: req.user.id };

    if (status) {
      query.status = status;
    }

    const orders = await Order.find(query)
      .populate('driver', 'name email phoneNumber')
      .sort({ 'timestamps.created': -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Order.countDocuments(query);

    res.json({
      orders,
      totalPages: Math.ceil(total / limit),
      currentPage: page
    });
  } catch (error) {
    trackError(error, { route: 'GET /api/orders/my-orders' });
    res.status(error.statusCode || 500).json({ message: error.message });
  }
});

// Get business orders
router.get('/business-orders', auth, checkRole(['business', 'admin']), async (req, res) => {
  try {
    const { page = 1, limit = 10, status, startDate, endDate } = req.query;
    const query = { business: req.user.id };

    if (status) {
      query.status = status;
    }

    if (startDate || endDate) {
      query['timestamps.created'] = {};
      if (startDate) query['timestamps.created'].$gte = new Date(startDate);
      if (endDate) query['timestamps.created'].$lte = new Date(endDate);
    }

    const orders = await Order.find(query)
      .populate('user', 'name email phoneNumber')
      .populate('driver', 'name email phoneNumber')
      .sort({ 'timestamps.created': -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Order.countDocuments(query);

    res.json({
      orders,
      totalPages: Math.ceil(total / limit),
      currentPage: page
    });
  } catch (error) {
    trackError(error, { route: 'GET /api/orders/business-orders' });
    res.status(error.statusCode || 500).json({ message: error.message });
  }
});

// Create new order
router.post('/', auth, validateOrderCreation, async (req, res) => {
  try {
    const {
      pickup,
      dropoff,
      items,
      paymentMethod
    } = req.body;

    // Calculate distance and duration
    const distance = calculateDistance(
      pickup.location.coordinates[1],
      pickup.location.coordinates[0],
      dropoff.location.coordinates[1],
      dropoff.location.coordinates[0]
    );

    // Estimate duration (assuming average speed of 30 km/h)
    const duration = Math.ceil((distance / 30) * 60); // Duration in minutes

    const order = new Order({
      user: req.user.id,
      pickup,
      dropoff,
      distance,
      duration,
      items,
      paymentMethod
    });

    // Calculate price
    order.calculatePrice();

    await order.save();

    // Send order confirmation email
    await sendOrderConfirmation({
      orderId: order._id,
      userEmail: req.user.email,
      userName: req.user.name,
      pickupAddress: pickup.address,
      dropoffAddress: dropoff.address,
      items,
      price: order.price
    });

    res.status(201).json(order);
  } catch (error) {
    trackError(error, { route: 'POST /api/orders' });
    res.status(error.statusCode || 500).json({ message: error.message });
  }
});

// Get order by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('user', 'name email phoneNumber')
      .populate('driver', 'name email phoneNumber');

    if (!order) {
      throw new NotFoundError('Order not found');
    }

    // Check if user has permission to view the order
    if (req.user.role !== 'admin' && 
        order.user._id.toString() !== req.user.id && 
        order.driver?._id?.toString() !== req.user.id) {
      throw new AuthenticationError('Not authorized to view this order');
    }

    res.json(order);
  } catch (error) {
    trackError(error, { route: 'GET /api/orders/:id' });
    res.status(error.statusCode || 500).json({ message: error.message });
  }
});

// Update order status
router.put('/:id/status', auth, checkRole(['business', 'admin', 'driver']), validateOrderUpdate, async (req, res) => {
  try {
    const { status, cancelReason } = req.body;
    const order = await Order.findById(req.params.id);

    if (!order) {
      throw new NotFoundError('Order not found');
    }

    // Check if user has permission to update the order
    if (req.user.role !== 'admin' && 
        order.business.toString() !== req.user.id && 
        order.driver?.toString() !== req.user.id) {
      throw new AuthenticationError('Not authorized to update this order');
    }

    // Validate status transition
    const validTransitions = {
      pending: ['accepted', 'cancelled'],
      accepted: ['in_progress', 'cancelled'],
      in_progress: ['completed', 'cancelled'],
      completed: [],
      cancelled: []
    };

    if (!validTransitions[order.status].includes(status)) {
      throw new ValidationError('Invalid status transition');
    }

    // Update order status and timestamps
    order.status = status;
    order.timestamps[status] = Date.now();

    if (status === 'cancelled' && cancelReason) {
      order.cancelReason = {
        by: req.user.role,
        reason: cancelReason,
        createdAt: Date.now()
      };
    }

    await order.save();

    // Send status update email
    await sendOrderStatusUpdate({
      orderId: order._id,
      userEmail: order.user.email,
      userName: order.user.name,
      status,
      cancelReason: order.cancelReason
    });

    res.json(order);
  } catch (error) {
    trackError(error, { route: 'PUT /api/orders/:id/status' });
    res.status(error.statusCode || 500).json({ message: error.message });
  }
});

// Rate and review order
router.post('/:id/review', auth, async (req, res) => {
  try {
    const { rating, comment, reviewedBy } = req.body;
    const order = await Order.findById(req.params.id);

    if (!order) {
      throw new NotFoundError('Order not found');
    }

    // Check if user has permission to review the order
    if (order.user.toString() !== req.user.id && 
        order.driver?.toString() !== req.user.id) {
      throw new AuthenticationError('Not authorized to review this order');
    }

    // Validate rating
    if (rating < 1 || rating > 5) {
      throw new ValidationError('Rating must be between 1 and 5');
    }

    // Update rating based on who is reviewing
    if (reviewedBy === 'user') {
      order.rating.user = {
        rating,
        comment,
        createdAt: Date.now()
      };
    } else if (reviewedBy === 'driver') {
      order.rating.driver = {
        rating,
        comment,
        createdAt: Date.now()
      };
    } else {
      throw new ValidationError('Invalid reviewer type');
    }

    await order.save();

    // Update user/driver rating
    const targetUser = reviewedBy === 'user' ? order.driver : order.user;
    if (targetUser) {
      const user = await User.findById(targetUser);
      if (user) {
        const ratingField = reviewedBy === 'user' ? 'driverRating' : 'userRating';
        user[ratingField] = rating;
        await user.save();
      }
    }

    res.json(order);
  } catch (error) {
    trackError(error, { route: 'POST /api/orders/:id/review' });
    res.status(error.statusCode || 500).json({ message: error.message });
  }
});

// Update order route
router.put('/:id/route', auth, checkRole(['driver']), async (req, res) => {
  try {
    const { coordinates } = req.body;
    const order = await Order.findById(req.params.id);

    if (!order) {
      throw new NotFoundError('Order not found');
    }

    if (order.driver?.toString() !== req.user.id) {
      throw new AuthenticationError('Not authorized to update this order route');
    }

    if (!Array.isArray(coordinates) || coordinates.length < 2) {
      throw new ValidationError('Invalid route coordinates');
    }

    order.route.coordinates = coordinates;
    await order.save();

    res.json(order);
  } catch (error) {
    trackError(error, { route: 'PUT /api/orders/:id/route' });
    res.status(error.statusCode || 500).json({ message: error.message });
  }
});

module.exports = router; 