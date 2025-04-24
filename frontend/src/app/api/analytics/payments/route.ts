import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import {
  calculateDailyMetrics,
  getPaymentMethodBreakdown,
  getRevenueTrend,
  getRefundMetrics,
  exportAnalytics,
} from '@/lib/analytics';
import { z } from 'zod';

const querySchema = z.object({
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  storeId: z.string().optional(),
  export: z.boolean().optional(),
});

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const query = querySchema.parse({
      startDate: searchParams.get('startDate'),
      endDate: searchParams.get('endDate'),
      storeId: searchParams.get('storeId'),
      export: searchParams.get('export') === 'true',
    });

    const startDate = new Date(query.startDate);
    const endDate = new Date(query.endDate);

    if (query.export) {
      const data = await exportAnalytics(startDate, endDate, query.storeId);
      return NextResponse.json(data);
    }

    const [
      dailyMetrics,
      methodBreakdown,
      revenueTrend,
      refundMetrics,
    ] = await Promise.all([
      calculateDailyMetrics(startDate, query.storeId),
      getPaymentMethodBreakdown(startDate, endDate, query.storeId),
      getRevenueTrend(7, query.storeId),
      getRefundMetrics(startDate, endDate, query.storeId),
    ]);

    return NextResponse.json({
      dailyMetrics,
      methodBreakdown,
      revenueTrend,
      refundMetrics,
    });
  } catch (error) {
    console.error('Analytics error:', error);
    if (error instanceof z.ZodError) {
      return new NextResponse(JSON.stringify(error.errors), { status: 400 });
    }
    return new NextResponse('Internal Server Error', { status: 500 });
  }
} 