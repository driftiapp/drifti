import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useAuth } from '../../contexts/AuthContext';

const PaymentSettings = () => {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const { user } = useAuth();

  const [formData, setFormData] = useState({
    general: {
      defaultCurrency: 'USD',
      defaultPaymentMethod: 'card',
      retryAttempts: 3,
      retryInterval: 24,
      autoCancelFailed: true,
    },
    tax: {
      enabled: true,
      rate: 0,
      inclusive: false,
      countries: [],
    },
    fees: {
      enabled: true,
      percentage: 0,
      fixed: 0,
      minimum: 0,
      maximum: 0,
    },
    notifications: {
      paymentSuccess: true,
      paymentFailed: true,
      refundProcessed: true,
      subscriptionRenewal: true,
      subscriptionCancelled: true,
      disputeOpened: true,
      disputeResolved: true,
    },
    policies: {
      refundPeriod: 30,
      requireConfirmation: true,
      allowPartialRefunds: true,
      requireReason: true,
    },
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await axios.get('/api/payments/settings', {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      });
      setSettings(response.data);
      setFormData(response.data);
    } catch (err) {
      setError('Failed to load settings');
      toast.error('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await axios.put('/api/payments/settings', formData, {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      });
      toast.success('Settings updated successfully');
      fetchSettings();
    } catch (err) {
      toast.error('Failed to update settings');
    } finally {
      setSaving(false);
    }
  };

  const handleGeneralChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      general: {
        ...prev.general,
        [name]: type === 'checkbox' ? checked : value,
      },
    }));
  };

  const handleTaxChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      tax: {
        ...prev.tax,
        [name]: type === 'checkbox' ? checked : value,
      },
    }));
  };

  const handleFeesChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      fees: {
        ...prev.fees,
        [name]: parseFloat(value) || 0,
      },
    }));
  };

  const handleNotificationChange = (e) => {
    const { name, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      notifications: {
        ...prev.notifications,
        [name]: checked,
      },
    }));
  };

  const handlePolicyChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      policies: {
        ...prev.policies,
        [name]: type === 'checkbox' ? checked : value,
      },
    }));
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
      <h2 className="text-2xl font-bold mb-6">Payment Settings</h2>

      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* General Settings */}
        <div className="border rounded-lg p-4">
          <h3 className="text-lg font-semibold mb-4">General Settings</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2">
                Default Currency
              </label>
              <select
                name="defaultCurrency"
                value={formData.general.defaultCurrency}
                onChange={handleGeneralChange}
                className="w-full px-3 py-2 border rounded-md"
              >
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
                <option value="GBP">GBP</option>
                <option value="JPY">JPY</option>
              </select>
            </div>
            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2">
                Default Payment Method
              </label>
              <select
                name="defaultPaymentMethod"
                value={formData.general.defaultPaymentMethod}
                onChange={handleGeneralChange}
                className="w-full px-3 py-2 border rounded-md"
              >
                <option value="card">Card</option>
                <option value="bank_transfer">Bank Transfer</option>
                <option value="paypal">PayPal</option>
              </select>
            </div>
            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2">
                Retry Attempts
              </label>
              <input
                type="number"
                name="retryAttempts"
                value={formData.general.retryAttempts}
                onChange={handleGeneralChange}
                className="w-full px-3 py-2 border rounded-md"
                min="0"
                max="5"
              />
            </div>
            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2">
                Retry Interval (hours)
              </label>
              <input
                type="number"
                name="retryInterval"
                value={formData.general.retryInterval}
                onChange={handleGeneralChange}
                className="w-full px-3 py-2 border rounded-md"
                min="1"
                max="72"
              />
            </div>
            <div className="md:col-span-2">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  name="autoCancelFailed"
                  checked={formData.general.autoCancelFailed}
                  onChange={handleGeneralChange}
                  className="mr-2"
                />
                <span className="text-gray-700 text-sm font-bold">
                  Automatically cancel failed payments
                </span>
              </label>
            </div>
          </div>
        </div>

        {/* Tax Settings */}
        <div className="border rounded-lg p-4">
          <h3 className="text-lg font-semibold mb-4">Tax Settings</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  name="enabled"
                  checked={formData.tax.enabled}
                  onChange={handleTaxChange}
                  className="mr-2"
                />
                <span className="text-gray-700 text-sm font-bold">
                  Enable tax calculation
                </span>
              </label>
            </div>
            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2">
                Tax Rate (%)
              </label>
              <input
                type="number"
                name="rate"
                value={formData.tax.rate}
                onChange={handleTaxChange}
                className="w-full px-3 py-2 border rounded-md"
                min="0"
                max="100"
                step="0.01"
              />
            </div>
            <div>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  name="inclusive"
                  checked={formData.tax.inclusive}
                  onChange={handleTaxChange}
                  className="mr-2"
                />
                <span className="text-gray-700 text-sm font-bold">
                  Tax inclusive pricing
                </span>
              </label>
            </div>
          </div>
        </div>

        {/* Fee Settings */}
        <div className="border rounded-lg p-4">
          <h3 className="text-lg font-semibold mb-4">Fee Settings</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  name="enabled"
                  checked={formData.fees.enabled}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      fees: {
                        ...prev.fees,
                        enabled: e.target.checked,
                      },
                    }))
                  }
                  className="mr-2"
                />
                <span className="text-gray-700 text-sm font-bold">
                  Enable processing fees
                </span>
              </label>
            </div>
            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2">
                Percentage Fee (%)
              </label>
              <input
                type="number"
                name="percentage"
                value={formData.fees.percentage}
                onChange={handleFeesChange}
                className="w-full px-3 py-2 border rounded-md"
                min="0"
                max="100"
                step="0.01"
              />
            </div>
            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2">
                Fixed Fee ($)
              </label>
              <input
                type="number"
                name="fixed"
                value={formData.fees.fixed}
                onChange={handleFeesChange}
                className="w-full px-3 py-2 border rounded-md"
                min="0"
                step="0.01"
              />
            </div>
            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2">
                Minimum Fee ($)
              </label>
              <input
                type="number"
                name="minimum"
                value={formData.fees.minimum}
                onChange={handleFeesChange}
                className="w-full px-3 py-2 border rounded-md"
                min="0"
                step="0.01"
              />
            </div>
            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2">
                Maximum Fee ($)
              </label>
              <input
                type="number"
                name="maximum"
                value={formData.fees.maximum}
                onChange={handleFeesChange}
                className="w-full px-3 py-2 border rounded-md"
                min="0"
                step="0.01"
              />
            </div>
          </div>
        </div>

        {/* Notification Settings */}
        <div className="border rounded-lg p-4">
          <h3 className="text-lg font-semibold mb-4">Notification Settings</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                name="paymentSuccess"
                checked={formData.notifications.paymentSuccess}
                onChange={handleNotificationChange}
                className="mr-2"
              />
              <span className="text-gray-700 text-sm font-bold">
                Payment Success
              </span>
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                name="paymentFailed"
                checked={formData.notifications.paymentFailed}
                onChange={handleNotificationChange}
                className="mr-2"
              />
              <span className="text-gray-700 text-sm font-bold">
                Payment Failed
              </span>
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                name="refundProcessed"
                checked={formData.notifications.refundProcessed}
                onChange={handleNotificationChange}
                className="mr-2"
              />
              <span className="text-gray-700 text-sm font-bold">
                Refund Processed
              </span>
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                name="subscriptionRenewal"
                checked={formData.notifications.subscriptionRenewal}
                onChange={handleNotificationChange}
                className="mr-2"
              />
              <span className="text-gray-700 text-sm font-bold">
                Subscription Renewal
              </span>
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                name="subscriptionCancelled"
                checked={formData.notifications.subscriptionCancelled}
                onChange={handleNotificationChange}
                className="mr-2"
              />
              <span className="text-gray-700 text-sm font-bold">
                Subscription Cancelled
              </span>
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                name="disputeOpened"
                checked={formData.notifications.disputeOpened}
                onChange={handleNotificationChange}
                className="mr-2"
              />
              <span className="text-gray-700 text-sm font-bold">
                Dispute Opened
              </span>
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                name="disputeResolved"
                checked={formData.notifications.disputeResolved}
                onChange={handleNotificationChange}
                className="mr-2"
              />
              <span className="text-gray-700 text-sm font-bold">
                Dispute Resolved
              </span>
            </label>
          </div>
        </div>

        {/* Policy Settings */}
        <div className="border rounded-lg p-4">
          <h3 className="text-lg font-semibold mb-4">Policy Settings</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2">
                Refund Period (days)
              </label>
              <input
                type="number"
                name="refundPeriod"
                value={formData.policies.refundPeriod}
                onChange={handlePolicyChange}
                className="w-full px-3 py-2 border rounded-md"
                min="0"
                max="90"
              />
            </div>
            <div>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  name="requireConfirmation"
                  checked={formData.policies.requireConfirmation}
                  onChange={handlePolicyChange}
                  className="mr-2"
                />
                <span className="text-gray-700 text-sm font-bold">
                  Require confirmation for refunds
                </span>
              </label>
            </div>
            <div>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  name="allowPartialRefunds"
                  checked={formData.policies.allowPartialRefunds}
                  onChange={handlePolicyChange}
                  className="mr-2"
                />
                <span className="text-gray-700 text-sm font-bold">
                  Allow partial refunds
                </span>
              </label>
            </div>
            <div>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  name="requireReason"
                  checked={formData.policies.requireReason}
                  onChange={handlePolicyChange}
                  className="mr-2"
                />
                <span className="text-gray-700 text-sm font-bold">
                  Require reason for refunds
                </span>
              </label>
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default PaymentSettings; 