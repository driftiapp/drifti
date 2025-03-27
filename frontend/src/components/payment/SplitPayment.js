import React, { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useAuth } from '../../contexts/AuthContext';

const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLIC_KEY);

const SplitPaymentFormContent = ({ order, splits, onSuccess }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedSplit, setSelectedSplit] = useState(null);
  const { user } = useAuth();

  const handleSplitSelect = (split) => {
    setSelectedSplit(split);
    setError(null);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    if (!stripe || !elements || !selectedSplit) {
      return;
    }

    try {
      // Create payment method
      const { error: stripeError, paymentMethod } = await stripe.createPaymentMethod({
        type: 'card',
        card: elements.getElement(CardElement),
      });

      if (stripeError) {
        setError(stripeError.message);
        setLoading(false);
        return;
      }

      // Process split payment
      const response = await axios.post(
        `/api/payments/split/${order._id}`,
        {
          paymentMethodId: paymentMethod.id,
          splitId: selectedSplit.id,
          amount: selectedSplit.amount,
        },
        {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        }
      );

      if (response.data.status === 'succeeded') {
        toast.success('Payment processed successfully!');
        onSuccess(response.data);
      } else {
        setError('Payment failed. Please try again.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Payment failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6">Split Payment</h2>
      
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-4">Select Your Split</h3>
        <div className="space-y-3">
          {splits.map((split) => (
            <div
              key={split.id}
              className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                selectedSplit?.id === split.id
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-blue-300'
              }`}
              onClick={() => handleSplitSelect(split)}
            >
              <div className="flex justify-between items-center">
                <div>
                  <div className="font-medium">{split.name}</div>
                  <div className="text-sm text-gray-500">{split.description}</div>
                </div>
                <div className="text-lg font-bold">${split.amount.toFixed(2)}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {selectedSplit && (
        <>
          <div className="mb-6">
            <div className="mb-2">
              <label className="block text-gray-700 text-sm font-bold mb-2">
                Card Details
              </label>
              <div className="p-3 border rounded-md">
                <CardElement
                  options={{
                    style: {
                      base: {
                        fontSize: '16px',
                        color: '#424770',
                        '::placeholder': {
                          color: '#aab7c4',
                        },
                      },
                      invalid: {
                        color: '#9e2146',
                      },
                    },
                  }}
                />
              </div>
            </div>
          </div>

          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-2">Payment Summary</h3>
            <div className="bg-gray-50 p-4 rounded-md">
              <div className="flex justify-between mb-2">
                <span>Split Amount</span>
                <span>${selectedSplit.amount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between mb-2">
                <span>Service Fee</span>
                <span>${(selectedSplit.amount * 0.029 + 0.3).toFixed(2)}</span>
              </div>
              <div className="border-t pt-2 mt-2">
                <div className="flex justify-between font-bold">
                  <span>Total</span>
                  <span>
                    ${(selectedSplit.amount + (selectedSplit.amount * 0.029 + 0.3)).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={!stripe || loading}
            className={`w-full py-3 px-4 rounded-md text-white font-semibold ${
              loading || !stripe
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {loading ? 'Processing...' : 'Pay Now'}
          </button>
        </>
      )}
    </form>
  );
};

const SplitPayment = ({ order, splits, onSuccess }) => {
  const [clientSecret, setClientSecret] = useState(null);
  const { user } = useAuth();

  useEffect(() => {
    const fetchSplitIntent = async () => {
      try {
        const response = await axios.post(
          `/api/payments/split-intent/${order._id}`,
          {
            splits: splits.map(split => ({
              id: split.id,
              amount: split.amount,
            })),
          },
          {
            headers: {
              Authorization: `Bearer ${user.token}`,
            },
          }
        );
        setClientSecret(response.data.clientSecret);
      } catch (error) {
        console.error('Error fetching split payment intent:', error);
        toast.error('Failed to initialize split payment');
      }
    };

    fetchSplitIntent();
  }, [order._id, splits, user.token]);

  if (!clientSecret) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <Elements
      stripe={stripePromise}
      options={{
        clientSecret,
        appearance: {
          theme: 'stripe',
          variables: {
            colorPrimary: '#3b82f6',
            colorBackground: '#ffffff',
            colorText: '#1f2937',
            colorDanger: '#ef4444',
            fontFamily: 'system-ui, sans-serif',
            spacingUnit: '4px',
            borderRadius: '4px',
          },
        },
      }}
    >
      <SplitPaymentFormContent order={order} splits={splits} onSuccess={onSuccess} />
    </Elements>
  );
};

export default SplitPayment; 