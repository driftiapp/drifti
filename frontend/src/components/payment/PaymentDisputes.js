import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useAuth } from '../../contexts/AuthContext';
import { format } from 'date-fns';

const PaymentDisputes = () => {
  const [disputes, setDisputes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedDispute, setSelectedDispute] = useState(null);
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [showResponseModal, setShowResponseModal] = useState(false);
  const [filters, setFilters] = useState({
    status: 'all',
    dateRange: 'all',
    search: '',
  });
  const { user } = useAuth();

  const [refundForm, setRefundForm] = useState({
    amount: '',
    reason: '',
    notes: '',
  });

  const [responseForm, setResponseForm] = useState({
    response: '',
    evidence: null,
  });

  useEffect(() => {
    fetchDisputes();
  }, [filters]);

  const fetchDisputes = async () => {
    try {
      const response = await axios.get('/api/payments/disputes', {
        params: filters,
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      });
      setDisputes(response.data);
    } catch (err) {
      setError('Failed to load disputes');
      toast.error('Failed to load disputes');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const handleSearch = (e) => {
    setFilters((prev) => ({ ...prev, search: e.target.value }));
  };

  const handleRefundSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(
        `/api/payments/disputes/${selectedDispute.id}/refund`,
        refundForm,
        {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        }
      );
      toast.success('Refund processed successfully');
      setShowRefundModal(false);
      fetchDisputes();
    } catch (err) {
      toast.error('Failed to process refund');
    }
  };

  const handleResponseSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('response', responseForm.response);
    if (responseForm.evidence) {
      formData.append('evidence', responseForm.evidence);
    }

    try {
      await axios.post(
        `/api/payments/disputes/${selectedDispute.id}/respond`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${user.token}`,
            'Content-Type': 'multipart/form-data',
          },
        }
      );
      toast.success('Response submitted successfully');
      setShowResponseModal(false);
      fetchDisputes();
    } catch (err) {
      toast.error('Failed to submit response');
    }
  };

  const handleEvidenceChange = (e) => {
    setResponseForm((prev) => ({
      ...prev,
      evidence: e.target.files[0],
    }));
  };

  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case 'open':
        return 'bg-yellow-100 text-yellow-800';
      case 'under_review':
        return 'bg-blue-100 text-blue-800';
      case 'resolved':
        return 'bg-green-100 text-green-800';
      case 'closed':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
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
        <h2 className="text-2xl font-bold">Payment Disputes</h2>
        <div className="flex space-x-4">
          <input
            type="text"
            placeholder="Search disputes..."
            value={filters.search}
            onChange={handleSearch}
            className="px-4 py-2 border rounded-md"
          />
          <select
            name="status"
            value={filters.status}
            onChange={handleFilterChange}
            className="px-4 py-2 border rounded-md"
          >
            <option value="all">All Status</option>
            <option value="open">Open</option>
            <option value="under_review">Under Review</option>
            <option value="resolved">Resolved</option>
            <option value="closed">Closed</option>
          </select>
          <select
            name="dateRange"
            value={filters.dateRange}
            onChange={handleFilterChange}
            className="px-4 py-2 border rounded-md"
          >
            <option value="all">All Time</option>
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
          {error}
        </div>
      )}

      <div className="space-y-4">
        {disputes.map((dispute) => (
          <div
            key={dispute.id}
            className="border rounded-lg p-4 hover:shadow-md transition-shadow"
          >
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-semibold">
                  Dispute #{dispute.id}
                </h3>
                <p className="text-gray-600">
                  Amount: ${dispute.amount.toFixed(2)}
                </p>
              </div>
              <span
                className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
                  dispute.status
                )}`}
              >
                {dispute.status.replace('_', ' ')}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <p className="text-sm text-gray-600">Created</p>
                <p className="font-medium">
                  {format(new Date(dispute.date), 'MMM d, yyyy HH:mm')}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Reason</p>
                <p className="font-medium">{dispute.reason}</p>
              </div>
            </div>

            {dispute.customerResponse && (
              <div className="mb-4">
                <p className="text-sm text-gray-600">Customer Response</p>
                <p className="font-medium">{dispute.customerResponse}</p>
              </div>
            )}

            <div className="flex justify-end space-x-4">
              {dispute.status === 'open' && (
                <>
                  <button
                    onClick={() => {
                      setSelectedDispute(dispute);
                      setShowResponseModal(true);
                    }}
                    className="px-4 py-2 text-green-600 hover:text-green-800"
                  >
                    Respond
                  </button>
                  <button
                    onClick={() => {
                      setSelectedDispute(dispute);
                      setShowRefundModal(true);
                    }}
                    className="px-4 py-2 text-blue-600 hover:text-blue-800"
                  >
                    Process Refund
                  </button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Refund Modal */}
      {showRefundModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-xl font-bold mb-4">Process Refund</h3>
            <form onSubmit={handleRefundSubmit} className="space-y-4">
              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Amount
                </label>
                <input
                  type="number"
                  value={refundForm.amount}
                  onChange={(e) =>
                    setRefundForm({ ...refundForm, amount: e.target.value })
                  }
                  className="w-full px-3 py-2 border rounded-md"
                  required
                  min="0"
                  max={selectedDispute.amount}
                  step="0.01"
                />
              </div>
              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Reason
                </label>
                <select
                  value={refundForm.reason}
                  onChange={(e) =>
                    setRefundForm({ ...refundForm, reason: e.target.value })
                  }
                  className="w-full px-3 py-2 border rounded-md"
                  required
                >
                  <option value="">Select a reason</option>
                  <option value="customer_request">Customer Request</option>
                  <option value="duplicate_charge">Duplicate Charge</option>
                  <option value="fraudulent">Fraudulent</option>
                  <option value="product_not_received">Product Not Received</option>
                  <option value="quality_issue">Quality Issue</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Notes
                </label>
                <textarea
                  value={refundForm.notes}
                  onChange={(e) =>
                    setRefundForm({ ...refundForm, notes: e.target.value })
                  }
                  className="w-full px-3 py-2 border rounded-md"
                  rows="3"
                />
              </div>
              <div className="flex justify-end space-x-4">
                <button
                  type="button"
                  onClick={() => setShowRefundModal(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Process Refund
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Response Modal */}
      {showResponseModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-xl font-bold mb-4">Respond to Dispute</h3>
            <form onSubmit={handleResponseSubmit} className="space-y-4">
              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Response
                </label>
                <textarea
                  value={responseForm.response}
                  onChange={(e) =>
                    setResponseForm({ ...responseForm, response: e.target.value })
                  }
                  className="w-full px-3 py-2 border rounded-md"
                  rows="4"
                  required
                />
              </div>
              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Evidence
                </label>
                <input
                  type="file"
                  onChange={handleEvidenceChange}
                  className="w-full px-3 py-2 border rounded-md"
                  accept=".pdf,.jpg,.jpeg,.png"
                />
              </div>
              <div className="flex justify-end space-x-4">
                <button
                  type="button"
                  onClick={() => setShowResponseModal(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                >
                  Submit Response
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentDisputes; 