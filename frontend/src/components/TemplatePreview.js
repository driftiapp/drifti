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

const TemplatePreviewComponent = () => {
    // Component implementation
};

export default TemplatePreviewComponent; 