import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useAuth } from '../../contexts/AuthContext';

const PaymentWebhooks = () => {
  const [webhooks, setWebhooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedWebhook, setSelectedWebhook] = useState(null);
  const [webhookForm, setWebhookForm] = useState({
    url: '',
    events: [],
    secret: '',
    isActive: true,
  });
  const { user } = useAuth();

  const webhookEvents = [
    'payment.succeeded',
    'payment.failed',
    'payment.refunded',
    'subscription.created',
    'subscription.updated',
    'subscription.cancelled',
    'dispute.created',
    'dispute.updated',
    'dispute.closed',
  ];

  useEffect(() => {
    fetchWebhooks();
  }, []);

  const fetchWebhooks = async () => {
    try {
      const response = await axios.get('/api/payments/webhooks', {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      });
      setWebhooks(response.data);
    } catch (err) {
      setError('Failed to load webhooks');
      toast.error('Failed to load webhooks');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/api/payments/webhooks', webhookForm, {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      });
      toast.success('Webhook created successfully');
      setShowCreateModal(false);
      fetchWebhooks();
    } catch (err) {
      toast.error('Failed to create webhook');
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.put(
        `/api/payments/webhooks/${selectedWebhook.id}`,
        webhookForm,
        {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        }
      );
      toast.success('Webhook updated successfully');
      setShowEditModal(false);
      fetchWebhooks();
    } catch (err) {
      toast.error('Failed to update webhook');
    }
  };

  const handleDeleteWebhook = async (webhookId) => {
    if (window.confirm('Are you sure you want to delete this webhook?')) {
      try {
        await axios.delete(`/api/payments/webhooks/${webhookId}`, {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        });
        toast.success('Webhook deleted successfully');
        fetchWebhooks();
      } catch (err) {
        toast.error('Failed to delete webhook');
      }
    }
  };

  const handleEventToggle = (event) => {
    setWebhookForm((prev) => ({
      ...prev,
      events: prev.events.includes(event)
        ? prev.events.filter((e) => e !== event)
        : [...prev.events, event],
    }));
  };

  const handleEditClick = (webhook) => {
    setSelectedWebhook(webhook);
    setWebhookForm({
      url: webhook.url,
      events: [...webhook.events],
      secret: webhook.secret,
      isActive: webhook.isActive,
    });
    setShowEditModal(true);
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
        <h2 className="text-2xl font-bold">Payment Webhooks</h2>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Create Webhook
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
          {error}
        </div>
      )}

      {/* Webhooks List */}
      <div className="space-y-4">
        {webhooks.map((webhook) => (
          <div
            key={webhook.id}
            className="border rounded-lg p-4 hover:shadow-md transition-shadow"
          >
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-semibold">{webhook.url}</h3>
                <p className="text-sm text-gray-600">
                  {webhook.events.length} events configured
                </p>
              </div>
              <span
                className={`px-3 py-1 rounded-full text-sm font-medium ${
                  webhook.isActive
                    ? 'bg-green-100 text-green-800'
                    : 'bg-gray-100 text-gray-800'
                }`}
              >
                {webhook.isActive ? 'Active' : 'Inactive'}
              </span>
            </div>

            <div className="mb-4">
              <h4 className="text-sm font-medium text-gray-700 mb-2">
                Events
              </h4>
              <div className="flex flex-wrap gap-2">
                {webhook.events.map((event) => (
                  <span
                    key={event}
                    className="px-2 py-1 bg-blue-100 text-blue-800 rounded-md text-sm"
                  >
                    {event}
                  </span>
                ))}
              </div>
            </div>

            <div className="flex justify-end space-x-4">
              <button
                onClick={() => handleEditClick(webhook)}
                className="text-blue-600 hover:text-blue-800"
              >
                Edit
              </button>
              <button
                onClick={() => handleDeleteWebhook(webhook.id)}
                className="text-red-600 hover:text-red-800"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Create Webhook Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-xl font-bold mb-4">Create Webhook</h3>
            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Webhook URL
                </label>
                <input
                  type="url"
                  value={webhookForm.url}
                  onChange={(e) =>
                    setWebhookForm({ ...webhookForm, url: e.target.value })
                  }
                  className="w-full px-3 py-2 border rounded-md"
                  required
                  placeholder="https://your-domain.com/webhook"
                />
              </div>
              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Secret Key
                </label>
                <input
                  type="text"
                  value={webhookForm.secret}
                  onChange={(e) =>
                    setWebhookForm({ ...webhookForm, secret: e.target.value })
                  }
                  className="w-full px-3 py-2 border rounded-md"
                  required
                  placeholder="Enter a secret key for webhook signature"
                />
              </div>
              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Events
                </label>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {webhookEvents.map((event) => (
                    <label key={event} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={webhookForm.events.includes(event)}
                        onChange={() => handleEventToggle(event)}
                        className="mr-2"
                      />
                      <span className="text-sm text-gray-700">{event}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={webhookForm.isActive}
                  onChange={(e) =>
                    setWebhookForm({
                      ...webhookForm,
                      isActive: e.target.checked,
                    })
                  }
                  className="mr-2"
                />
                <label className="text-gray-700 text-sm font-bold">
                  Active
                </label>
              </div>
              <div className="flex justify-end space-x-4">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Create Webhook
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Webhook Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-xl font-bold mb-4">Edit Webhook</h3>
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Webhook URL
                </label>
                <input
                  type="url"
                  value={webhookForm.url}
                  onChange={(e) =>
                    setWebhookForm({ ...webhookForm, url: e.target.value })
                  }
                  className="w-full px-3 py-2 border rounded-md"
                  required
                />
              </div>
              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Secret Key
                </label>
                <input
                  type="text"
                  value={webhookForm.secret}
                  onChange={(e) =>
                    setWebhookForm({ ...webhookForm, secret: e.target.value })
                  }
                  className="w-full px-3 py-2 border rounded-md"
                  required
                />
              </div>
              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Events
                </label>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {webhookEvents.map((event) => (
                    <label key={event} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={webhookForm.events.includes(event)}
                        onChange={() => handleEventToggle(event)}
                        className="mr-2"
                      />
                      <span className="text-sm text-gray-700">{event}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={webhookForm.isActive}
                  onChange={(e) =>
                    setWebhookForm({
                      ...webhookForm,
                      isActive: e.target.checked,
                    })
                  }
                  className="mr-2"
                />
                <label className="text-gray-700 text-sm font-bold">
                  Active
                </label>
              </div>
              <div className="flex justify-end space-x-4">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Update Webhook
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentWebhooks; 