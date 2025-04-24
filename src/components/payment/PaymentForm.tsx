'use client';

import { useState } from 'react';
import { useStripe, useElements, PaymentElement } from '@stripe/react-stripe-js';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'react-hot-toast';
import { PaymentMethod } from '@prisma/client';
import { PayPalButtons } from '@paypal/react-paypal-js';

interface PaymentFormProps {
  clientSecret?: string;
  amount: number;
  currency: string;
  paymentMethod: PaymentMethod;
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

export function PaymentForm({
  clientSecret,
  amount,
  currency,
  paymentMethod,
  onSuccess,
  onError,
}: PaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleStripeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);

    try {
      const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/payment/confirmation`,
        },
      });

      if (error) {
        toast.error(error.message || 'Payment failed');
        onError?.(error);
      } else {
        toast.success('Payment successful!');
        onSuccess?.();
      }
    } catch (error) {
      console.error('Payment error:', error);
      toast.error('An error occurred during payment');
      onError?.(error as Error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePayPalSuccess = async (data: any) => {
    try {
      const response = await fetch('/api/payment/paypal/capture', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderId: data.orderID,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to capture PayPal payment');
      }

      toast.success('Payment successful!');
      onSuccess?.();
    } catch (error) {
      console.error('PayPal capture error:', error);
      toast.error('An error occurred during payment');
      onError?.(error as Error);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Payment Details</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="space-y-2">
            <p className="text-sm text-gray-500">
              Amount: {amount} {currency}
            </p>
            <p className="text-sm text-gray-500">
              Payment Method: {paymentMethod}
            </p>
          </div>

          {paymentMethod === PaymentMethod.PAYPAL ? (
            <PayPalButtons
              style={{ layout: 'vertical' }}
              createOrder={async () => {
                const response = await fetch('/api/payment/paypal/checkout', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({
                    amount,
                    currency,
                  }),
                });

                const data = await response.json();
                return data.orderId;
              }}
              onApprove={handlePayPalSuccess}
              onError={(err) => {
                console.error('PayPal error:', err);
                toast.error('An error occurred with PayPal');
                onError?.(err as Error);
              }}
            />
          ) : (
            <form onSubmit={handleStripeSubmit} className="space-y-4">
              <PaymentElement />
              <Button
                type="submit"
                disabled={!stripe || isProcessing}
                className="w-full"
              >
                {isProcessing ? 'Processing...' : 'Pay Now'}
              </Button>
            </form>
          )}
        </div>
      </CardContent>
    </Card>
  );
} 