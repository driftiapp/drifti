import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { capturePayPalOrder, updatePayPalTransactionStatus } from '@/lib/paypal';
import { PaymentStatus } from '@prisma/client';

export async function POST(request: Request) {
  try {
    const body = await request.text();
    const signature = headers().get('paypal-transmission-sig');

    if (!signature) {
      return new NextResponse('No signature', { status: 400 });
    }

    if (!process.env.PAYPAL_WEBHOOK_SECRET) {
      throw new Error('PAYPAL_WEBHOOK_SECRET is not set');
    }

    // Verify webhook signature
    const event = JSON.parse(body);

    switch (event.event_type) {
      case 'CHECKOUT.ORDER.APPROVED':
        const orderApproved = event.resource;
        await updatePayPalTransactionStatus(
          orderApproved.custom_id,
          PaymentStatus.PENDING,
          {
            payerId: orderApproved.payer.payer_id,
            status: orderApproved.status,
          }
        );
        break;

      case 'PAYMENT.CAPTURE.COMPLETED':
        const paymentCompleted = event.resource;
        await updatePayPalTransactionStatus(
          paymentCompleted.custom_id,
          PaymentStatus.COMPLETED,
          {
            captureId: paymentCompleted.id,
            status: paymentCompleted.status,
          }
        );
        break;

      case 'PAYMENT.CAPTURE.DENIED':
        const paymentDenied = event.resource;
        await updatePayPalTransactionStatus(
          paymentDenied.custom_id,
          PaymentStatus.FAILED,
          {
            status: paymentDenied.status,
          }
        );
        break;

      case 'PAYMENT.REFUND.COMPLETED':
        const refundCompleted = event.resource;
        await updatePayPalTransactionStatus(
          refundCompleted.custom_id,
          PaymentStatus.REFUNDED,
          {
            status: refundCompleted.status,
          }
        );
        break;

      default:
        console.log(`Unhandled event type: ${event.event_type}`);
    }

    return new NextResponse(null, { status: 200 });
  } catch (error) {
    console.error('PayPal webhook error:', error);
    return new NextResponse('Webhook Error', { status: 400 });
  }
} 