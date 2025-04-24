'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';

export default function PaymentConfirmationPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');

  useEffect(() => {
    const paymentIntent = searchParams.get('payment_intent');
    const paymentIntentClientSecret = searchParams.get('payment_intent_client_secret');

    if (!paymentIntent || !paymentIntentClientSecret) {
      setStatus('error');
      return;
    }

    // Verify payment status
    const verifyPayment = async () => {
      try {
        const response = await fetch('/api/payment/verify', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            paymentIntent,
            paymentIntentClientSecret,
          }),
        });

        if (!response.ok) {
          throw new Error('Payment verification failed');
        }

        const data = await response.json();
        setStatus(data.status === 'succeeded' ? 'success' : 'error');
      } catch (error) {
        console.error('Payment verification error:', error);
        setStatus('error');
      }
    };

    verifyPayment();
  }, [searchParams]);

  return (
    <div className="container mx-auto py-8">
      <Card className="max-w-md mx-auto">
        <CardHeader>
          <CardTitle>Payment Confirmation</CardTitle>
        </CardHeader>
        <CardContent>
          {status === 'processing' && (
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4" />
              <p>Verifying your payment...</p>
            </div>
          )}

          {status === 'success' && (
            <div className="text-center space-y-4">
              <div className="text-green-500 text-5xl mb-4">✓</div>
              <h2 className="text-2xl font-bold">Payment Successful!</h2>
              <p className="text-gray-600">
                Thank you for your payment. Your transaction has been completed successfully.
              </p>
              <Button
                onClick={() => router.push('/dashboard')}
                className="w-full"
              >
                Go to Dashboard
              </Button>
            </div>
          )}

          {status === 'error' && (
            <div className="text-center space-y-4">
              <div className="text-red-500 text-5xl mb-4">✕</div>
              <h2 className="text-2xl font-bold">Payment Failed</h2>
              <p className="text-gray-600">
                We couldn&apos;t process your payment. Please try again or contact support.
              </p>
              <Button
                onClick={() => router.push('/payment')}
                variant="outline"
                className="w-full"
              >
                Try Again
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 