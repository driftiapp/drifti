import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useAuth } from '../../contexts/AuthContext';

const PaymentRetry = () => {
  const [retrySettings, setRetrySettings] = useState({
    enabled: false,
    maxAttempts: 3,
    interval: 24,
    notifyCustomer: true,
    notifyAdmin: true,
    cancelAfterMaxAttempts: true,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [failedPayments, setFailedPayments] = useState([]);
  const { user } = useAuth();

  useEffect(() => {
    fetchRetrySettings();
    fetchFailedPayments();
  }, []);

  const fetchRetrySettings = async () => {
    try {
      const response = await axios.get('/api/payments/retry-settings', {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      });
      setRetrySettings(response.data);
    } catch (err) {
      setError('Failed to load retry settings');
      toast.error('Failed to load retry settings');
    } finally {
      setLoading(false);
    }
  };

  const fetchFailedPayments = async () => {
    try {
      const response = await axios.get('/api/payments/failed', {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      });
      setFailedPayments(response.data);
    } catch (err) {
      toast.error('Failed to load failed payments');
    }
  };

  const handleSettingChange = (setting) => {
    setRetrySettings((prev) => ({
      ...prev,
      [setting]: !prev[setting],
    }));
  };

  const handleNumberChange = (setting, value) => {
    setRetrySettings((prev) => ({
      ...prev,
      [setting]: parseInt(value),
    }));
  };

  const handleSaveSettings = async () => {
    setSaving(true);
    try {
      await axios.put('/api/payments/retry-settings', retrySettings, {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      });
      toast.success('Retry settings updated successfully');
    } catch (err) {
      setError('Failed to update retry settings');
      toast.error('Failed to update retry settings');
    } finally {
      setSaving(false);
    }
  };

  const handleRetryPayment = async (paymentId) => {
    try {
      await axios.post(
        `/api/payments/${paymentId}/retry`,
        {},
        {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        }
      );
      toast.success('Payment retry initiated');
      fetchFailedPayments();
    } catch (err) {
      toast.error('Failed to retry payment');
    }
  };

  const handleCancelRetry = async (paymentId) => {
    try {
      await axios.post(
        `/api/payments/${paymentId}/cancel-retry`,
        {},
        {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        }
      );
      toast.success('Payment retry cancelled');
      fetchFailedPayments();
    } catch (err) {
      toast.error('Failed to cancel payment retry');
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
      <h2 className="text-2xl font-bold mb-6">Payment Retry Settings</h2>

      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
          {error}
        </div>
      )}

      {/* Retry Settings Form */}
      <div className="mb-8">
        <div className="space-y-4">
          <div className="flex items-center">
            <input
              type="checkbox"
              id="enabled"
              checked={retrySettings.enabled}
              onChange={() => handleSettingChange('enabled')}
              className="h-4 w-4 text-blue-600 rounded border-gray-300"
            />
            <label htmlFor="enabled" className="ml-2 text-gray-700">
              Enable Automated Payment Retries
            </label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Maximum Retry Attempts
              </label>
              <input
                type="number"
                min="1"
                max="10"
                value={retrySettings.maxAttempts}
                onChange={(e) => handleNumberChange('maxAttempts', e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Retry Interval (hours)
              </label>
              <input
                type="number"
                min="1"
                max="168"
                value={retrySettings.interval}
                onChange={(e) => handleNumberChange('interval', e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="notifyCustomer"
                checked={retrySettings.notifyCustomer}
                onChange={() => handleSettingChange('notifyCustomer')}
                className="h-4 w-4 text-blue-600 rounded border-gray-300"
              />
              <label htmlFor="notifyCustomer" className="ml-2 text-gray-700">
                Notify Customer on Retry
              </label>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="notifyAdmin"
                checked={retrySettings.notifyAdmin}
                onChange={() => handleSettingChange('notifyAdmin')}
                className="h-4 w-4 text-blue-600 rounded border-gray-300"
              />
              <label htmlFor="notifyAdmin" className="ml-2 text-gray-700">
                Notify Admin on Retry
              </label>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="cancelAfterMaxAttempts"
                checked={retrySettings.cancelAfterMaxAttempts}
                onChange={() => handleSettingChange('cancelAfterMaxAttempts')}
                className="h-4 w-4 text-blue-600 rounded border-gray-300"
              />
              <label htmlFor="cancelAfterMaxAttempts" className="ml-2 text-gray-700">
                Cancel Payment After Max Attempts
              </label>
            </div>
          </div>

          <button
            onClick={handleSaveSettings}
            disabled={saving}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </div>

      {/* Failed Payments List */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Failed Payments</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Payment ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Retry Attempts
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {failedPayments.map((payment) => (
                <tr key={payment.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {payment.id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ${payment.amount.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {new Date(payment.date).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {payment.retryAttempts}/{retrySettings.maxAttempts}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        payment.status === 'pending_retry'
                          ? 'bg-yellow-100 text-yellow-800'
                          : payment.status === 'retry_scheduled'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {payment.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {payment.status === 'failed' && (
                      <button
                        onClick={() => handleRetryPayment(payment.id)}
                        className="text-blue-600 hover:text-blue-900 mr-3"
                      >
                        Retry
                      </button>
                    )}
                    {payment.status === 'retry_scheduled' && (
                      <button
                        onClick={() => handleCancelRetry(payment.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Cancel Retry
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default PaymentRetry; 