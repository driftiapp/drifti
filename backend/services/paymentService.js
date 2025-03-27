const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { trackError } = require('../monitoring/errorMonitor');
const { ValidationError } = require('../utils/errors');

class PaymentService {
  // Create a payment intent
  async createPaymentIntent(order) {
    try {
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(order.price.amount * 100), // Convert to cents
        currency: order.price.currency.toLowerCase(),
        metadata: {
          orderId: order._id.toString(),
          userId: order.user.toString()
        }
      });

      return paymentIntent;
    } catch (error) {
      trackError(error, { service: 'paymentService', action: 'createPaymentIntent' });
      throw new ValidationError('Failed to create payment intent');
    }
  }

  // Process payment
  async processPayment(order, paymentMethodId) {
    try {
      const paymentIntent = await this.createPaymentIntent(order);
      
      // Attach payment method to customer
      const customer = await this.getOrCreateCustomer(order.user);
      await stripe.paymentMethods.attach(paymentMethodId, {
        customer: customer.id
      });

      // Confirm payment
      const confirmedPayment = await stripe.paymentIntents.confirm(paymentIntent.id, {
        payment_method: paymentMethodId,
        return_url: `${process.env.FRONTEND_URL}/payment/confirmation?orderId=${order._id}`
      });

      return confirmedPayment;
    } catch (error) {
      trackError(error, { service: 'paymentService', action: 'processPayment' });
      throw new ValidationError('Payment processing failed');
    }
  }

  // Process refund
  async processRefund(order, amount = null) {
    try {
      const refundParams = {
        payment_intent: order.paymentIntentId,
        reason: 'requested_by_customer'
      };

      if (amount) {
        refundParams.amount = Math.round(amount * 100); // Convert to cents
      }

      const refund = await stripe.refunds.create(refundParams);
      return refund;
    } catch (error) {
      trackError(error, { service: 'paymentService', action: 'processRefund' });
      throw new ValidationError('Refund processing failed');
    }
  }

  // Get or create Stripe customer
  async getOrCreateCustomer(user) {
    try {
      if (user.stripeCustomerId) {
        return await stripe.customers.retrieve(user.stripeCustomerId);
      }

      const customer = await stripe.customers.create({
        email: user.email,
        name: user.name,
        metadata: {
          userId: user._id.toString()
        }
      });

      // Update user with Stripe customer ID
      user.stripeCustomerId = customer.id;
      await user.save();

      return customer;
    } catch (error) {
      trackError(error, { service: 'paymentService', action: 'getOrCreateCustomer' });
      throw new ValidationError('Failed to create customer');
    }
  }

  // Handle webhook events
  async handleWebhook(event) {
    try {
      switch (event.type) {
        case 'payment_intent.succeeded':
          await this.handlePaymentSuccess(event.data.object);
          break;
        case 'payment_intent.payment_failed':
          await this.handlePaymentFailure(event.data.object);
          break;
        case 'refund.succeeded':
          await this.handleRefundSuccess(event.data.object);
          break;
        default:
          console.log(`Unhandled event type: ${event.type}`);
      }
    } catch (error) {
      trackError(error, { service: 'paymentService', action: 'handleWebhook' });
      throw error;
    }
  }

  // Handle successful payment
  async handlePaymentSuccess(paymentIntent) {
    const order = await Order.findById(paymentIntent.metadata.orderId);
    if (order) {
      order.paymentStatus = 'completed';
      order.paymentIntentId = paymentIntent.id;
      await order.save();
    }
  }

  // Handle failed payment
  async handlePaymentFailure(paymentIntent) {
    const order = await Order.findById(paymentIntent.metadata.orderId);
    if (order) {
      order.paymentStatus = 'failed';
      await order.save();
    }
  }

  // Handle successful refund
  async handleRefundSuccess(refund) {
    const order = await Order.findOne({ paymentIntentId: refund.payment_intent });
    if (order) {
      order.paymentStatus = 'refunded';
      order.refundId = refund.id;
      await order.save();
    }
  }

  // Get payment method details
  async getPaymentMethod(paymentMethodId) {
    try {
      return await stripe.paymentMethods.retrieve(paymentMethodId);
    } catch (error) {
      trackError(error, { service: 'paymentService', action: 'getPaymentMethod' });
      throw new ValidationError('Failed to retrieve payment method');
    }
  }

  // List payment methods for a customer
  async listPaymentMethods(userId) {
    try {
      const user = await User.findById(userId);
      if (!user?.stripeCustomerId) {
        return [];
      }

      return await stripe.paymentMethods.list({
        customer: user.stripeCustomerId,
        type: 'card'
      });
    } catch (error) {
      trackError(error, { service: 'paymentService', action: 'listPaymentMethods' });
      throw new ValidationError('Failed to list payment methods');
    }
  }

  // Delete payment method
  async deletePaymentMethod(paymentMethodId) {
    try {
      await stripe.paymentMethods.detach(paymentMethodId);
    } catch (error) {
      trackError(error, { service: 'paymentService', action: 'deletePaymentMethod' });
      throw new ValidationError('Failed to delete payment method');
    }
  }
}

module.exports = new PaymentService(); 