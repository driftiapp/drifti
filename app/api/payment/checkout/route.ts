import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { PaymentMethod, PaymentProvider } from '@/types/payment';
import { stripe } from '@/lib/stripe';

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const json = await request.json();
    const { amount, currency = 'USD', paymentMethod, metadata = {} } = json;

    if (!amount || typeof amount !== 'number') {
      return new NextResponse('Invalid amount', { status: 400 });
    }

    if (!paymentMethod || !Object.values(PaymentMethod).includes(paymentMethod)) {
      return new NextResponse('Invalid payment method', { status: 400 });
    }

    // Create a transaction record
    const transaction = await prisma.transaction.create({
      data: {
        userId: session.user.id,
        amount,
        currency,
        paymentMethod,
        paymentProvider: PaymentProvider.STRIPE,
        status: 'PENDING',
        metadata: metadata || null,
      },
    });

    // Create a Stripe checkout session
    const checkoutSession = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency,
            product_data: {
              name: 'Payment',
            },
            unit_amount: Math.round(amount * 100), // Convert to cents
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/payment/cancel`,
      metadata: {
        transactionId: transaction.id,
      },
    });

    return NextResponse.json({ url: checkoutSession.url });
  } catch (error) {
    console.error('[CHECKOUT_ERROR]', error);
    return new NextResponse('Internal error', { status: 500 });
  }
} 