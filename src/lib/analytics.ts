import { prisma } from './prisma';
import { startOfDay, endOfDay, subDays, format } from 'date-fns';

// Define payment-related enums
export enum PaymentMethod {
  CREDIT_CARD = 'CREDIT_CARD',
  DEBIT_CARD = 'DEBIT_CARD',
  PAYPAL = 'PAYPAL',
  BANK_TRANSFER = 'BANK_TRANSFER',
  CRYPTO = 'CRYPTO',
}

export enum PaymentProvider {
  STRIPE = 'STRIPE',
  PAYPAL = 'PAYPAL',
  BANK = 'BANK',
  CRYPTO = 'CRYPTO',
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED',
  PARTIALLY_REFUNDED = 'PARTIALLY_REFUNDED',
}

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

interface Transaction {
  id: string;
  amount: number;
  paymentMethod: string;
  status: string;
  createdAt: Date;
  category?: string;
}

interface PaymentMethodCounts {
  creditCard: number;
  paypal: number;
  bankTransfer: number;
  crypto: number;
}

/**
 * Calculates daily metrics for a given date range
 * @param {Date} date - The date to calculate metrics for
 * @param {string} [storeId] - Optional store ID to filter metrics
 * @returns {Promise<{
 *   date: Date;
 *   totalTransactions: number;
 *   successfulTransactions: number;
 *   failedTransactions: number;
 *   refundedTransactions: number;
 *   totalRevenue: number;
 *   averageAmount: number;
 *   customerLifetimeValue: number;
 *   customerAcquisitionCost: number;
 *   churnRate: number;
 *   retentionRate: number;
 * }>} Daily metrics object
 */
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

/**
 * Calculates transaction heat map data
 * @param {Date} startDate - Start date of the period
 * @param {Date} endDate - End date of the period
 * @param {string} [storeId] - Optional store ID to filter data
 * @returns {Promise<Array<{
 *   hour: number;
 *   day: number;
 *   transactions: number;
 * }>>} Heat map data
 */
export async function getTransactionHeatMapData(
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

  const transactions = await prisma.transaction.findMany({
    where,
    select: {
      createdAt: true,
    },
  }) as Transaction[];

  const heatMapData = transactions.reduce((acc: Record<string, number>, t: Transaction) => {
    const day = t.createdAt.getDay();
    const hour = t.createdAt.getHours();
    const key = `${day}-${hour}`;
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

  return Object.entries(heatMapData).map(([key, transactions]) => {
    const [day, hour] = key.split('-').map(Number);
    return { day, hour, transactions };
  });
}

/**
 * Calculates performance metrics for radar chart
 * @param {Date} startDate - Start date of the period
 * @param {Date} endDate - End date of the period
 * @param {string} [storeId] - Optional store ID to filter data
 * @returns {Promise<Array<{
 *   metric: string;
 *   value: number;
 *   maxValue: number;
 * }>>} Radar chart data
 */
export async function getPerformanceMetrics(
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

  const [
    totalTransactions,
    successfulTransactions,
    totalRevenue,
    averageAmount,
    refundRate,
  ] = await Promise.all([
    prisma.transaction.count({ where }),
    prisma.transaction.count({
      where: {
        ...where,
        status: PaymentStatus.COMPLETED,
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
    prisma.transaction.aggregate({
      where: {
        ...where,
        status: PaymentStatus.COMPLETED,
      },
      _avg: {
        amount: true,
      },
    }),
    prisma.transaction.count({
      where: {
        ...where,
        status: PaymentStatus.REFUNDED,
      },
    }),
  ]);

  const successRate = (successfulTransactions / totalTransactions) * 100;
  const avgAmount = averageAmount._avg.amount || 0;
  const refundRatePercent = (refundRate / totalTransactions) * 100;

  return [
    {
      metric: 'Success Rate',
      value: successRate,
      maxValue: 100,
    },
    {
      metric: 'Average Amount',
      value: avgAmount,
      maxValue: avgAmount * 2,
    },
    {
      metric: 'Refund Rate',
      value: refundRatePercent,
      maxValue: 10,
    },
    {
      metric: 'Total Revenue',
      value: totalRevenue._sum.amount || 0,
      maxValue: (totalRevenue._sum.amount || 0) * 1.5,
    },
  ];
}

/**
 * Calculates payment method trends over time
 * @param {Date} startDate - Start date of the period
 * @param {Date} endDate - End date of the period
 * @param {string} [storeId] - Optional store ID to filter data
 * @returns {Promise<Array<{
 *   date: string;
 *   creditCard: number;
 *   paypal: number;
 *   bankTransfer: number;
 *   crypto: number;
 * }>>} Payment method trends data
 */
export async function getPaymentMethodTrends(
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

  const transactions = await prisma.transaction.findMany({
    where,
    select: {
      createdAt: true,
      paymentMethod: true,
    },
  }) as Transaction[];

  const dailyData = transactions.reduce((acc: Record<string, PaymentMethodCounts>, t: Transaction) => {
    const date = format(t.createdAt, 'yyyy-MM-dd');
    if (!acc[date]) {
      acc[date] = {
        creditCard: 0,
        paypal: 0,
        bankTransfer: 0,
        crypto: 0,
      };
    }
    const method = t.paymentMethod.toLowerCase() as keyof PaymentMethodCounts;
    if (method in acc[date]) {
      acc[date][method]++;
    }
    return acc;
  }, {});

  return Object.entries(dailyData).map(([date, methods]) => ({
    date,
    ...methods,
  }));
}

/**
 * Calculates revenue by category
 * @param {Date} startDate - Start date of the period
 * @param {Date} endDate - End date of the period
 * @param {string} [storeId] - Optional store ID to filter data
 * @returns {Promise<Array<{
 *   date: string;
 *   amount: number;
 *   category: string;
 * }>>} Revenue by category data
 */
export async function getRevenueByCategory(
  startDate: Date,
  endDate: Date,
  storeId?: string
) {
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
      createdAt: true,
      amount: true,
      category: true,
    },
  }) as Transaction[];

  return transactions.map((t: Transaction) => ({
    date: format(t.createdAt, 'yyyy-MM-dd'),
    amount: t.amount,
    category: t.category,
  }));
}

/**
 * Exports analytics data in various formats
 * @param {Date} startDate - Start date of the export period
 * @param {Date} endDate - End date of the export period
 * @param {string} [storeId] - Optional store ID to filter data
 * @param {string} format - Export format ('csv' | 'json' | 'excel')
 * @returns {Promise<string>} Exported data
 */
export async function exportAnalyticsData(
  startDate: Date,
  endDate: Date,
  storeId?: string,
  format: 'csv' | 'json' | 'excel' = 'csv'
) {
  const [
    dailyMetrics,
    methodBreakdown,
    revenueTrend,
    refundMetrics,
    heatMapData,
    radarMetrics,
    paymentMethodTrends,
    revenueByCategory,
  ] = await Promise.all([
    calculateDailyMetrics(startDate, storeId),
    getPaymentMethodBreakdown(startDate, endDate, storeId),
    getRevenueTrend(7, storeId),
    getRefundMetrics(startDate, endDate, storeId),
    getTransactionHeatMapData(startDate, endDate, storeId),
    getPerformanceMetrics(startDate, endDate, storeId),
    getPaymentMethodTrends(startDate, endDate, storeId),
    getRevenueByCategory(startDate, endDate, storeId),
  ]);

  const data = {
    dailyMetrics,
    methodBreakdown,
    revenueTrend,
    refundMetrics,
    heatMapData,
    radarMetrics,
    paymentMethodTrends,
    revenueByCategory,
  };

  switch (format) {
    case 'csv':
      return convertToCSV(data);
    case 'json':
      return JSON.stringify(data, null, 2);
    case 'excel':
      return convertToExcel(data);
    default:
      throw new Error(`Unsupported export format: ${format}`);
  }
}

/**
 * Converts analytics data to CSV format
 * @param {Record<string, any>} data - Analytics data to convert
 * @returns {string} CSV formatted data
 */
function convertToCSV(data: Record<string, any>): string {
  const sections = Object.entries(data).map(([section, sectionData]) => {
    const rows = Array.isArray(sectionData)
      ? sectionData.map(row => Object.values(row as Record<string, any>).join(','))
      : [Object.values(sectionData as Record<string, any>).join(',')];
    return `${section}\n${rows.join('\n')}`;
  });
  return sections.join('\n\n');
}

/**
 * Converts analytics data to Excel format
 * @param {Record<string, any>} data - Analytics data to convert
 * @returns {string} Excel formatted data
 */
function convertToExcel(data: Record<string, any>): string {
  // This is a placeholder for Excel conversion
  // In a real implementation, you would use a library like xlsx
  return convertToCSV(data);
}

/**
 * Gets daily metrics for a specific date
 * @param {Date} [date=new Date()] - The date to get metrics for
 * @returns {Promise<{
 *   totalOrders: number;
 *   totalRevenue: number;
 *   averageOrderValue: number;
 *   totalRefunds: number;
 *   refundRate: number;
 *   paymentMethodBreakdown: any;
 *   topProducts: any;
 *   customerMetrics: {
 *     totalCustomers: number;
 *     averageOrderValue: number;
 *     repeatCustomers: number;
 *   };
 * }>} Daily metrics object
 */
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

/**
 * Formats customer metrics data
 * @param {Array<{
 *   _count: number;
 *   _sum: { totalAmount: number };
 * }>} metrics - Raw customer metrics data
 * @returns {{
 *   totalCustomers: number;
 *   averageOrderValue: number;
 *   repeatCustomers: number;
 * }} Formatted customer metrics
 */
function formatCustomerMetrics(metrics: any[]) {
  return {
    totalCustomers: metrics.length,
    averageOrderValue: metrics.reduce((acc, curr) => acc + (curr._sum.totalAmount || 0), 0) / metrics.length,
    repeatCustomers: metrics.filter(m => m._count > 1).length
  };
}

/**
 * Gets drill-down data for a specific date
 * @param {Date} date - The date to get drill-down data for
 * @param {string} [storeId] - Optional store ID to filter data
 * @returns {Promise<{
 *   date: string;
 *   transactions: Array<{
 *     id: string;
 *     amount: number;
 *     method: string;
 *     status: string;
 *     timestamp: string;
 *   }>;
 * }>} Drill-down data
 */
export async function getDrillDownData(
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

  const transactions = await prisma.transaction.findMany({
    where,
    select: {
      id: true,
      amount: true,
      paymentMethod: true,
      status: true,
      createdAt: true,
      category: true,
    },
    orderBy: {
      createdAt: 'asc',
    },
  }) as Transaction[];

  return {
    date: format(date, 'yyyy-MM-dd'),
    transactions: transactions.map((t: Transaction) => ({
      id: t.id,
      amount: t.amount,
      method: t.paymentMethod,
      status: t.status,
      timestamp: t.createdAt.toISOString(),
      category: t.category,
    })),
  };
}

/**
 * Gets drill-down data for a date range
 * @param {Date} startDate - Start date of the period
 * @param {Date} endDate - End date of the period
 * @param {string} [storeId] - Optional store ID to filter data
 * @returns {Promise<Record<string, {
 *   date: string;
 *   transactions: Array<{
 *     id: string;
 *     amount: number;
 *     method: string;
 *     status: string;
 *     timestamp: string;
 *   }>;
 * }>>} Drill-down data for the period
 */
export async function getDrillDownDataForPeriod(
  startDate: Date,
  endDate: Date,
  storeId?: string
) {
  const dates = [];
  let currentDate = startDate;
  while (currentDate <= endDate) {
    dates.push(new Date(currentDate));
    currentDate = subDays(currentDate, -1);
  }

  const drillDownData = await Promise.all(
    dates.map(date => getDrillDownData(date, storeId))
  );

  return drillDownData.reduce((acc, data) => {
    acc[data.date] = data;
    return acc;
  }, {} as Record<string, typeof drillDownData[0]>);
}

// Update the exportAnalytics function to include drill-down data
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
    heatMapData,
    radarMetrics,
    paymentMethodTrends,
    revenueByCategory,
    drillDownData,
  ] = await Promise.all([
    calculateDailyMetrics(startDate, storeId),
    getPaymentMethodBreakdown(startDate, endDate, storeId),
    getRevenueTrend(7, storeId),
    getRefundMetrics(startDate, endDate, storeId),
    getTransactionHeatMapData(startDate, endDate, storeId),
    getPerformanceMetrics(startDate, endDate, storeId),
    getPaymentMethodTrends(startDate, endDate, storeId),
    getRevenueByCategory(startDate, endDate, storeId),
    getDrillDownDataForPeriod(startDate, endDate, storeId),
  ]);

  return {
    dailyMetrics,
    methodBreakdown,
    revenueTrend,
    refundMetrics,
    heatMapData,
    radarMetrics,
    paymentMethodTrends,
    revenueByCategory,
    drillDownData,
  };
} 