import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { createPayPalOrder, createPayPalTransaction } from '@/lib/paypal';
import { z } from 'zod';

const checkoutSchema = z.object({
  amount: z.number().positive(),
  currency: z.string().default('USD'),
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
    const { amount, currency, orderId, metadata } = checkoutSchema.parse(body);

    // Create PayPal order
    const paypalOrder = await createPayPalOrder(amount, currency, {
      userId: session.user.id,
      orderId,
      ...metadata,
    });

    // Create transaction record
    const transaction = await createPayPalTransaction(
      session.user.id,
      orderId || null,
      amount,
      currency,
      paypalOrder.id,
      {
        paypalOrderId: paypalOrder.id,
        ...metadata,
      }
    );

    return NextResponse.json({
      orderId: paypalOrder.id,
      transactionId: transaction.id,
      links: paypalOrder.links,
    });
  } catch (error) {
    console.error('PayPal checkout error:', error);
    if (error instanceof z.ZodError) {
      return new NextResponse(JSON.stringify(error.errors), { status: 400 });
    }
    return new NextResponse('Internal Server Error', { status: 500 });
  }
} 