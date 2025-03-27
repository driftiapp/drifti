import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useAuth } from '../../contexts/AuthContext';
import { format } from 'date-fns';

const ScheduledPayments = () => {
  const [scheduledPayments, setScheduledPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const { user } = useAuth();

  // Form states
  const [scheduleForm, setScheduleForm] = useState({
    amount: '',
    frequency: 'once',
    startDate: '',
    endDate: '',
    description: '',
    paymentMethod: '',
  });

  const [subscriptionForm, setSubscriptionForm] = useState({
    planId: '',
    interval: 'month',
    startDate: '',
    trialDays: 0,
    paymentMethod: '',
  });

  useEffect(() => {
    fetchScheduledPayments();
  }, []);

  const fetchScheduledPayments = async () => {
    try {
      const response = await axios.get('/api/payments/scheduled', {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      });
      setScheduledPayments(response.data);
    } catch (err) {
      setError('Failed to load scheduled payments');
      toast.error('Failed to load scheduled payments');
    } finally {
      setLoading(false);
    }
  };

  const handleScheduleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(
        '/api/payments/schedule',
        scheduleForm,
        {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        }
      );
      toast.success('Payment scheduled successfully');
      setShowScheduleModal(false);
      fetchScheduledPayments();
    } catch (err) {
      toast.error('Failed to schedule payment');
    }
  };

  const handleSubscriptionSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(
        '/api/payments/subscriptions',
        subscriptionForm,
        {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        }
      );
      toast.success('Subscription created successfully');
      setShowSubscriptionModal(false);
      fetchScheduledPayments();
    } catch (err) {
      toast.error('Failed to create subscription');
    }
  };

  const handleCancelPayment = async (paymentId) => {
    try {
      await axios.post(
        `/api/payments/scheduled/${paymentId}/cancel`,
        {},
        {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        }
      );
      toast.success('Payment cancelled successfully');
      fetchScheduledPayments();
    } catch (err) {
      toast.error('Failed to cancel payment');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Scheduled Payments</h2>
        <div className="space-x-4">
          <button
            onClick={() => setShowScheduleModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Schedule Payment
          </button>
          <button
            onClick={() => setShowSubscriptionModal(true)}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
          >
            Create Subscription
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
          {error}
        </div>
      )}

      <div className="space-y-4">
        {scheduledPayments.map((payment) => (
          <div
            key={payment._id}
            className="border rounded-lg p-4 hover:shadow-md transition-shadow"
          >
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-semibold">
                  {payment.type === 'subscription' ? 'Subscription' : 'Scheduled Payment'}
                </h3>
                <p className="text-gray-600">
                  Amount: ${payment.amount.toFixed(2)}
                </p>
              </div>
              <span
                className={`px-3 py-1 rounded-full text-sm font-medium ${
                  payment.status === 'active'
                    ? 'bg-green-100 text-green-800'
                    : payment.status === 'pending'
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-red-100 text-red-800'
                }`}
              >
                {payment.status}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <p className="text-sm text-gray-600">Next Payment</p>
                <p className="font-medium">
                  {format(new Date(payment.nextPaymentDate), 'PPP')}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Frequency</p>
                <p className="font-medium">
                  {payment.frequency === 'once'
                    ? 'One-time'
                    : payment.frequency === 'daily'
                    ? 'Daily'
                    : payment.frequency === 'weekly'
                    ? 'Weekly'
                    : payment.frequency === 'monthly'
                    ? 'Monthly'
                    : 'Yearly'}
                </p>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => handleCancelPayment(payment._id)}
                className="px-4 py-2 text-red-600 hover:text-red-800"
              >
                Cancel
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Schedule Payment Modal */}
      {showScheduleModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-xl font-bold mb-4">Schedule Payment</h3>
            <form onSubmit={handleScheduleSubmit} className="space-y-4">
              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Amount
                </label>
                <input
                  type="number"
                  value={scheduleForm.amount}
                  onChange={(e) =>
                    setScheduleForm({ ...scheduleForm, amount: e.target.value })
                  }
                  className="w-full px-3 py-2 border rounded-md"
                  required
                  min="0"
                  step="0.01"
                />
              </div>
              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Frequency
                </label>
                <select
                  value={scheduleForm.frequency}
                  onChange={(e) =>
                    setScheduleForm({ ...scheduleForm, frequency: e.target.value })
                  }
                  className="w-full px-3 py-2 border rounded-md"
                >
                  <option value="once">One-time</option>
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="yearly">Yearly</option>
                </select>
              </div>
              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Start Date
                </label>
                <input
                  type="date"
                  value={scheduleForm.startDate}
                  onChange={(e) =>
                    setScheduleForm({ ...scheduleForm, startDate: e.target.value })
                  }
                  className="w-full px-3 py-2 border rounded-md"
                  required
                />
              </div>
              {scheduleForm.frequency !== 'once' && (
                <div>
                  <label className="block text-gray-700 text-sm font-bold mb-2">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={scheduleForm.endDate}
                    onChange={(e) =>
                      setScheduleForm({ ...scheduleForm, endDate: e.target.value })
                    }
                    className="w-full px-3 py-2 border rounded-md"
                  />
                </div>
              )}
              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Description
                </label>
                <textarea
                  value={scheduleForm.description}
                  onChange={(e) =>
                    setScheduleForm({ ...scheduleForm, description: e.target.value })
                  }
                  className="w-full px-3 py-2 border rounded-md"
                  rows="3"
                />
              </div>
              <div className="flex justify-end space-x-4">
                <button
                  type="button"
                  onClick={() => setShowScheduleModal(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Schedule Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Subscription Modal */}
      {showSubscriptionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-xl font-bold mb-4">Create Subscription</h3>
            <form onSubmit={handleSubscriptionSubmit} className="space-y-4">
              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Plan
                </label>
                <select
                  value={subscriptionForm.planId}
                  onChange={(e) =>
                    setSubscriptionForm({ ...subscriptionForm, planId: e.target.value })
                  }
                  className="w-full px-3 py-2 border rounded-md"
                  required
                >
                  <option value="">Select a plan</option>
                  <option value="basic">Basic Plan</option>
                  <option value="pro">Pro Plan</option>
                  <option value="enterprise">Enterprise Plan</option>
                </select>
              </div>
              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Billing Interval
                </label>
                <select
                  value={subscriptionForm.interval}
                  onChange={(e) =>
                    setSubscriptionForm({ ...subscriptionForm, interval: e.target.value })
                  }
                  className="w-full px-3 py-2 border rounded-md"
                >
                  <option value="month">Monthly</option>
                  <option value="year">Yearly</option>
                </select>
              </div>
              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Start Date
                </label>
                <input
                  type="date"
                  value={subscriptionForm.startDate}
                  onChange={(e) =>
                    setSubscriptionForm({ ...subscriptionForm, startDate: e.target.value })
                  }
                  className="w-full px-3 py-2 border rounded-md"
                  required
                />
              </div>
              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Trial Period (days)
                </label>
                <input
                  type="number"
                  value={subscriptionForm.trialDays}
                  onChange={(e) =>
                    setSubscriptionForm({ ...subscriptionForm, trialDays: parseInt(e.target.value) })
                  }
                  className="w-full px-3 py-2 border rounded-md"
                  min="0"
                />
              </div>
              <div className="flex justify-end space-x-4">
                <button
                  type="button"
                  onClick={() => setShowSubscriptionModal(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                >
                  Create Subscription
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ScheduledPayments; 