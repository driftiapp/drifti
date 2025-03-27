import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useAuth } from '../../contexts/AuthContext';
import { format } from 'date-fns';
import { io } from 'socket.io-client';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  AreaChart,
  Area,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Treemap,
  Cell,
  ComposedChart,
  FunnelChart,
  Funnel,
  Sankey,
  SankeyLink,
  SankeyNode,
  HeatmapChart,
  Heatmap,
  SunburstChart,
  Sunburst,
  ChordChart,
  Chord,
} from 'recharts';

const PaymentReporting = () => {
  const [scheduledReports, setScheduledReports] = useState([]);
  const [customReports, setCustomReports] = useState([]);
  const [reportTemplates, setReportTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showCustomReportModal, setShowCustomReportModal] = useState(false);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  const [previewData, setPreviewData] = useState(null);
  const { user } = useAuth();

  const [scheduleForm, setScheduleForm] = useState({
    name: '',
    description: '',
    reportType: '',
    frequency: 'daily',
    recipients: [],
    format: 'pdf',
    parameters: {},
    visualization: 'table',
  });

  const [customReportForm, setCustomReportForm] = useState({
    name: '',
    description: '',
    metrics: [],
    filters: [],
    grouping: [],
    format: 'pdf',
    visualization: 'table',
    template: '',
  });

  const [templateForm, setTemplateForm] = useState({
    name: '',
    description: '',
    metrics: [],
    filters: [],
    grouping: [],
    visualization: 'table',
  });

  const [shareForm, setShareForm] = useState({
    recipients: [],
    accessLevel: 'view',
    expiryDate: '',
    message: '',
  });

  const [showComparisonModal, setShowComparisonModal] = useState(false);
  const [showVersionModal, setShowVersionModal] = useState(false);
  const [selectedReports, setSelectedReports] = useState([]);
  const [reportVersions, setReportVersions] = useState([]);
  const [comparisonData, setComparisonData] = useState(null);
  const [showAdvancedScheduleModal, setShowAdvancedScheduleModal] = useState(false);
  const [showTemplateComparisonModal, setShowTemplateComparisonModal] = useState(false);
  const [showCollaborationModal, setShowCollaborationModal] = useState(false);
  const [showArchiveRulesModal, setShowArchiveRulesModal] = useState(false);
  const [advancedSchedule, setAdvancedSchedule] = useState({
    conditions: [],
    actions: [],
    notifications: [],
  });
  const [templateComparison, setTemplateComparison] = useState({
    selectedVersions: [],
    differences: [],
  });
  const [collaborationSettings, setCollaborationSettings] = useState({
    collaborators: [],
    permissions: {},
    comments: [],
  });
  const [archiveRules, setArchiveRules] = useState({
    rules: [],
    retention: {},
  });
  const [socket, setSocket] = useState(null);
  const [realTimeData, setRealTimeData] = useState({
    sales: [],
    deposits: [],
    predictions: {},
    alerts: [],
  });
  const [showAIPredictionsModal, setShowAIPredictionsModal] = useState(false);
  const [showAutomatedReportsModal, setShowAutomatedReportsModal] = useState(false);
  const [aiPredictions, setAIPredictions] = useState({
    expectedDeposits: [],
    salesForecast: [],
    riskAnalysis: [],
    productPredictions: [],
  });
  const [automatedReports, setAutomatedReports] = useState({
    schedules: [],
    recipients: [],
    channels: [],
  });

  useEffect(() => {
    fetchReports();
    fetchTemplates();
    // Initialize Socket.IO connection
    const newSocket = io(process.env.REACT_APP_SOCKET_URL, {
      auth: { token: user.token },
    });

    newSocket.on('connect', () => {
      console.log('Connected to real-time updates');
    });

    newSocket.on('sales_update', (data) => {
      setRealTimeData((prev) => ({
        ...prev,
        sales: [...prev.sales, data],
      }));
    });

    newSocket.on('deposit_update', (data) => {
      setRealTimeData((prev) => ({
        ...prev,
        deposits: [...prev.deposits, data],
      }));
    });

    newSocket.on('ai_prediction', (data) => {
      setRealTimeData((prev) => ({
        ...prev,
        predictions: data,
      }));
    });

    newSocket.on('alert', (data) => {
      setRealTimeData((prev) => ({
        ...prev,
        alerts: [...prev.alerts, data],
      }));
      toast.info(data.message);
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, [user.token]);

  const fetchReports = async () => {
    try {
      const [scheduledResponse, customResponse] = await Promise.all([
        axios.get('/api/payments/reports/scheduled', {
          headers: { Authorization: `Bearer ${user.token}` },
        }),
        axios.get('/api/payments/reports/custom', {
          headers: { Authorization: `Bearer ${user.token}` },
        }),
      ]);
      setScheduledReports(scheduledResponse.data);
      setCustomReports(customResponse.data);
    } catch (err) {
      setError('Failed to load reports');
      toast.error('Failed to load reports');
    } finally {
      setLoading(false);
    }
  };

  const fetchTemplates = async () => {
    try {
      const response = await axios.get('/api/payments/reports/templates', {
        headers: { Authorization: `Bearer ${user.token}` },
      });
      setReportTemplates(response.data);
    } catch (err) {
      toast.error('Failed to load report templates');
    }
  };

  const handleScheduleReport = async (e) => {
    e.preventDefault();
    try {
      const scheduleData = {
        ...scheduleForm,
        schedule: {
          frequency: scheduleForm.frequency,
          interval: scheduleForm.interval,
          daysOfWeek: scheduleForm.daysOfWeek,
          timeOfDay: scheduleForm.timeOfDay,
          timezone: scheduleForm.timezone,
          startDate: scheduleForm.startDate,
          endDate: scheduleForm.endDate,
          customCron: scheduleForm.customCron,
        },
      };
      await axios.post('/api/payments/reports/schedule', scheduleData, {
        headers: { Authorization: `Bearer ${user.token}` },
      });
      toast.success('Report scheduled successfully');
      setShowScheduleModal(false);
      fetchReports();
    } catch (err) {
      toast.error('Failed to schedule report');
    }
  };

  const handleCreateCustomReport = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/api/payments/reports/custom', customReportForm, {
        headers: { Authorization: `Bearer ${user.token}` },
      });
      toast.success('Custom report created successfully');
      setShowCustomReportModal(false);
      fetchReports();
    } catch (err) {
      toast.error('Failed to create custom report');
    }
  };

  const handleCreateTemplate = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/api/payments/reports/templates', templateForm, {
        headers: { Authorization: `Bearer ${user.token}` },
      });
      toast.success('Report template created successfully');
      setShowTemplateModal(false);
      fetchTemplates();
    } catch (err) {
      toast.error('Failed to create report template');
    }
  };

  const handleShareReport = async (e) => {
    e.preventDefault();
    try {
      await axios.post(
        `/api/payments/reports/${selectedReport.id}/share`,
        shareForm,
        {
          headers: { Authorization: `Bearer ${user.token}` },
        }
      );
      toast.success('Report shared successfully');
      setShowShareModal(false);
    } catch (err) {
      toast.error('Failed to share report');
    }
  };

  const handlePreviewReport = async (reportId, type) => {
    try {
      const response = await axios.get(
        `/api/payments/reports/${type}/${reportId}/preview`,
        {
          headers: { Authorization: `Bearer ${user.token}` },
        }
      );
      setPreviewData(response.data);
      setSelectedReport({ id: reportId, type });
      setShowPreviewModal(true);
    } catch (err) {
      toast.error('Failed to load report preview');
    }
  };

  const handleDeleteScheduledReport = async (reportId) => {
    if (window.confirm('Are you sure you want to delete this scheduled report?')) {
      try {
        await axios.delete(`/api/payments/reports/scheduled/${reportId}`, {
          headers: { Authorization: `Bearer ${user.token}` },
        });
        toast.success('Scheduled report deleted successfully');
        fetchReports();
      } catch (err) {
        toast.error('Failed to delete scheduled report');
      }
    }
  };

  const handleDeleteCustomReport = async (reportId) => {
    if (window.confirm('Are you sure you want to delete this custom report?')) {
      try {
        await axios.delete(`/api/payments/reports/custom/${reportId}`, {
          headers: { Authorization: `Bearer ${user.token}` },
        });
        toast.success('Custom report deleted successfully');
        fetchReports();
      } catch (err) {
        toast.error('Failed to delete custom report');
      }
    }
  };

  const handleGenerateReport = async (reportId, type, format = 'pdf') => {
    try {
      const response = await axios.get(
        `/api/payments/reports/${type}/${reportId}/generate`,
        {
          headers: { Authorization: `Bearer ${user.token}` },
          params: { format },
          responseType: 'blob',
        }
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `report-${reportId}.${format}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      toast.success('Report generated successfully');
    } catch (err) {
      toast.error('Failed to generate report');
    }
  };

  const handleCompareReports = async () => {
    try {
      const response = await axios.post(
        '/api/payments/reports/compare',
        { reportIds: selectedReports },
        {
          headers: { Authorization: `Bearer ${user.token}` },
        }
      );
      setComparisonData(response.data);
      setShowComparisonModal(true);
    } catch (err) {
      toast.error('Failed to compare reports');
    }
  };

  const handleViewVersions = async (reportId, type) => {
    try {
      const response = await axios.get(
        `/api/payments/reports/${type}/${reportId}/versions`,
        {
          headers: { Authorization: `Bearer ${user.token}` },
        }
      );
      setReportVersions(response.data);
      setSelectedReport({ id: reportId, type });
      setShowVersionModal(true);
    } catch (err) {
      toast.error('Failed to load report versions');
    }
  };

  const handleRestoreVersion = async (versionId) => {
    try {
      await axios.post(
        `/api/payments/reports/${selectedReport.type}/${selectedReport.id}/restore`,
        { versionId },
        {
          headers: { Authorization: `Bearer ${user.token}` },
        }
      );
      toast.success('Report version restored successfully');
      setShowVersionModal(false);
      fetchReports();
    } catch (err) {
      toast.error('Failed to restore report version');
    }
  };

  const handleAdvancedSchedule = async (e) => {
    e.preventDefault();
    try {
      const scheduleData = {
        ...scheduleForm,
        schedule: {
          ...scheduleForm.schedule,
          conditions: advancedSchedule.conditions,
          actions: advancedSchedule.actions,
          notifications: advancedSchedule.notifications,
        },
      };
      await axios.post('/api/payments/reports/schedule/advanced', scheduleData, {
        headers: { Authorization: `Bearer ${user.token}` },
      });
      toast.success('Advanced schedule created successfully');
      setShowAdvancedScheduleModal(false);
      fetchReports();
    } catch (err) {
      toast.error('Failed to create advanced schedule');
    }
  };

  const handleTemplateComparison = async () => {
    try {
      const response = await axios.post(
        '/api/payments/reports/templates/compare',
        { versionIds: templateComparison.selectedVersions },
        {
          headers: { Authorization: `Bearer ${user.token}` },
        }
      );
      setTemplateComparison({
        ...templateComparison,
        differences: response.data.differences,
      });
      setShowTemplateComparisonModal(true);
    } catch (err) {
      toast.error('Failed to compare template versions');
    }
  };

  const handleCollaborationUpdate = async (e) => {
    e.preventDefault();
    try {
      await axios.put(
        `/api/payments/reports/${selectedReport.id}/collaboration`,
        collaborationSettings,
        {
          headers: { Authorization: `Bearer ${user.token}` },
        }
      );
      toast.success('Collaboration settings updated successfully');
      setShowCollaborationModal(false);
    } catch (err) {
      toast.error('Failed to update collaboration settings');
    }
  };

  const handleArchiveRuleUpdate = async (e) => {
    e.preventDefault();
    try {
      await axios.put(
        '/api/payments/reports/archive/rules',
        archiveRules,
        {
          headers: { Authorization: `Bearer ${user.token}` },
        }
      );
      toast.success('Archive rules updated successfully');
      setShowArchiveRulesModal(false);
    } catch (err) {
      toast.error('Failed to update archive rules');
    }
  };

  const handleAIPredictions = async () => {
    try {
      const response = await axios.get('/api/payments/reports/ai-predictions', {
        headers: { Authorization: `Bearer ${user.token}` },
      });
      setAIPredictions(response.data);
      setShowAIPredictionsModal(true);
    } catch (err) {
      toast.error('Failed to load AI predictions');
    }
  };

  const handleAutomatedReports = async () => {
    try {
      const response = await axios.get('/api/payments/reports/automated', {
        headers: { Authorization: `Bearer ${user.token}` },
      });
      setAutomatedReports(response.data);
      setShowAutomatedReportsModal(true);
    } catch (err) {
      toast.error('Failed to load automated reports');
    }
  };

  const handleUpdateAutomatedReport = async (e) => {
    e.preventDefault();
    try {
      await axios.put(
        '/api/payments/reports/automated',
        automatedReports,
        {
          headers: { Authorization: `Bearer ${user.token}` },
        }
      );
      toast.success('Automated reports updated successfully');
      setShowAutomatedReportsModal(false);
    } catch (err) {
      toast.error('Failed to update automated reports');
    }
  };

  const renderVisualization = (data, type) => {
    switch (type) {
      case 'line':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="value" stroke="#8884d8" />
            </LineChart>
          </ResponsiveContainer>
        );
      case 'bar':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="value" fill="#8884d8" />
            </BarChart>
          </ResponsiveContainer>
        );
      case 'pie':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <PieChart>
              <Pie
                data={data}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={150}
                fill="#8884d8"
                label
              />
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        );
      case 'scatter':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <ScatterChart>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="x" />
              <YAxis dataKey="y" />
              <Tooltip />
              <Legend />
              <Scatter data={data} fill="#8884d8" />
            </ScatterChart>
          </ResponsiveContainer>
        );
      case 'area':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <AreaChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Area
                type="monotone"
                dataKey="value"
                stroke="#8884d8"
                fill="#8884d8"
                fillOpacity={0.3}
              />
            </AreaChart>
          </ResponsiveContainer>
        );
      case 'radar':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <RadarChart data={data}>
              <PolarGrid />
              <PolarAngleAxis dataKey="name" />
              <PolarRadiusAxis />
              <Radar
                name="Value"
                dataKey="value"
                stroke="#8884d8"
                fill="#8884d8"
                fillOpacity={0.6}
              />
              <Legend />
            </RadarChart>
          </ResponsiveContainer>
        );
      case 'treemap':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <Treemap
              data={data}
              dataKey="value"
              nameKey="name"
              fill="#8884d8"
              label
            >
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={`hsl(${(index * 360) / data.length}, 70%, 50%)`}
                />
              ))}
            </Treemap>
          </ResponsiveContainer>
        );
      case 'composed':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <ComposedChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="value" fill="#8884d8" />
              <Line type="monotone" dataKey="trend" stroke="#ff7300" />
              <Area
                type="monotone"
                dataKey="area"
                fill="#8884d8"
                stroke="#8884d8"
                fillOpacity={0.3}
              />
            </ComposedChart>
          </ResponsiveContainer>
        );
      case 'funnel':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <FunnelChart>
              <Tooltip />
              <Funnel
                data={data}
                dataKey="value"
                nameKey="name"
                labelFormatter={(value) => `${value}%`}
              />
            </FunnelChart>
          </ResponsiveContainer>
        );
      case 'sankey':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <Sankey
              data={data}
              node={{ fill: '#8884d8' }}
              link={{ stroke: '#8884d8', strokeOpacity: 0.3 }}
            >
              <Tooltip />
            </Sankey>
          </ResponsiveContainer>
        );
      case 'heatmap':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <HeatmapChart>
              <XAxis dataKey="x" />
              <YAxis dataKey="y" />
              <Tooltip />
              <Heatmap data={data} />
            </HeatmapChart>
          </ResponsiveContainer>
        );
      case 'sunburst':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <SunburstChart>
              <Tooltip />
              <Sunburst
                data={data}
                dataKey="value"
                nameKey="name"
                fill="#8884d8"
              />
            </SunburstChart>
          </ResponsiveContainer>
        );
      case 'chord':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <ChordChart>
              <Tooltip />
              <Chord
                data={data}
                dataKey="value"
                nameKey="name"
                fill="#8884d8"
              />
            </ChordChart>
          </ResponsiveContainer>
        );
      default:
        return (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {Object.keys(data[0] || {}).map((key) => (
                    <th
                      key={key}
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      {key}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {data.map((row, index) => (
                  <tr key={index}>
                    {Object.values(row).map((value, i) => (
                      <td
                        key={i}
                        className="px-6 py-4 whitespace-nowrap text-sm text-gray-500"
                      >
                        {value}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
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
        <h2 className="text-2xl font-bold">Payment Reporting</h2>
        <div className="flex space-x-4">
          <button
            onClick={() => setShowTemplateModal(true)}
            className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
          >
            Create Template
          </button>
          <button
            onClick={() => setShowScheduleModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Schedule Report
          </button>
          <button
            onClick={() => setShowCustomReportModal(true)}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
          >
            Create Custom Report
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
          {error}
        </div>
      )}

      {/* Report Templates */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold mb-4">Report Templates</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {reportTemplates.map((template) => (
            <div
              key={template.id}
              className="border rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <h4 className="text-lg font-semibold mb-2">{template.name}</h4>
              <p className="text-gray-600 mb-4">{template.description}</p>
              <div className="flex flex-wrap gap-2 mb-4">
                {template.metrics.map((metric, index) => (
                  <span
                    key={index}
                    className="px-2 py-1 bg-blue-100 text-blue-800 rounded-md text-sm"
                  >
                    {metric}
                  </span>
                ))}
              </div>
              <div className="flex justify-end space-x-4">
                <button
                  onClick={() => {
                    setCustomReportForm((prev) => ({
                      ...prev,
                      template: template.id,
                      metrics: template.metrics,
                      filters: template.filters,
                      grouping: template.grouping,
                      visualization: template.visualization,
                    }));
                    setShowCustomReportModal(true);
                  }}
                  className="text-blue-600 hover:text-blue-800"
                >
                  Use Template
                </button>
                <button
                  onClick={() => handleDeleteTemplate(template.id)}
                  className="text-red-600 hover:text-red-800"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Scheduled Reports */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold mb-4">Scheduled Reports</h3>
        <div className="space-y-4">
          {scheduledReports.map((report) => (
            <div
              key={report.id}
              className="border rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h4 className="text-lg font-semibold">{report.name}</h4>
                  <p className="text-gray-600">{report.description}</p>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-sm font-medium ${
                    report.active
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {report.active ? 'Active' : 'Inactive'}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-sm text-gray-600">Report Type</p>
                  <p className="font-medium">{report.reportType}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Frequency</p>
                  <p className="font-medium">{report.frequency}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Format</p>
                  <p className="font-medium">{report.format.toUpperCase()}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Visualization</p>
                  <p className="font-medium">{report.visualization}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Recipients</p>
                  <p className="font-medium">{report.recipients.join(', ')}</p>
                </div>
              </div>

              <div className="flex justify-end space-x-4">
                <button
                  onClick={() => handlePreviewReport(report.id, 'scheduled')}
                  className="text-blue-600 hover:text-blue-800"
                >
                  Preview
                </button>
                <button
                  onClick={() => {
                    setSelectedReport({ id: report.id, type: 'scheduled' });
                    setShowShareModal(true);
                  }}
                  className="text-green-600 hover:text-green-800"
                >
                  Share
                </button>
                <button
                  onClick={() => handleGenerateReport(report.id, 'scheduled')}
                  className="text-blue-600 hover:text-blue-800"
                >
                  Generate Now
                </button>
                <button
                  onClick={() => handleDeleteScheduledReport(report.id)}
                  className="text-red-600 hover:text-red-800"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Custom Reports */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Custom Reports</h3>
        <div className="space-y-4">
          {customReports.map((report) => (
            <div
              key={report.id}
              className="border rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h4 className="text-lg font-semibold">{report.name}</h4>
                  <p className="text-gray-600">{report.description}</p>
                </div>
              </div>

              <div className="mb-4">
                <h5 className="text-sm font-medium text-gray-700 mb-2">
                  Metrics
                </h5>
                <div className="flex flex-wrap gap-2">
                  {report.metrics.map((metric, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-blue-100 text-blue-800 rounded-md text-sm"
                    >
                      {metric}
                    </span>
                  ))}
                </div>
              </div>

              <div className="mb-4">
                <h5 className="text-sm font-medium text-gray-700 mb-2">
                  Filters
                </h5>
                <div className="flex flex-wrap gap-2">
                  {report.filters.map((filter, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-green-100 text-green-800 rounded-md text-sm"
                    >
                      {filter}
                    </span>
                  ))}
                </div>
              </div>

              <div className="mb-4">
                <h5 className="text-sm font-medium text-gray-700 mb-2">
                  Visualization
                </h5>
                <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded-md text-sm">
                  {report.visualization}
                </span>
              </div>

              <div className="flex justify-end space-x-4">
                <button
                  onClick={() => handlePreviewReport(report.id, 'custom')}
                  className="text-blue-600 hover:text-blue-800"
                >
                  Preview
                </button>
                <button
                  onClick={() => {
                    setSelectedReport({ id: report.id, type: 'custom' });
                    setShowShareModal(true);
                  }}
                  className="text-green-600 hover:text-green-800"
                >
                  Share
                </button>
                <button
                  onClick={() => handleGenerateReport(report.id, 'custom')}
                  className="text-blue-600 hover:text-blue-800"
                >
                  Generate Report
                </button>
                <button
                  onClick={() => handleDeleteCustomReport(report.id)}
                  className="text-red-600 hover:text-red-800"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Real-time Dashboard */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold mb-4">Real-time Dashboard</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="text-sm font-medium text-blue-800">Total Sales (24h)</h4>
            <p className="text-2xl font-bold text-blue-600">
              ${realTimeData.sales.reduce((sum, sale) => sum + sale.amount, 0).toFixed(2)}
            </p>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <h4 className="text-sm font-medium text-green-800">Bank Deposits</h4>
            <p className="text-2xl font-bold text-green-600">
              ${realTimeData.deposits.reduce((sum, deposit) => sum + deposit.amount, 0).toFixed(2)}
            </p>
          </div>
          <div className="bg-yellow-50 p-4 rounded-lg">
            <h4 className="text-sm font-medium text-yellow-800">Pending Deposits</h4>
            <p className="text-2xl font-bold text-yellow-600">
              ${realTimeData.deposits
                .filter((deposit) => deposit.status === 'pending')
                .reduce((sum, deposit) => sum + deposit.amount, 0)
                .toFixed(2)}
            </p>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg">
            <h4 className="text-sm font-medium text-purple-800">AI Predictions</h4>
            <p className="text-2xl font-bold text-purple-600">
              {realTimeData.predictions.salesIncrease}% Increase
            </p>
          </div>
        </div>
      </div>

      {/* AI Predictions Modal */}
      {showAIPredictionsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">AI Predictions</h3>
              <button
                onClick={() => setShowAIPredictionsModal(false)}
                className="text-gray-600 hover:text-gray-800"
              >
                Close
              </button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="text-lg font-semibold mb-2">Expected Deposits</h4>
                <div className="space-y-2">
                  {aiPredictions.expectedDeposits.map((deposit, index) => (
                    <div key={index} className="bg-gray-50 p-3 rounded-md">
                      <p className="font-medium">${deposit.amount.toFixed(2)}</p>
                      <p className="text-sm text-gray-600">
                        Expected by {format(new Date(deposit.expectedTime), 'PPpp')}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="text-lg font-semibold mb-2">Sales Forecast</h4>
                <div className="space-y-2">
                  {aiPredictions.salesForecast.map((forecast, index) => (
                    <div key={index} className="bg-gray-50 p-3 rounded-md">
                      <p className="font-medium">{forecast.period}</p>
                      <p className="text-sm text-gray-600">
                        Expected: ${forecast.amount.toFixed(2)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="text-lg font-semibold mb-2">Risk Analysis</h4>
                <div className="space-y-2">
                  {aiPredictions.riskAnalysis.map((risk, index) => (
                    <div key={index} className="bg-gray-50 p-3 rounded-md">
                      <p className="font-medium">{risk.type}</p>
                      <p className="text-sm text-gray-600">{risk.description}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="text-lg font-semibold mb-2">Product Predictions</h4>
                <div className="space-y-2">
                  {aiPredictions.productPredictions.map((product, index) => (
                    <div key={index} className="bg-gray-50 p-3 rounded-md">
                      <p className="font-medium">{product.name}</p>
                      <p className="text-sm text-gray-600">
                        Expected Sales: {product.expectedSales}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Automated Reports Modal */}
      {showAutomatedReportsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full">
            <h3 className="text-xl font-bold mb-4">Automated Reports</h3>
            <form onSubmit={handleUpdateAutomatedReport} className="space-y-4">
              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Report Schedules
                </label>
                <div className="space-y-2">
                  {automatedReports.schedules.map((schedule, index) => (
                    <div key={index} className="flex space-x-2">
                      <select
                        value={schedule.frequency}
                        onChange={(e) => {
                          const newSchedules = [...automatedReports.schedules];
                          newSchedules[index] = {
                            ...newSchedules[index],
                            frequency: e.target.value,
                          };
                          setAutomatedReports({
                            ...automatedReports,
                            schedules: newSchedules,
                          });
                        }}
                        className="px-3 py-2 border rounded-md"
                      >
                        <option value="daily">Daily</option>
                        <option value="weekly">Weekly</option>
                        <option value="monthly">Monthly</option>
                        <option value="custom">Custom</option>
                      </select>
                      <input
                        type="time"
                        value={schedule.time}
                        onChange={(e) => {
                          const newSchedules = [...automatedReports.schedules];
                          newSchedules[index] = {
                            ...newSchedules[index],
                            time: e.target.value,
                          };
                          setAutomatedReports({
                            ...automatedReports,
                            schedules: newSchedules,
                          });
                        }}
                        className="px-3 py-2 border rounded-md"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setAutomatedReports({
                            ...automatedReports,
                            schedules: automatedReports.schedules.filter(
                              (_, i) => i !== index
                            ),
                          });
                        }}
                        className="px-3 py-2 text-red-600 hover:text-red-800"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => {
                      setAutomatedReports({
                        ...automatedReports,
                        schedules: [
                          ...automatedReports.schedules,
                          { frequency: 'daily', time: '08:00' },
                        ],
                      });
                    }}
                    className="px-4 py-2 text-blue-600 hover:text-blue-800"
                  >
                    Add Schedule
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Recipients
                </label>
                <div className="space-y-2">
                  {automatedReports.recipients.map((recipient, index) => (
                    <div key={index} className="flex space-x-2">
                      <input
                        type="email"
                        value={recipient.email}
                        onChange={(e) => {
                          const newRecipients = [...automatedReports.recipients];
                          newRecipients[index] = {
                            ...newRecipients[index],
                            email: e.target.value,
                          };
                          setAutomatedReports({
                            ...automatedReports,
                            recipients: newRecipients,
                          });
                        }}
                        className="px-3 py-2 border rounded-md"
                        placeholder="Email"
                      />
                      <select
                        value={recipient.channel}
                        onChange={(e) => {
                          const newRecipients = [...automatedReports.recipients];
                          newRecipients[index] = {
                            ...newRecipients[index],
                            channel: e.target.value,
                          };
                          setAutomatedReports({
                            ...automatedReports,
                            recipients: newRecipients,
                          });
                        }}
                        className="px-3 py-2 border rounded-md"
                      >
                        <option value="email">Email</option>
                        <option value="slack">Slack</option>
                        <option value="whatsapp">WhatsApp</option>
                      </select>
                      <button
                        type="button"
                        onClick={() => {
                          setAutomatedReports({
                            ...automatedReports,
                            recipients: automatedReports.recipients.filter(
                              (_, i) => i !== index
                            ),
                          });
                        }}
                        className="px-3 py-2 text-red-600 hover:text-red-800"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => {
                      setAutomatedReports({
                        ...automatedReports,
                        recipients: [
                          ...automatedReports.recipients,
                          { email: '', channel: 'email' },
                        ],
                      });
                    }}
                    className="px-4 py-2 text-blue-600 hover:text-blue-800"
                  >
                    Add Recipient
                  </button>
                </div>
              </div>
              <div className="flex justify-end space-x-4">
                <button
                  type="button"
                  onClick={() => setShowAutomatedReportsModal(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Template Modal */}
      {showTemplateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full">
            <h3 className="text-xl font-bold mb-4">Create Report Template</h3>
            <form onSubmit={handleCreateTemplate} className="space-y-4">
              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Template Name
                </label>
                <input
                  type="text"
                  value={templateForm.name}
                  onChange={(e) =>
                    setTemplateForm({ ...templateForm, name: e.target.value })
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
                  value={templateForm.description}
                  onChange={(e) =>
                    setTemplateForm({
                      ...templateForm,
                      description: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border rounded-md"
                  rows="3"
                  required
                />
              </div>
              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Metrics
                </label>
                <div className="space-y-2">
                  {templateForm.metrics.map((metric, index) => (
                    <div key={index} className="flex space-x-2">
                      <select
                        value={metric}
                        onChange={(e) => {
                          const newMetrics = [...templateForm.metrics];
                          newMetrics[index] = e.target.value;
                          setTemplateForm({
                            ...templateForm,
                            metrics: newMetrics,
                          });
                        }}
                        className="px-3 py-2 border rounded-md"
                      >
                        <option value="">Select Metric</option>
                        <option value="revenue">Revenue</option>
                        <option value="transactions">Transactions</option>
                        <option value="customers">Customers</option>
                        <option value="products">Products</option>
                        <option value="success_rate">Success Rate</option>
                        <option value="average_order_value">
                          Average Order Value
                        </option>
                        <option value="churn_rate">Churn Rate</option>
                        <option value="customer_lifetime_value">
                          Customer Lifetime Value
                        </option>
                        <option value="acquisition_cost">
                          Customer Acquisition Cost
                        </option>
                      </select>
                      <button
                        type="button"
                        onClick={() => {
                          setTemplateForm((prev) => ({
                            ...prev,
                            metrics: prev.metrics.filter((_, i) => i !== index),
                          }));
                        }}
                        className="px-3 py-2 text-red-600 hover:text-red-800"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => {
                      setTemplateForm((prev) => ({
                        ...prev,
                        metrics: [...prev.metrics, ''],
                      }));
                    }}
                    className="px-4 py-2 text-blue-600 hover:text-blue-800"
                  >
                    Add Metric
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Filters
                </label>
                <div className="space-y-2">
                  {templateForm.filters.map((filter, index) => (
                    <div key={index} className="flex space-x-2">
                      <select
                        value={filter.field}
                        onChange={(e) => {
                          const newFilters = [...templateForm.filters];
                          newFilters[index] = {
                            ...newFilters[index],
                            field: e.target.value,
                          };
                          setTemplateForm({
                            ...templateForm,
                            filters: newFilters,
                          });
                        }}
                        className="px-3 py-2 border rounded-md"
                      >
                        <option value="">Select Field</option>
                        <option value="date_range">Date Range</option>
                        <option value="payment_method">Payment Method</option>
                        <option value="status">Status</option>
                        <option value="amount_range">Amount Range</option>
                        <option value="customer_segment">
                          Customer Segment
                        </option>
                        <option value="product_category">
                          Product Category
                        </option>
                      </select>
                      <input
                        type="text"
                        value={filter.value}
                        onChange={(e) => {
                          const newFilters = [...templateForm.filters];
                          newFilters[index] = {
                            ...newFilters[index],
                            value: e.target.value,
                          };
                          setTemplateForm({
                            ...templateForm,
                            filters: newFilters,
                          });
                        }}
                        className="px-3 py-2 border rounded-md"
                        placeholder="Value"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setTemplateForm((prev) => ({
                            ...prev,
                            filters: prev.filters.filter((_, i) => i !== index),
                          }));
                        }}
                        className="px-3 py-2 text-red-600 hover:text-red-800"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => {
                      setTemplateForm((prev) => ({
                        ...prev,
                        filters: [...prev.filters, { field: '', value: '' }],
                      }));
                    }}
                    className="px-4 py-2 text-blue-600 hover:text-blue-800"
                  >
                    Add Filter
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Grouping
                </label>
                <div className="space-y-2">
                  {templateForm.grouping.map((group, index) => (
                    <div key={index} className="flex space-x-2">
                      <select
                        value={group}
                        onChange={(e) => {
                          const newGrouping = [...templateForm.grouping];
                          newGrouping[index] = e.target.value;
                          setTemplateForm({
                            ...templateForm,
                            grouping: newGrouping,
                          });
                        }}
                        className="px-3 py-2 border rounded-md"
                      >
                        <option value="">Select Group</option>
                        <option value="date">Date</option>
                        <option value="payment_method">Payment Method</option>
                        <option value="status">Status</option>
                        <option value="customer_type">Customer Type</option>
                        <option value="product_category">
                          Product Category
                        </option>
                        <option value="region">Region</option>
                      </select>
                      <button
                        type="button"
                        onClick={() => {
                          setTemplateForm((prev) => ({
                            ...prev,
                            grouping: prev.grouping.filter((_, i) => i !== index),
                          }));
                        }}
                        className="px-3 py-2 text-red-600 hover:text-red-800"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => {
                      setTemplateForm((prev) => ({
                        ...prev,
                        grouping: [...prev.grouping, ''],
                      }));
                    }}
                    className="px-4 py-2 text-blue-600 hover:text-blue-800"
                  >
                    Add Grouping
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Visualization
                </label>
                <select
                  value={templateForm.visualization}
                  onChange={(e) =>
                    setTemplateForm({
                      ...templateForm,
                      visualization: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border rounded-md"
                  required
                >
                  <option value="table">Table</option>
                  <option value="line">Line Chart</option>
                  <option value="bar">Bar Chart</option>
                  <option value="pie">Pie Chart</option>
                  <option value="scatter">Scatter Plot</option>
                  <option value="heatmap">Heatmap</option>
                </select>
              </div>
              <div className="flex justify-end space-x-4">
                <button
                  type="button"
                  onClick={() => setShowTemplateModal(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
                >
                  Create Template
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Share Report Modal */}
      {showShareModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full">
            <h3 className="text-xl font-bold mb-4">Share Report</h3>
            <form onSubmit={handleShareReport} className="space-y-4">
              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Recipients (comma-separated)
                </label>
                <input
                  type="text"
                  value={shareForm.recipients.join(', ')}
                  onChange={(e) =>
                    setShareForm({
                      ...shareForm,
                      recipients: e.target.value
                        .split(',')
                        .map((email) => email.trim()),
                    })
                  }
                  className="w-full px-3 py-2 border rounded-md"
                  required
                />
              </div>
              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Access Level
                </label>
                <select
                  value={shareForm.accessLevel}
                  onChange={(e) =>
                    setShareForm({ ...shareForm, accessLevel: e.target.value })
                  }
                  className="w-full px-3 py-2 border rounded-md"
                  required
                >
                  <option value="view">View Only</option>
                  <option value="edit">Can Edit</option>
                  <option value="admin">Full Access</option>
                </select>
              </div>
              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Expiry Date
                </label>
                <input
                  type="date"
                  value={shareForm.expiryDate}
                  onChange={(e) =>
                    setShareForm({ ...shareForm, expiryDate: e.target.value })
                  }
                  className="w-full px-3 py-2 border rounded-md"
                  required
                />
              </div>
              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Message
                </label>
                <textarea
                  value={shareForm.message}
                  onChange={(e) =>
                    setShareForm({ ...shareForm, message: e.target.value })
                  }
                  className="w-full px-3 py-2 border rounded-md"
                  rows="3"
                  required
                />
              </div>
              <div className="flex justify-end space-x-4">
                <button
                  type="button"
                  onClick={() => setShowShareModal(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                >
                  Share Report
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {showPreviewModal && previewData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">Report Preview</h3>
              <button
                onClick={() => setShowPreviewModal(false)}
                className="text-gray-600 hover:text-gray-800"
              >
                Close
              </button>
            </div>
            <div className="mb-4">
              <h4 className="text-lg font-semibold mb-2">
                {previewData.name}
              </h4>
              <p className="text-gray-600">{previewData.description}</p>
            </div>
            <div className="mb-4">
              <div className="flex flex-wrap gap-2">
                {previewData.metrics.map((metric, index) => (
                  <span
                    key={index}
                    className="px-2 py-1 bg-blue-100 text-blue-800 rounded-md text-sm"
                  >
                    {metric}
                  </span>
                ))}
              </div>
            </div>
            <div className="mb-4">
              <div className="flex flex-wrap gap-2">
                {previewData.filters.map((filter, index) => (
                  <span
                    key={index}
                    className="px-2 py-1 bg-green-100 text-green-800 rounded-md text-sm"
                  >
                    {filter}
                  </span>
                ))}
              </div>
            </div>
            <div className="mt-8">
              {renderVisualization(previewData.data, previewData.visualization)}
            </div>
          </div>
        </div>
      )}

      {/* Comparison Modal */}
      {showComparisonModal && comparisonData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">Report Comparison</h3>
              <button
                onClick={() => setShowComparisonModal(false)}
                className="text-gray-600 hover:text-gray-800"
              >
                Close
              </button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {comparisonData.reports.map((report, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <h4 className="text-lg font-semibold mb-2">{report.name}</h4>
                  <p className="text-gray-600 mb-4">{report.description}</p>
                  <div className="mt-4">
                    {renderVisualization(report.data, report.visualization)}
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4">
              <h4 className="text-lg font-semibold mb-2">Comparison Summary</h4>
              <div className="grid grid-cols-2 gap-4">
                {comparisonData.summary.map((item, index) => (
                  <div key={index} className="bg-gray-50 p-4 rounded-lg">
                    <p className="font-medium">{item.metric}</p>
                    <p className="text-gray-600">{item.difference}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Version History Modal */}
      {showVersionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">Version History</h3>
              <button
                onClick={() => setShowVersionModal(false)}
                className="text-gray-600 hover:text-gray-800"
              >
                Close
              </button>
            </div>
            <div className="space-y-4">
              {reportVersions.map((version) => (
                <div
                  key={version.id}
                  className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="font-semibold">
                        Version {version.versionNumber}
                      </h4>
                      <p className="text-sm text-gray-600">
                        {format(new Date(version.createdAt), 'PPpp')}
                      </p>
                    </div>
                    <span className="text-sm text-gray-500">
                      by {version.createdBy}
                    </span>
                  </div>
                  <p className="text-gray-600 mb-4">{version.changes}</p>
                  <div className="flex justify-end space-x-4">
                    <button
                      onClick={() => handlePreviewReport(version.id, 'version')}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      Preview
                    </button>
                    <button
                      onClick={() => handleRestoreVersion(version.id)}
                      className="text-green-600 hover:text-green-800"
                    >
                      Restore
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Advanced Schedule Modal */}
      {showAdvancedScheduleModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full">
            <h3 className="text-xl font-bold mb-4">Advanced Schedule Settings</h3>
            <form onSubmit={handleAdvancedSchedule} className="space-y-4">
              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Conditions
                </label>
                <div className="space-y-2">
                  {advancedSchedule.conditions.map((condition, index) => (
                    <div key={index} className="flex space-x-2">
                      <select
                        value={condition.type}
                        onChange={(e) => {
                          const newConditions = [...advancedSchedule.conditions];
                          newConditions[index] = {
                            ...newConditions[index],
                            type: e.target.value,
                          };
                          setAdvancedSchedule({
                            ...advancedSchedule,
                            conditions: newConditions,
                          });
                        }}
                        className="px-3 py-2 border rounded-md"
                      >
                        <option value="threshold">Threshold</option>
                        <option value="time">Time</option>
                        <option value="event">Event</option>
                        <option value="data">Data Condition</option>
                        <option value="custom">Custom</option>
                      </select>
                      <input
                        type="text"
                        value={condition.value}
                        onChange={(e) => {
                          const newConditions = [...advancedSchedule.conditions];
                          newConditions[index] = {
                            ...newConditions[index],
                            value: e.target.value,
                          };
                          setAdvancedSchedule({
                            ...advancedSchedule,
                            conditions: newConditions,
                          });
                        }}
                        className="px-3 py-2 border rounded-md"
                        placeholder="Value"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setAdvancedSchedule({
                            ...advancedSchedule,
                            conditions: advancedSchedule.conditions.filter(
                              (_, i) => i !== index
                            ),
                          });
                        }}
                        className="px-3 py-2 text-red-600 hover:text-red-800"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => {
                      setAdvancedSchedule({
                        ...advancedSchedule,
                        conditions: [
                          ...advancedSchedule.conditions,
                          { type: '', value: '' },
                        ],
                      });
                    }}
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
                  {advancedSchedule.actions.map((action, index) => (
                    <div key={index} className="flex space-x-2">
                      <select
                        value={action.type}
                        onChange={(e) => {
                          const newActions = [...advancedSchedule.actions];
                          newActions[index] = {
                            ...newActions[index],
                            type: e.target.value,
                          };
                          setAdvancedSchedule({
                            ...advancedSchedule,
                            actions: newActions,
                          });
                        }}
                        className="px-3 py-2 border rounded-md"
                      >
                        <option value="generate">Generate Report</option>
                        <option value="notify">Send Notification</option>
                        <option value="share">Share Report</option>
                        <option value="archive">Archive Report</option>
                        <option value="export">Export Report</option>
                      </select>
                      <input
                        type="text"
                        value={action.value}
                        onChange={(e) => {
                          const newActions = [...advancedSchedule.actions];
                          newActions[index] = {
                            ...newActions[index],
                            value: e.target.value,
                          };
                          setAdvancedSchedule({
                            ...advancedSchedule,
                            actions: newActions,
                          });
                        }}
                        className="px-3 py-2 border rounded-md"
                        placeholder="Value"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setAdvancedSchedule({
                            ...advancedSchedule,
                            actions: advancedSchedule.actions.filter(
                              (_, i) => i !== index
                            ),
                          });
                        }}
                        className="px-3 py-2 text-red-600 hover:text-red-800"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => {
                      setAdvancedSchedule({
                        ...advancedSchedule,
                        actions: [
                          ...advancedSchedule.actions,
                          { type: '', value: '' },
                        ],
                      });
                    }}
                    className="px-4 py-2 text-blue-600 hover:text-blue-800"
                  >
                    Add Action
                  </button>
                </div>
              </div>
              <div className="flex justify-end space-x-4">
                <button
                  type="button"
                  onClick={() => setShowAdvancedScheduleModal(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Save Schedule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Template Comparison Modal */}
      {showTemplateComparisonModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">Template Version Comparison</h3>
              <button
                onClick={() => setShowTemplateComparisonModal(false)}
                className="text-gray-600 hover:text-gray-800"
              >
                Close
              </button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {templateComparison.selectedVersions.map((version, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <h4 className="text-lg font-semibold mb-2">
                    Version {version.versionNumber}
                  </h4>
                  <div className="space-y-4">
                    <div>
                      <h5 className="font-medium mb-2">Metrics</h5>
                      <div className="flex flex-wrap gap-2">
                        {version.metrics.map((metric, i) => (
                          <span
                            key={i}
                            className="px-2 py-1 bg-blue-100 text-blue-800 rounded-md text-sm"
                          >
                            {metric}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div>
                      <h5 className="font-medium mb-2">Filters</h5>
                      <div className="flex flex-wrap gap-2">
                        {version.filters.map((filter, i) => (
                          <span
                            key={i}
                            className="px-2 py-1 bg-green-100 text-green-800 rounded-md text-sm"
                          >
                            {filter}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4">
              <h4 className="text-lg font-semibold mb-2">Differences</h4>
              <div className="space-y-2">
                {templateComparison.differences.map((diff, index) => (
                  <div
                    key={index}
                    className="p-3 bg-gray-50 rounded-md"
                  >
                    <p className="font-medium">{diff.type}</p>
                    <p className="text-gray-600">{diff.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Collaboration Modal */}
      {showCollaborationModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full">
            <h3 className="text-xl font-bold mb-4">Collaboration Settings</h3>
            <form onSubmit={handleCollaborationUpdate} className="space-y-4">
              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Collaborators
                </label>
                <div className="space-y-2">
                  {collaborationSettings.collaborators.map((collaborator, index) => (
                    <div key={index} className="flex space-x-2">
                      <input
                        type="email"
                        value={collaborator.email}
                        onChange={(e) => {
                          const newCollaborators = [...collaborationSettings.collaborators];
                          newCollaborators[index] = {
                            ...newCollaborators[index],
                            email: e.target.value,
                          };
                          setCollaborationSettings({
                            ...collaborationSettings,
                            collaborators: newCollaborators,
                          });
                        }}
                        className="px-3 py-2 border rounded-md"
                        placeholder="Email"
                      />
                      <select
                        value={collaborator.role}
                        onChange={(e) => {
                          const newCollaborators = [...collaborationSettings.collaborators];
                          newCollaborators[index] = {
                            ...newCollaborators[index],
                            role: e.target.value,
                          };
                          setCollaborationSettings({
                            ...collaborationSettings,
                            collaborators: newCollaborators,
                          });
                        }}
                        className="px-3 py-2 border rounded-md"
                      >
                        <option value="viewer">Viewer</option>
                        <option value="editor">Editor</option>
                        <option value="admin">Admin</option>
                      </select>
                      <button
                        type="button"
                        onClick={() => {
                          setCollaborationSettings({
                            ...collaborationSettings,
                            collaborators: collaborationSettings.collaborators.filter(
                              (_, i) => i !== index
                            ),
                          });
                        }}
                        className="px-3 py-2 text-red-600 hover:text-red-800"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => {
                      setCollaborationSettings({
                        ...collaborationSettings,
                        collaborators: [
                          ...collaborationSettings.collaborators,
                          { email: '', role: 'viewer' },
                        ],
                      });
                    }}
                    className="px-4 py-2 text-blue-600 hover:text-blue-800"
                  >
                    Add Collaborator
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Comments
                </label>
                <div className="space-y-2">
                  {collaborationSettings.comments.map((comment, index) => (
                    <div key={index} className="border rounded-md p-3">
                      <div className="flex justify-between items-start mb-2">
                        <span className="font-medium">{comment.user}</span>
                        <span className="text-sm text-gray-500">
                          {format(new Date(comment.timestamp), 'PPpp')}
                        </span>
                      </div>
                      <p className="text-gray-600">{comment.text}</p>
                    </div>
                  ))}
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      placeholder="Add a comment..."
                      className="flex-1 px-3 py-2 border rounded-md"
                    />
                    <button
                      type="button"
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    >
                      Add
                    </button>
                  </div>
                </div>
              </div>
              <div className="flex justify-end space-x-4">
                <button
                  type="button"
                  onClick={() => setShowCollaborationModal(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Archive Rules Modal */}
      {showArchiveRulesModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full">
            <h3 className="text-xl font-bold mb-4">Archive Rules</h3>
            <form onSubmit={handleArchiveRuleUpdate} className="space-y-4">
              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Rules
                </label>
                <div className="space-y-2">
                  {archiveRules.rules.map((rule, index) => (
                    <div key={index} className="flex space-x-2">
                      <select
                        value={rule.type}
                        onChange={(e) => {
                          const newRules = [...archiveRules.rules];
                          newRules[index] = {
                            ...newRules[index],
                            type: e.target.value,
                          };
                          setArchiveRules({
                            ...archiveRules,
                            rules: newRules,
                          });
                        }}
                        className="px-3 py-2 border rounded-md"
                      >
                        <option value="age">Age</option>
                        <option value="size">Size</option>
                        <option value="type">Type</option>
                        <option value="custom">Custom</option>
                      </select>
                      <input
                        type="text"
                        value={rule.value}
                        onChange={(e) => {
                          const newRules = [...archiveRules.rules];
                          newRules[index] = {
                            ...newRules[index],
                            value: e.target.value,
                          };
                          setArchiveRules({
                            ...archiveRules,
                            rules: newRules,
                          });
                        }}
                        className="px-3 py-2 border rounded-md"
                        placeholder="Value"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setArchiveRules({
                            ...archiveRules,
                            rules: archiveRules.rules.filter(
                              (_, i) => i !== index
                            ),
                          });
                        }}
                        className="px-3 py-2 text-red-600 hover:text-red-800"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => {
                      setArchiveRules({
                        ...archiveRules,
                        rules: [
                          ...archiveRules.rules,
                          { type: '', value: '' },
                        ],
                      });
                    }}
                    className="px-4 py-2 text-blue-600 hover:text-blue-800"
                  >
                    Add Rule
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Retention Period
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">
                      Minimum Age
                    </label>
                    <input
                      type="number"
                      value={archiveRules.retention.minAge}
                      onChange={(e) => {
                        setArchiveRules({
                          ...archiveRules,
                          retention: {
                            ...archiveRules.retention,
                            minAge: e.target.value,
                          },
                        });
                      }}
                      className="w-full px-3 py-2 border rounded-md"
                      placeholder="Days"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">
                      Maximum Age
                    </label>
                    <input
                      type="number"
                      value={archiveRules.retention.maxAge}
                      onChange={(e) => {
                        setArchiveRules({
                          ...archiveRules,
                          retention: {
                            ...archiveRules.retention,
                            maxAge: e.target.value,
                          },
                        });
                      }}
                      className="w-full px-3 py-2 border rounded-md"
                      placeholder="Days"
                    />
                  </div>
                </div>
              </div>
              <div className="flex justify-end space-x-4">
                <button
                  type="button"
                  onClick={() => setShowArchiveRulesModal(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Save Rules
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentReporting; 