import React, { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useAuth } from '../../contexts/AuthContext';

const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLIC_KEY);

const SubscriptionFormContent = ({ plan, onSuccess }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { user } = useAuth();

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    if (!stripe || !elements) {
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

      // Create subscription
      const response = await axios.post(
        '/api/payments/subscriptions',
        {
          paymentMethodId: paymentMethod.id,
          planId: plan.id,
          priceId: plan.priceId,
        },
        {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        }
      );

      if (response.data.status === 'active') {
        toast.success('Subscription activated successfully!');
        onSuccess(response.data);
      } else {
        setError('Failed to activate subscription. Please try again.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to activate subscription');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6">Subscription Details</h2>
      
      <div className="mb-6">
        <div className="bg-gray-50 p-4 rounded-md mb-4">
          <h3 className="text-lg font-semibold mb-2">{plan.name}</h3>
          <p className="text-gray-600 mb-2">{plan.description}</p>
          <div className="flex items-center justify-between">
            <span className="text-2xl font-bold">${plan.price}</span>
            <span className="text-gray-600">/{plan.interval}</span>
          </div>
        </div>

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
        <h3 className="text-lg font-semibold mb-2">Billing Details</h3>
        <div className="space-y-3">
          <div className="flex justify-between">
            <span className="text-gray-600">Billing Cycle</span>
            <span className="font-medium">Every {plan.interval}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Next Billing Date</span>
            <span className="font-medium">
              {new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString()}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Auto-Renewal</span>
            <span className="font-medium text-green-600">Enabled</span>
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
        {loading ? 'Processing...' : 'Subscribe Now'}
      </button>
    </form>
  );
};

const SubscriptionPayment = ({ plan, onSuccess }) => {
  const [clientSecret, setClientSecret] = useState(null);
  const { user } = useAuth();

  useEffect(() => {
    const fetchSubscriptionIntent = async () => {
      try {
        const response = await axios.post(
          '/api/payments/subscription-intent',
          {
            planId: plan.id,
            priceId: plan.priceId,
          },
          {
            headers: {
              Authorization: `Bearer ${user.token}`,
            },
          }
        );
        setClientSecret(response.data.clientSecret);
      } catch (error) {
        console.error('Error fetching subscription intent:', error);
        toast.error('Failed to initialize subscription');
      }
    };

    fetchSubscriptionIntent();
  }, [plan.id, plan.priceId, user.token]);

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
      <SubscriptionFormContent plan={plan} onSuccess={onSuccess} />
    </Elements>
  );
};

export default SubscriptionPayment; 