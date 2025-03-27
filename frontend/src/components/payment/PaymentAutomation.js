import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useAuth } from '../../contexts/AuthContext';

const PaymentAutomation = () => {
  const [automationRules, setAutomationRules] = useState([]);
  const [retrySettings, setRetrySettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreateRuleModal, setShowCreateRuleModal] = useState(false);
  const [showEditRuleModal, setShowEditRuleModal] = useState(false);
  const [selectedRule, setSelectedRule] = useState(null);
  const { user } = useAuth();

  const [ruleForm, setRuleForm] = useState({
    name: '',
    description: '',
    conditions: [],
    actions: [],
    isActive: true,
    priority: 'medium',
  });

  useEffect(() => {
    fetchAutomationData();
  }, []);

  const fetchAutomationData = async () => {
    try {
      const [rulesResponse, settingsResponse] = await Promise.all([
        axios.get('/api/payments/automation/rules', {
          headers: { Authorization: `Bearer ${user.token}` },
        }),
        axios.get('/api/payments/automation/retry-settings', {
          headers: { Authorization: `Bearer ${user.token}` },
        }),
      ]);
      setAutomationRules(rulesResponse.data);
      setRetrySettings(settingsResponse.data);
    } catch (err) {
      setError('Failed to load automation data');
      toast.error('Failed to load automation data');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRule = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/api/payments/automation/rules', ruleForm, {
        headers: { Authorization: `Bearer ${user.token}` },
      });
      toast.success('Automation rule created successfully');
      setShowCreateRuleModal(false);
      fetchAutomationData();
    } catch (err) {
      toast.error('Failed to create automation rule');
    }
  };

  const handleUpdateRule = async (e) => {
    e.preventDefault();
    try {
      await axios.put(
        `/api/payments/automation/rules/${selectedRule.id}`,
        ruleForm,
        {
          headers: { Authorization: `Bearer ${user.token}` },
        }
      );
      toast.success('Automation rule updated successfully');
      setShowEditRuleModal(false);
      fetchAutomationData();
    } catch (err) {
      toast.error('Failed to update automation rule');
    }
  };

  const handleDeleteRule = async (ruleId) => {
    if (window.confirm('Are you sure you want to delete this automation rule?')) {
      try {
        await axios.delete(`/api/payments/automation/rules/${ruleId}`, {
          headers: { Authorization: `Bearer ${user.token}` },
        });
        toast.success('Automation rule deleted successfully');
        fetchAutomationData();
      } catch (err) {
        toast.error('Failed to delete automation rule');
      }
    }
  };

  const handleUpdateRetrySettings = async (e) => {
    e.preventDefault();
    try {
      await axios.put(
        '/api/payments/automation/retry-settings',
        retrySettings,
        {
          headers: { Authorization: `Bearer ${user.token}` },
        }
      );
      toast.success('Retry settings updated successfully');
      fetchAutomationData();
    } catch (err) {
      toast.error('Failed to update retry settings');
    }
  };

  const handleAddCondition = () => {
    setRuleForm((prev) => ({
      ...prev,
      conditions: [
        ...prev.conditions,
        { field: '', operator: '', value: '' },
      ],
    }));
  };

  const handleAddAction = () => {
    setRuleForm((prev) => ({
      ...prev,
      actions: [...prev.actions, { type: '', parameters: {} }],
    }));
  };

  const handleConditionChange = (index, field, value) => {
    setRuleForm((prev) => ({
      ...prev,
      conditions: prev.conditions.map((condition, i) =>
        i === index ? { ...condition, [field]: value } : condition
      ),
    }));
  };

  const handleActionChange = (index, field, value) => {
    setRuleForm((prev) => ({
      ...prev,
      actions: prev.actions.map((action, i) =>
        i === index ? { ...action, [field]: value } : action
      ),
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
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Payment Automation</h2>
        <button
          onClick={() => setShowCreateRuleModal(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Create Automation Rule
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
          {error}
        </div>
      )}

      {/* Retry Settings */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold mb-4">Retry Settings</h3>
        <form onSubmit={handleUpdateRetrySettings} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Enable Automatic Retries
              </label>
              <input
                type="checkbox"
                checked={retrySettings.enabled}
                onChange={(e) =>
                  setRetrySettings({
                    ...retrySettings,
                    enabled: e.target.checked,
                  })
                }
                className="h-4 w-4 text-blue-600"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Maximum Retry Attempts
              </label>
              <input
                type="number"
                value={retrySettings.maxAttempts}
                onChange={(e) =>
                  setRetrySettings({
                    ...retrySettings,
                    maxAttempts: parseInt(e.target.value),
                  })
                }
                className="w-full px-3 py-2 border rounded-md"
                min="1"
                max="10"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Retry Interval (hours)
              </label>
              <input
                type="number"
                value={retrySettings.interval}
                onChange={(e) =>
                  setRetrySettings({
                    ...retrySettings,
                    interval: parseInt(e.target.value),
                  })
                }
                className="w-full px-3 py-2 border rounded-md"
                min="1"
                max="168"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Maximum Amount for Retry
              </label>
              <input
                type="number"
                value={retrySettings.maxAmount}
                onChange={(e) =>
                  setRetrySettings({
                    ...retrySettings,
                    maxAmount: parseFloat(e.target.value),
                  })
                }
                className="w-full px-3 py-2 border rounded-md"
                min="0"
                step="0.01"
              />
            </div>
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
          >
            Update Retry Settings
          </button>
        </form>
      </div>

      {/* Automation Rules */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Automation Rules</h3>
        <div className="space-y-4">
          {automationRules.map((rule) => (
            <div
              key={rule.id}
              className="border rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h4 className="text-lg font-semibold">{rule.name}</h4>
                  <p className="text-gray-600">{rule.description}</p>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-sm font-medium ${
                    rule.isActive
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {rule.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>

              <div className="mb-4">
                <h5 className="text-sm font-medium text-gray-700 mb-2">
                  Conditions
                </h5>
                <div className="space-y-2">
                  {rule.conditions.map((condition, index) => (
                    <div
                      key={index}
                      className="flex items-center space-x-2 text-sm"
                    >
                      <span className="font-medium">{condition.field}</span>
                      <span>{condition.operator}</span>
                      <span>{condition.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mb-4">
                <h5 className="text-sm font-medium text-gray-700 mb-2">
                  Actions
                </h5>
                <div className="space-y-2">
                  {rule.actions.map((action, index) => (
                    <div
                      key={index}
                      className="flex items-center space-x-2 text-sm"
                    >
                      <span className="font-medium">{action.type}</span>
                      <span>
                        {Object.entries(action.parameters)
                          .map(([key, value]) => `${key}: ${value}`)
                          .join(', ')}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end space-x-4">
                <button
                  onClick={() => {
                    setSelectedRule(rule);
                    setRuleForm({
                      name: rule.name,
                      description: rule.description,
                      conditions: [...rule.conditions],
                      actions: [...rule.actions],
                      isActive: rule.isActive,
                      priority: rule.priority,
                    });
                    setShowEditRuleModal(true);
                  }}
                  className="text-blue-600 hover:text-blue-800"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDeleteRule(rule.id)}
                  className="text-red-600 hover:text-red-800"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Create Rule Modal */}
      {showCreateRuleModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full">
            <h3 className="text-xl font-bold mb-4">Create Automation Rule</h3>
            <form onSubmit={handleCreateRule} className="space-y-4">
              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Rule Name
                </label>
                <input
                  type="text"
                  value={ruleForm.name}
                  onChange={(e) =>
                    setRuleForm({ ...ruleForm, name: e.target.value })
                  }
                  className="w-full px-3 py-2 border rounded-md"
                  required
                />
              </div>
              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Description
                </label>
                <textarea
                  value={ruleForm.description}
                  onChange={(e) =>
                    setRuleForm({ ...ruleForm, description: e.target.value })
                  }
                  className="w-full px-3 py-2 border rounded-md"
                  rows="3"
                  required
                />
              </div>

              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Conditions
                </label>
                <div className="space-y-2">
                  {ruleForm.conditions.map((condition, index) => (
                    <div key={index} className="flex space-x-2">
                      <select
                        value={condition.field}
                        onChange={(e) =>
                          handleConditionChange(index, 'field', e.target.value)
                        }
                        className="px-3 py-2 border rounded-md"
                      >
                        <option value="">Select Field</option>
                        <option value="amount">Amount</option>
                        <option value="status">Status</option>
                        <option value="payment_method">Payment Method</option>
                        <option value="customer_type">Customer Type</option>
                      </select>
                      <select
                        value={condition.operator}
                        onChange={(e) =>
                          handleConditionChange(index, 'operator', e.target.value)
                        }
                        className="px-3 py-2 border rounded-md"
                      >
                        <option value="">Select Operator</option>
                        <option value="equals">Equals</option>
                        <option value="not_equals">Not Equals</option>
                        <option value="greater_than">Greater Than</option>
                        <option value="less_than">Less Than</option>
                        <option value="contains">Contains</option>
                      </select>
                      <input
                        type="text"
                        value={condition.value}
                        onChange={(e) =>
                          handleConditionChange(index, 'value', e.target.value)
                        }
                        className="px-3 py-2 border rounded-md"
                        placeholder="Value"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setRuleForm((prev) => ({
                            ...prev,
                            conditions: prev.conditions.filter((_, i) => i !== index),
                          }))
                        }
                        className="px-3 py-2 text-red-600 hover:text-red-800"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={handleAddCondition}
                    className="px-4 py-2 text-blue-600 hover:text-blue-800"
                  >
                    Add Condition
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Actions
                </label>
                <div className="space-y-2">
                  {ruleForm.actions.map((action, index) => (
                    <div key={index} className="flex space-x-2">
                      <select
                        value={action.type}
                        onChange={(e) =>
                          handleActionChange(index, 'type', e.target.value)
                        }
                        className="px-3 py-2 border rounded-md"
                      >
                        <option value="">Select Action</option>
                        <option value="retry_payment">Retry Payment</option>
                        <option value="send_notification">Send Notification</option>
                        <option value="update_status">Update Status</option>
                        <option value="apply_discount">Apply Discount</option>
                      </select>
                      <input
                        type="text"
                        value={action.parameters}
                        onChange={(e) =>
                          handleActionChange(index, 'parameters', e.target.value)
                        }
                        className="px-3 py-2 border rounded-md"
                        placeholder="Parameters (JSON)"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setRuleForm((prev) => ({
                            ...prev,
                            actions: prev.actions.filter((_, i) => i !== index),
                          }))
                        }
                        className="px-3 py-2 text-red-600 hover:text-red-800"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={handleAddAction}
                    className="px-4 py-2 text-blue-600 hover:text-blue-800"
                  >
                    Add Action
                  </button>
                </div>
              </div>

              <div className="flex items-center space-x-4">
                <div>
                  <label className="block text-gray-700 text-sm font-bold mb-2">
                    Priority
                  </label>
                  <select
                    value={ruleForm.priority}
                    onChange={(e) =>
                      setRuleForm({ ...ruleForm, priority: e.target.value })
                    }
                    className="px-3 py-2 border rounded-md"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={ruleForm.isActive}
                    onChange={(e) =>
                      setRuleForm({ ...ruleForm, isActive: e.target.checked })
                    }
                    className="h-4 w-4 text-blue-600"
                  />
                  <label className="ml-2 text-gray-700 text-sm font-bold">
                    Active
                  </label>
                </div>
              </div>

              <div className="flex justify-end space-x-4">
                <button
                  type="button"
                  onClick={() => setShowCreateRuleModal(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Create Rule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Rule Modal */}
      {showEditRuleModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full">
            <h3 className="text-xl font-bold mb-4">Edit Automation Rule</h3>
            <form onSubmit={handleUpdateRule} className="space-y-4">
              {/* Same form fields as Create Rule Modal */}
              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Rule Name
                </label>
                <input
                  type="text"
                  value={ruleForm.name}
                  onChange={(e) =>
                    setRuleForm({ ...ruleForm, name: e.target.value })
                  }
                  className="w-full px-3 py-2 border rounded-md"
                  required
                />
              </div>
              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Description
                </label>
                <textarea
                  value={ruleForm.description}
                  onChange={(e) =>
                    setRuleForm({ ...ruleForm, description: e.target.value })
                  }
                  className="w-full px-3 py-2 border rounded-md"
                  rows="3"
                  required
                />
              </div>

              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Conditions
                </label>
                <div className="space-y-2">
                  {ruleForm.conditions.map((condition, index) => (
                    <div key={index} className="flex space-x-2">
                      <select
                        value={condition.field}
                        onChange={(e) =>
                          handleConditionChange(index, 'field', e.target.value)
                        }
                        className="px-3 py-2 border rounded-md"
                      >
                        <option value="">Select Field</option>
                        <option value="amount">Amount</option>
                        <option value="status">Status</option>
                        <option value="payment_method">Payment Method</option>
                        <option value="customer_type">Customer Type</option>
                      </select>
                      <select
                        value={condition.operator}
                        onChange={(e) =>
                          handleConditionChange(index, 'operator', e.target.value)
                        }
                        className="px-3 py-2 border rounded-md"
                      >
                        <option value="">Select Operator</option>
                        <option value="equals">Equals</option>
                        <option value="not_equals">Not Equals</option>
                        <option value="greater_than">Greater Than</option>
                        <option value="less_than">Less Than</option>
                        <option value="contains">Contains</option>
                      </select>
                      <input
                        type="text"
                        value={condition.value}
                        onChange={(e) =>
                          handleConditionChange(index, 'value', e.target.value)
                        }
                        className="px-3 py-2 border rounded-md"
                        placeholder="Value"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setRuleForm((prev) => ({
                            ...prev,
                            conditions: prev.conditions.filter((_, i) => i !== index),
                          }))
                        }
                        className="px-3 py-2 text-red-600 hover:text-red-800"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={handleAddCondition}
                    className="px-4 py-2 text-blue-600 hover:text-blue-800"
                  >
                    Add Condition
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Actions
                </label>
                <div className="space-y-2">
                  {ruleForm.actions.map((action, index) => (
                    <div key={index} className="flex space-x-2">
                      <select
                        value={action.type}
                        onChange={(e) =>
                          handleActionChange(index, 'type', e.target.value)
                        }
                        className="px-3 py-2 border rounded-md"
                      >
                        <option value="">Select Action</option>
                        <option value="retry_payment">Retry Payment</option>
                        <option value="send_notification">Send Notification</option>
                        <option value="update_status">Update Status</option>
                        <option value="apply_discount">Apply Discount</option>
                      </select>
                      <input
                        type="text"
                        value={action.parameters}
                        onChange={(e) =>
                          handleActionChange(index, 'parameters', e.target.value)
                        }
                        className="px-3 py-2 border rounded-md"
                        placeholder="Parameters (JSON)"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setRuleForm((prev) => ({
                            ...prev,
                            actions: prev.actions.filter((_, i) => i !== index),
                          }))
                        }
                        className="px-3 py-2 text-red-600 hover:text-red-800"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={handleAddAction}
                    className="px-4 py-2 text-blue-600 hover:text-blue-800"
                  >
                    Add Action
                  </button>
                </div>
              </div>

              <div className="flex items-center space-x-4">
                <div>
                  <label className="block text-gray-700 text-sm font-bold mb-2">
                    Priority
                  </label>
                  <select
                    value={ruleForm.priority}
                    onChange={(e) =>
                      setRuleForm({ ...ruleForm, priority: e.target.value })
                    }
                    className="px-3 py-2 border rounded-md"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={ruleForm.isActive}
                    onChange={(e) =>
                      setRuleForm({ ...ruleForm, isActive: e.target.checked })
                    }
                    className="h-4 w-4 text-blue-600"
                  />
                  <label className="ml-2 text-gray-700 text-sm font-bold">
                    Active
                  </label>
                </div>
              </div>

              <div className="flex justify-end space-x-4">
                <button
                  type="button"
                  onClick={() => setShowEditRuleModal(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Update Rule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentAutomation; 