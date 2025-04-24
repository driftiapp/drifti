import Stripe from 'stripe';
import { prisma } from './prisma';
import { PaymentMethod, PaymentProvider, PaymentStatus } from '@prisma/client';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not set');
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-03-31.basil',
});

interface TransactionMetadata {
  paymentIntentId?: string;
  refundId?: string;
  refundReason?: string;
  refundedAt?: string;
  [key: string]: any;
}

interface Transaction {
  id: string;
  amount: number;
  currency: string;
  status: string;
  metadata?: TransactionMetadata;
}

export async function createPaymentIntent(
  amount: number,
  currency: string,
  metadata: Record<string, any> = {}
) {
  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency: currency.toLowerCase(),
      metadata,
    });

    return paymentIntent;
  } catch (error) {
    console.error('Error creating payment intent:', error);
    throw error;
  }
}

export async function createTransaction(
  userId: string,
  orderId: string | null,
  amount: number,
  currency: string,
  paymentMethod: PaymentMethod,
  paymentProvider: PaymentProvider,
  metadata: Record<string, any> = {}
) {
  try {
    const transaction = await prisma.transaction.create({
      data: {
        userId,
        orderId,
        amount,
        currency,
        paymentMethod,
        paymentProvider,
        status: PaymentStatus.PENDING,
        metadata,
      },
    });

    return transaction;
  } catch (error) {
    console.error('Error creating transaction:', error);
    throw error;
  }
}

export async function updateTransactionStatus(
  transactionId: string,
  status: PaymentStatus,
  metadata: Record<string, any> = {}
) {
  try {
    const transaction = await prisma.transaction.update({
      where: { id: transactionId },
      data: {
        status,
        metadata: {
          ...metadata,
          updatedAt: new Date().toISOString(),
        },
      },
    });

    return transaction;
  } catch (error) {
    console.error('Error updating transaction status:', error);
    throw error;
  }
}

export async function processRefund(
  transactionId: string,
  amount: number,
  reason: string
) {
  try {
    const transaction = await prisma.transaction.findUnique({
      where: { id: transactionId },
    });

    if (!transaction) {
      throw new Error('Transaction not found');
    }

    if (transaction.paymentProvider === PaymentProvider.STRIPE) {
      const metadata = transaction.metadata as TransactionMetadata;
      const refund = await stripe.refunds.create({
        payment_intent: metadata?.paymentIntentId,
        amount: Math.round(amount * 100),
        reason: 'requested_by_customer',
        metadata: {
          reason,
        },
      });

      await prisma.transaction.update({
        where: { id: transactionId },
        data: {
          status: amount === transaction.amount ? PaymentStatus.REFUNDED : PaymentStatus.PARTIALLY_REFUNDED,
          refundedAmount: amount,
          metadata: {
            ...metadata,
            refundId: refund.id,
            refundReason: reason,
            refundedAt: new Date().toISOString(),
          },
        },
      });

      return refund;
    }

    throw new Error('Unsupported payment provider for refund');
  } catch (error) {
    console.error('Error processing refund:', error);
    throw error;
  }
}

export async function createStripePayment(transaction: Transaction) {
  try {
    const metadata = transaction.metadata as TransactionMetadata;
    const paymentIntent = await stripe.paymentIntents.create({
      amount: transaction.amount,
      currency: transaction.currency,
      metadata: {
        payment_intent: metadata?.paymentIntentId || null,
        transaction_id: transaction.id,
        ...metadata,
      },
    });

    return paymentIntent;
  } catch (error) {
    console.error('Error creating Stripe payment:', error);
    throw error;
  }
} 