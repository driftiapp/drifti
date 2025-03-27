const express = require('express');
const router = express.Router();
const { auth, checkRole } = require('../middleware/auth');
const paymentService = require('../services/paymentService');
const Order = require('../models/Order');
const { trackError } = require('../monitoring/errorMonitor');
const { NotFoundError, ValidationError, AuthenticationError } = require('../utils/errors');
const { validatePaymentMethod } = require('../middleware/validation');

// Process payment for an order
router.post('/process/:orderId', auth, validatePaymentMethod, async (req, res) => {
  try {
    const { paymentMethodId } = req.body;
    const order = await Order.findById(req.params.orderId);

    if (!order) {
      throw new NotFoundError('Order not found');
    }

    // Check if user has permission to pay for this order
    if (order.user.toString() !== req.user.id) {
      throw new AuthenticationError('Not authorized to pay for this order');
    }

    // Check if order is already paid
    if (order.paymentStatus === 'completed') {
      throw new ValidationError('Order is already paid');
    }

    const payment = await paymentService.processPayment(order, paymentMethodId);
    res.json(payment);
  } catch (error) {
    trackError(error, { route: 'POST /api/payments/process/:orderId' });
    res.status(error.statusCode || 500).json({ message: error.message });
  }
});

// Request refund for an order
router.post('/refund/:orderId', auth, async (req, res) => {
  try {
    const { amount } = req.body;
    const order = await Order.findById(req.params.orderId);

    if (!order) {
      throw new NotFoundError('Order not found');
    }

    // Check if user has permission to request refund
    if (order.user.toString() !== req.user.id && req.user.role !== 'admin') {
      throw new AuthenticationError('Not authorized to request refund');
    }

    // Check if order is eligible for refund
    if (order.paymentStatus !== 'completed') {
      throw new ValidationError('Order is not eligible for refund');
    }

    const refund = await paymentService.processRefund(order, amount);
    res.json(refund);
  } catch (error) {
    trackError(error, { route: 'POST /api/payments/refund/:orderId' });
    res.status(error.statusCode || 500).json({ message: error.message });
  }
});

// Get user's payment methods
router.get('/methods', auth, async (req, res) => {
  try {
    const paymentMethods = await paymentService.listPaymentMethods(req.user.id);
    res.json(paymentMethods);
  } catch (error) {
    trackError(error, { route: 'GET /api/payments/methods' });
    res.status(error.statusCode || 500).json({ message: error.message });
  }
});

// Delete payment method
router.delete('/methods/:paymentMethodId', auth, async (req, res) => {
  try {
    await paymentService.deletePaymentMethod(req.params.paymentMethodId);
    res.json({ message: 'Payment method deleted successfully' });
  } catch (error) {
    trackError(error, { route: 'DELETE /api/payments/methods/:paymentMethodId' });
    res.status(error.statusCode || 500).json({ message: error.message });
  }
});

// Handle Stripe webhooks
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    const sig = req.headers['stripe-signature'];
    const event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );

    await paymentService.handleWebhook(event);
    res.json({ received: true });
  } catch (error) {
    trackError(error, { route: 'POST /api/payments/webhook' });
    res.status(400).json({ message: error.message });
  }
});

// Get payment status for an order
router.get('/status/:orderId', auth, async (req, res) => {
  try {
    const order = await Order.findById(req.params.orderId);

    if (!order) {
      throw new NotFoundError('Order not found');
    }

    // Check if user has permission to view payment status
    if (order.user.toString() !== req.user.id && 
        order.driver?.toString() !== req.user.id && 
        req.user.role !== 'admin') {
      throw new AuthenticationError('Not authorized to view payment status');
    }

    res.json({
      status: order.paymentStatus,
      amount: order.price,
      paymentMethod: order.paymentMethod,
      paymentIntentId: order.paymentIntentId,
      refundId: order.refundId
    });
  } catch (error) {
    trackError(error, { route: 'GET /api/payments/status/:orderId' });
    res.status(error.statusCode || 500).json({ message: error.message });
  }
});

module.exports = router; 