import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { z } from 'zod';

const verifySchema = z.object({
  paymentIntent: z.string(),
  paymentIntentClientSecret: z.string(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { paymentIntent, paymentIntentClientSecret } = verifySchema.parse(body);

    const intent = await stripe.paymentIntents.retrieve(paymentIntent);

    if (intent.client_secret !== paymentIntentClientSecret) {
      return new NextResponse('Invalid client secret', { status: 400 });
    }

    return NextResponse.json({
      status: intent.status,
      amount: intent.amount / 100,
      currency: intent.currency,
    });
  } catch (error) {
    console.error('Payment verification error:', error);
    if (error instanceof z.ZodError) {
      return new NextResponse(JSON.stringify(error.errors), { status: 400 });
    }
    return new NextResponse('Internal Server Error', { status: 500 });
  }
} 