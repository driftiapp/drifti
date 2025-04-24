import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { stripe } from '@/lib/stripe';
import { updateTransactionStatus } from '@/lib/stripe';
import { PaymentStatus } from '@prisma/client';
import Stripe from 'stripe';

export async function POST(request: Request) {
  try {
    const body = await request.text();
    const signature = headers().get('stripe-signature');

    if (!signature) {
      return new NextResponse('No signature', { status: 400 });
    }

    if (!process.env.STRIPE_WEBHOOK_SECRET) {
      throw new Error('STRIPE_WEBHOOK_SECRET is not set');
    }

    const event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );

    switch (event.type) {
      case 'payment_intent.succeeded':
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        await updateTransactionStatus(
          paymentIntent.metadata.transactionId,
          PaymentStatus.COMPLETED,
          {
            paymentIntentId: paymentIntent.id,
            status: paymentIntent.status,
          }
        );
        break;

      case 'payment_intent.payment_failed':
        const failedPayment = event.data.object as Stripe.PaymentIntent;
        await updateTransactionStatus(
          failedPayment.metadata.transactionId,
          PaymentStatus.FAILED,
          {
            paymentIntentId: failedPayment.id,
            status: failedPayment.status,
            error: failedPayment.last_payment_error,
          }
        );
        break;

      case 'charge.refunded':
        const refund = event.data.object as Stripe.Charge;
        if (!refund.refunds?.data?.[0]?.id) {
          console.error('No refund data found in charge');
          return new NextResponse('Invalid refund data', { status: 400 });
        }
        await updateTransactionStatus(
          refund.metadata.transactionId,
          PaymentStatus.REFUNDED,
          {
            chargeId: refund.id,
            refundId: refund.refunds.data[0].id,
            refundAmount: refund.amount_refunded / 100,
          }
        );
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return new NextResponse(null, { status: 200 });
  } catch (error) {
    console.error('Webhook error:', error);
    return new NextResponse('Webhook Error', { status: 400 });
  }
} 