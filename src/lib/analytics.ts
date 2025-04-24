import { prisma } from './prisma';
import { startOfDay, endOfDay, subDays, format } from 'date-fns';
import { PaymentMethod, PaymentProvider, PaymentStatus } from '@prisma/client';

type TransactionGroupBy = {
  paymentMethod: PaymentMethod;
  paymentProvider: PaymentProvider;
  _count: { id: number };
  _sum: { amount: number | null };
};

type RefundGroupBy = {
  paymentMethod: PaymentMethod;
  paymentProvider: PaymentProvider;
  _count: { id: number };
  _sum: { refundedAmount: number | null };
};

type TransactionWithDate = {
  amount: number;
  createdAt: Date;
};

export async function calculateDailyMetrics(
  date: Date,
  storeId?: string
) {
  const startDate = startOfDay(date);
  const endDate = endOfDay(date);

  const where = {
    createdAt: {
      gte: startDate,
      lte: endDate,
    },
    ...(storeId && { storeId }),
  };

  const [
    totalTransactions,
    successfulTransactions,
    failedTransactions,
    refundedTransactions,
    totalRevenue,
  ] = await Promise.all([
    prisma.transaction.count({ where }),
    prisma.transaction.count({
      where: {
        ...where,
        status: PaymentStatus.COMPLETED,
      },
    }),
    prisma.transaction.count({
      where: {
        ...where,
        status: PaymentStatus.FAILED,
      },
    }),
    prisma.transaction.count({
      where: {
        ...where,
        status: PaymentStatus.REFUNDED,
      },
    }),
    prisma.transaction.aggregate({
      where: {
        ...where,
        status: PaymentStatus.COMPLETED,
      },
      _sum: {
        amount: true,
      },
    }),
  ]);

  const averageAmount = successfulTransactions > 0
    ? (totalRevenue._sum.amount || 0) / successfulTransactions
    : 0;

  return {
    date: startDate,
    totalTransactions,
    successfulTransactions,
    failedTransactions,
    refundedTransactions,
    totalRevenue: totalRevenue._sum.amount || 0,
    averageAmount,
  };
}

export async function getPaymentMethodBreakdown(
  startDate: Date,
  endDate: Date,
  storeId?: string
) {
  const where = {
    createdAt: {
      gte: startDate,
      lte: endDate,
    },
    ...(storeId && { storeId }),
  };

  const transactions = await prisma.transaction.groupBy({
    by: ['paymentMethod', 'paymentProvider'],
    where,
    _count: {
      id: true,
    },
    _sum: {
      amount: true,
    },
  });

  return transactions.map((t: TransactionGroupBy) => ({
    method: t.paymentMethod,
    provider: t.paymentProvider,
    count: t._count.id,
    total: t._sum.amount || 0,
  }));
}

export async function getRevenueTrend(
  days: number,
  storeId?: string
) {
  const endDate = new Date();
  const startDate = subDays(endDate, days);

  const where = {
    createdAt: {
      gte: startDate,
      lte: endDate,
    },
    status: PaymentStatus.COMPLETED,
    ...(storeId && { storeId }),
  };

  const transactions = await prisma.transaction.findMany({
    where,
    select: {
      amount: true,
      createdAt: true,
    },
    orderBy: {
      createdAt: 'asc',
    },
  });

  const dailyRevenue = transactions.reduce((acc: Record<string, number>, t: TransactionWithDate) => {
    const date = format(t.createdAt, 'yyyy-MM-dd');
    acc[date] = (acc[date] || 0) + t.amount;
    return acc;
  }, {} as Record<string, number>);

  return Object.entries(dailyRevenue).map(([date, amount]) => ({
    date,
    amount,
  }));
}

export async function getRefundMetrics(
  startDate: Date,
  endDate: Date,
  storeId?: string
) {
  const where = {
    createdAt: {
      gte: startDate,
      lte: endDate,
    },
    status: {
      in: [PaymentStatus.REFUNDED, PaymentStatus.PARTIALLY_REFUNDED],
    },
    ...(storeId && { storeId }),
  };

  const [
    totalRefunds,
    totalRefundAmount,
    refundsByMethod,
  ] = await Promise.all([
    prisma.transaction.count({ where }),
    prisma.transaction.aggregate({
      where,
      _sum: {
        refundedAmount: true,
      },
    }),
    prisma.transaction.groupBy({
      by: ['paymentMethod', 'paymentProvider'],
      where,
      _count: {
        id: true,
      },
      _sum: {
        refundedAmount: true,
      },
    }),
  ]);

  return {
    totalRefunds,
    totalRefundAmount: totalRefundAmount._sum.refundedAmount || 0,
    refundsByMethod: refundsByMethod.map((r: RefundGroupBy) => ({
      method: r.paymentMethod,
      provider: r.paymentProvider,
      count: r._count.id,
      amount: r._sum.refundedAmount || 0,
    })),
  };
}

export async function exportAnalytics(
  startDate: Date,
  endDate: Date,
  storeId?: string
) {
  const [
    dailyMetrics,
    methodBreakdown,
    revenueTrend,
    refundMetrics,
  ] = await Promise.all([
    calculateDailyMetrics(startDate, storeId),
    getPaymentMethodBreakdown(startDate, endDate, storeId),
    getRevenueTrend(7, storeId),
    getRefundMetrics(startDate, endDate, storeId),
  ]);

  return {
    dailyMetrics,
    methodBreakdown,
    revenueTrend,
    refundMetrics,
  };
}

export async function getDailyMetrics(date: Date = new Date()) {
  const start = startOfDay(date);
  const end = endOfDay(date);

  // Use Promise.all for concurrent queries
  const [
    totalOrders,
    totalRevenue,
    averageOrderValue,
    totalRefunds,
    refundRate,
    paymentMethodBreakdown,
    topProducts,
    customerMetrics
  ] = await Promise.all([
    // Total Orders
    prisma.order.count({
      where: {
        createdAt: {
          gte: start,
          lte: end
        }
      }
    }),

    // Total Revenue
    prisma.transaction.aggregate({
      where: {
        createdAt: {
          gte: start,
          lte: end
        },
        status: PaymentStatus.COMPLETED
      },
      _sum: {
        amount: true
      }
    }),

    // Average Order Value
    prisma.order.aggregate({
      where: {
        createdAt: {
          gte: start,
          lte: end
        }
      },
      _avg: {
        totalAmount: true
      }
    }),

    // Total Refunds
    prisma.transaction.count({
      where: {
        createdAt: {
          gte: start,
          lte: end
        },
        status: PaymentStatus.REFUNDED
      }
    }),

    // Refund Rate
    prisma.transaction.groupBy({
      by: ['status'],
      where: {
        createdAt: {
          gte: start,
          lte: end
        }
      },
      _count: true
    }),

    // Payment Method Breakdown
    prisma.transaction.groupBy({
      by: ['paymentMethod'],
      where: {
        createdAt: {
          gte: start,
          lte: end
        },
        status: PaymentStatus.COMPLETED
      },
      _sum: {
        amount: true
      }
    }),

    // Top Products
    prisma.order.groupBy({
      by: ['items'],
      where: {
        createdAt: {
          gte: start,
          lte: end
        }
      },
      _count: true,
      orderBy: {
        _count: {
          items: 'desc'
        }
      },
      take: 10
    }),

    // Customer Metrics
    prisma.order.groupBy({
      by: ['userId'],
      where: {
        createdAt: {
          gte: start,
          lte: end
        }
      },
      _count: true,
      _sum: {
        totalAmount: true
      }
    })
  ]);

  return {
    totalOrders,
    totalRevenue: totalRevenue._sum.amount || 0,
    averageOrderValue: averageOrderValue._avg.totalAmount || 0,
    totalRefunds,
    refundRate: calculateRefundRate(refundRate),
    paymentMethodBreakdown: formatPaymentMethodBreakdown(paymentMethodBreakdown),
    topProducts: formatTopProducts(topProducts),
    customerMetrics: formatCustomerMetrics(customerMetrics)
  };
}

// Helper functions for data formatting
function calculateRefundRate(refundData: any[]) {
  const total = refundData.reduce((acc, curr) => acc + curr._count, 0);
  const refunded = refundData.find(r => r.status === PaymentStatus.REFUNDED)?._count || 0;
  return total > 0 ? (refunded / total) * 100 : 0;
}

function formatPaymentMethodBreakdown(breakdown: any[]) {
  return breakdown.map(item => ({
    method: item.paymentMethod,
    amount: item._sum.amount || 0
  }));
}

function formatTopProducts(products: any[]) {
  return products.map(item => ({
    product: item.items,
    count: item._count
  }));
}

function formatCustomerMetrics(metrics: any[]) {
  return {
    totalCustomers: metrics.length,
    averageOrderValue: metrics.reduce((acc, curr) => acc + (curr._sum.totalAmount || 0), 0) / metrics.length,
    repeatCustomers: metrics.filter(m => m._count > 1).length
  };
} 