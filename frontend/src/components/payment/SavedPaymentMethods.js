import React, { useState, useEffect } from 'react';
import { useStripe } from '@stripe/react-stripe-js';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useAuth } from '../../contexts/AuthContext';

const SavedPaymentMethods = ({ onSelect, selectedMethodId }) => {
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useAuth();
  const stripe = useStripe();

  useEffect(() => {
    fetchPaymentMethods();
  }, []);

  const fetchPaymentMethods = async () => {
    try {
      const response = await axios.get('/api/payments/methods', {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      });
      setPaymentMethods(response.data);
    } catch (err) {
      setError('Failed to load payment methods');
      toast.error('Failed to load payment methods');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (paymentMethodId) => {
    try {
      await axios.delete(`/api/payments/methods/${paymentMethodId}`, {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      });
      setPaymentMethods(paymentMethods.filter(method => method.id !== paymentMethodId));
      toast.success('Payment method deleted successfully');
    } catch (err) {
      toast.error('Failed to delete payment method');
    }
  };

  const formatCardNumber = (last4) => {
    return `•••• ${last4}`;
  };

  const formatExpiry = (expMonth, expYear) => {
    return `${expMonth.toString().padStart(2, '0')}/${expYear.toString().slice(-2)}`;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[200px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 text-red-700 rounded-md">
        {error}
      </div>
    );
  }

  if (paymentMethods.length === 0) {
    return (
      <div className="text-center text-gray-500 py-8">
        No saved payment methods
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {paymentMethods.map((method) => (
        <div
          key={method.id}
          className={`p-4 border rounded-lg cursor-pointer transition-colors ${
            selectedMethodId === method.id
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-200 hover:border-blue-300'
          }`}
          onClick={() => onSelect(method.id)}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-8 bg-gray-200 rounded flex items-center justify-center">
                {method.card.brand === 'visa' && (
                  <span className="text-blue-600 font-bold">VISA</span>
                )}
                {method.card.brand === 'mastercard' && (
                  <span className="text-red-600 font-bold">MC</span>
                )}
              </div>
              <div>
                <div className="font-medium">
                  {formatCardNumber(method.card.last4)}
                </div>
                <div className="text-sm text-gray-500">
                  Expires {formatExpiry(method.card.exp_month, method.card.exp_year)}
                </div>
              </div>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleDelete(method.id);
              }}
              className="text-red-600 hover:text-red-800"
            >
              Delete
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default SavedPaymentMethods; 