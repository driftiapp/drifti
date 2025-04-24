import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { processRefund } from '@/lib/stripe';
import { z } from 'zod';

const refundSchema = z.object({
  transactionId: z.string(),
  amount: z.number().positive(),
  reason: z.string().min(1),
});

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const body = await request.json();
    const { transactionId, amount, reason } = refundSchema.parse(body);

    const refund = await processRefund(transactionId, amount, reason);

    return NextResponse.json(refund);
  } catch (error) {
    console.error('Refund error:', error);
    if (error instanceof z.ZodError) {
      return new NextResponse(JSON.stringify(error.errors), { status: 400 });
    }
    return new NextResponse('Internal Server Error', { status: 500 });
  }
} 