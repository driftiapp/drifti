import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { stripe } from '@/lib/stripe';
import { updateTransactionStatus } from '@/lib/stripe';
import { PaymentStatus } from '@prisma/client';
import { POST } from '../route';

// Mock dependencies
jest.mock('next/headers', () => ({
  headers: jest.fn(),
}));

jest.mock('@/lib/stripe', () => ({
  stripe: {
    webhooks: {
      constructEvent: jest.fn(),
    },
  },
  updateTransactionStatus: jest.fn(),
}));

describe('Payment Webhook Handler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.STRIPE_WEBHOOK_SECRET = 'test_secret';
  });

  it('should return 400 if no signature is provided', async () => {
    (headers as jest.Mock).mockReturnValue({ get: () => null });
    
    const response = await POST(new Request('http://localhost'));
    expect(response.status).toBe(400);
  });

  it('should handle payment_intent.succeeded event', async () => {
    (headers as jest.Mock).mockReturnValue({ get: () => 'test_signature' });
    (stripe.webhooks.constructEvent as jest.Mock).mockReturnValue({
      type: 'payment_intent.succeeded',
      data: {
        object: {
          id: 'pi_test',
          status: 'succeeded',
          metadata: {
            transactionId: 'tx_123',
          },
        },
      },
    });

    const response = await POST(new Request('http://localhost'));
    expect(response.status).toBe(200);
    expect(updateTransactionStatus).toHaveBeenCalledWith(
      'tx_123',
      PaymentStatus.COMPLETED,
      {
        paymentIntentId: 'pi_test',
        status: 'succeeded',
      }
    );
  });

  it('should handle payment_intent.payment_failed event', async () => {
    (headers as jest.Mock).mockReturnValue({ get: () => 'test_signature' });
    (stripe.webhooks.constructEvent as jest.Mock).mockReturnValue({
      type: 'payment_intent.payment_failed',
      data: {
        object: {
          id: 'pi_test',
          status: 'failed',
          metadata: {
            transactionId: 'tx_123',
          },
          last_payment_error: {
            message: 'Card declined',
          },
        },
      },
    });

    const response = await POST(new Request('http://localhost'));
    expect(response.status).toBe(200);
    expect(updateTransactionStatus).toHaveBeenCalledWith(
      'tx_123',
      PaymentStatus.FAILED,
      {
        paymentIntentId: 'pi_test',
        status: 'failed',
        error: {
          message: 'Card declined',
        },
      }
    );
  });

  it('should handle charge.refunded event', async () => {
    (headers as jest.Mock).mockReturnValue({ get: () => 'test_signature' });
    (stripe.webhooks.constructEvent as jest.Mock).mockReturnValue({
      type: 'charge.refunded',
      data: {
        object: {
          id: 'ch_test',
          amount_refunded: 1000,
          metadata: {
            transactionId: 'tx_123',
          },
          refunds: {
            data: [
              {
                id: 're_test',
              },
            ],
          },
        },
      },
    });

    const response = await POST(new Request('http://localhost'));
    expect(response.status).toBe(200);
    expect(updateTransactionStatus).toHaveBeenCalledWith(
      'tx_123',
      PaymentStatus.REFUNDED,
      {
        chargeId: 'ch_test',
        refundId: 're_test',
        refundAmount: 10,
      }
    );
  });

  it('should handle webhook construction errors', async () => {
    (headers as jest.Mock).mockReturnValue({ get: () => 'test_signature' });
    (stripe.webhooks.constructEvent as jest.Mock).mockImplementation(() => {
      throw new Error('Invalid signature');
    });

    const response = await POST(new Request('http://localhost'));
    expect(response.status).toBe(400);
  });
}); 