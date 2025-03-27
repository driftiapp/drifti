import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useAuth } from '../../contexts/AuthContext';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  ScatterChart,
  Scatter,
} from 'recharts';

const PaymentAnalyticsPredictive = () => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeframe, setTimeframe] = useState('30');
  const [cohortType, setCohortType] = useState('monthly');
  const [forecastPeriod, setForecastPeriod] = useState('90');
  const { user } = useAuth();

  useEffect(() => {
    fetchPredictiveAnalytics();
  }, [timeframe, cohortType, forecastPeriod]);

  const fetchPredictiveAnalytics = async () => {
    try {
      const response = await axios.get('/api/payments/analytics/predictive', {
        params: {
          timeframe,
          cohortType,
          forecastPeriod,
        },
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      });
      setAnalytics(response.data);
    } catch (err) {
      setError('Failed to load predictive analytics');
      toast.error('Failed to load predictive analytics');
    } finally {
      setLoading(false);
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
        <h2 className="text-2xl font-bold">Predictive Analytics</h2>
        <div className="flex space-x-4">
          <select
            value={timeframe}
            onChange={(e) => setTimeframe(e.target.value)}
            className="px-4 py-2 border rounded-md"
          >
            <option value="30">Last 30 Days</option>
            <option value="90">Last 90 Days</option>
            <option value="180">Last 180 Days</option>
            <option value="365">Last 12 Months</option>
          </select>
          <select
            value={cohortType}
            onChange={(e) => setCohortType(e.target.value)}
            className="px-4 py-2 border rounded-md"
          >
            <option value="monthly">Monthly Cohorts</option>
            <option value="quarterly">Quarterly Cohorts</option>
            <option value="yearly">Yearly Cohorts</option>
          </select>
          <select
            value={forecastPeriod}
            onChange={(e) => setForecastPeriod(e.target.value)}
            className="px-4 py-2 border rounded-md"
          >
            <option value="30">30 Days Forecast</option>
            <option value="90">90 Days Forecast</option>
            <option value="180">180 Days Forecast</option>
            <option value="365">1 Year Forecast</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
          {error}
        </div>
      )}

      {analytics && (
        <>
          {/* Key Predictive Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="text-sm font-medium text-blue-800">
                Predicted Revenue
              </h3>
              <p className="text-2xl font-bold text-blue-900">
                ${analytics.predictedRevenue.toFixed(2)}
              </p>
              <p className="text-sm text-blue-600">
                {analytics.revenueGrowth > 0 ? '+' : ''}
                {analytics.revenueGrowth}% vs previous period
              </p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <h3 className="text-sm font-medium text-green-800">
                Customer Lifetime Value
              </h3>
              <p className="text-2xl font-bold text-green-900">
                ${analytics.predictedLifetimeValue.toFixed(2)}
              </p>
              <p className="text-sm text-green-600">
                Based on {analytics.cohortSize} customers
              </p>
            </div>
            <div className="bg-yellow-50 p-4 rounded-lg">
              <h3 className="text-sm font-medium text-yellow-800">
                Churn Risk
              </h3>
              <p className="text-2xl font-bold text-yellow-900">
                {analytics.churnRisk}%
              </p>
              <p className="text-sm text-yellow-600">
                {analytics.churnRisk > 50 ? 'High' : 'Low'} risk
              </p>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <h3 className="text-sm font-medium text-purple-800">
                Customer Acquisition Cost
              </h3>
              <p className="text-2xl font-bold text-purple-900">
                ${analytics.acquisitionCost.toFixed(2)}
              </p>
              <p className="text-sm text-purple-600">
                ROI: {analytics.acquisitionROI}%
              </p>
            </div>
          </div>

          {/* Revenue Forecast */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="bg-white p-4 rounded-lg shadow">
              <h3 className="text-lg font-semibold mb-4">Revenue Forecast</h3>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={analytics.revenueForecast}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="actual"
                      stroke="#8884d8"
                      name="Actual"
                    />
                    <Line
                      type="monotone"
                      dataKey="predicted"
                      stroke="#82ca9d"
                      name="Predicted"
                      strokeDasharray="5 5"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Cohort Analysis */}
            <div className="bg-white p-4 rounded-lg shadow">
              <h3 className="text-lg font-semibold mb-4">Cohort Analysis</h3>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analytics.cohortAnalysis}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="cohort" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="retention" fill="#8884d8" name="Retention %" />
                    <Bar dataKey="revenue" fill="#82ca9d" name="Revenue" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Customer Behavior Analysis */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="bg-white p-4 rounded-lg shadow">
              <h3 className="text-lg font-semibold mb-4">
                Customer Behavior Patterns
              </h3>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <ScatterChart>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="frequency" name="Purchase Frequency" />
                    <YAxis dataKey="value" name="Order Value" />
                    <Tooltip />
                    <Legend />
                    <Scatter
                      data={analytics.customerBehavior}
                      fill="#8884d8"
                      name="Customer Segments"
                    />
                  </ScatterChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Churn Prediction */}
            <div className="bg-white p-4 rounded-lg shadow">
              <h3 className="text-lg font-semibold mb-4">Churn Prediction</h3>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={analytics.churnPrediction}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="risk"
                      stroke="#ff7300"
                      name="Churn Risk"
                    />
                    <Line
                      type="monotone"
                      dataKey="intervention"
                      stroke="#82ca9d"
                      name="After Intervention"
                      strokeDasharray="5 5"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Customer Segmentation */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-4 rounded-lg shadow">
              <h3 className="text-lg font-semibold mb-4">Customer Segments</h3>
              <div className="space-y-4">
                {analytics.customerSegments.map((segment) => (
                  <div
                    key={segment.name}
                    className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex justify-between items-center mb-2">
                      <h4 className="font-semibold">{segment.name}</h4>
                      <span className="text-sm text-gray-600">
                        {segment.size} customers
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <p className="text-gray-600">Average Value</p>
                        <p className="font-medium">${segment.avgValue}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Churn Risk</p>
                        <p className="font-medium">{segment.churnRisk}%</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recommendations */}
            <div className="bg-white p-4 rounded-lg shadow">
              <h3 className="text-lg font-semibold mb-4">AI Recommendations</h3>
              <div className="space-y-4">
                {analytics.recommendations.map((rec, index) => (
                  <div
                    key={index}
                    className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start">
                      <div
                        className={`w-2 h-2 rounded-full mt-2 mr-3 ${
                          rec.priority === 'high'
                            ? 'bg-red-500'
                            : rec.priority === 'medium'
                            ? 'bg-yellow-500'
                            : 'bg-green-500'
                        }`}
                      />
                      <div>
                        <h4 className="font-semibold">{rec.title}</h4>
                        <p className="text-sm text-gray-600 mt-1">
                          {rec.description}
                        </p>
                        <p className="text-sm text-gray-500 mt-2">
                          Expected Impact: {rec.impact}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default PaymentAnalyticsPredictive; 