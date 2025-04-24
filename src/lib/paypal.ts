import { prisma } from './prisma';
import { PaymentMethod, PaymentProvider, PaymentStatus } from '@prisma/client';

if (!process.env.PAYPAL_CLIENT_ID || !process.env.PAYPAL_CLIENT_SECRET) {
  throw new Error('PayPal credentials are not set');
}

const PAYPAL_API_URL = process.env.NODE_ENV === 'production'
  ? 'https://api-m.paypal.com'
  : 'https://api-m.sandbox.paypal.com';

async function getAccessToken() {
  const auth = Buffer.from(
    `${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`
  ).toString('base64');

  const response = await fetch(`${PAYPAL_API_URL}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${auth}`,
    },
    body: 'grant_type=client_credentials',
  });

  const data = await response.json();
  return data.access_token;
}

export async function createPayPalOrder(
  amount: number,
  currency: string,
  metadata: Record<string, any> = {}
) {
  const accessToken = await getAccessToken();

  const response = await fetch(`${PAYPAL_API_URL}/v2/checkout/orders`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      intent: 'CAPTURE',
      purchase_units: [
        {
          amount: {
            currency_code: currency,
            value: amount.toString(),
          },
          custom_id: metadata.transactionId,
        },
      ],
      application_context: {
        return_url: `${process.env.NEXT_PUBLIC_APP_URL}/payment/confirmation`,
        cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/payment/cancelled`,
      },
    }),
  });

  const data = await response.json();
  return data;
}

export async function capturePayPalOrder(orderId: string) {
  const accessToken = await getAccessToken();

  const response = await fetch(
    `${PAYPAL_API_URL}/v2/checkout/orders/${orderId}/capture`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  const data = await response.json();
  return data;
}

export async function createPayPalTransaction(
  userId: string,
  orderId: string | null,
  amount: number,
  currency: string,
  paypalOrderId: string,
  metadata: Record<string, any> = {}
) {
  try {
    const transaction = await prisma.transaction.create({
      data: {
        userId,
        orderId,
        amount,
        currency,
        paymentMethod: PaymentMethod.PAYPAL,
        paymentProvider: PaymentProvider.PAYPAL,
        status: PaymentStatus.PENDING,
        paypalOrderId,
        metadata,
      },
    });

    return transaction;
  } catch (error) {
    console.error('Error creating PayPal transaction:', error);
    throw error;
  }
}

export async function updatePayPalTransactionStatus(
  transactionId: string,
  status: PaymentStatus,
  paypalData: {
    payerId?: string;
    captureId?: string;
    status?: string;
  } = {},
  metadata: Record<string, any> = {}
) {
  try {
    const transaction = await prisma.transaction.update({
      where: { id: transactionId },
      data: {
        status,
        paypalPayerId: paypalData.payerId,
        paypalCaptureId: paypalData.captureId,
        metadata: {
          ...metadata,
          paypalStatus: paypalData.status,
          updatedAt: new Date().toISOString(),
        },
      },
    });

    return transaction;
  } catch (error) {
    console.error('Error updating PayPal transaction status:', error);
    throw error;
  }
}

export async function processPayPalRefund(
  transactionId: string,
  amount: number,
  reason: string
) {
  try {
    const transaction = await prisma.transaction.findUnique({
      where: { id: transactionId },
    });

    if (!transaction) {
      throw new Error('Transaction not found');
    }

    if (!transaction.paypalCaptureId) {
      throw new Error('No PayPal capture ID found for refund');
    }

    const accessToken = await getAccessToken();

    const response = await fetch(`${PAYPAL_API_URL}/v2/payments/captures/${transaction.paypalCaptureId}/refund`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        amount: {
          value: amount.toString(),
          currency_code: transaction.currency,
        },
        note_to_payer: reason,
      }),
    });

    const refundData = await response.json();

    await prisma.transaction.update({
      where: { id: transactionId },
      data: {
        status: amount === transaction.amount ? PaymentStatus.REFUNDED : PaymentStatus.PARTIALLY_REFUNDED,
        refundedAmount: amount,
        metadata: {
          ...transaction.metadata,
          refundId: refundData.id,
          refundReason: reason,
          refundedAt: new Date().toISOString(),
        },
      },
    });

    return refundData;
  } catch (error) {
    console.error('Error processing PayPal refund:', error);
    throw error;
  }
} 