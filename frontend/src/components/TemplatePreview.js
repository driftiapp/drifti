import React, { useState, useEffect } from 'react';
import { Tabs, Tab } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input, FormLabel } from '@/components/ui/input';
import { Alert } from '@/components/ui/alert';
import { Grid, Typography, Box, Chip, Tooltip, IconButton } from '@/components/ui/layout';
import { Dialog, DialogTitle, DialogContent, DialogActions } from '@/components/ui/dialog';
import TemplatePreview from '../utils/TemplatePreview';
import InfoIcon from '@mui/icons-material/Info';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import CodeIcon from '@mui/icons-material/Code';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import CategoryIcon from '@mui/icons-material/Category';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import FilterListIcon from '@mui/icons-material/FilterList';
import TagIcon from '@mui/icons-material/Tag';
import DateRangeIcon from '@mui/icons-material/DateRange';
import ShareIcon from '@mui/icons-material/Share';
import DownloadIcon from '@mui/icons-material/Download';
import AddTagIcon from '@mui/icons-material/AddTag';
import EditIcon from '@mui/icons-material/Edit';
import AnalyticsIcon from '@mui/icons-material/Analytics';
import UploadIcon from '@mui/icons-material/Upload';
import BarChartIcon from '@mui/icons-material/BarChart';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TimelineIcon from '@mui/icons-material/Timeline';
import PieChartIcon from '@mui/icons-material/PieChart';
import HistoryIcon from '@mui/icons-material/History';
import RestoreIcon from '@mui/icons-material/Restore';
import DonutLargeIcon from '@mui/icons-material/DonutLarge';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import ZoomInIcon from '@mui/icons-material/ZoomIn';
import ZoomOutIcon from '@mui/icons-material/ZoomOut';
import SortIcon from '@mui/icons-material/Sort';
import FilterAltIcon from '@mui/icons-material/FilterAlt';
import TableChartIcon from '@mui/icons-material/TableChart';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import ShowChartIcon from '@mui/icons-material/ShowChart';
import ScatterPlotIcon from '@mui/icons-material/ScatterPlot';
import PanToolIcon from '@mui/icons-material/PanTool';
import ImageIcon from '@mui/icons-material/Image';
import LinkIcon from '@mui/icons-material/Link';
import DateRangePicker from '@mui/lab/DateRangePicker';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { format, subDays, isWithinInterval } from 'date-fns';
import SelectAllIcon from '@mui/icons-material/SelectAll';
import ClearIcon from '@mui/icons-material/Clear';
import LightbulbIcon from '@mui/icons-material/Lightbulb';
import WarningIcon from '@mui/icons-material/Warning';
import AutoGraphIcon from '@mui/icons-material/AutoGraph';
import PsychologyIcon from '@mui/icons-material/Psychology';
import EmailIcon from '@mui/icons-material/Email';
import AssessmentIcon from '@mui/icons-material/Assessment';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import PersonIcon from '@mui/icons-material/Person';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import Switch from '@mui/material/Switch';
import GroupIcon from '@mui/icons-material/Group';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import LoyaltyIcon from '@mui/icons-material/Loyalty';
import InventoryIcon from '@mui/icons-material/Inventory';
import StorefrontIcon from '@mui/icons-material/Storefront';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import GroupsIcon from '@mui/icons-material/Groups';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import WeatherIcon from '@mui/icons-material/WbSunny';
import LeaderboardIcon from '@mui/icons-material/Leaderboard';
import CardGiftcardIcon from '@mui/icons-material/CardGiftcard';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import EventIcon from '@mui/icons-material/Event';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CampaignIcon from '@mui/icons-material/Campaign';
import LinearProgress from '@mui/material/LinearProgress';
import Avatar from '@mui/material/Avatar';

const defaultValues = {
    message: 'Alert: CPU usage high!',
    severity: 'critical',
    metric: 'CPU Utilization',
    instance: 'server-01',
    details: { region: 'us-east-1' }
};

const templateVariables = {
    message: {
        description: 'Main alert message',
        examples: ['CPU usage high', 'Memory threshold exceeded', 'Service unavailable']
    },
    severity: {
        description: 'Alert severity level',
        examples: ['critical', 'warning', 'info']
    },
    metric: {
        description: 'Name of the metric being monitored',
        examples: ['CPU Utilization', 'Memory Usage', 'Response Time']
    },
    instance: {
        description: 'Name or ID of the affected instance',
        examples: ['server-01', 'db-primary', 'api-gateway']
    },
    'details.region': {
        description: 'AWS region or deployment region',
        examples: ['us-east-1', 'eu-west-2', 'ap-southeast-1']
    },
    'details.value': {
        description: 'Current metric value',
        examples: ['85.5', '92.3', '1500']
    },
    'details.threshold': {
        description: 'Threshold that was exceeded',
        examples: ['80', '90', '1000']
    },
    'details.timestamp': {
        description: 'When the alert was triggered',
        examples: ['2024-03-20T10:30:00Z']
    }
};

const validationRules = {
    message: {
        required: true,
        minLength: 5,
        maxLength: 200
    },
    severity: {
        required: true,
        enum: ['critical', 'warning', 'info']
    },
    metric: {
        required: true,
        pattern: /^[a-zA-Z0-9\s-_]+$/
    },
    instance: {
        required: true,
        pattern: /^[a-zA-Z0-9-_]+$/
    },
    'details.region': {
        required: true,
        pattern: /^[a-z0-9-]+$/
    }
};

const templateCategories = {
    'System Alerts': {
        icon: '🖥️',
        description: 'System-level monitoring alerts',
        snippets: {
            'High CPU Alert': {
                subject: 'High CPU Usage Alert - {{instance}}',
                body: 'The {{metric}} on {{instance}} in {{details.region}} has exceeded the threshold of {{details.threshold}}%.\n\nCurrent value: {{details.value}}%\nTimestamp: {{details.timestamp}}\n\nPlease investigate this issue.',
                html: '<div style="font-family: Arial, sans-serif; padding: 20px; background-color: #f8f9fa; border-radius: 5px;">\n  <h2 style="color: #dc3545;">High CPU Usage Alert</h2>\n  <p>The <strong>{{metric}}</strong> on <strong>{{instance}}</strong> in <strong>{{details.region}}</strong> has exceeded the threshold of <strong>{{details.threshold}}%</strong>.</p>\n  <ul>\n    <li>Current value: <strong>{{details.value}}%</strong></li>\n    <li>Timestamp: <strong>{{details.timestamp}}</strong></li>\n  </ul>\n  <p>Please investigate this issue.</p>\n</div>'
            },
            'Memory Alert': {
                subject: 'High Memory Usage Alert - {{instance}}',
                body: 'The memory usage on {{instance}} in {{details.region}} has exceeded {{details.threshold}}%.\n\nCurrent usage: {{details.value}}%\nTimestamp: {{details.timestamp}}\n\nPlease check the system memory usage.',
                html: '<div style="font-family: Arial, sans-serif; padding: 20px; background-color: #f8f9fa; border-radius: 5px;">\n  <h2 style="color: #dc3545;">High Memory Usage Alert</h2>\n  <p>The memory usage on <strong>{{instance}}</strong> in <strong>{{details.region}}</strong> has exceeded <strong>{{details.threshold}}%</strong>.</p>\n  <ul>\n    <li>Current usage: <strong>{{details.value}}%</strong></li>\n    <li>Timestamp: <strong>{{details.timestamp}}</strong></li>\n  </ul>\n  <p>Please check the system memory usage.</p>\n</div>'
            }
        }
    },
    'Service Health': {
        icon: '🔄',
        description: 'Service health and availability alerts',
        snippets: {
            'Service Health': {
                subject: 'Service Health Alert - {{instance}}',
                body: 'Service {{instance}} in {{details.region}} is reporting {{message}}.\n\nStatus: {{severity}}\nLast Check: {{details.timestamp}}\n\nPlease review the service status.',
                html: '<div style="font-family: Arial, sans-serif; padding: 20px; background-color: #f8f9fa; border-radius: 5px;">\n  <h2 style="color: #ffc107;">Service Health Alert</h2>\n  <p>Service <strong>{{instance}}</strong> in <strong>{{details.region}}</strong> is reporting <strong>{{message}}</strong>.</p>\n  <ul>\n    <li>Status: <strong>{{severity}}</strong></li>\n    <li>Last Check: <strong>{{details.timestamp}}</strong></li>\n  </ul>\n  <p>Please review the service status.</p>\n</div>'
            },
            'Service Latency': {
                subject: 'High Service Latency - {{instance}}',
                body: 'Service {{instance}} in {{details.region}} is experiencing high latency.\n\nCurrent latency: {{details.value}}ms\nThreshold: {{details.threshold}}ms\nTimestamp: {{details.timestamp}}\n\nPlease investigate the performance issue.',
                html: '<div style="font-family: Arial, sans-serif; padding: 20px; background-color: #f8f9fa; border-radius: 5px;">\n  <h2 style="color: #ffc107;">High Service Latency Alert</h2>\n  <p>Service <strong>{{instance}}</strong> in <strong>{{details.region}}</strong> is experiencing high latency.</p>\n  <ul>\n    <li>Current latency: <strong>{{details.value}}ms</strong></li>\n    <li>Threshold: <strong>{{details.threshold}}ms</strong></li>\n    <li>Timestamp: <strong>{{details.timestamp}}</strong></li>\n  </ul>\n  <p>Please investigate the performance issue.</p>\n</div>'
            }
        }
    },
    'Database Alerts': {
        icon: '🗄️',
        description: 'Database performance and health alerts',
        snippets: {
            'Connection Pool': {
                subject: 'Database Connection Pool Alert - {{instance}}',
                body: 'The connection pool for {{instance}} in {{details.region}} is near capacity.\n\nCurrent connections: {{details.value}}\nMax connections: {{details.threshold}}\nTimestamp: {{details.timestamp}}\n\nPlease review the connection pool settings.',
                html: '<div style="font-family: Arial, sans-serif; padding: 20px; background-color: #f8f9fa; border-radius: 5px;">\n  <h2 style="color: #dc3545;">Database Connection Pool Alert</h2>\n  <p>The connection pool for <strong>{{instance}}</strong> in <strong>{{details.region}}</strong> is near capacity.</p>\n  <ul>\n    <li>Current connections: <strong>{{details.value}}</strong></li>\n    <li>Max connections: <strong>{{details.threshold}}</strong></li>\n    <li>Timestamp: <strong>{{details.timestamp}}</strong></li>\n  </ul>\n  <p>Please review the connection pool settings.</p>\n</div>'
            }
        }
    }
};

const TemplatePreviewComponent = ({ template, type, onSave }) => {
    const [values, setValues] = useState(defaultValues);
    const [error, setError] = useState(null);
    const [validationErrors, setValidationErrors] = useState({});
    const [activeTab, setActiveTab] = useState(0);
    const [showVariables, setShowVariables] = useState(false);
    const [showSnippets, setShowSnippets] = useState(false);
    const [copied, setCopied] = useState(false);
    const previewUtil = new TemplatePreview();
    const [expandedCategories, setExpandedCategories] = useState({});
    const [searchQuery, setSearchQuery] = useState('');
    const [customTemplates, setCustomTemplates] = useState(() => {
        const saved = localStorage.getItem('customTemplates');
        return saved ? JSON.parse(saved) : {};
    });
    const [showCustomTemplateDialog, setShowCustomTemplateDialog] = useState(false);
    const [newTemplate, setNewTemplate] = useState({
        name: '',
        category: 'Custom Templates',
        subject: '',
        body: '',
        html: ''
    });
    const [searchFilters, setSearchFilters] = useState({
        category: 'all',
        dateRange: 'all',
        tags: []
    });
    const [showFilters, setShowFilters] = useState(false);
    const [availableTags, setAvailableTags] = useState([
        'critical', 'warning', 'info',
        'system', 'service', 'database',
        'performance', 'security', 'health'
    ]);
    const [showShareDialog, setShowShareDialog] = useState(false);
    const [showCustomTagDialog, setShowCustomTagDialog] = useState(false);
    const [newTag, setNewTag] = useState('');
    const [customTags, setCustomTags] = useState(() => {
        const saved = localStorage.getItem('customTags');
        return saved ? JSON.parse(saved) : [];
    });
    const [showAnalyticsDialog, setShowAnalyticsDialog] = useState(false);
    const [showImportDialog, setShowImportDialog] = useState(false);
    const [templateUsage, setTemplateUsage] = useState(() => {
        const saved = localStorage.getItem('templateUsage');
        return saved ? JSON.parse(saved) : {};
    });
    const [importError, setImportError] = useState(null);
    const [templateVersions, setTemplateVersions] = useState(() => {
        const saved = localStorage.getItem('templateVersions');
        return saved ? JSON.parse(saved) : {};
    });
    const [showVersionDialog, setShowVersionDialog] = useState(false);
    const [selectedTemplate, setSelectedTemplate] = useState(null);
    const [timeRange, setTimeRange] = useState('daily');
    const [selectedDataPoint, setSelectedDataPoint] = useState(null);
    const [zoomLevel, setZoomLevel] = useState(1);
    const [analyticsFilters, setAnalyticsFilters] = useState({
        dateRange: 'all',
        categories: [],
        minUses: 0,
        sortBy: 'usage',
        sortOrder: 'desc'
    });
    const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
    const [chartInteractions, setChartInteractions] = useState({
        weeklyTrends: { zoom: 1, pan: { x: 0, y: 0 } },
        usagePatterns: { zoom: 1, pan: { x: 0, y: 0 } }
    });
    const [selectedTimeRange, setSelectedTimeRange] = useState('all');
    const [selectedCategories, setSelectedCategories] = useState([]);
    const [selectedDataPoints, setSelectedDataPoints] = useState([]);
    const [customDateRange, setCustomDateRange] = useState([null, null]);
    const [selectedMetric, setSelectedMetric] = useState('usage');
    const [dataPointDetails, setDataPointDetails] = useState(null);
    const [insights, setInsights] = useState([]);
    const [predictions, setPredictions] = useState([]);
    const [anomalies, setAnomalies] = useState([]);
    const [showInsightsDialog, setShowInsightsDialog] = useState(false);
    const [reportSettings, setReportSettings] = useState({
        frequency: 'weekly',
        format: 'pdf',
        metrics: ['usage', 'trends', 'anomalies', 'predictions'],
        email: '',
        autoActions: true
    });
    const [showReportDialog, setShowReportDialog] = useState(false);
    const [showAISettingsDialog, setShowAISettingsDialog] = useState(false);
    const [aiSettings, setAISettings] = useState({
        anomalyThreshold: 2.0,
        predictionConfidence: 0.8,
        autoActions: true,
        seasonalAnalysis: true,
        userProfiles: true
    });
    const [anomalyAlerts, setAnomalyAlerts] = useState([]);
    const [autoActions, setAutoActions] = useState([]);
    const [showAnomalyDialog, setShowAnomalyDialog] = useState(false);
    const [showAutoActionDialog, setShowAutoActionDialog] = useState(false);
    const [battleMode, setBattleMode] = useState(false);
    const [battleStats, setBattleStats] = useState({
        currentScore: 0,
        previousScore: 0,
        challenges: []
    });
    const [userProfiles, setUserProfiles] = useState([]);
    const [smartBundles, setSmartBundles] = useState({
        abTests: [],
        locationBased: [],
        weatherBased: []
    });
    const [showBundleDialog, setShowBundleDialog] = useState(false);
    const [showProfileDialog, setShowProfileDialog] = useState(false);
    const [dynamicPricing, setDynamicPricing] = useState({
        enabled: false,
        rules: [],
        competitorPrices: {}
    });
    const [userPersonas, setUserPersonas] = useState([]);
    const [subscriptionPlans, setSubscriptionPlans] = useState([]);
    const [inventoryAlerts, setInventoryAlerts] = useState([]);
    const [showPricingDialog, setShowPricingDialog] = useState(false);
    const [showPersonaDialog, setShowPersonaDialog] = useState(false);
    const [showInventoryDialog, setShowInventoryDialog] = useState(false);
    const [inventoryStatus, setInventoryStatus] = useState({
        lowStock: [],
        reorderSuggestions: [],
        demandForecasts: []
    });
    const [businessHealth, setBusinessHealth] = useState({
        metrics: {},
        trends: [],
        recommendations: []
    });
    const [showHealthDialog, setShowHealthDialog] = useState(false);
    const [showGamificationDialog, setShowGamificationDialog] = useState(false);
    const [gamification, setGamification] = useState({
        challenges: [],
        leaderboards: [],
        rewards: []
    });
    const [showBusinessIntelligenceDialog, setShowBusinessIntelligenceDialog] = useState(false);
    const [businessIntelligence, setBusinessIntelligence] = useState({
        kpis: {
            revenueGrowth: 0,
            customerRetention: 0,
            averageOrderValue: 0,
            customerSatisfaction: 0,
            healthScore: 0,
            competitorBenchmark: 0
        },
        marketInsights: [],
        recommendations: [],
        alerts: [],
        predictions: [],
        competitorAnalysis: [],
        inventoryForecasts: [],
        vendorDeals: [],
        growthStrategies: [],
        loyaltyPrograms: [],
        healthMetrics: {
            salesTrend: 0,
            inventoryHealth: 0,
            customerEngagement: 0,
            marketPosition: 0
        }
    });
    const [showHealthScoreDialog, setShowHealthScoreDialog] = useState(false);
    const [showCompetitorDialog, setShowCompetitorDialog] = useState(false);
    const [showGrowthDialog, setShowGrowthDialog] = useState(false);
    const [showSmartAssistantDialog, setShowSmartAssistantDialog] = useState(false);
    const [businessAutomation, setBusinessAutomation] = useState({
        superAutomation: {
            autoGrow: {
                enabled: false,
                triggers: [],
                executedActions: [],
                pendingActions: []
            },
            workforceOptimization: {
                staffSchedule: [],
                recommendations: [],
                peakHours: [],
                autoScheduling: false
            },
            revenueOptimization: {
                pricingSuggestions: [],
                inventoryAlerts: [],
                demandSpikes: [],
                autoAdjustments: []
            }
        },
        smartAdvertising: {
            autoAds: {
                campaigns: [],
                performance: {},
                budget: {},
                targeting: {}
            },
            retargeting: {
                segments: [],
                campaigns: [],
                conversions: []
            },
            flashSales: {
                active: [],
                scheduled: [],
                performance: {}
            }
        }
    });
    const [showSmartAdsDialog, setShowSmartAdsDialog] = useState(false);
    const [showLoyaltyDialog, setShowLoyaltyDialog] = useState(false);

    useEffect(() => {
        setValues(defaultValues);
        setError(null);
        setValidationErrors({});
    }, [type, template]);

    useEffect(() => {
        localStorage.setItem('customTemplates', JSON.stringify(customTemplates));
    }, [customTemplates]);

    useEffect(() => {
        localStorage.setItem('customTags', JSON.stringify(customTags));
    }, [customTags]);

    useEffect(() => {
        localStorage.setItem('templateUsage', JSON.stringify(templateUsage));
    }, [templateUsage]);

    useEffect(() => {
        localStorage.setItem('templateVersions', JSON.stringify(templateVersions));
    }, [templateVersions]);

    const validateField = (name, value) => {
        const rules = validationRules[name];
        if (!rules) return null;

        const errors = [];
        if (rules.required && !value) {
            errors.push('This field is required');
        }
        if (rules.minLength && value.length < rules.minLength) {
            errors.push(`Minimum length is ${rules.minLength} characters`);
        }
        if (rules.maxLength && value.length > rules.maxLength) {
            errors.push(`Maximum length is ${rules.maxLength} characters`);
        }
        if (rules.enum && !rules.enum.includes(value)) {
            errors.push(`Must be one of: ${rules.enum.join(', ')}`);
        }
        if (rules.pattern && !rules.pattern.test(value)) {
            errors.push('Invalid format');
        }

        return errors.length > 0 ? errors : null;
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setValues(prev => {
            const keys = name.split('.');
            if (keys.length > 1) {
                return {
                    ...prev,
                    [keys[0]]: {
                        ...prev[keys[0]],
                        [keys[1]]: value
                    }
                };
            }
            return { ...prev, [name]: value };
        });

        const errors = validateField(name, value);
        setValidationErrors(prev => ({
            ...prev,
            [name]: errors
        }));
    };

    const handleReset = () => {
        setValues(defaultValues);
        setError(null);
        setValidationErrors({});
    };

    const handleSave = () => {
        const errors = {};
        Object.keys(validationRules).forEach(key => {
            const value = key.includes('.') 
                ? key.split('.').reduce((obj, k) => obj?.[k], values)
                : values[key];
            const fieldErrors = validateField(key, value);
            if (fieldErrors) {
                errors[key] = fieldErrors;
            }
        });

        if (Object.keys(errors).length > 0) {
            setValidationErrors(errors);
            return;
        }

        if (onSave) onSave(values);
    };

    const insertVariable = (variable) => {
        const textarea = document.querySelector('textarea[name="template"]');
        if (textarea) {
            const start = textarea.selectionStart;
            const end = textarea.selectionEnd;
            const text = textarea.value;
            const newText = text.substring(0, start) + `{{${variable}}}` + text.substring(end);
            textarea.value = newText;
            textarea.focus();
            textarea.setSelectionRange(start + variable.length + 4, start + variable.length + 4);
        }
    };

    const insertSnippet = (snippet) => {
        if (onSave) {
            onSave({
                ...values,
                template: {
                    subject: snippet.subject,
                    body: snippet.body,
                    html: snippet.html
                }
            });
            trackTemplateUsage(snippet.name);
        }
    };

    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const toggleCategory = (category) => {
        setExpandedCategories(prev => ({
            ...prev,
            [category]: !prev[category]
        }));
    };

    const handleSearch = (e) => {
        setSearchQuery(e.target.value.toLowerCase());
    };

    const handleSaveCustomTemplate = () => {
        if (!newTemplate.name) return;

        const template = {
            ...newTemplate,
            timestamp: new Date().toISOString()
        };

        setCustomTemplates(prev => ({
            ...prev,
            [newTemplate.name]: template
        }));
        saveTemplateVersion(template, newTemplate.name);
        setShowCustomTemplateDialog(false);
        setNewTemplate({
            name: '',
            category: 'Custom Templates',
            subject: '',
            body: '',
            html: ''
        });
    };

    const handleDeleteCustomTemplate = (name) => {
        setCustomTemplates(prev => {
            const newTemplates = { ...prev };
            delete newTemplates[name];
            return newTemplates;
        });
    };

    const handleFilterChange = (filterType, value) => {
        setSearchFilters(prev => ({
            ...prev,
            [filterType]: value
        }));
    };

    const toggleTag = (tag) => {
        setSearchFilters(prev => ({
            ...prev,
            tags: prev.tags.includes(tag)
                ? prev.tags.filter(t => t !== tag)
                : [...prev.tags, tag]
        }));
    };

    const filterTemplates = (snippets) => {
        let filtered = snippets;

        // Text search
        if (searchQuery) {
            filtered = Object.entries(filtered).filter(([name, snippet]) => 
                name.toLowerCase().includes(searchQuery) ||
                snippet.body.toLowerCase().includes(searchQuery)
            );
        }

        // Category filter
        if (searchFilters.category !== 'all') {
            filtered = Object.entries(filtered).filter(([_, snippet]) => 
                snippet.category === searchFilters.category
            );
        }

        // Date range filter
        if (searchFilters.dateRange !== 'all') {
            const now = new Date();
            filtered = Object.entries(filtered).filter(([_, snippet]) => {
                const templateDate = new Date(snippet.timestamp);
                switch (searchFilters.dateRange) {
                    case 'today':
                        return templateDate.toDateString() === now.toDateString();
                    case 'week':
                        return (now - templateDate) <= 7 * 24 * 60 * 60 * 1000;
                    case 'month':
                        return (now - templateDate) <= 30 * 24 * 60 * 60 * 1000;
                    default:
                        return true;
                }
            });
        }

        // Tags filter
        if (searchFilters.tags.length > 0) {
            filtered = Object.entries(filtered).filter(([_, snippet]) => 
                searchFilters.tags.every(tag => snippet.tags?.includes(tag))
            );
        }

        return filtered;
    };

    const renderSearchBar = () => (
        <Box sx={{ mb: 2 }}>
            <Input
                placeholder="Search templates..."
                value={searchQuery}
                onChange={handleSearch}
                startAdornment={<SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />}
                sx={{ width: '100%' }}
            />
        </Box>
    );

    const renderSearchFilters = () => (
        <Box sx={{ mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Typography variant="subtitle1" sx={{ mr: 1 }}>
                    Search Filters
                </Typography>
                <IconButton
                    size="small"
                    onClick={() => setShowFilters(!showFilters)}
                >
                    <FilterListIcon />
                </IconButton>
            </Box>
            {showFilters && (
                <Box sx={{ mt: 1 }}>
                    <Grid container spacing={2}>
                        <Grid item xs={12} sm={4}>
                            <FormLabel>Category</FormLabel>
                            <Input
                                select
                                value={searchFilters.category}
                                onChange={(e) => handleFilterChange('category', e.target.value)}
                                sx={{ width: '100%' }}
                            >
                                <option value="all">All Categories</option>
                                <option value="System Alerts">System Alerts</option>
                                <option value="Service Health">Service Health</option>
                                <option value="Database Alerts">Database Alerts</option>
                                <option value="Custom Templates">Custom Templates</option>
                            </Input>
                        </Grid>
                        <Grid item xs={12} sm={4}>
                            <FormLabel>Date Range</FormLabel>
                            <Input
                                select
                                value={searchFilters.dateRange}
                                onChange={(e) => handleFilterChange('dateRange', e.target.value)}
                                sx={{ width: '100%' }}
                            >
                                <option value="all">All Time</option>
                                <option value="today">Today</option>
                                <option value="week">Last 7 Days</option>
                                <option value="month">Last 30 Days</option>
                            </Input>
                        </Grid>
                        <Grid item xs={12}>
                            <FormLabel>Tags</FormLabel>
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                {availableTags.map(tag => (
                                    <Chip
                                        key={tag}
                                        label={tag}
                                        onClick={() => toggleTag(tag)}
                                        color={searchFilters.tags.includes(tag) ? 'primary' : 'default'}
                                        icon={<TagIcon />}
                                    />
                                ))}
                            </Box>
                        </Grid>
                    </Grid>
                </Box>
            )}
        </Box>
    );

    const renderCustomTemplateDialog = () => (
        <Dialog open={showCustomTemplateDialog} onClose={() => setShowCustomTemplateDialog(false)}>
            <DialogTitle>Save Custom Template</DialogTitle>
            <DialogContent>
                <Grid container spacing={2} sx={{ mt: 1 }}>
                    <Grid item xs={12}>
                        <FormLabel>Template Name</FormLabel>
                        <Input
                            value={newTemplate.name}
                            onChange={(e) => setNewTemplate(prev => ({ ...prev, name: e.target.value }))}
                            placeholder="Enter template name"
                        />
                    </Grid>
                    <Grid item xs={12}>
                        <FormLabel>Subject</FormLabel>
                        <Input
                            value={newTemplate.subject}
                            onChange={(e) => setNewTemplate(prev => ({ ...prev, subject: e.target.value }))}
                            placeholder="Enter subject"
                        />
                    </Grid>
                    <Grid item xs={12}>
                        <FormLabel>Body</FormLabel>
                        <Input
                            multiline
                            rows={4}
                            value={newTemplate.body}
                            onChange={(e) => setNewTemplate(prev => ({ ...prev, body: e.target.value }))}
                            placeholder="Enter body"
                        />
                    </Grid>
                    <Grid item xs={12}>
                        <FormLabel>HTML</FormLabel>
                        <Input
                            multiline
                            rows={4}
                            value={newTemplate.html}
                            onChange={(e) => setNewTemplate(prev => ({ ...prev, html: e.target.value }))}
                            placeholder="Enter HTML"
                        />
                    </Grid>
                </Grid>
            </DialogContent>
            <DialogActions>
                <Button onClick={() => setShowCustomTemplateDialog(false)}>Cancel</Button>
                <Button onClick={handleSaveCustomTemplate} variant="contained">
                    Save Template
                </Button>
            </DialogActions>
        </Dialog>
    );

    const handleExportTemplate = (template) => {
        const exportData = {
            name: template.name,
            category: template.category,
            subject: template.subject,
            body: template.body,
            html: template.html,
            tags: template.tags || [],
            timestamp: new Date().toISOString(),
            version: '1.0'
        };

        const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${template.name.toLowerCase().replace(/\s+/g, '-')}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const handleShareTemplate = (template) => {
        const shareData = {
            name: template.name,
            category: template.category,
            subject: template.subject,
            body: template.body,
            html: template.html,
            tags: template.tags || []
        };

        if (navigator.share) {
            navigator.share({
                title: template.name,
                text: template.body,
                url: window.location.href
            }).catch(console.error);
        } else {
            // Fallback to clipboard copy
            navigator.clipboard.writeText(JSON.stringify(shareData, null, 2));
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const handleAddCustomTag = () => {
        if (!newTag) return;

        setCustomTags(prev => {
            if (prev.includes(newTag)) return prev;
            return [...prev, newTag];
        });
        setNewTag('');
        setShowCustomTagDialog(false);
    };

    const handleDeleteCustomTag = (tag) => {
        setCustomTags(prev => prev.filter(t => t !== tag));
    };

    const renderShareDialog = () => (
        <Dialog open={showShareDialog} onClose={() => setShowShareDialog(false)}>
            <DialogTitle>Share Template</DialogTitle>
            <DialogContent>
                <Typography variant="body2" sx={{ mb: 2 }}>
                    Choose how you want to share this template:
                </Typography>
                <Grid container spacing={2}>
                    <Grid item xs={12}>
                        <Button
                            fullWidth
                            startIcon={<DownloadIcon />}
                            onClick={() => {
                                handleExportTemplate(newTemplate);
                                setShowShareDialog(false);
                            }}
                        >
                            Export as JSON
                        </Button>
                    </Grid>
                    <Grid item xs={12}>
                        <Button
                            fullWidth
                            startIcon={<ShareIcon />}
                            onClick={() => {
                                handleShareTemplate(newTemplate);
                                setShowShareDialog(false);
                            }}
                        >
                            Share via System Share
                        </Button>
                    </Grid>
                </Grid>
            </DialogContent>
        </Dialog>
    );

    const renderCustomTagDialog = () => (
        <Dialog open={showCustomTagDialog} onClose={() => setShowCustomTagDialog(false)}>
            <DialogTitle>Add Custom Tag</DialogTitle>
            <DialogContent>
                <Grid container spacing={2} sx={{ mt: 1 }}>
                    <Grid item xs={12}>
                        <FormLabel>Tag Name</FormLabel>
                        <Input
                            value={newTag}
                            onChange={(e) => setNewTag(e.target.value)}
                            placeholder="Enter tag name"
                        />
                    </Grid>
                </Grid>
            </DialogContent>
            <DialogActions>
                <Button onClick={() => setShowCustomTagDialog(false)}>Cancel</Button>
                <Button onClick={handleAddCustomTag} variant="contained">
                    Add Tag
                </Button>
            </DialogActions>
        </Dialog>
    );

    const renderTagSection = () => (
        <Box sx={{ mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Typography variant="subtitle1" sx={{ mr: 1 }}>
                    Tags
                </Typography>
                <IconButton
                    size="small"
                    onClick={() => setShowCustomTagDialog(true)}
                >
                    <AddTagIcon />
                </IconButton>
            </Box>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {[...availableTags, ...customTags].map(tag => (
                    <Chip
                        key={tag}
                        label={tag}
                        onClick={() => toggleTag(tag)}
                        color={searchFilters.tags.includes(tag) ? 'primary' : 'default'}
                        icon={<TagIcon />}
                        onDelete={customTags.includes(tag) ? () => handleDeleteCustomTag(tag) : undefined}
                    />
                ))}
            </Box>
        </Box>
    );

    const trackTemplateUsage = (templateName) => {
        const now = new Date();
        setTemplateUsage(prev => ({
            ...prev,
            [templateName]: {
                ...prev[templateName],
                totalUses: (prev[templateName]?.totalUses || 0) + 1,
                lastUsed: now.toISOString(),
                usageHistory: [
                    ...(prev[templateName]?.usageHistory || []),
                    now.toISOString()
                ].slice(-100) // Keep last 100 uses
            }
        }));
    };

    const handleImportTemplate = (event) => {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const importedTemplate = JSON.parse(e.target.result);
                if (!importedTemplate.name || !importedTemplate.body) {
                    throw new Error('Invalid template format');
                }

                setCustomTemplates(prev => ({
                    ...prev,
                    [importedTemplate.name]: {
                        ...importedTemplate,
                        timestamp: new Date().toISOString()
                    }
                }));
                setShowImportDialog(false);
                setImportError(null);
            } catch (error) {
                setImportError('Failed to import template. Please check the file format.');
            }
        };
        reader.readAsText(file);
    };

    const getUsageStats = () => {
        const stats = {
            totalTemplates: Object.keys(templateUsage).length,
            totalUses: Object.values(templateUsage).reduce((sum, usage) => sum + usage.totalUses, 0),
            mostUsed: Object.entries(templateUsage)
                .sort(([, a], [, b]) => b.totalUses - a.totalUses)
                .slice(0, 5),
            recentActivity: Object.entries(templateUsage)
                .sort(([, a], [, b]) => new Date(b.lastUsed) - new Date(a.lastUsed))
                .slice(0, 5)
        };

        // Calculate daily usage for the last 7 days
        const last7Days = Array.from({ length: 7 }, (_, i) => {
            const date = new Date();
            date.setDate(date.getDate() - i);
            return date.toISOString().split('T')[0];
        }).reverse();

        stats.dailyUsage = last7Days.map(date => ({
            date,
            count: Object.values(templateUsage).reduce((sum, usage) => {
                return sum + usage.usageHistory.filter(use => 
                    use.startsWith(date)
                ).length;
            }, 0)
        }));

        // Calculate category distribution
        stats.categoryDistribution = Object.entries(templateCategories).map(([category, { snippets }]) => ({
            category,
            count: Object.keys(snippets).length,
            usage: Object.values(templateUsage).reduce((sum, usage) => {
                const templateName = Object.keys(snippets).find(name => 
                    usage.name === name
                );
                return sum + (templateName ? usage.totalUses : 0);
            }, 0)
        }));

        // Calculate hourly usage heatmap data
        const hourlyUsage = Array(24).fill(0);
        Object.values(templateUsage).forEach(usage => {
            usage.usageHistory.forEach(timestamp => {
                const hour = new Date(timestamp).getHours();
                hourlyUsage[hour]++;
            });
        });
        stats.hourlyUsage = hourlyUsage;

        // Calculate weekly usage trends
        const now = new Date();
        const last12Weeks = Array.from({ length: 12 }, (_, i) => {
            const date = new Date(now);
            date.setDate(date.getDate() - (i * 7));
            return date.toISOString().split('T')[0];
        }).reverse();

        stats.weeklyUsage = last12Weeks.map(date => ({
            date,
            count: Object.values(templateUsage).reduce((sum, usage) => {
                return sum + usage.usageHistory.filter(use => 
                    use.startsWith(date)
                ).length;
            }, 0)
        }));

        // Calculate template correlation data
        stats.templateCorrelations = Object.entries(templateUsage).map(([name, usage]) => {
            const hourlyUsage = Array(24).fill(0);
            usage.usageHistory.forEach(timestamp => {
                const hour = new Date(timestamp).getHours();
                hourlyUsage[hour]++;
            });
            return {
                name,
                hourlyUsage,
                totalUses: usage.totalUses
            };
        });

        // Calculate category correlations
        stats.categoryCorrelations = Object.entries(templateCategories).map(([category, { snippets }]) => {
            const categoryTemplates = Object.keys(snippets);
            const hourlyUsage = Array(24).fill(0);
            const weeklyUsage = Array(7).fill(0);
            const totalUses = Object.values(templateUsage).reduce((sum, usage) => {
                const templateName = categoryTemplates.find(name => usage.name === name);
                return sum + (templateName ? usage.totalUses : 0);
            }, 0);

            // Calculate hourly distribution
            Object.values(templateUsage).forEach(usage => {
                if (categoryTemplates.includes(usage.name)) {
                    usage.usageHistory.forEach(timestamp => {
                        const hour = new Date(timestamp).getHours();
                        hourlyUsage[hour]++;
                    });
                }
            });

            // Calculate weekly distribution
            Object.values(templateUsage).forEach(usage => {
                if (categoryTemplates.includes(usage.name)) {
                    usage.usageHistory.forEach(timestamp => {
                        const day = new Date(timestamp).getDay();
                        weeklyUsage[day]++;
                    });
                }
            });

            return {
                category,
                hourlyUsage,
                weeklyUsage,
                totalUses,
                templates: categoryTemplates
            };
        });

        // Calculate cross-category correlations
        stats.crossCategoryCorrelations = Object.entries(templateCategories).map(([category1, { snippets: snippets1 }]) => {
            return Object.entries(templateCategories).map(([category2, { snippets: snippets2 }]) => {
                if (category1 === category2) return null;
                
                const templates1 = Object.keys(snippets1);
                const templates2 = Object.keys(snippets2);
                
                let correlation = 0;
                let totalPairs = 0;

                templates1.forEach(t1 => {
                    templates2.forEach(t2 => {
                        const usage1 = templateUsage[t1]?.usageHistory || [];
                        const usage2 = templateUsage[t2]?.usageHistory || [];
                        
                        // Calculate temporal correlation
                        usage1.forEach(time1 => {
                            usage2.forEach(time2 => {
                                const diff = Math.abs(new Date(time1) - new Date(time2));
                                if (diff < 3600000) { // Within 1 hour
                                    correlation++;
                                }
                                totalPairs++;
                            });
                        });
                    });
                });

                return {
                    category1,
                    category2,
                    correlation: totalPairs > 0 ? correlation / totalPairs : 0
                };
            }).filter(Boolean);
        }).flat()
    };

    const saveTemplateVersion = (template, name) => {
        const now = new Date();
        const version = {
            name,
            timestamp: now.toISOString(),
            content: template,
            version: (templateVersions[name]?.length || 0) + 1
        };

        setTemplateVersions(prev => ({
            ...prev,
            [name]: [...(prev[name] || []), version].slice(-10) // Keep last 10 versions
        }));
    };

    const restoreTemplateVersion = (name, version) => {
        const templateVersion = templateVersions[name]?.find(v => v.version === version);
        if (templateVersion) {
            setCustomTemplates(prev => ({
                ...prev,
                [name]: templateVersion.content
            }));
            setShowVersionDialog(false);
        }
    };

    const renderVersionDialog = () => (
        <Dialog 
            open={showVersionDialog} 
            onClose={() => setShowVersionDialog(false)}
            maxWidth="md"
            fullWidth
        >
            <DialogTitle>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <HistoryIcon sx={{ mr: 1 }} />
                    Template Version History
                </Box>
            </DialogTitle>
            <DialogContent>
                {selectedTemplate && templateVersions[selectedTemplate] ? (
                    <Box>
                        <Typography variant="h6" gutterBottom>
                            {selectedTemplate}
                        </Typography>
                        <Box sx={{ mt: 2 }}>
                            {templateVersions[selectedTemplate].map(version => (
                                <Card key={version.version} sx={{ mb: 1 }}>
                                    <CardContent>
                                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                            <Box>
                                                <Typography variant="subtitle1">
                                                    Version {version.version}
                                                </Typography>
                                                <Typography variant="caption" color="text.secondary">
                                                    {new Date(version.timestamp).toLocaleString()}
                                                </Typography>
                                            </Box>
                                            <Button
                                                startIcon={<RestoreIcon />}
                                                onClick={() => restoreTemplateVersion(selectedTemplate, version.version)}
                                            >
                                                Restore
                                            </Button>
                                        </Box>
                                    </CardContent>
                                </Card>
                            ))}
                        </Box>
                    </Box>
                ) : (
                    <Typography variant="body2" color="text.secondary">
                        No version history available
                    </Typography>
                )}
            </DialogContent>
        </Dialog>
    );

    const handleExportAnalytics = (format) => {
        const stats = getUsageStats();
        let exportData;
        let mimeType;
        let fileExtension;

        switch (format) {
            case 'json':
                exportData = JSON.stringify(stats, null, 2);
                mimeType = 'application/json';
                fileExtension = 'json';
                break;
            case 'csv':
                // Convert stats to CSV format
                const csvRows = [];
                // Add headers
                csvRows.push(['Metric', 'Value']);
                // Add overview data
                csvRows.push(['Total Templates', stats.totalTemplates]);
                csvRows.push(['Total Uses', stats.totalUses]);
                // Add category distribution
                csvRows.push([]);
                csvRows.push(['Category', 'Usage']);
                stats.categoryDistribution.forEach(({ category, usage }) => {
                    csvRows.push([category, usage]);
                });
                // Add time-based data
                csvRows.push([]);
                csvRows.push(['Time', 'Usage']);
                stats.timeData.forEach(({ time, count }) => {
                    csvRows.push([time, count]);
                });
                exportData = csvRows.map(row => row.join(',')).join('\n');
                mimeType = 'text/csv';
                fileExtension = 'csv';
                break;
            case 'excel':
                // For Excel, we'll create a more structured CSV that Excel can open
                const excelRows = [];
                // Overview sheet
                excelRows.push(['Overview']);
                excelRows.push(['Metric', 'Value']);
                excelRows.push(['Total Templates', stats.totalTemplates]);
                excelRows.push(['Total Uses', stats.totalUses]);
                // Category sheet
                excelRows.push([]);
                excelRows.push(['Category Distribution']);
                excelRows.push(['Category', 'Usage']);
                stats.categoryDistribution.forEach(({ category, usage }) => {
                    excelRows.push([category, usage]);
                });
                // Time data sheet
                excelRows.push([]);
                excelRows.push(['Time-based Usage']);
                excelRows.push(['Time', 'Usage']);
                stats.timeData.forEach(({ time, count }) => {
                    excelRows.push([time, count]);
                });
                exportData = excelRows.map(row => row.join('\t')).join('\n');
                mimeType = 'application/vnd.ms-excel';
                fileExtension = 'xls';
                break;
        }

        const blob = new Blob([exportData], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `template-analytics-${new Date().toISOString().split('T')[0]}.${fileExtension}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const filterAnalyticsData = (data) => {
        let filtered = data;

        // Date range filter
        if (analyticsFilters.dateRange !== 'all') {
            const now = new Date();
            filtered = filtered.filter(item => {
                const itemDate = new Date(item.timestamp || item.date);
                switch (analyticsFilters.dateRange) {
                    case 'today':
                        return itemDate.toDateString() === now.toDateString();
                    case 'week':
                        return (now - itemDate) <= 7 * 24 * 60 * 60 * 1000;
                    case 'month':
                        return (now - itemDate) <= 30 * 24 * 60 * 60 * 1000;
                    default:
                        return true;
                }
            });
        }

        // Category filter
        if (analyticsFilters.categories.length > 0) {
            filtered = filtered.filter(item => 
                analyticsFilters.categories.includes(item.category)
            );
        }

        // Minimum uses filter
        if (analyticsFilters.minUses > 0) {
            filtered = filtered.filter(item => 
                (item.usage || item.count) >= analyticsFilters.minUses
            );
        }

        // Sorting
        if (analyticsFilters.sortBy) {
            filtered.sort((a, b) => {
                const aValue = a[analyticsFilters.sortBy];
                const bValue = b[analyticsFilters.sortBy];
                const comparison = aValue > bValue ? 1 : -1;
                return analyticsFilters.sortOrder === 'desc' ? comparison : -comparison;
            });
        }

        return filtered;
    };

    const renderAnalyticsFilters = () => (
        <Box sx={{ mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Typography variant="subtitle1" sx={{ mr: 1 }}>
                    Analytics Filters
                </Typography>
                <IconButton
                    size="small"
                    onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                >
                    <FilterAltIcon />
                </IconButton>
            </Box>
            {showAdvancedFilters && (
                <Grid container spacing={2} sx={{ mt: 1 }}>
                    <Grid item xs={12} sm={4}>
                        <FormLabel>Date Range</FormLabel>
                        <Input
                            select
                            value={analyticsFilters.dateRange}
                            onChange={(e) => setAnalyticsFilters(prev => ({
                                ...prev,
                                dateRange: e.target.value
                            }))}
                            sx={{ width: '100%' }}
                        >
                            <option value="all">All Time</option>
                            <option value="today">Today</option>
                            <option value="week">Last 7 Days</option>
                            <option value="month">Last 30 Days</option>
                        </Input>
                    </Grid>
                    <Grid item xs={12} sm={4}>
                        <FormLabel>Categories</FormLabel>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                            {Object.keys(templateCategories).map(category => (
                                <Chip
                                    key={category}
                                    label={category}
                                    onClick={() => setAnalyticsFilters(prev => ({
                                        ...prev,
                                        categories: prev.categories.includes(category)
                                            ? prev.categories.filter(c => c !== category)
                                            : [...prev.categories, category]
                                    }))}
                                    color={analyticsFilters.categories.includes(category) ? 'primary' : 'default'}
                                />
                            ))}
                        </Box>
                    </Grid>
                    <Grid item xs={12} sm={4}>
                        <FormLabel>Minimum Uses</FormLabel>
                        <Input
                            type="number"
                            value={analyticsFilters.minUses}
                            onChange={(e) => setAnalyticsFilters(prev => ({
                                ...prev,
                                minUses: parseInt(e.target.value) || 0
                            }))}
                            sx={{ width: '100%' }}
                        />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <FormLabel>Sort By</FormLabel>
                        <Input
                            select
                            value={analyticsFilters.sortBy}
                            onChange={(e) => setAnalyticsFilters(prev => ({
                                ...prev,
                                sortBy: e.target.value
                            }))}
                            sx={{ width: '100%' }}
                        >
                            <option value="usage">Usage</option>
                            <option value="name">Name</option>
                            <option value="timestamp">Date</option>
                        </Input>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <FormLabel>Sort Order</FormLabel>
                        <Input
                            select
                            value={analyticsFilters.sortOrder}
                            onChange={(e) => setAnalyticsFilters(prev => ({
                                ...prev,
                                sortOrder: e.target.value
                            }))}
                            sx={{ width: '100%' }}
                        >
                            <option value="desc">Descending</option>
                            <option value="asc">Ascending</option>
                        </Input>
                    </Grid>
                </Grid>
            )}
        </Box>
    );

    const renderExportOptions = () => (
        <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
            <Button
                startIcon={<FileDownloadIcon />}
                onClick={() => handleExportAnalytics('json')}
                size="small"
            >
                Export JSON
            </Button>
            <Button
                startIcon={<TableChartIcon />}
                onClick={() => handleExportAnalytics('csv')}
                size="small"
            >
                Export CSV
            </Button>
            <Button
                startIcon={<TableChartIcon />}
                onClick={() => handleExportAnalytics('excel')}
                size="small"
            >
                Export Excel
            </Button>
        </Box>
    );

    const handleChartInteraction = (chart, action, value) => {
        setChartInteractions(prev => ({
            ...prev,
            [chart]: {
                ...prev[chart],
                [action]: value
            }
        }));
    };

    const exportChartAsImage = (chartId) => {
        const chartElement = document.getElementById(chartId);
        if (chartElement) {
            html2canvas(chartElement).then(canvas => {
                const link = document.createElement('a');
                link.download = `${chartId}-${new Date().toISOString().split('T')[0]}.png`;
                link.href = canvas.toDataURL();
                link.click();
            });
        }
    };

    const shareChartLink = (chartId) => {
        const chartState = {
            id: chartId,
            interactions: chartInteractions[chartId],
            timeRange: selectedTimeRange,
            categories: selectedCategories
        };
        
        const shareUrl = new URL(window.location.href);
        shareUrl.searchParams.set('chart', JSON.stringify(chartState));
        
        navigator.clipboard.writeText(shareUrl.toString());
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const renderChartControls = (chartId) => (
        <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
            <Tooltip title="Zoom In">
                <IconButton
                    size="small"
                    onClick={() => handleChartInteraction(chartId, 'zoom', chartInteractions[chartId].zoom * 1.2)}
                >
                    <ZoomInIcon />
                </IconButton>
            </Tooltip>
            <Tooltip title="Zoom Out">
                <IconButton
                    size="small"
                    onClick={() => handleChartInteraction(chartId, 'zoom', chartInteractions[chartId].zoom * 0.8)}
                >
                    <ZoomOutIcon />
                </IconButton>
            </Tooltip>
            <Tooltip title="Pan Mode">
                <IconButton
                    size="small"
                    onClick={() => handleChartInteraction(chartId, 'panMode', !chartInteractions[chartId].panMode)}
                    color={chartInteractions[chartId].panMode ? 'primary' : 'default'}
                >
                    <PanToolIcon />
                </IconButton>
            </Tooltip>
            <Tooltip title="Export as Image">
                <IconButton
                    size="small"
                    onClick={() => exportChartAsImage(chartId)}
                >
                    <ImageIcon />
                </IconButton>
            </Tooltip>
            <Tooltip title="Share Link">
                <IconButton
                    size="small"
                    onClick={() => shareChartLink(chartId)}
                >
                    <LinkIcon />
                </IconButton>
            </Tooltip>
        </Box>
    );

    const renderCategoryCorrelations = () => {
        const stats = getUsageStats();
        return (
            <Card>
                <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <ScatterPlotIcon sx={{ mr: 1 }} />
                        <Typography variant="h6">
                            Category Correlations
                        </Typography>
                    </Box>
                    {renderChartControls('categoryCorrelations')}
                    <Box sx={{ height: 300, position: 'relative' }}>
                        <Box sx={{ 
                            position: 'absolute', 
                            top: 0, 
                            left: 0, 
                            right: 0, 
                            bottom: 0,
                            display: 'grid',
                            gridTemplateColumns: 'repeat(3, 1fr)',
                            gap: 1
                        }}>
                            {stats.categoryCorrelations.map(({ category, hourlyUsage, weeklyUsage, totalUses }) => (
                                <Box key={category} sx={{ p: 1, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                                    <Typography variant="subtitle2" gutterBottom>
                                        {category}
                                    </Typography>
                                    <Box sx={{ height: 100, display: 'flex', alignItems: 'flex-end', gap: 0.5 }}>
                                        {hourlyUsage.map((count, hour) => {
                                            const maxCount = Math.max(...hourlyUsage);
                                            const height = `${(count / maxCount) * 100}%`;
                                            return (
                                                <Tooltip
                                                    key={hour}
                                                    title={`${count} uses at ${hour}:00`}
                                                >
                                                    <Box
                                                        sx={{
                                                            flex: 1,
                                                            height,
                                                            bgcolor: 'primary.main',
                                                            borderRadius: 0.5,
                                                            transition: 'opacity 0.2s ease',
                                                            '&:hover': {
                                                                opacity: 0.8
                                                            }
                                                        }}
                                                    />
                                                </Tooltip>
                                            );
                                        })}
                                    </Box>
                                    <Typography variant="caption" color="text.secondary">
                                        Total Uses: {totalUses}
                                    </Typography>
                                </Box>
                            ))}
                        </Box>
                    </Box>
                </CardContent>
            </Card>
        );
    };

    const renderCrossCategoryCorrelations = () => {
        const stats = getUsageStats();
        return (
            <Card>
                <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <ScatterPlotIcon sx={{ mr: 1 }} />
                        <Typography variant="h6">
                            Cross-Category Correlations
                        </Typography>
                    </Box>
                    {renderChartControls('crossCategoryCorrelations')}
                    <Box sx={{ height: 300, position: 'relative' }}>
                        <Box sx={{ 
                            position: 'absolute', 
                            top: 0, 
                            left: 0, 
                            right: 0, 
                            bottom: 0,
                            display: 'grid',
                            gridTemplateColumns: 'repeat(3, 1fr)',
                            gap: 1
                        }}>
                            {stats.crossCategoryCorrelations.map(({ category1, category2, correlation }) => (
                                <Box
                                    key={`${category1}-${category2}`}
                                    sx={{
                                        p: 1,
                                        border: '1px solid',
                                        borderColor: 'divider',
                                        borderRadius: 1,
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                    }}
                                >
                                    <Typography variant="caption" align="center">
                                        {category1} ↔ {category2}
                                    </Typography>
                                    <Box
                                        sx={{
                                            width: 60,
                                            height: 60,
                                            borderRadius: '50%',
                                            bgcolor: `rgba(25, 118, 210, ${correlation})`,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            mt: 1
                                        }}
                                    >
                                        <Typography variant="caption" sx={{ color: 'white' }}>
                                            {(correlation * 100).toFixed(0)}%
                                        </Typography>
                                    </Box>
                                </Box>
                            ))}
                        </Box>
                    </Box>
                </CardContent>
            </Card>
        );
    };

    const handleDataPointSelect = (point, chartId) => {
        setSelectedDataPoints(prev => {
            const isSelected = prev.some(p => 
                p.id === point.id && p.chartId === chartId
            );
            
            if (isSelected) {
                return prev.filter(p => 
                    !(p.id === point.id && p.chartId === chartId)
                );
            }
            
            return [...prev, { ...point, chartId }];
        });
    };

    const handleDateRangeChange = (newRange) => {
        setCustomDateRange(newRange);
        setAnalyticsFilters(prev => ({
            ...prev,
            dateRange: 'custom',
            customRange: newRange
        }));
    };

    const filterDataByDateRange = (data) => {
        if (!customDateRange[0] || !customDateRange[1]) return data;

        return data.filter(item => {
            const itemDate = new Date(item.timestamp || item.date);
            return isWithinInterval(itemDate, {
                start: customDateRange[0],
                end: customDateRange[1]
            });
        });
    };

    const renderDataPointDetails = () => {
        if (!dataPointDetails) return null;

        return (
            <Dialog
                open={!!dataPointDetails}
                onClose={() => setDataPointDetails(null)}
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Typography variant="h6">
                            Data Point Details
                        </Typography>
                        <IconButton onClick={() => setDataPointDetails(null)}>
                            <ClearIcon />
                        </IconButton>
                    </Box>
                </DialogTitle>
                <DialogContent>
                    <Grid container spacing={2}>
                        <Grid item xs={12}>
                            <Typography variant="subtitle2" gutterBottom>
                                {dataPointDetails.title}
                            </Typography>
                            {Object.entries(dataPointDetails.data).map(([key, value]) => (
                                <Box key={key} sx={{ mb: 1 }}>
                                    <Typography variant="body2" color="text.secondary">
                                        {key}
                                    </Typography>
                                    <Typography variant="body1">
                                        {typeof value === 'number' ? value.toLocaleString() : value}
                                    </Typography>
                                </Box>
                            ))}
                        </Grid>
                    </Grid>
                </DialogContent>
            </Dialog>
        );
    };

    const renderDateRangeSelector = () => (
        <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle1" gutterBottom>
                Time Range
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                <LocalizationProvider dateAdapter={AdapterDateFns}>
                    <DateRangePicker
                        value={customDateRange}
                        onChange={handleDateRangeChange}
                        renderInput={(startProps, endProps) => (
                            <>
                                <Input {...startProps} />
                                <Box sx={{ mx: 2 }}> to </Box>
                                <Input {...endProps} />
                            </>
                        )}
                    />
                </LocalizationProvider>
                <Button
                    startIcon={<ClearIcon />}
                    onClick={() => {
                        setCustomDateRange([null, null]);
                        setAnalyticsFilters(prev => ({
                            ...prev,
                            dateRange: 'all'
                        }));
                    }}
                >
                    Clear
                </Button>
            </Box>
        </Box>
    );

    const renderDataPointSelection = () => (
        <Box sx={{ mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Typography variant="subtitle1">
                    Selected Data Points
                </Typography>
                <Box>
                    <Tooltip title="Select All">
                        <IconButton
                            size="small"
                            onClick={() => {
                                const allPoints = getUsageStats().weeklyUsage.map(point => ({
                                    ...point,
                                    chartId: 'weeklyUsage'
                                }));
                                setSelectedDataPoints(allPoints);
                            }}
                        >
                            <SelectAllIcon />
                        </IconButton>
                    </Tooltip>
                    <Tooltip title="Clear Selection">
                        <IconButton
                            size="small"
                            onClick={() => setSelectedDataPoints([])}
                        >
                            <ClearIcon />
                        </IconButton>
                    </Tooltip>
                </Box>
            </Box>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
                {selectedDataPoints.map((point, index) => (
                    <Chip
                        key={`${point.chartId}-${point.id || index}`}
                        label={`${point.chartId}: ${point.date || point.name}`}
                        onDelete={() => handleDataPointSelect(point, point.chartId)}
                        color="primary"
                        variant="outlined"
                    />
                ))}
            </Box>
        </Box>
    );

    const generateAIInsights = (stats) => {
        const newInsights = [];
        const newPredictions = [];
        const newAnomalies = [];

        // Analyze hourly usage patterns
        const hourlyUsage = stats.hourlyUsage;
        const maxHour = hourlyUsage.indexOf(Math.max(...hourlyUsage));
        const minHour = hourlyUsage.indexOf(Math.min(...hourlyUsage));
        
        if (maxHour !== minHour) {
            newInsights.push({
                type: 'pattern',
                icon: <TrendingUpIcon />,
                title: 'Peak Usage Hours',
                message: `Peak template usage occurs between ${maxHour}:00 and ${(maxHour + 1) % 24}:00. Consider optimizing your workflow during these hours.`,
                severity: 'info'
            });
        }

        // Analyze weekly trends
        const weeklyUsage = stats.weeklyUsage;
        const recentWeeks = weeklyUsage.slice(-4);
        const trend = recentWeeks.reduce((acc, curr, idx) => {
            return acc + (curr.count - recentWeeks[idx - 1]?.count || 0);
        }, 0) / 3;

        if (Math.abs(trend) > 5) {
            newInsights.push({
                type: 'trend',
                icon: <AutoGraphIcon />,
                title: 'Usage Trend',
                message: trend > 0 
                    ? `Template usage has increased by ${Math.round(trend)}% over the last 4 weeks.`
                    : `Template usage has decreased by ${Math.round(Math.abs(trend))}% over the last 4 weeks.`,
                severity: trend > 0 ? 'success' : 'warning'
            });
        }

        // Predict future usage
        const lastWeekUsage = weeklyUsage[weeklyUsage.length - 1].count;
        const predictedUsage = Math.round(lastWeekUsage * (1 + trend / 100));
        newPredictions.push({
            type: 'forecast',
            icon: <PsychologyIcon />,
            title: 'Usage Forecast',
            message: `Based on current trends, expected usage next week: ${predictedUsage} templates`,
            confidence: Math.min(95, Math.round(100 - Math.abs(trend) * 2))
        });

        // Detect anomalies
        const usageMean = weeklyUsage.reduce((sum, week) => sum + week.count, 0) / weeklyUsage.length;
        const usageStd = Math.sqrt(
            weeklyUsage.reduce((sum, week) => sum + Math.pow(week.count - usageMean, 2), 0) / weeklyUsage.length
        );

        weeklyUsage.forEach((week, idx) => {
            if (Math.abs(week.count - usageMean) > 2 * usageStd) {
                newAnomalies.push({
                    type: 'anomaly',
                    icon: <WarningIcon />,
                    title: 'Usage Anomaly',
                    message: `Unusual template usage detected for ${format(new Date(week.date), 'PPP')}: ${week.count} templates`,
                    severity: 'warning'
                });
            }
        });

        // Category correlation insights
        const categoryCorrelations = stats.categoryCorrelations;
        categoryCorrelations.forEach(({ category, hourlyUsage }) => {
            const peakHour = hourlyUsage.indexOf(Math.max(...hourlyUsage));
            newInsights.push({
                type: 'category',
                icon: <CategoryIcon />,
                title: `${category} Usage Pattern`,
                message: `Peak usage for ${category} templates occurs at ${peakHour}:00`,
                severity: 'info'
            });
        });

        setInsights(newInsights);
        setPredictions(newPredictions);
        setAnomalies(newAnomalies);
    };

    const renderInsightsDialog = () => (
        <Dialog
            open={showInsightsDialog}
            onClose={() => setShowInsightsDialog(false)}
            maxWidth="md"
            fullWidth
        >
            <DialogTitle>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <LightbulbIcon sx={{ mr: 1 }} />
                    AI-Powered Insights
                </Box>
            </DialogTitle>
            <DialogContent>
                <Grid container spacing={3}>
                    <Grid item xs={12}>
                        <Typography variant="h6" gutterBottom>
                            Key Insights
                        </Typography>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            {insights.map((insight, index) => (
                                <Card key={index}>
                                    <CardContent>
                                        <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
                                            <Box sx={{ mr: 2, color: insight.severity === 'success' ? 'success.main' : 
                                                                   insight.severity === 'warning' ? 'warning.main' : 'info.main' }}>
                                                {insight.icon}
                                            </Box>
                                            <Box>
                                                <Typography variant="subtitle1" gutterBottom>
                                                    {insight.title}
                                                </Typography>
                                                <Typography variant="body2" color="text.secondary">
                                                    {insight.message}
                                                </Typography>
                                            </Box>
                                        </Box>
                                    </CardContent>
                                </Card>
                            ))}
                        </Box>
                    </Grid>
                    <Grid item xs={12}>
                        <Typography variant="h6" gutterBottom>
                            Predictions
                        </Typography>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            {predictions.map((prediction, index) => (
                                <Card key={index}>
                                    <CardContent>
                                        <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
                                            <Box sx={{ mr: 2, color: 'primary.main' }}>
                                                {prediction.icon}
                                            </Box>
                                            <Box>
                                                <Typography variant="subtitle1" gutterBottom>
                                                    {prediction.title}
                                                </Typography>
                                                <Typography variant="body2" color="text.secondary">
                                                    {prediction.message}
                                                </Typography>
                                                <Box sx={{ mt: 1 }}>
                                                    <Typography variant="caption" color="text.secondary">
                                                        Confidence: {prediction.confidence}%
                                                    </Typography>
                                                    <Box sx={{ 
                                                        width: '100%', 
                                                        height: 4, 
                                                        bgcolor: 'grey.200', 
                                                        borderRadius: 2,
                                                        mt: 0.5
                                                    }}>
                                                        <Box sx={{ 
                                                            width: `${prediction.confidence}%`,
                                                            height: '100%',
                                                            bgcolor: 'primary.main',
                                                            borderRadius: 2
                                                        }} />
                                                    </Box>
                                                </Box>
                                            </Box>
                                        </Box>
                                    </CardContent>
                                </Card>
                            ))}
                        </Box>
                    </Grid>
                    <Grid item xs={12}>
                        <Typography variant="h6" gutterBottom>
                            Anomalies
                        </Typography>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            {anomalies.map((anomaly, index) => (
                                <Card key={index}>
                                    <CardContent>
                                        <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
                                            <Box sx={{ mr: 2, color: 'warning.main' }}>
                                                {anomaly.icon}
                                            </Box>
                                            <Box>
                                                <Typography variant="subtitle1" gutterBottom>
                                                    {anomaly.title}
                                                </Typography>
                                                <Typography variant="body2" color="text.secondary">
                                                    {anomaly.message}
                                                </Typography>
                                            </Box>
                                        </Box>
                                    </CardContent>
                                </Card>
                            ))}
                        </Box>
                    </Grid>
                </Grid>
            </DialogContent>
        </Dialog>
    );

    const generateAIPredictions = (stats) => {
        const predictions = [];
        const now = new Date();
        const nextWeek = new Date(now);
        nextWeek.setDate(now.getDate() + 7);

        // Seasonal analysis
        const isHolidaySeason = now.getMonth() === 11 || now.getMonth() === 0;
        const isWeekend = now.getDay() === 0 || now.getDay() === 6;
        
        if (isHolidaySeason) {
            predictions.push({
                type: 'seasonal',
                icon: <CalendarTodayIcon />,
                title: 'Holiday Season Impact',
                message: 'Expected 30% increase in template usage during holiday season',
                confidence: 0.85,
                action: 'Consider preparing holiday-specific templates'
            });
        }

        // User behavior patterns
        const userPatterns = analyzeUserPatterns(stats);
        if (userPatterns.length > 0) {
            predictions.push(...userPatterns);
        }

        // Trend forecasting
        const trend = calculateTrend(stats.weeklyUsage);
        if (Math.abs(trend) > 0.1) {
            predictions.push({
                type: 'trend',
                icon: <AutoGraphIcon />,
                title: 'Usage Trend Forecast',
                message: `Expected ${trend > 0 ? 'increase' : 'decrease'} of ${Math.abs(Math.round(trend * 100))}% in template usage`,
                confidence: 0.75,
                action: trend > 0 ? 'Consider scaling up resources' : 'Review template effectiveness'
            });
        }

        return predictions;
    };

    const analyzeUserPatterns = (stats) => {
        const patterns = [];
        const userProfiles = generateUserProfiles(stats);
        
        userProfiles.forEach(profile => {
            patterns.push({
                type: 'user_pattern',
                icon: <PersonIcon />,
                title: `${profile.type} User Pattern`,
                message: `${profile.description}`,
                confidence: profile.confidence,
                action: profile.recommendation
            });
        });

        return patterns;
    };

    const generateUserProfiles = (stats) => {
        const profiles = [];
        const usagePatterns = stats.templateUsage;

        // Analyze usage patterns to identify user types
        Object.entries(usagePatterns).forEach(([template, usage]) => {
            const hourlyDistribution = Array(24).fill(0);
            usage.usageHistory.forEach(timestamp => {
                const hour = new Date(timestamp).getHours();
                hourlyDistribution[hour]++;
            });

            const peakHour = hourlyDistribution.indexOf(Math.max(...hourlyDistribution));
            const isNightUser = peakHour >= 20 || peakHour <= 4;
            const isFrequentUser = usage.totalUses > 10;
            const preferredCategories = getPreferredCategories(template, stats);

            if (isNightUser && isFrequentUser) {
                profiles.push({
                    type: 'Night Owl',
                    description: 'Frequent template usage during late hours',
                    confidence: 0.85,
                    recommendation: 'Consider adding night-specific templates',
                    preferredCategories,
                    usagePattern: hourlyDistribution
                });
            }

            if (preferredCategories.length > 2) {
                profiles.push({
                    type: 'Category Explorer',
                    description: 'Diverse template usage across multiple categories',
                    confidence: 0.75,
                    recommendation: 'Offer category bundles',
                    preferredCategories,
                    usagePattern: hourlyDistribution
                });
            }
        });

        return profiles;
    };

    const getPreferredCategories = (template, stats) => {
        return stats.categoryCorrelations
            .filter(cat => cat.templates.includes(template))
            .map(cat => cat.category);
    };

    const generatePDFReport = (stats, insights) => {
        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.width;
        const margin = 20;
        let yPos = margin;

        // Title
        doc.setFontSize(24);
        doc.text('Template Analytics Report', margin, yPos);
        yPos += 20;

        // Overview
        doc.setFontSize(16);
        doc.text('Overview', margin, yPos);
        yPos += 10;
        doc.setFontSize(12);
        doc.text(`Total Templates: ${stats.totalTemplates}`, margin, yPos);
        yPos += 7;
        doc.text(`Total Uses: ${stats.totalUses}`, margin, yPos);
        yPos += 15;

        // AI Insights
        doc.setFontSize(16);
        doc.text('AI-Powered Insights', margin, yPos);
        yPos += 10;
        doc.setFontSize(12);
        insights.forEach(insight => {
            if (yPos > 250) {
                doc.addPage();
                yPos = margin;
            }
            doc.text(`• ${insight.message}`, margin, yPos);
            yPos += 7;
        });

        // Save the PDF
        doc.save(`template-analytics-${new Date().toISOString().split('T')[0]}.pdf`);
    };

    const renderReportSettingsDialog = () => (
        <Dialog
            open={showReportDialog}
            onClose={() => setShowReportDialog(false)}
            maxWidth="sm"
            fullWidth
        >
            <DialogTitle>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <AssessmentIcon sx={{ mr: 1 }} />
                    Report Settings
                </Box>
            </DialogTitle>
            <DialogContent>
                <Grid container spacing={2} sx={{ mt: 1 }}>
                    <Grid item xs={12}>
                        <FormLabel>Report Frequency</FormLabel>
                        <Input
                            select
                            value={reportSettings.frequency}
                            onChange={(e) => setReportSettings(prev => ({
                                ...prev,
                                frequency: e.target.value
                            }))}
                            sx={{ width: '100%' }}
                        >
                            <option value="daily">Daily</option>
                            <option value="weekly">Weekly</option>
                            <option value="monthly">Monthly</option>
                        </Input>
                    </Grid>
                    <Grid item xs={12}>
                        <FormLabel>Report Format</FormLabel>
                        <Input
                            select
                            value={reportSettings.format}
                            onChange={(e) => setReportSettings(prev => ({
                                ...prev,
                                format: e.target.value
                            }))}
                            sx={{ width: '100%' }}
                        >
                            <option value="pdf">PDF</option>
                            <option value="excel">Excel</option>
                            <option value="json">JSON</option>
                            <option value="csv">CSV</option>
                        </Input>
                    </Grid>
                    <Grid item xs={12}>
                        <FormLabel>Metrics to Include</FormLabel>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                            {['usage', 'trends', 'anomalies', 'predictions'].map(metric => (
                                <Chip
                                    key={metric}
                                    label={metric}
                                    onClick={() => setReportSettings(prev => ({
                                        ...prev,
                                        metrics: prev.metrics.includes(metric)
                                            ? prev.metrics.filter(m => m !== metric)
                                            : [...prev.metrics, metric]
                                    }))}
                                    color={reportSettings.metrics.includes(metric) ? 'primary' : 'default'}
                                />
                            ))}
                        </Box>
                    </Grid>
                    <Grid item xs={12}>
                        <FormLabel>Email for Reports</FormLabel>
                        <Input
                            type="email"
                            value={reportSettings.email}
                            onChange={(e) => setReportSettings(prev => ({
                                ...prev,
                                email: e.target.value
                            }))}
                            placeholder="Enter email address"
                            sx={{ width: '100%' }}
                        />
                    </Grid>
                    <Grid item xs={12}>
                        <FormControlLabel
                            control={
                                <Switch
                                    checked={reportSettings.autoActions}
                                    onChange={(e) => setReportSettings(prev => ({
                                        ...prev,
                                        autoActions: e.target.checked
                                    }))}
                                />
                            }
                            label="Enable AI Auto-Actions"
                        />
                    </Grid>
                </Grid>
            </DialogContent>
            <DialogActions>
                <Button onClick={() => setShowReportDialog(false)}>Cancel</Button>
                <Button
                    onClick={() => {
                        const stats = getUsageStats();
                        const insights = generateAIInsights(stats);
                        generatePDFReport(stats, insights);
                        setShowReportDialog(false);
                    }}
                    variant="contained"
                >
                    Generate Report
                </Button>
            </DialogActions>
        </Dialog>
    );

    const renderAISettingsDialog = () => (
        <Dialog
            open={showAISettingsDialog}
            onClose={() => setShowAISettingsDialog(false)}
            maxWidth="sm"
            fullWidth
        >
            <DialogTitle>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <SmartToyIcon sx={{ mr: 1 }} />
                    AI Settings
                </Box>
            </DialogTitle>
            <DialogContent>
                <Grid container spacing={2} sx={{ mt: 1 }}>
                    <Grid item xs={12}>
                        <FormLabel>Anomaly Detection Threshold</FormLabel>
                        <Slider
                            value={aiSettings.anomalyThreshold}
                            onChange={(_, value) => setAISettings(prev => ({
                                ...prev,
                                anomalyThreshold: value
                            }))}
                            min={1}
                            max={5}
                            step={0.1}
                            marks
                        />
                        <Typography variant="caption" color="text.secondary">
                            Standard deviations from mean
                        </Typography>
                    </Grid>
                    <Grid item xs={12}>
                        <FormLabel>Prediction Confidence Threshold</FormLabel>
                        <Slider
                            value={aiSettings.predictionConfidence}
                            onChange={(_, value) => setAISettings(prev => ({
                                ...prev,
                                predictionConfidence: value
                            }))}
                            min={0}
                            max={1}
                            step={0.1}
                            marks
                        />
                        <Typography variant="caption" color="text.secondary">
                            Minimum confidence for predictions
                        </Typography>
                    </Grid>
                    <Grid item xs={12}>
                        <FormControlLabel
                            control={
                                <Switch
                                    checked={aiSettings.autoActions}
                                    onChange={(e) => setAISettings(prev => ({
                                        ...prev,
                                        autoActions: e.target.checked
                                    }))}
                                />
                            }
                            label="Enable AI Auto-Actions"
                        />
                    </Grid>
                    <Grid item xs={12}>
                        <FormControlLabel
                            control={
                                <Switch
                                    checked={aiSettings.seasonalAnalysis}
                                    onChange={(e) => setAISettings(prev => ({
                                        ...prev,
                                        seasonalAnalysis: e.target.checked
                                    }))}
                                />
                            }
                            label="Enable Seasonal Analysis"
                        />
                    </Grid>
                    <Grid item xs={12}>
                        <FormControlLabel
                            control={
                                <Switch
                                    checked={aiSettings.userProfiles}
                                    onChange={(e) => setAISettings(prev => ({
                                        ...prev,
                                        userProfiles: e.target.checked
                                    }))}
                                />
                            }
                            label="Enable User Profile Analysis"
                        />
                    </Grid>
                </Grid>
            </DialogContent>
            <DialogActions>
                <Button onClick={() => setShowAISettingsDialog(false)}>Cancel</Button>
                <Button
                    onClick={() => {
                        localStorage.setItem('aiSettings', JSON.stringify(aiSettings));
                        setShowAISettingsDialog(false);
                    }}
                    variant="contained"
                >
                    Save Settings
                </Button>
            </DialogActions>
        </Dialog>
    );

    const detectAnomalies = (stats) => {
        const anomalies = [];
        const threshold = aiSettings.anomalyThreshold;

        // Daily usage anomalies
        const dailyUsage = stats.dailyUsage;
        const usageMean = dailyUsage.reduce((sum, day) => sum + day.count, 0) / dailyUsage.length;
        const usageStd = Math.sqrt(
            dailyUsage.reduce((sum, day) => sum + Math.pow(day.count - usageMean, 2), 0) / dailyUsage.length
        );

        dailyUsage.forEach(day => {
            const zScore = Math.abs(day.count - usageMean) / usageStd;
            if (zScore > threshold) {
                anomalies.push({
                    type: 'usage_anomaly',
                    icon: <NotificationsActiveIcon />,
                    title: 'Usage Anomaly Detected',
                    message: `Unusual template usage on ${format(new Date(day.date), 'PPP')}: ${day.count} templates (${zScore.toFixed(2)} standard deviations from mean)`,
                    severity: zScore > 3 ? 'critical' : 'warning',
                    timestamp: new Date().toISOString()
                });
            }
        });

        // Category correlation anomalies
        const categoryCorrelations = stats.categoryCorrelations;
        categoryCorrelations.forEach(({ category, hourlyUsage }) => {
            const usageMean = hourlyUsage.reduce((sum, count) => sum + count, 0) / 24;
            const usageStd = Math.sqrt(
                hourlyUsage.reduce((sum, count) => sum + Math.pow(count - usageMean, 2), 0) / 24
            );

            hourlyUsage.forEach((count, hour) => {
                const zScore = Math.abs(count - usageMean) / usageStd;
                if (zScore > threshold) {
                    anomalies.push({
                        type: 'category_anomaly',
                        icon: <CategoryIcon />,
                        title: 'Category Usage Anomaly',
                        message: `Unusual ${category} template usage at ${hour}:00: ${count} templates (${zScore.toFixed(2)} standard deviations from mean)`,
                        severity: zScore > 3 ? 'critical' : 'warning',
                        timestamp: new Date().toISOString()
                    });
                }
            });
        });

        return anomalies;
    };

    const generateAutoActions = (anomalies) => {
        const actions = [];

        anomalies.forEach(anomaly => {
            if (anomaly.type === 'usage_anomaly' && anomaly.severity === 'critical') {
                actions.push({
                    type: 'promo',
                    icon: <AutoFixHighIcon />,
                    title: 'Auto-Promotion',
                    message: 'Launching "Surge-Free Guarantee" promotion to retain users',
                    status: 'pending',
                    timestamp: new Date().toISOString()
                });
            }

            if (anomaly.type === 'category_anomaly') {
                actions.push({
                    type: 'optimization',
                    icon: <AutoFixHighIcon />,
                    title: 'Template Optimization',
                    message: `Optimizing ${anomaly.category} templates for peak usage hours`,
                    status: 'pending',
                    timestamp: new Date().toISOString()
                });
            }
        });

        return actions;
    };

    const handleBattleMode = () => {
        setBattleMode(!battleMode);
        if (!battleMode) {
            const stats = getUsageStats();
            const currentScore = calculateBattleScore(stats);
            setBattleStats(prev => ({
                ...prev,
                currentScore,
                previousScore: prev.currentScore,
                challenges: generateChallenges(stats)
            }));
        }
    };

    const calculateBattleScore = (stats) => {
        let score = 0;
        // Usage growth
        const usageGrowth = stats.weeklyUsage[stats.weeklyUsage.length - 1].count / 
                          stats.weeklyUsage[stats.weeklyUsage.length - 2].count;
        score += (usageGrowth - 1) * 100;

        // Category diversity
        const categoryCount = stats.categoryDistribution.length;
        score += categoryCount * 10;

        // User engagement
        const activeUsers = Object.keys(stats.templateUsage).length;
        score += activeUsers * 5;

        return Math.round(score);
    };

    const generateChallenges = (stats) => {
        const challenges = [];
        const currentUsage = stats.weeklyUsage[stats.weeklyUsage.length - 1].count;
        const previousUsage = stats.weeklyUsage[stats.weeklyUsage.length - 2].count;

        if (currentUsage < previousUsage) {
            challenges.push({
                type: 'usage',
                title: 'Usage Recovery',
                message: `Increase template usage by ${Math.round((previousUsage - currentUsage) / previousUsage * 100)}%`,
                reward: 50
            });
        }

        const categoryCount = stats.categoryDistribution.length;
        if (categoryCount < 5) {
            challenges.push({
                type: 'diversity',
                title: 'Category Expansion',
                message: `Add ${5 - categoryCount} new template categories`,
                reward: 30
            });
        }

        return challenges;
    };

    const renderAnomalyDialog = () => (
        <Dialog
            open={showAnomalyDialog}
            onClose={() => setShowAnomalyDialog(false)}
            maxWidth="md"
            fullWidth
        >
            <DialogTitle>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <NotificationsActiveIcon sx={{ mr: 1 }} />
                    Anomaly Detection
                </Box>
            </DialogTitle>
            <DialogContent>
                <Grid container spacing={2}>
                    {anomalyAlerts.map((alert, index) => (
                        <Grid item xs={12} key={index}>
                            <Card>
                                <CardContent>
                                    <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
                                        <Box sx={{ mr: 2, color: alert.severity === 'critical' ? 'error.main' : 'warning.main' }}>
                                            {alert.icon}
                                        </Box>
                                        <Box>
                                            <Typography variant="subtitle1" gutterBottom>
                                                {alert.title}
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary">
                                                {alert.message}
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary">
                                                {format(new Date(alert.timestamp), 'PPP p')}
                                            </Typography>
                                        </Box>
                                    </Box>
                                </CardContent>
                            </Card>
                        </Grid>
                    ))}
                </Grid>
            </DialogContent>
        </Dialog>
    );

    const renderAutoActionDialog = () => (
        <Dialog
            open={showAutoActionDialog}
            onClose={() => setShowAutoActionDialog(false)}
            maxWidth="md"
            fullWidth
        >
            <DialogTitle>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <AutoFixHighIcon sx={{ mr: 1 }} />
                    AI Auto-Actions
                </Box>
            </DialogTitle>
            <DialogContent>
                <Grid container spacing={2}>
                    {autoActions.map((action, index) => (
                        <Grid item xs={12} key={index}>
                            <Card>
                                <CardContent>
                                    <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
                                        <Box sx={{ mr: 2, color: 'primary.main' }}>
                                            {action.icon}
                                        </Box>
                                        <Box>
                                            <Typography variant="subtitle1" gutterBottom>
                                                {action.title}
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary">
                                                {action.message}
                                            </Typography>
                                            <Box sx={{ mt: 1, display: 'flex', gap: 1 }}>
                                                <Chip
                                                    label={action.status}
                                                    color={action.status === 'pending' ? 'warning' : 'success'}
                                                    size="small"
                                                />
                                                <Typography variant="caption" color="text.secondary">
                                                    {format(new Date(action.timestamp), 'PPP p')}
                                                </Typography>
                                            </Box>
                                        </Box>
                                    </Box>
                                </CardContent>
                            </Card>
                        </Grid>
                    ))}
                </Grid>
            </DialogContent>
        </Dialog>
    );

    const renderBattleMode = () => (
        <Card sx={{ mb: 2 }}>
            <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <EmojiEventsIcon sx={{ mr: 1, color: 'primary.main' }} />
                        <Typography variant="h6">
                            AI Battle Mode
                        </Typography>
                    </Box>
                    <Switch
                        checked={battleMode}
                        onChange={handleBattleMode}
                        color="primary"
                    />
                </Box>
                {battleMode && (
                    <Grid container spacing={2}>
                        <Grid item xs={12} md={6}>
                            <Card variant="outlined">
                                <CardContent>
                                    <Typography variant="subtitle2" gutterBottom>
                                        Current Score
                                    </Typography>
                                    <Typography variant="h4" color="primary">
                                        {battleStats.currentScore}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                        Previous Score: {battleStats.previousScore}
                                    </Typography>
                                </CardContent>
                            </Card>
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <Card variant="outlined">
                                <CardContent>
                                    <Typography variant="subtitle2" gutterBottom>
                                        Active Challenges
                                    </Typography>
                                    {battleStats.challenges.map((challenge, index) => (
                                        <Box key={index} sx={{ mb: 1 }}>
                                            <Typography variant="body2">
                                                {challenge.title}
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary">
                                                {challenge.message}
                                            </Typography>
                                            <Chip
                                                label={`+${challenge.reward} points`}
                                                size="small"
                                                color="primary"
                                                sx={{ mt: 0.5 }}
                                            />
                                        </Box>
                                    ))}
                                </CardContent>
                            </Card>
                        </Grid>
                    </Grid>
                )}
            </CardContent>
        </Card>
    );

    const analyzeCategoryCorrelations = (stats) => {
        const correlations = [];
        const categoryUsage = stats.categoryCorrelations;

        // Calculate cross-category correlations
        categoryUsage.forEach((category1, i) => {
            categoryUsage.forEach((category2, j) => {
                if (i !== j) {
                    const correlation = calculateCorrelation(
                        category1.hourlyUsage,
                        category2.hourlyUsage
                    );
                    if (Math.abs(correlation) > 0.5) {
                        correlations.push({
                            category1: category1.category,
                            category2: category2.category,
                            correlation,
                            strength: Math.abs(correlation) > 0.8 ? 'strong' : 'moderate',
                            timestamp: new Date().toISOString()
                        });
                    }
                }
            });
        });

        return correlations;
    };

    const calculateCorrelation = (array1, array2) => {
        const mean1 = array1.reduce((sum, val) => sum + val, 0) / array1.length;
        const mean2 = array2.reduce((sum, val) => sum + val, 0) / array2.length;

        const covariance = array1.reduce((sum, val1, i) => 
            sum + (val1 - mean1) * (array2[i] - mean2), 0) / array1.length;

        const std1 = Math.sqrt(array1.reduce((sum, val) => 
            sum + Math.pow(val - mean1, 2), 0) / array1.length);
        const std2 = Math.sqrt(array2.reduce((sum, val) => 
            sum + Math.pow(val - mean2, 2), 0) / array2.length);

        return covariance / (std1 * std2);
    };

    const generateSmartBundles = (stats, correlations) => {
        const bundles = [];
        const strongCorrelations = correlations.filter(c => c.strength === 'strong');

        strongCorrelations.forEach(({ category1, category2, correlation }) => {
            const templates1 = stats.categoryCorrelations.find(c => c.category === category1)?.templates || [];
            const templates2 = stats.categoryCorrelations.find(c => c.category === category2)?.templates || [];

            // Create bundle suggestions
            templates1.forEach(t1 => {
                templates2.forEach(t2 => {
                    bundles.push({
                        name: `${t1} + ${t2}`,
                        templates: [t1, t2],
                        categories: [category1, category2],
                        correlation,
                        potentialUpsell: calculateUpsellPotential(t1, t2, stats),
                        timestamp: new Date().toISOString()
                    });
                });
            });
        });

        return bundles;
    };

    const calculateUpsellPotential = (template1, template2, stats) => {
        const usage1 = stats.templateUsage[template1]?.totalUses || 0;
        const usage2 = stats.templateUsage[template2]?.totalUses || 0;
        return Math.min(usage1, usage2) / Math.max(usage1, usage2);
    };

    const renderBundleDialog = () => (
        <Dialog
            open={showBundleDialog}
            onClose={() => setShowBundleDialog(false)}
            maxWidth="md"
            fullWidth
        >
            <DialogTitle>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <ShoppingCartIcon sx={{ mr: 1 }} />
                    Smart Bundles
                </Box>
            </DialogTitle>
            <DialogContent>
                <Grid container spacing={2}>
                    {smartBundles.map((bundle, index) => (
                        <Grid item xs={12} key={index}>
                            <Card>
                                <CardContent>
                                    <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
                                        <Box sx={{ mr: 2, color: 'primary.main' }}>
                                            <ShoppingCartIcon />
                                        </Box>
                                        <Box>
                                            <Typography variant="subtitle1" gutterBottom>
                                                {bundle.name}
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary">
                                                Categories: {bundle.categories.join(' + ')}
                                            </Typography>
                                            <Box sx={{ mt: 1, display: 'flex', gap: 1 }}>
                                                <Chip
                                                    label={`${(bundle.correlation * 100).toFixed(0)}% correlation`}
                                                    color={bundle.strength === 'strong' ? 'primary' : 'default'}
                                                    size="small"
                                                />
                                                <Chip
                                                    label={`${(bundle.potentialUpsell * 100).toFixed(0)}% upsell potential`}
                                                    color="success"
                                                    size="small"
                                                />
                                            </Box>
                                            <Typography variant="caption" color="text.secondary">
                                                {format(new Date(bundle.timestamp), 'PPP p')}
                                            </Typography>
                                        </Box>
                                    </Box>
                                </CardContent>
                            </Card>
                        </Grid>
                    ))}
                </Grid>
            </DialogContent>
        </Dialog>
    );

    const renderProfileDialog = () => (
        <Dialog
            open={showProfileDialog}
            onClose={() => setShowProfileDialog(false)}
            maxWidth="md"
            fullWidth
        >
            <DialogTitle>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <GroupIcon sx={{ mr: 1 }} />
                    User Profiles
                </Box>
            </DialogTitle>
            <DialogContent>
                <Grid container spacing={2}>
                    {userProfiles.map((profile, index) => (
                        <Grid item xs={12} key={index}>
                            <Card>
                                <CardContent>
                                    <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
                                        <Box sx={{ mr: 2, color: 'primary.main' }}>
                                            <PersonIcon />
                                        </Box>
                                        <Box>
                                            <Typography variant="subtitle1" gutterBottom>
                                                {profile.type}
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary">
                                                {profile.description}
                                            </Typography>
                                            <Box sx={{ mt: 1 }}>
                                                <Typography variant="caption" color="text.secondary">
                                                    Preferred Categories:
                                                </Typography>
                                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
                                                    {profile.preferredCategories.map(category => (
                                                        <Chip
                                                            key={category}
                                                            label={category}
                                                            size="small"
                                                        />
                                                    ))}
                                                </Box>
                                            </Box>
                                            <Box sx={{ mt: 1, display: 'flex', gap: 1 }}>
                                                <Chip
                                                    label={`${(profile.confidence * 100).toFixed(0)}% confidence`}
                                                    color="primary"
                                                    size="small"
                                                />
                                                <Typography variant="caption" color="text.secondary">
                                                    {format(new Date(profile.timestamp), 'PPP p')}
                                                </Typography>
                                            </Box>
                                        </Box>
                                    </Box>
                                </CardContent>
                            </Card>
                        </Grid>
                    ))}
                </Grid>
            </DialogContent>
        </Dialog>
    );

    const generateDynamicPricing = (stats) => {
        const rules = [];
        const now = new Date();
        const hour = now.getHours();
        const day = now.getDay();

        // Time-based pricing
        if (hour >= 20 || hour <= 4) {
            rules.push({
                type: 'time_based',
                title: 'Late Night Premium',
                description: 'Increased pricing during peak late-night hours',
                adjustment: 1.15, // 15% increase
                conditions: {
                    timeRange: '20:00-04:00',
                    categories: ['liquor', 'food']
                }
            });
        }

        // Weekend pricing
        if (day === 5 || day === 6) {
            rules.push({
                type: 'weekend',
                title: 'Weekend Special',
                description: 'Weekend pricing for popular items',
                adjustment: 1.10, // 10% increase
                conditions: {
                    days: ['Saturday', 'Sunday'],
                    categories: ['liquor', 'party']
                }
            });
        }

        // Demand-based pricing
        const demandSpikes = detectDemandSpikes(stats);
        demandSpikes.forEach(spike => {
            rules.push({
                type: 'demand_based',
                title: 'High Demand Adjustment',
                description: `Price adjustment for ${spike.category} due to increased demand`,
                adjustment: 1.05, // 5% increase
                conditions: {
                    category: spike.category,
                    demandIncrease: spike.increase
                }
            });
        });

        return rules;
    };

    const detectDemandSpikes = (stats) => {
        const spikes = [];
        const categoryUsage = stats.categoryCorrelations;

        categoryUsage.forEach(category => {
            const recentUsage = category.hourlyUsage.slice(-24);
            const previousUsage = category.hourlyUsage.slice(-48, -24);
            
            const recentAvg = recentUsage.reduce((sum, val) => sum + val, 0) / 24;
            const previousAvg = previousUsage.reduce((sum, val) => sum + val, 0) / 24;
            
            const increase = (recentAvg - previousAvg) / previousAvg;
            
            if (increase > 0.2) { // 20% increase threshold
                spikes.push({
                    category: category.category,
                    increase: increase,
                    timestamp: new Date().toISOString()
                });
            }
        });

        return spikes;
    };

    const generateUserPersonas = (stats) => {
        const personas = [];
        const usagePatterns = stats.templateUsage;

        // Luxury Buyer Profile
        const luxuryBuyers = Object.entries(usagePatterns)
            .filter(([_, usage]) => {
                const avgOrderValue = calculateAverageOrderValue(usage);
                return avgOrderValue > 1000;
            })
            .map(([template, usage]) => ({
                type: 'Luxury Buyer',
                description: 'High-value orders with premium products',
                characteristics: ['High order value', 'Premium products', 'Regular ordering'],
                confidence: 0.85,
                recommendations: ['VIP access', 'Exclusive bundles', 'Priority service']
            }));

        // Budget Shopper Profile
        const budgetShoppers = Object.entries(usagePatterns)
            .filter(([_, usage]) => {
                const avgOrderValue = calculateAverageOrderValue(usage);
                return avgOrderValue < 500;
            })
            .map(([template, usage]) => ({
                type: 'Budget Shopper',
                description: 'Value-conscious orders with focus on deals',
                characteristics: ['Lower order value', 'Deal-seeking', 'Bulk purchases'],
                confidence: 0.75,
                recommendations: ['Bulk discounts', 'Bundle deals', 'Loyalty rewards']
            }));

        // Party Lover Profile
        const partyLovers = Object.entries(usagePatterns)
            .filter(([_, usage]) => {
                const isNightUser = isNightTimeUser(usage);
                const hasPartyItems = hasPartyCategoryItems(usage);
                return isNightUser && hasPartyItems;
            })
            .map(([template, usage]) => ({
                type: 'Party Lover',
                description: 'Late-night orders with party items',
                characteristics: ['Night-time ordering', 'Party items', 'Group orders'],
                confidence: 0.80,
                recommendations: ['Party bundles', 'Group discounts', 'Late-night specials']
            }));

        return [...luxuryBuyers, ...budgetShoppers, ...partyLovers];
    };

    const calculateAverageOrderValue = (usage) => {
        // Implementation depends on your data structure
        return usage.totalUses * 100; // Placeholder
    };

    const isNightTimeUser = (usage) => {
        const nightHours = usage.usageHistory.filter(timestamp => {
            const hour = new Date(timestamp).getHours();
            return hour >= 20 || hour <= 4;
        });
        return nightHours.length > usage.usageHistory.length * 0.5;
    };

    const hasPartyCategoryItems = (usage) => {
        // Implementation depends on your data structure
        return true; // Placeholder
    };

    const generateSubscriptionPlans = (stats, personas) => {
        const plans = [];
        const usagePatterns = stats.templateUsage;

        // Analyze usage patterns for subscription opportunities
        Object.entries(usagePatterns).forEach(([template, usage]) => {
            const frequency = calculateOrderFrequency(usage);
            const avgOrderValue = calculateAverageOrderValue(usage);

            if (frequency >= 2) { // At least 2 orders per month
                plans.push({
                    name: `${template} Subscription`,
                    description: `Regular ${template} delivery with 10% discount`,
                    frequency: 'monthly',
                    discount: 0.10,
                    targetPersonas: personas.filter(p => 
                        p.type === 'Luxury Buyer' || p.type === 'Party Lover'
                    ),
                    estimatedSavings: avgOrderValue * 0.10
                });
            }
        });

        return plans;
    };

    const calculateOrderFrequency = (usage) => {
        const history = usage.usageHistory;
        if (history.length < 2) return 0;

        const firstOrder = new Date(history[0]);
        const lastOrder = new Date(history[history.length - 1]);
        const monthsDiff = (lastOrder - firstOrder) / (1000 * 60 * 60 * 24 * 30);
        
        return history.length / monthsDiff;
    };

    const renderPricingDialog = () => (
        <Dialog
            open={showPricingDialog}
            onClose={() => setShowPricingDialog(false)}
            maxWidth="md"
            fullWidth
        >
            <DialogTitle>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <LocalOfferIcon sx={{ mr: 1 }} />
                    Dynamic Pricing
                </Box>
            </DialogTitle>
            <DialogContent>
                <Grid container spacing={2}>
                    <Grid item xs={12}>
                        <FormControlLabel
                            control={
                                <Switch
                                    checked={dynamicPricing.enabled}
                                    onChange={(e) => setDynamicPricing(prev => ({
                                        ...prev,
                                        enabled: e.target.checked
                                    }))}
                                />
                            }
                            label="Enable Dynamic Pricing"
                        />
                    </Grid>
                    {dynamicPricing.rules.map((rule, index) => (
                        <Grid item xs={12} key={index}>
                            <Card>
                                <CardContent>
                                    <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
                                        <Box sx={{ mr: 2, color: 'primary.main' }}>
                                            <TrendingUpIcon />
                                        </Box>
                                        <Box>
                                            <Typography variant="subtitle1" gutterBottom>
                                                {rule.title}
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary">
                                                {rule.description}
                                            </Typography>
                                            <Box sx={{ mt: 1, display: 'flex', gap: 1 }}>
                                                <Chip
                                                    label={`${((rule.adjustment - 1) * 100).toFixed(0)}% ${rule.adjustment > 1 ? 'increase' : 'decrease'}`}
                                                    color={rule.adjustment > 1 ? 'error' : 'success'}
                                                    size="small"
                                                />
                                                <Chip
                                                    label={rule.type}
                                                    color="primary"
                                                    size="small"
                                                />
                                            </Box>
                                            <Typography variant="caption" color="text.secondary">
                                                Conditions: {JSON.stringify(rule.conditions)}
                                            </Typography>
                                        </Box>
                                    </Box>
                                </CardContent>
                            </Card>
                        </Grid>
                    ))}
                </Grid>
            </DialogContent>
        </Dialog>
    );

    const renderPersonaDialog = () => (
        <Dialog
            open={showPersonaDialog}
            onClose={() => setShowPersonaDialog(false)}
            maxWidth="md"
            fullWidth
        >
            <DialogTitle>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <GroupIcon sx={{ mr: 1 }} />
                    User Personas
                </Box>
            </DialogTitle>
            <DialogContent>
                <Grid container spacing={2}>
                    {userPersonas.map((persona, index) => (
                        <Grid item xs={12} key={index}>
                            <Card>
                                <CardContent>
                                    <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
                                        <Box sx={{ mr: 2, color: 'primary.main' }}>
                                            <PersonIcon />
                                        </Box>
                                        <Box>
                                            <Typography variant="subtitle1" gutterBottom>
                                                {persona.type}
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary">
                                                {persona.description}
                                            </Typography>
                                            <Box sx={{ mt: 1 }}>
                                                <Typography variant="caption" color="text.secondary">
                                                    Characteristics:
                                                </Typography>
                                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
                                                    {persona.characteristics.map(char => (
                                                        <Chip
                                                            key={char}
                                                            label={char}
                                                            size="small"
                                                        />
                                                    ))}
                                                </Box>
                                            </Box>
                                            <Box sx={{ mt: 1 }}>
                                                <Typography variant="caption" color="text.secondary">
                                                    Recommendations:
                                                </Typography>
                                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
                                                    {persona.recommendations.map(rec => (
                                                        <Chip
                                                            key={rec}
                                                            label={rec}
                                                            color="primary"
                                                            size="small"
                                                        />
                                                    ))}
                                                </Box>
                                            </Box>
                                            <Box sx={{ mt: 1, display: 'flex', gap: 1 }}>
                                                <Chip
                                                    label={`${(persona.confidence * 100).toFixed(0)}% confidence`}
                                                    color="primary"
                                                    size="small"
                                                />
                                            </Box>
                                        </Box>
                                    </Box>
                                </CardContent>
                            </Card>
                        </Grid>
                    ))}
                </Grid>
            </DialogContent>
        </Dialog>
    );

    const analyzeInventoryStatus = (stats) => {
        const status = {
            lowStock: [],
            reorderSuggestions: [],
            demandForecasts: []
        };

        // Analyze current inventory levels
        Object.entries(stats.templateUsage).forEach(([template, usage]) => {
            const stockLevel = calculateStockLevel(template, usage);
            if (stockLevel < 10) {
                status.lowStock.push({
                    template,
                    currentStock: stockLevel,
                    reorderPoint: 20,
                    urgency: stockLevel < 5 ? 'high' : 'medium',
                    lastRestocked: getLastRestockDate(template)
                });
            }
        });

        // Generate reorder suggestions
        status.lowStock.forEach(item => {
            const forecast = generateDemandForecast(item.template, stats);
            status.reorderSuggestions.push({
                template: item.template,
                suggestedQuantity: Math.max(20, forecast.weeklyDemand * 2),
                estimatedCost: calculateEstimatedCost(item.template, forecast.weeklyDemand * 2),
                urgency: item.urgency,
                reason: `Current stock: ${item.currentStock}, Weekly demand: ${forecast.weeklyDemand}`
            });
        });

        // Generate demand forecasts
        Object.keys(stats.templateUsage).forEach(template => {
            const forecast = generateDemandForecast(template, stats);
            status.demandForecasts.push({
                template,
                weeklyDemand: forecast.weeklyDemand,
                monthlyDemand: forecast.monthlyDemand,
                confidence: forecast.confidence,
                factors: forecast.factors
            });
        });

        return status;
    };

    const calculateStockLevel = (template, usage) => {
        // Implementation depends on your data structure
        return 15; // Placeholder
    };

    const getLastRestockDate = (template) => {
        // Implementation depends on your data structure
        return new Date().toISOString(); // Placeholder
    };

    const generateDemandForecast = (template, stats) => {
        const usage = stats.templateUsage[template];
        const history = usage.usageHistory;
        
        // Calculate weekly average
        const weeklyUsage = history.filter(timestamp => {
            const date = new Date(timestamp);
            const weekAgo = new Date();
            weekAgo.setDate(weekAgo.getDate() - 7);
            return date > weekAgo;
        }).length;

        // Calculate monthly average
        const monthlyUsage = history.filter(timestamp => {
            const date = new Date(timestamp);
            const monthAgo = new Date();
            monthAgo.setMonth(monthAgo.getMonth() - 1);
            return date > monthAgo;
        }).length;

        return {
            weeklyDemand: weeklyUsage,
            monthlyDemand: monthlyUsage,
            confidence: 0.85,
            factors: ['Historical usage', 'Seasonal trends', 'Promotional impact']
        };
    };

    const calculateEstimatedCost = (template, quantity) => {
        // Implementation depends on your data structure
        return quantity * 100; // Placeholder
    };

    const analyzeBusinessHealth = (stats) => {
        const health = {
            metrics: {},
            trends: [],
            recommendations: []
        };

        // Calculate key metrics
        const totalRevenue = calculateTotalRevenue(stats);
        const growthRate = calculateGrowthRate(stats);
        const customerRetention = calculateCustomerRetention(stats);
        const averageOrderValue = calculateAverageOrderValue(stats);

        health.metrics = {
            totalRevenue,
            growthRate,
            customerRetention,
            averageOrderValue
        };

        // Identify trends
        if (growthRate < 0) {
            health.trends.push({
                type: 'warning',
                message: 'Revenue growth is declining',
                impact: 'medium',
                suggestion: 'Consider launching promotional campaigns'
            });
        }

        if (customerRetention < 0.7) {
            health.trends.push({
                type: 'warning',
                message: 'Customer retention rate is below target',
                impact: 'high',
                suggestion: 'Implement loyalty program improvements'
            });
        }

        // Generate recommendations
        if (averageOrderValue < 500) {
            health.recommendations.push({
                type: 'opportunity',
                message: 'Increase average order value',
                action: 'Introduce premium bundles and upselling strategies',
                potentialImpact: 'high'
            });
        }

        return health;
    };

    const calculateTotalRevenue = (stats) => {
        // Implementation depends on your data structure
        return 100000; // Placeholder
    };

    const calculateGrowthRate = (stats) => {
        // Implementation depends on your data structure
        return 0.15; // Placeholder
    };

    const calculateCustomerRetention = (stats) => {
        // Implementation depends on your data structure
        return 0.75; // Placeholder
    };

    const renderInventoryDialog = () => (
        <Dialog
            open={showInventoryDialog}
            onClose={() => setShowInventoryDialog(false)}
            maxWidth="md"
            fullWidth
        >
            <DialogTitle>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <InventoryIcon sx={{ mr: 1 }} />
                    Inventory Management
                </Box>
            </DialogTitle>
            <DialogContent>
                <Grid container spacing={2}>
                    <Grid item xs={12}>
                        <Typography variant="h6" gutterBottom>
                            Low Stock Alerts
                        </Typography>
                        {inventoryStatus.lowStock.map((item, index) => (
                            <Card key={index} sx={{ mb: 2 }}>
                                <CardContent>
                                    <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
                                        <Box sx={{ mr: 2, color: item.urgency === 'high' ? 'error.main' : 'warning.main' }}>
                                            <InventoryIcon />
                                        </Box>
                                        <Box>
                                            <Typography variant="subtitle1" gutterBottom>
                                                {item.template}
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary">
                                                Current Stock: {item.currentStock}
                                            </Typography>
                                            <Box sx={{ mt: 1, display: 'flex', gap: 1 }}>
                                                <Chip
                                                    label={item.urgency}
                                                    color={item.urgency === 'high' ? 'error' : 'warning'}
                                                    size="small"
                                                />
                                                <Typography variant="caption" color="text.secondary">
                                                    Last Restocked: {format(new Date(item.lastRestocked), 'PPP')}
                                                </Typography>
                                            </Box>
                                        </Box>
                                    </Box>
                                </CardContent>
                            </Card>
                        ))}
                    </Grid>
                    <Grid item xs={12}>
                        <Typography variant="h6" gutterBottom>
                            Reorder Suggestions
                        </Typography>
                        {inventoryStatus.reorderSuggestions.map((suggestion, index) => (
                            <Card key={index} sx={{ mb: 2 }}>
                                <CardContent>
                                    <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
                                        <Box sx={{ mr: 2, color: 'primary.main' }}>
                                            <ShoppingCartIcon />
                                        </Box>
                                        <Box>
                                            <Typography variant="subtitle1" gutterBottom>
                                                {suggestion.template}
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary">
                                                Suggested Quantity: {suggestion.suggestedQuantity}
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary">
                                                Estimated Cost: ${suggestion.estimatedCost}
                                            </Typography>
                                            <Box sx={{ mt: 1, display: 'flex', gap: 1 }}>
                                                <Chip
                                                    label={suggestion.urgency}
                                                    color={suggestion.urgency === 'high' ? 'error' : 'warning'}
                                                    size="small"
                                                />
                                                <Typography variant="caption" color="text.secondary">
                                                    {suggestion.reason}
                                                </Typography>
                                            </Box>
                                        </Box>
                                    </Box>
                                </CardContent>
                            </Card>
                        ))}
                    </Grid>
                    <Grid item xs={12}>
                        <Typography variant="h6" gutterBottom>
                            Demand Forecasts
                        </Typography>
                        {inventoryStatus.demandForecasts.map((forecast, index) => (
                            <Card key={index} sx={{ mb: 2 }}>
                                <CardContent>
                                    <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
                                        <Box sx={{ mr: 2, color: 'primary.main' }}>
                                            <TrendingUpIcon />
                                        </Box>
                                        <Box>
                                            <Typography variant="subtitle1" gutterBottom>
                                                {forecast.template}
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary">
                                                Weekly Demand: {forecast.weeklyDemand}
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary">
                                                Monthly Demand: {forecast.monthlyDemand}
                                            </Typography>
                                            <Box sx={{ mt: 1, display: 'flex', gap: 1 }}>
                                                <Chip
                                                    label={`${(forecast.confidence * 100).toFixed(0)}% confidence`}
                                                    color="primary"
                                                    size="small"
                                                />
                                                {forecast.factors.map(factor => (
                                                    <Chip
                                                        key={factor}
                                                        label={factor}
                                                        size="small"
                                                    />
                                                ))}
                                            </Box>
                                        </Box>
                                    </Box>
                                </CardContent>
                            </Card>
                        ))}
                    </Grid>
                </Grid>
            </DialogContent>
        </Dialog>
    );

    const renderHealthDialog = () => (
        <Dialog
            open={showHealthDialog}
            onClose={() => setShowHealthDialog(false)}
            maxWidth="md"
            fullWidth
        >
            <DialogTitle>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <StorefrontIcon sx={{ mr: 1 }} />
                    Business Health Report
                </Box>
            </DialogTitle>
            <DialogContent>
                <Grid container spacing={2}>
                    <Grid item xs={12}>
                        <Typography variant="h6" gutterBottom>
                            Key Metrics
                        </Typography>
                        <Grid container spacing={2}>
                            <Grid item xs={12} sm={6} md={3}>
                                <Card>
                                    <CardContent>
                                        <Typography variant="subtitle2" color="text.secondary">
                                            Total Revenue
                                        </Typography>
                                        <Typography variant="h4">
                                            ${businessHealth.metrics.totalRevenue?.toLocaleString()}
                                        </Typography>
                                    </CardContent>
                                </Card>
                            </Grid>
                            <Grid item xs={12} sm={6} md={3}>
                                <Card>
                                    <CardContent>
                                        <Typography variant="subtitle2" color="text.secondary">
                                            Growth Rate
                                        </Typography>
                                        <Typography variant="h4" color={businessHealth.metrics.growthRate >= 0 ? 'success.main' : 'error.main'}>
                                            {(businessHealth.metrics.growthRate * 100).toFixed(1)}%
                                        </Typography>
                                    </CardContent>
                                </Card>
                            </Grid>
                            <Grid item xs={12} sm={6} md={3}>
                                <Card>
                                    <CardContent>
                                        <Typography variant="subtitle2" color="text.secondary">
                                            Customer Retention
                                        </Typography>
                                        <Typography variant="h4" color={businessHealth.metrics.customerRetention >= 0.7 ? 'success.main' : 'warning.main'}>
                                            {(businessHealth.metrics.customerRetention * 100).toFixed(1)}%
                                        </Typography>
                                    </CardContent>
                                </Card>
                            </Grid>
                            <Grid item xs={12} sm={6} md={3}>
                                <Card>
                                    <CardContent>
                                        <Typography variant="subtitle2" color="text.secondary">
                                            Avg Order Value
                                        </Typography>
                                        <Typography variant="h4">
                                            ${businessHealth.metrics.averageOrderValue?.toLocaleString()}
                                        </Typography>
                                    </CardContent>
                                </Card>
                            </Grid>
                        </Grid>
                    </Grid>
                    <Grid item xs={12}>
                        <Typography variant="h6" gutterBottom>
                            Trends & Alerts
                        </Typography>
                        {businessHealth.trends.map((trend, index) => (
                            <Card key={index} sx={{ mb: 2 }}>
                                <CardContent>
                                    <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
                                        <Box sx={{ mr: 2, color: trend.type === 'warning' ? 'warning.main' : 'success.main' }}>
                                            <TrendingUpIcon />
                                        </Box>
                                        <Box>
                                            <Typography variant="subtitle1" gutterBottom>
                                                {trend.message}
                                            </Typography>
                                            <Box sx={{ mt: 1, display: 'flex', gap: 1 }}>
                                                <Chip
                                                    label={trend.impact}
                                                    color={trend.impact === 'high' ? 'error' : 'warning'}
                                                    size="small"
                                                />
                                                <Typography variant="caption" color="text.secondary">
                                                    {trend.suggestion}
                                                </Typography>
                                            </Box>
                                        </Box>
                                    </Box>
                                </CardContent>
                            </Card>
                        ))}
                    </Grid>
                    <Grid item xs={12}>
                        <Typography variant="h6" gutterBottom>
                            Recommendations
                        </Typography>
                        {businessHealth.recommendations.map((rec, index) => (
                            <Card key={index} sx={{ mb: 2 }}>
                                <CardContent>
                                    <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
                                        <Box sx={{ mr: 2, color: 'primary.main' }}>
                                            <LightbulbIcon />
                                        </Box>
                                        <Box>
                                            <Typography variant="subtitle1" gutterBottom>
                                                {rec.message}
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary">
                                                {rec.action}
                                            </Typography>
                                            <Box sx={{ mt: 1, display: 'flex', gap: 1 }}>
                                                <Chip
                                                    label={rec.potentialImpact}
                                                    color="primary"
                                                    size="small"
                                                />
                                            </Box>
                                        </Box>
                                    </Box>
                                </CardContent>
                            </Card>
                        ))}
                    </Grid>
                </Grid>
            </DialogContent>
        </Dialog>
    );

    const renderSmartBundleDialog = () => (
        <Dialog
            open={showBundleDialog}
            onClose={() => setShowBundleDialog(false)}
            maxWidth="md"
            fullWidth
        >
            <DialogTitle>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <LocalOfferIcon sx={{ mr: 1 }} />
                    AI-Powered Smart Bundles
                </Box>
            </DialogTitle>
            <DialogContent>
                <Grid container spacing={2}>
                    <Grid item xs={12}>
                        <Typography variant="h6" gutterBottom>
                            A/B Test Bundles
                        </Typography>
                        {smartBundles.abTests.map((bundle, index) => (
                            <Card key={index} sx={{ mb: 2 }}>
                                <CardContent>
                                    <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
                                        <Box sx={{ mr: 2, color: 'primary.main' }}>
                                            <LocalOfferIcon />
                                        </Box>
                                        <Box>
                                            <Typography variant="subtitle1" gutterBottom>
                                                {bundle.name}
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary">
                                                Items: {bundle.items.join(', ')}
                                            </Typography>
                                            <Box sx={{ mt: 1 }}>
                                                <Typography variant="subtitle2" gutterBottom>
                                                    Test Variants:
                                                </Typography>
                                                {bundle.variants.map((variant, vIndex) => (
                                                    <Box key={vIndex} sx={{ ml: 2, mb: 1 }}>
                                                        <Typography variant="body2">
                                                            {variant.name}: {variant.discount}% off
                                                        </Typography>
                                                        <Typography variant="caption" color="text.secondary">
                                                            Extras: {variant.extras.join(', ')}
                                                        </Typography>
                                                    </Box>
                                                ))}
                                            </Box>
                                            <Box sx={{ mt: 1, display: 'flex', gap: 1 }}>
                                                <Chip
                                                    label={`${bundle.testDuration} Test`}
                                                    color="primary"
                                                    size="small"
                                                />
                                                <Chip
                                                    label={bundle.targetAudience}
                                                    size="small"
                                                />
                                            </Box>
                                        </Box>
                                    </Box>
                                </CardContent>
                            </Card>
                        ))}
                    </Grid>
                    <Grid item xs={12}>
                        <Typography variant="h6" gutterBottom>
                            Location-Based Bundles
                        </Typography>
                        {smartBundles.locationBased.map((bundle, index) => (
                            <Card key={index} sx={{ mb: 2 }}>
                                <CardContent>
                                    <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
                                        <Box sx={{ mr: 2, color: 'primary.main' }}>
                                            <LocationOnIcon />
                                        </Box>
                                        <Box>
                                            <Typography variant="subtitle1" gutterBottom>
                                                {bundle.name}
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary">
                                                {bundle.description}
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary">
                                                Items: {bundle.items.join(', ')}
                                            </Typography>
                                            <Box sx={{ mt: 1, display: 'flex', gap: 1 }}>
                                                <Chip
                                                    label={`${bundle.discount}% Off`}
                                                    color="primary"
                                                    size="small"
                                                />
                                            </Box>
                                        </Box>
                                    </Box>
                                </CardContent>
                            </Card>
                        ))}
                    </Grid>
                    <Grid item xs={12}>
                        <Typography variant="h6" gutterBottom>
                            Weather-Based Bundles
                        </Typography>
                        {smartBundles.weatherBased.map((bundle, index) => (
                            <Card key={index} sx={{ mb: 2 }}>
                                <CardContent>
                                    <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
                                        <Box sx={{ mr: 2, color: 'primary.main' }}>
                                            <WeatherIcon />
                                        </Box>
                                        <Box>
                                            <Typography variant="subtitle1" gutterBottom>
                                                {bundle.name}
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary">
                                                {bundle.description}
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary">
                                                Items: {bundle.items.join(', ')}
                                            </Typography>
                                            <Box sx={{ mt: 1, display: 'flex', gap: 1 }}>
                                                <Chip
                                                    label={`${bundle.discount}% Off`}
                                                    color="primary"
                                                    size="small"
                                                />
                                            </Box>
                                        </Box>
                                    </Box>
                                </CardContent>
                            </Card>
                        ))}
                    </Grid>
                </Grid>
            </DialogContent>
        </Dialog>
    );

    const renderDynamicPricingDialog = () => (
        <Dialog
            open={showPricingDialog}
            onClose={() => setShowPricingDialog(false)}
            maxWidth="md"
            fullWidth
        >
            <DialogTitle>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <TrendingUpIcon sx={{ mr: 1 }} />
                    AI-Driven Dynamic Pricing
                </Box>
            </DialogTitle>
            <DialogContent>
                <Grid container spacing={2}>
                    <Grid item xs={12}>
                        <Typography variant="h6" gutterBottom>
                            Time-Based Pricing
                        </Typography>
                        {dynamicPricing.timeBased.map((rule, index) => (
                            <Card key={index} sx={{ mb: 2 }}>
                                <CardContent>
                                    <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
                                        <Box sx={{ mr: 2, color: 'primary.main' }}>
                                            <AccessTimeIcon />
                                        </Box>
                                        <Box>
                                            <Typography variant="subtitle1" gutterBottom>
                                                {rule.name}
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary">
                                                Product: {rule.product}
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary">
                                                Time: {rule.timeRange} ({rule.day})
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary">
                                                Adjustment: {rule.adjustment > 0 ? '+' : ''}{rule.adjustment}%
                                            </Typography>
                                            <Box sx={{ mt: 1, display: 'flex', gap: 1 }}>
                                                <Chip
                                                    label={rule.reason}
                                                    color="primary"
                                                    size="small"
                                                />
                                            </Box>
                                        </Box>
                                    </Box>
                                </CardContent>
                            </Card>
                        ))}
                    </Grid>
                    <Grid item xs={12}>
                        <Typography variant="h6" gutterBottom>
                            Event-Based Pricing
                        </Typography>
                        {dynamicPricing.eventBased.map((rule, index) => (
                            <Card key={index} sx={{ mb: 2 }}>
                                <CardContent>
                                    <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
                                        <Box sx={{ mr: 2, color: 'primary.main' }}>
                                            <EventIcon />
                                        </Box>
                                        <Box>
                                            <Typography variant="subtitle1" gutterBottom>
                                                {rule.name}
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary">
                                                Product: {rule.product}
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary">
                                                Date: {format(new Date(rule.date), 'PPP')}
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary">
                                                Adjustment: {rule.adjustment > 0 ? '+' : ''}{rule.adjustment}%
                                            </Typography>
                                            <Box sx={{ mt: 1, display: 'flex', gap: 1 }}>
                                                <Chip
                                                    label={rule.reason}
                                                    color="primary"
                                                    size="small"
                                                />
                                            </Box>
                                        </Box>
                                    </Box>
                                </CardContent>
                            </Card>
                        ))}
                    </Grid>
                    <Grid item xs={12}>
                        <Typography variant="h6" gutterBottom>
                            Competitor-Based Pricing
                        </Typography>
                        {dynamicPricing.competitorBased.map((rule, index) => (
                            <Card key={index} sx={{ mb: 2 }}>
                                <CardContent>
                                    <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
                                        <Box sx={{ mr: 2, color: 'primary.main' }}>
                                            <StorefrontIcon />
                                        </Box>
                                        <Box>
                                            <Typography variant="subtitle1" gutterBottom>
                                                {rule.name}
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary">
                                                Product: {rule.product}
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary">
                                                Competitor: {rule.competitor}
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary">
                                                Adjustment: {rule.adjustment > 0 ? '+' : ''}{rule.adjustment}%
                                            </Typography>
                                            <Box sx={{ mt: 1, display: 'flex', gap: 1 }}>
                                                <Chip
                                                    label={rule.reason}
                                                    color="primary"
                                                    size="small"
                                                />
                                                {rule.extras.map((extra, eIndex) => (
                                                    <Chip
                                                        key={eIndex}
                                                        label={extra}
                                                        color="secondary"
                                                        size="small"
                                                    />
                                                ))}
                                            </Box>
                                        </Box>
                                    </Box>
                                </CardContent>
                            </Card>
                        ))}
                    </Grid>
                </Grid>
            </DialogContent>
        </Dialog>
    );

    const renderGamificationDialog = () => (
        <Dialog
            open={showGamificationDialog}
            onClose={() => setShowGamificationDialog(false)}
            maxWidth="md"
            fullWidth
        >
            <DialogTitle>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <EmojiEventsIcon sx={{ mr: 1 }} />
                    AI-Powered Gamification
                </Box>
            </DialogTitle>
            <DialogContent>
                <Grid container spacing={2}>
                    <Grid item xs={12}>
                        <Typography variant="h6" gutterBottom>
                            Active Challenges
                        </Typography>
                        {gamification.challenges.map((challenge, index) => (
                            <Card key={index} sx={{ mb: 2 }}>
                                <CardContent>
                                    <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
                                        <Box sx={{ mr: 2, color: 'primary.main' }}>
                                            <EmojiEventsIcon />
                                        </Box>
                                        <Box>
                                            <Typography variant="subtitle1" gutterBottom>
                                                {challenge.name}
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary">
                                                {challenge.description}
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary">
                                                Reward: {challenge.reward}
                                            </Typography>
                                            <Box sx={{ mt: 1, display: 'flex', gap: 1 }}>
                                                <Chip
                                                    label={`${challenge.duration}`}
                                                    color="primary"
                                                    size="small"
                                                />
                                                <Chip
                                                    label={`Progress: ${challenge.progress}/${challenge.target}`}
                                                    color="secondary"
                                                    size="small"
                                                />
                                            </Box>
                                        </Box>
                                    </Box>
                                </CardContent>
                            </Card>
                        ))}
                    </Grid>
                    <Grid item xs={12}>
                        <Typography variant="h6" gutterBottom>
                            Leaderboards
                        </Typography>
                        {gamification.leaderboards.map((board, index) => (
                            <Card key={index} sx={{ mb: 2 }}>
                                <CardContent>
                                    <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
                                        <Box sx={{ mr: 2, color: 'primary.main' }}>
                                            <LeaderboardIcon />
                                        </Box>
                                        <Box>
                                            <Typography variant="subtitle1" gutterBottom>
                                                {board.name}
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary">
                                                {board.description}
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary">
                                                Reward: {board.reward}
                                            </Typography>
                                            <Box sx={{ mt: 1, display: 'flex', gap: 1 }}>
                                                <Chip
                                                    label={board.duration}
                                                    color="primary"
                                                    size="small"
                                                />
                                            </Box>
                                        </Box>
                                    </Box>
                                </CardContent>
                            </Card>
                        ))}
                    </Grid>
                    <Grid item xs={12}>
                        <Typography variant="h6" gutterBottom>
                            Rewards
                        </Typography>
                        {gamification.rewards.map((reward, index) => (
                            <Card key={index} sx={{ mb: 2 }}>
                                <CardContent>
                                    <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
                                        <Box sx={{ mr: 2, color: 'primary.main' }}>
                                            <CardGiftcardIcon />
                                        </Box>
                                        <Box>
                                            <Typography variant="subtitle1" gutterBottom>
                                                {reward.name}
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary">
                                                {reward.description}
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary">
                                                Reward: {reward.reward}
                                            </Typography>
                                            <Box sx={{ mt: 1, display: 'flex', gap: 1 }}>
                                                {reward.requirements.map((req, rIndex) => (
                                                    <Chip
                                                        key={rIndex}
                                                        label={req}
                                                        color="primary"
                                                        size="small"
                                                    />
                                                ))}
                                            </Box>
                                        </Box>
                                    </Box>
                                </CardContent>
                            </Card>
                        ))}
                    </Grid>
                </Grid>
            </DialogContent>
        </Dialog>
    );

    const generateHealthScore = (stats) => {
        const metrics = {
            salesTrend: calculateGrowthRate(stats),
            inventoryHealth: calculateInventoryHealth(stats),
            customerEngagement: calculateCustomerEngagement(stats),
            marketPosition: calculateMarketPosition(stats)
        };

        const weights = {
            salesTrend: 0.3,
            inventoryHealth: 0.2,
            customerEngagement: 0.3,
            marketPosition: 0.2
        };

        const score = Object.entries(metrics).reduce((acc, [key, value]) => {
            return acc + (value * weights[key]);
        }, 0);

        return {
            score: Math.round(score * 100),
            metrics,
            recommendations: generateHealthRecommendations(metrics)
        };
    };

    const calculateInventoryHealth = (stats) => {
        const lowStockItems = stats.filter(item => item.stockLevel < item.reorderPoint).length;
        const totalItems = stats.length;
        return 1 - (lowStockItems / totalItems);
    };

    const calculateCustomerEngagement = (stats) => {
        const totalOrders = stats.reduce((acc, item) => acc + item.orders, 0);
        const uniqueCustomers = stats.reduce((acc, item) => acc + item.uniqueCustomers, 0);
        return Math.min(totalOrders / uniqueCustomers / 5, 1);
    };

    const calculateMarketPosition = (stats) => {
        const marketShare = stats.reduce((acc, item) => acc + item.marketShare, 0) / stats.length;
        const competitorCount = stats[0]?.competitorCount || 1;
        return marketShare / competitorCount;
    };

    const generateHealthRecommendations = (metrics) => {
        const recommendations = [];
        
        if (metrics.salesTrend < 0.5) {
            recommendations.push({
                title: "Boost Sales Growth",
                description: "Launch targeted promotions and optimize pricing strategy",
                impact: "High",
                priority: "Urgent"
            });
        }
        
        if (metrics.inventoryHealth < 0.7) {
            recommendations.push({
                title: "Improve Inventory Management",
                description: "Optimize stock levels and implement automated reordering",
                impact: "Medium",
                priority: "Important"
            });
        }
        
        if (metrics.customerEngagement < 0.6) {
            recommendations.push({
                title: "Enhance Customer Engagement",
                description: "Launch loyalty program and personalized promotions",
                impact: "High",
                priority: "Important"
            });
        }
        
        return recommendations;
    };

    const generateCompetitorAnalysis = (stats) => {
        return stats.map(item => ({
            product: item.name,
            marketShare: item.marketShare,
            competitors: item.competitors.map(comp => ({
                name: comp.name,
                price: comp.price,
                promotions: comp.promotions,
                marketShare: comp.marketShare
            })),
            recommendations: generateCompetitorRecommendations(item)
        }));
    };

    const generateCompetitorRecommendations = (item) => {
        const recommendations = [];
        
        if (item.marketShare < 0.2) {
            recommendations.push({
                title: "Market Share Growth",
                description: "Launch aggressive pricing and marketing campaign",
                impact: "High",
                priority: "Urgent"
            });
        }
        
        const priceCompetitors = item.competitors.filter(c => c.price < item.price);
        if (priceCompetitors.length > 0) {
            recommendations.push({
                title: "Price Optimization",
                description: "Adjust pricing strategy to remain competitive",
                impact: "Medium",
                priority: "Important"
            });
        }
        
        return recommendations;
    };

    const generateGrowthStrategies = (stats) => {
        const strategies = [];
        
        // Market Expansion
        if (stats.some(item => item.marketShare > 0.3)) {
            strategies.push({
                title: "Market Expansion",
                description: "Consider opening new locations in high-growth areas",
                potential: "High",
                timeline: "6-12 months"
            });
        }
        
        // Product Diversification
        if (stats.length < 5) {
            strategies.push({
                title: "Product Diversification",
                description: "Expand product range based on customer preferences",
                potential: "Medium",
                timeline: "3-6 months"
            });
        }
        
        // Digital Transformation
        if (!stats.some(item => item.hasDigitalPresence)) {
            strategies.push({
                title: "Digital Transformation",
                description: "Launch online store and digital marketing campaign",
                potential: "High",
                timeline: "2-4 months"
            });
        }
        
        return strategies;
    };

    const renderAnalyticsDialog = () => {
        return (
            <Dialog
                open={showAnalyticsDialog}
                onClose={() => setShowAnalyticsDialog(false)}
                maxWidth="lg"
                fullWidth
            >
                <DialogTitle>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <AnalyticsIcon sx={{ mr: 1 }} />
                            Advanced Analytics Dashboard
                        </Box>
                        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                            <Button
                                startIcon={<SmartToyIcon />}
                                onClick={() => setShowSmartAssistantDialog(true)}
                                size="small"
                                color="primary"
                                variant="outlined"
                            >
                                AI Assistant
                            </Button>
                            <Button
                                startIcon={<CampaignIcon />}
                                onClick={() => setShowSmartAdsDialog(true)}
                                size="small"
                                color="primary"
                                variant="outlined"
                            >
                                Smart Ads
                            </Button>
                            <Button
                                startIcon={<LoyaltyIcon />}
                                onClick={() => setShowLoyaltyDialog(true)}
                                size="small"
                                color="primary"
                                variant="outlined"
                            >
                                Loyalty Program
                            </Button>
                            <Button
                                startIcon={<TrendingUpIcon />}
                                onClick={() => setShowHealthScoreDialog(true)}
                                size="small"
                                color="primary"
                                variant="outlined"
                            >
                                Health Score
                            </Button>
                            <Button
                                startIcon={<StorefrontIcon />}
                                onClick={() => setShowCompetitorDialog(true)}
                                size="small"
                                color="primary"
                                variant="outlined"
                            >
                                Competitor Analysis
                            </Button>
                            <Button
                                startIcon={<TrendingUpIcon />}
                                onClick={() => setShowGrowthDialog(true)}
                                size="small"
                                color="primary"
                                variant="outlined"
                            >
                                Growth Strategies
                            </Button>
                        </Box>
                    </Box>
                </DialogTitle>
                <DialogContent>
                    <Grid container spacing={2}>
                        <Grid item xs={12}>
                            <Typography variant="h6" gutterBottom>
                                Key Performance Indicators
                            </Typography>
                            <Grid container spacing={2}>
                                <Grid item xs={12} sm={6} md={3}>
                                    <Card>
                                        <CardContent>
                                            <Typography variant="subtitle2" color="text.secondary">
                                                Revenue Growth
                                            </Typography>
                                            <Typography variant="h4" color={businessIntelligence.kpis.revenueGrowth >= 0 ? "success.main" : "error.main"}>
                                                {businessIntelligence.kpis.revenueGrowth}%
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary">
                                            Last 30 days
                                        </Typography>
                                    </CardContent>
                                </Card>
                            </Grid>
                            <Grid item xs={12} sm={6} md={3}>
                                <Card>
                                    <CardContent>
                                        <Typography variant="subtitle2" color="text.secondary">
                                            Click-Through Rate
                                        </Typography>
                                        <Typography variant="h4" color="primary">
                                            {businessAutomation.smartAds.performanceMetrics.ctr?.toFixed(1)}%
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary">
                                            vs industry avg
                                        </Typography>
                                    </CardContent>
                                </Card>
                            </Grid>
                            <Grid item xs={12} sm={6} md={3}>
                                <Card>
                                    <CardContent>
                                        <Typography variant="subtitle2" color="text.secondary">
                                            Conversion Rate
                                        </Typography>
                                        <Typography variant="h4" color="primary">
                                            {businessAutomation.smartAds.performanceMetrics.conversionRate?.toFixed(1)}%
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary">
                                            Last 30 days
                                        </Typography>
                                    </CardContent>
                                </Card>
                            </Grid>
                            <Grid item xs={12} sm={6} md={3}>
                                <Card>
                                    <CardContent>
                                        <Typography variant="subtitle2" color="text.secondary">
                                            ROI
                                        </Typography>
                                        <Typography variant="h4" color="primary">
                                            {businessAutomation.smartAds.performanceMetrics.roi?.toFixed(1)}x
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary">
                                            vs target
                                        </Typography>
                                    </CardContent>
                                </Card>
                            </Grid>
                        </Grid>
                    </Grid>
                    <Grid item xs={12}>
                        <Typography variant="h6" gutterBottom>
                            Budget Allocation
                        </Typography>
                        <Grid container spacing={2}>
                            {Object.entries(businessAutomation.smartAds.budgetAllocation).map(([platform, budget], index) => (
                                <Grid item xs={12} sm={6} key={index}>
                                    <Card>
                                        <CardContent>
                                            <Typography variant="subtitle2" gutterBottom>
                                                {platform}
                                            </Typography>
                                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                                <Box sx={{ flexGrow: 1, mr: 1 }}>
                                                    <LinearProgress
                                                        variant="determinate"
                                                        value={budget.percentage}
                                                        color={budget.percentage > 50 ? 'success' : 'primary'}
                                                    />
                                                </Box>
                                                <Typography variant="body2" color="text.secondary">
                                                    {budget.percentage}%
                                                </Typography>
                                            </Box>
                                            <Typography variant="body2" color="text.secondary">
                                                Budget: ${budget.amount}
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary">
                                                ROI: {budget.roi}x
                                            </Typography>
                                        </CardContent>
                                    </Card>
                                </Grid>
                            ))}
                        </Grid>
                    </Grid>
                </Grid>
            </DialogContent>
        </Dialog>
    );

    const renderLoyaltyDialog = () => (
        <Dialog
            open={showLoyaltyDialog}
            onClose={() => setShowLoyaltyDialog(false)}
            maxWidth="md"
            fullWidth
        >
            <DialogTitle>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <LoyaltyIcon sx={{ mr: 1 }} />
                    AI Smart Loyalty Program
                </Box>
            </DialogTitle>
            <DialogContent>
                <Grid container spacing={2}>
                    <Grid item xs={12}>
                        <Typography variant="h6" gutterBottom>
                            Membership Tiers
                        </Typography>
                        {businessAutomation.loyaltyPrograms.tiers.map((tier, index) => (
                            <Card key={index} sx={{ mb: 2 }}>
                                <CardContent>
                                    <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
                                        <Box sx={{ mr: 2, color: getTierColor(tier.name) }}>
                                            <LoyaltyIcon />
                                        </Box>
                                        <Box sx={{ flexGrow: 1 }}>
                                            <Typography variant="subtitle1" gutterBottom>
                                                {tier.name}
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary">
                                                Threshold: ${tier.threshold}
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary">
                                                Members: {tier.members}
                                            </Typography>
                                            <Box sx={{ mt: 1 }}>
                                                <Typography variant="subtitle2" gutterBottom>
                                                    Benefits:
                                                </Typography>
                                                <Grid container spacing={1}>
                                                    {tier.benefits.map((benefit, benefitIndex) => (
                                                        <Grid item xs={12} sm={6} key={benefitIndex}>
                                                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                                <CheckCircleIcon sx={{ mr: 1, color: 'success.main', fontSize: 16 }} />
                                                                <Typography variant="body2">
                                                                    {benefit}
                                                                </Typography>
                                                            </Box>
                                                        </Grid>
                                                    ))}
                                                </Grid>
                                            </Box>
                                        </Box>
                                    </Box>
                                </CardContent>
                            </Card>
                        ))}
                    </Grid>
                    <Grid item xs={12}>
                        <Typography variant="h6" gutterBottom>
                            Active Members
                        </Typography>
                        <Grid container spacing={2}>
                            {businessAutomation.loyaltyPrograms.activeMembers.map((member, index) => (
                                <Grid item xs={12} sm={6} key={index}>
                                    <Card>
                                        <CardContent>
                                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                                <Box sx={{ mr: 2 }}>
                                                    <Avatar sx={{ bgcolor: getTierColor(member.tier) }}>
                                                        {member.name.charAt(0)}
                                                    </Avatar>
                                                </Box>
                                                <Box>
                                                    <Typography variant="subtitle2">
                                                        {member.name}
                                                    </Typography>
                                                    <Typography variant="caption" color="text.secondary">
                                                        {member.tier} Member
                                                    </Typography>
                                                </Box>
                                            </Box>
                                            <Typography variant="body2" color="text.secondary">
                                                Total Spent: ${member.totalSpent}
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary">
                                                Points: {member.points}
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary">
                                                Member since: {member.joinDate}
                                            </Typography>
                                        </CardContent>
                                    </Card>
                                </Grid>
                            ))}
                        </Grid>
                    </Grid>
                    <Grid item xs={12}>
                        <Typography variant="h6" gutterBottom>
                            Active Rewards
                        </Typography>
                        {businessAutomation.loyaltyPrograms.rewards.map((reward, index) => (
                            <Card key={index} sx={{ mb: 2 }}>
                                <CardContent>
                                    <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
                                        <Box sx={{ mr: 2, color: 'primary.main' }}>
                                            <CardGiftcardIcon />
                                        </Box>
                                        <Box>
                                            <Typography variant="subtitle1" gutterBottom>
                                                {reward.name}
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary">
                                                {reward.description}
                                            </Typography>
                                            <Box sx={{ mt: 1, display: 'flex', gap: 1 }}>
                                                <Chip
                                                    label={`${reward.points} points`}
                                                    color="primary"
                                                    size="small"
                                                />
                                                <Chip
                                                    label={reward.tier}
                                                    color="secondary"
                                                    size="small"
                                                />
                                                {reward.expires && (
                                                    <Chip
                                                        label={`Expires: ${reward.expiryDate}`}
                                                        color="warning"
                                                        size="small"
                                                    />
                                                )}
                                            </Box>
                                        </Box>
                                    </Box>
                                </CardContent>
                            </Card>
                        ))}
                    </Grid>
                </Grid>
            </DialogContent>
        </Dialog>
    );

    const getTierColor = (tier) => {
        switch (tier) {
            case 'PLATINUM':
                return '#E5E4E2';
            case 'GOLD':
                return '#FFD700';
            case 'SILVER':
                return '#C0C0C0';
            case 'BRONZE':
                return '#CD7F32';
            default:
                return 'primary.main';
        }
    };

    const generateAutoGrowActions = (stats) => {
        const actions = [];
        
        // Sales Performance Monitoring
        if (stats.revenueGrowth < 0) {
            actions.push({
                type: 'SALES_BOOST',
                title: 'Auto-Launch Sales Campaign',
                description: `Sales decreased by ${Math.abs(stats.revenueGrowth)}% - Launching targeted ad campaign`,
                autoExecute: true,
                priority: 'URGENT',
                action: {
                    type: 'LAUNCH_CAMPAIGN',
                    params: {
                        budget: calculateOptimalBudget(stats),
                        targeting: generateTargetAudience(stats),
                        duration: '7_DAYS'
                    }
                }
            });
        }
        
        // Customer Engagement Optimization
        if (stats.customerEngagement < 0.6) {
            actions.push({
                type: 'ENGAGEMENT_BOOST',
                title: 'Auto-Send VIP Discounts',
                description: 'Customer engagement dropped - Sending exclusive offers to VIP customers',
                autoExecute: true,
                priority: 'HIGH',
                action: {
                    type: 'SEND_OFFERS',
                    params: {
                        segment: 'VIP_CUSTOMERS',
                        discount: calculateOptimalDiscount(stats),
                        duration: '3_DAYS'
                    }
                }
            });
        }
        
        return actions;
    };

    const optimizeWorkforce = (stats) => {
        const optimization = {
            staffSchedule: [],
            recommendations: [],
            peakHours: []
        };
        
        // Peak Hours Analysis
        stats.hourlyOrders.forEach((hour, index) => {
            if (hour.orders > stats.averageHourlyOrders * 1.5) {
                optimization.peakHours.push({
                    hour: index,
                    demand: hour.orders,
                    staffNeeded: calculateRequiredStaff(hour.orders),
                    recommendation: generateStaffingRecommendation(hour)
                });
            }
        });
        
        // Auto Schedule Adjustment
        if (optimization.peakHours.length > 0) {
            optimization.recommendations.push({
                type: 'STAFF_ADJUSTMENT',
                title: 'Optimize Peak Hour Staffing',
                description: `Increase staff during peak hours: ${optimization.peakHours.map(h => h.hour).join(', ')}`,
                autoExecute: true,
                changes: optimization.peakHours.map(hour => ({
                    hour: hour.hour,
                    addStaff: hour.staffNeeded
                }))
            });
        }
        
        return optimization;
    };

    const calculateRequiredStaff = (orderVolume) => {
        const baseStaff = 2;
        const ordersPerStaff = 10;
        return Math.ceil(baseStaff + (orderVolume / ordersPerStaff));
    };

    const generateStaffingRecommendation = (hour) => {
        return {
            title: `Staff Adjustment for Hour ${hour.hour}`,
            description: `Add ${calculateRequiredStaff(hour.orders)} staff members`,
            impact: 'HIGH',
            reason: `High order volume (${hour.orders} orders/hour)`
        };
    };

    const optimizeRevenue = (stats) => {
        const optimization = {
            pricingSuggestions: [],
            inventoryAlerts: [],
            demandSpikes: [],
            autoAdjustments: []
        };
        
        // Demand-based Price Adjustments
        stats.products.forEach(product => {
            if (product.demand > product.averageDemand * 1.3) {
                optimization.demandSpikes.push({
                    product: product.name,
                    demandIncrease: ((product.demand / product.averageDemand) - 1) * 100,
                    suggestedPriceIncrease: calculateOptimalPriceIncrease(product),
                    autoAdjust: true
                });
            }
        });
        
        // Slow-moving Inventory Alerts
        stats.products.forEach(product => {
            if (product.turnoverRate < 0.3) {
                optimization.inventoryAlerts.push({
                    product: product.name,
                    stockLevel: product.stock,
                    suggestedDiscount: calculateClearanceDiscount(product),
                    urgency: product.stock > product.averageStock ? 'HIGH' : 'MEDIUM'
                });
            }
        });
        
        return optimization;
    };

    const calculateOptimalPriceIncrease = (product) => {
        const demandRatio = product.demand / product.averageDemand;
        const baseIncrease = 0.05; // 5% base increase
        return Math.min(baseIncrease * demandRatio, 0.15); // Cap at 15% increase
    };

    const calculateClearanceDiscount = (product) => {
        const turnoverRatio = product.turnoverRate;
        const baseDiscount = 0.2; // 20% base discount
        return Math.min(baseDiscount / turnoverRatio, 0.5); // Cap at 50% discount
    };

    return (
        <div className="template-preview">
            {/* Render your component content here */}
        </div>
    );
};

export default TemplatePreviewComponent; 