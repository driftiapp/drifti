import { PaymentMethod, PaymentProvider, PaymentStatus } from '@prisma/client';

export interface PaymentDetails {
  amount: number;
  currency: string;
  paymentMethod: PaymentMethod;
  paymentProvider: PaymentProvider;
  status: PaymentStatus;
  metadata?: Record<string, any>;
}

export interface PaymentAnalytics {
  totalRevenue: number;
  totalTransactions: number;
  successfulTransactions: number;
  failedTransactions: number;
  refundedTransactions: number;
  averageAmount: number;
  currency: string;
  paymentMethod: PaymentMethod;
  paymentProvider: PaymentProvider;
  storeId?: string;
  metadata?: Record<string, any>;
}

export interface PaymentMetrics extends PaymentAnalytics {
  date: Date;
}

export type PaymentError = {
  code: string;
  message: string;
  details?: Record<string, any>;
};

export type PaymentWebhookEvent = {
  type: string;
  data: Record<string, any>;
  timestamp: Date;
}; 