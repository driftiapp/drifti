import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { createPaymentIntent, createTransaction } from '@/lib/stripe';
import { PaymentMethod, PaymentProvider } from '@prisma/client';
import { z } from 'zod';

const checkoutSchema = z.object({
  amount: z.number().positive(),
  currency: z.string().default('USD'),
  paymentMethod: z.nativeEnum(PaymentMethod),
  orderId: z.string().optional(),
  metadata: z.record(z.any()).optional(),
});

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const body = await request.json();
    const { amount, currency, paymentMethod, orderId, metadata } = checkoutSchema.parse(body);

    // Create payment intent
    const paymentIntent = await createPaymentIntent(amount, currency, {
      userId: session.user.id,
      orderId,
      ...metadata,
    });

    // Create transaction record
    const transaction = await createTransaction(
      session.user.id,
      orderId || null,
      amount,
      currency,
      paymentMethod,
      PaymentProvider.STRIPE,
      {
        paymentIntentId: paymentIntent.id,
        ...metadata,
      }
    );

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      transactionId: transaction.id,
    });
  } catch (error) {
    console.error('Checkout error:', error);
    if (error instanceof z.ZodError) {
      return new NextResponse(JSON.stringify(error.errors), { status: 400 });
    }
    return new NextResponse('Internal Server Error', { status: 500 });
  }
} 