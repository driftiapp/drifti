import React, { useState, useEffect } from 'react';
import {
    LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
    ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';
import {
    Card, CardContent, Typography, Grid, Alert, Box, Slider, TextField,
    Button, Dialog, DialogTitle, DialogContent, DialogActions, IconButton,
    FormControl, InputLabel, Select, MenuItem, Switch, FormControlLabel,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
    Chip, Stack, Divider, Tabs, Tab, Badge, Checkbox, InputAdornment,
    Autocomplete, Tooltip as MuiTooltip, Fade
} from '@mui/material';
import SettingsIcon from '@mui/icons-material/Settings';
import NotificationsIcon from '@mui/icons-material/Notifications';
import HistoryIcon from '@mui/icons-material/History';
import PendingIcon from '@mui/icons-material/Pending';
import SearchIcon from '@mui/icons-material/Search';
import PreviewIcon from '@mui/icons-material/Preview';
import ConfigStorage from '../utils/configStorage';
import TemplatePreviewComponent from './TemplatePreview';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

const MonitoringDashboard = () => {
    const [metrics, setMetrics] = useState([]);
    const [warnings, setWarnings] = useState([]);
    const [historicalData, setHistoricalData] = useState([]);
    const [config, setConfig] = useState(null);
    const [configStorage, setConfigStorage] = useState(null);
    const [settingsOpen, setSettingsOpen] = useState(false);
    const [notificationsOpen, setNotificationsOpen] = useState(false);
    const [configHistory, setConfigHistory] = useState([]);
    const [historyDialogOpen, setHistoryDialogOpen] = useState(false);
    const [selectedVersion, setSelectedVersion] = useState(null);
    const [diffDialogOpen, setDiffDialogOpen] = useState(false);
    const [diffData, setDiffData] = useState(null);
    const [selectedChanges, setSelectedChanges] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedTags, setSelectedTags] = useState([]);
    const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
    const [previewData, setPreviewData] = useState(null);
    const [filterStatus, setFilterStatus] = useState('all');
    const [pendingChanges, setPendingChanges] = useState(null);
    const [selectedTemplate, setSelectedTemplate] = useState(null);
    const [previewType, setPreviewType] = useState('email');

    useEffect(() => {
        const initializeStorage = async () => {
            const storage = new ConfigStorage({
                storageType: 'local',
                storageOptions: {}
            });
            await storage.initialize();
            setConfigStorage(storage);
            const loadedConfig = await storage.loadConfig();
            setConfig(loadedConfig);
        };

        initializeStorage();
    }, []);

    useEffect(() => {
        if (!configStorage) return;

        const ws = new WebSocket('ws://localhost:3001');
        
        ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            
            switch (data.type) {
                case 'metrics':
                    setMetrics(data.metrics);
                    break;
                case 'warning':
                    setWarnings(prev => [...prev, data.warning]);
                    break;
                case 'config_update':
                    setConfig(data.config);
                    break;
            }
        };

        return () => ws.close();
    }, [configStorage]);

    const handleConfigUpdate = async (newConfig) => {
        try {
            await configStorage.saveConfig(newConfig);
            setConfig(newConfig);
            setPendingChanges(null);
        } catch (error) {
            console.error('Failed to update config:', error);
        }
    };

    const handleConfigReset = async () => {
        try {
            const defaultConfig = await configStorage.resetConfig();
            setConfig(defaultConfig);
            setPendingChanges(null);
        } catch (error) {
            console.error('Failed to reset config:', error);
        }
    };

    const formatMemory = (bytes) => {
        const units = ['B', 'KB', 'MB', 'GB', 'TB'];
        let value = bytes;
        let unitIndex = 0;
        
        while (value >= 1024 && unitIndex < units.length - 1) {
            value /= 1024;
            unitIndex++;
        }
        
        return `${value.toFixed(2)} ${units[unitIndex]}`;
    };

    const getStatusColor = (value, threshold) => {
        return value > threshold ? '#ff4444' : value > threshold * 0.8 ? '#ffbb33' : '#00C851';
    };

    const handleBulkApprove = async () => {
        try {
            await Promise.all(
                selectedChanges.map(changeId => 
                    configStorage.approveChange(changeId, 'current_user')
                )
            );
            // Refresh pending changes and current config
            const changes = await configStorage.getPendingChanges();
            setSelectedChanges([]);
        } catch (error) {
            console.error('Failed to approve changes:', error);
        }
    };

    const handleBulkReject = async () => {
        try {
            await Promise.all(
                selectedChanges.map(changeId => 
                    configStorage.rejectChange(changeId, 'current_user')
                )
            );
            // Refresh pending changes
            const changes = await configStorage.getPendingChanges();
            setSelectedChanges([]);
        } catch (error) {
            console.error('Failed to reject changes:', error);
        }
    };

    const handlePreviewChange = (change) => {
        setPreviewData(change);
        setPreviewDialogOpen(true);
    };

    const filteredChanges = configHistory.filter(change => {
        const matchesSearch = change.metadata?.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            change.metadata?.author?.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesTags = selectedTags.length === 0 || 
                           selectedTags.every(tag => change.metadata?.tags?.includes(tag));
        const matchesStatus = filterStatus === 'all' || change.metadata?.status === filterStatus;
        return matchesSearch && matchesTags && matchesStatus;
    });

    const allTags = Array.from(new Set(
        configHistory.flatMap(change => change.metadata?.tags || [])
    ));

    const renderAlertConfig = () => (
        <Box sx={{ mt: 2 }}>
            <Typography variant="h6" gutterBottom>
                Alert Configuration
            </Typography>
            <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                    <FormControl fullWidth>
                        <InputLabel>Alert Type</InputLabel>
                        <Select
                            value={config.alerts.type}
                            onChange={(e) => {
                                handleConfigUpdate({
                                    ...config,
                                    alerts: {
                                        ...config.alerts,
                                        type: e.target.value
                                    }
                                });
                                setPreviewType(e.target.value);
                            }}
                            label="Alert Type"
                        >
                            <MenuItem value="email">Email</MenuItem>
                            <MenuItem value="slack">Slack</MenuItem>
                            <MenuItem value="webhook">Webhook</MenuItem>
                        </Select>
                    </FormControl>
                </Grid>
                <Grid item xs={12}>
                    <TextField
                        label="Alert Template"
                        multiline
                        rows={4}
                        value={config.alerts.template}
                        onChange={(e) => {
                            handleConfigUpdate({
                                ...config,
                                alerts: {
                                    ...config.alerts,
                                    template: e.target.value
                                }
                            });
                            setSelectedTemplate(e.target.value);
                        }}
                        fullWidth
                        helperText="Use {{variable}} syntax for placeholders. Available variables: message, severity, details.value, details.instance, details.region"
                    />
                </Grid>
                {selectedTemplate && (
                    <Grid item xs={12}>
                        <Typography variant="subtitle1" gutterBottom>
                            Template Preview
                        </Typography>
                        <TemplatePreviewComponent
                            template={selectedTemplate}
                            type={previewType}
                            onSave={(values) => {
                                // Save custom values to config
                                handleConfigUpdate({
                                    ...config,
                                    alerts: {
                                        ...config.alerts,
                                        defaultValues: values
                                    }
                                });
                            }}
                        />
                    </Grid>
                )}
            </Grid>
        </Box>
    );

    useEffect(() => {
        if (config?.alerts?.template) {
            setSelectedTemplate(config.alerts.template);
            setPreviewType(config.alerts.type);
        }
    }, [config?.alerts?.template, config?.alerts?.type]);

    return (
        <Box sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h4">
                    System Monitoring Dashboard
                </Typography>
                <Box>
                    <IconButton onClick={() => setHistoryDialogOpen(true)}>
                        <HistoryIcon />
                    </IconButton>
                    <IconButton onClick={() => setNotificationsOpen(true)}>
                        <NotificationsIcon />
                    </IconButton>
                    <IconButton onClick={() => setSettingsOpen(true)}>
                        <SettingsIcon />
                    </IconButton>
                </Box>
            </Box>

            {/* Warnings Section */}
            {warnings.length > 0 && (
                <Box sx={{ mb: 3 }}>
                    <Typography variant="h6" gutterBottom>
                        Active Warnings
                    </Typography>
                    {warnings.map(warning => (
                        <Alert 
                            key={warning.id} 
                            severity="warning" 
                            sx={{ mb: 1 }}
                        >
                            {warning.type}: {warning.value.toFixed(2)} (Threshold: {warning.threshold})
                        </Alert>
                    ))}
                </Box>
            )}

            <Grid container spacing={3}>
                {/* CPU Usage */}
                <Grid item xs={12} md={6}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>
                                CPU Usage
                            </Typography>
                            <ResponsiveContainer width="100%" height={300}>
                                <LineChart data={historicalData}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis 
                                        dataKey="timestamp" 
                                        tickFormatter={(value) => new Date(value).toLocaleTimeString()}
                                    />
                                    <YAxis domain={[0, 1]} />
                                    <Tooltip />
                                    <Legend />
                                    <Line 
                                        type="monotone" 
                                        dataKey="cpu.usage" 
                                        stroke={getStatusColor(metrics.cpu.usage, 0.8)}
                                        name="CPU Usage"
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                            <Typography variant="body2" color="textSecondary">
                                Current Usage: {(metrics.cpu.usage * 100).toFixed(2)}%
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Memory Usage */}
                <Grid item xs={12} md={6}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>
                                Memory Usage
                            </Typography>
                            <ResponsiveContainer width="100%" height={300}>
                                <PieChart>
                                    <Pie
                                        data={[
                                            { name: 'Used', value: metrics.memory.used },
                                            { name: 'Free', value: metrics.memory.free }
                                        ]}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={80}
                                        fill="#8884d8"
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {metrics.memory.used && metrics.memory.free && [
                                            <Cell key="used" fill={getStatusColor(metrics.memory.usagePercent, 0.85)} />,
                                            <Cell key="free" fill="#00C49F" />
                                        ]}
                                    </Pie>
                                    <Tooltip formatter={formatMemory} />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                            <Typography variant="body2" color="textSecondary">
                                Used: {formatMemory(metrics.memory.used)} / Total: {formatMemory(metrics.memory.used + metrics.memory.free)}
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Latency */}
                <Grid item xs={12} md={6}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>
                                Request Latency
                            </Typography>
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={[
                                    { name: 'Average', value: metrics.latency.average },
                                    { name: 'P95', value: metrics.latency.p95 },
                                    { name: 'P99', value: metrics.latency.p99 }
                                ]}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="name" />
                                    <YAxis />
                                    <Tooltip />
                                    <Bar dataKey="value" fill="#8884d8" />
                                </BarChart>
                            </ResponsiveContainer>
                            <Typography variant="body2" color="textSecondary">
                                Average: {metrics.latency.average.toFixed(2)}ms
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Request Rate */}
                <Grid item xs={12} md={6}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>
                                Request Rate
                            </Typography>
                            <ResponsiveContainer width="100%" height={300}>
                                <LineChart data={historicalData}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis 
                                        dataKey="timestamp" 
                                        tickFormatter={(value) => new Date(value).toLocaleTimeString()}
                                    />
                                    <YAxis />
                                    <Tooltip />
                                    <Legend />
                                    <Line 
                                        type="monotone" 
                                        dataKey="requests.rate" 
                                        stroke="#8884d8" 
                                        name="Requests/sec"
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                            <Typography variant="body2" color="textSecondary">
                                Current Rate: {metrics.requests.rate.toFixed(2)} req/s
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            {/* Configuration History Dialog */}
            <Dialog open={historyDialogOpen} onClose={() => setHistoryDialogOpen(false)} maxWidth="md" fullWidth>
                <DialogTitle>Configuration History</DialogTitle>
                <DialogContent>
                    <Tabs value={selectedTab} onChange={(e, newValue) => setSelectedTab(newValue)}>
                        <Tab label="History" />
                        <Tab 
                            label={
                                <Badge badgeContent={configHistory.length} color="primary">
                                    Pending Changes
                                </Badge>
                            } 
                        />
                    </Tabs>

                    {selectedTab === 1 && (
                        <Box sx={{ mt: 2, mb: 2 }}>
                            <Grid container spacing={2}>
                                <Grid item xs={12} md={6}>
                                    <TextField
                                        fullWidth
                                        placeholder="Search changes..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        InputProps={{
                                            startAdornment: (
                                                <InputAdornment position="start">
                                                    <SearchIcon />
                                                </InputAdornment>
                                            ),
                                        }}
                                    />
                                </Grid>
                                <Grid item xs={12} md={3}>
                                    <Autocomplete
                                        multiple
                                        options={allTags}
                                        value={selectedTags}
                                        onChange={(_, newValue) => setSelectedTags(newValue)}
                                        renderInput={(params) => (
                                            <TextField
                                                {...params}
                                                label="Filter by tags"
                                                placeholder="Select tags"
                                            />
                                        )}
                                    />
                                </Grid>
                                <Grid item xs={12} md={3}>
                                    <FormControl fullWidth>
                                        <InputLabel>Status</InputLabel>
                                        <Select
                                            value={filterStatus}
                                            onChange={(e) => setFilterStatus(e.target.value)}
                                            label="Status"
                                        >
                                            <MenuItem value="all">All</MenuItem>
                                            <MenuItem value="pending">Pending</MenuItem>
                                            <MenuItem value="approved">Approved</MenuItem>
                                            <MenuItem value="rejected">Rejected</MenuItem>
                                        </Select>
                                    </FormControl>
                                </Grid>
                            </Grid>

                            {selectedChanges.length > 0 && (
                                <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                                    <Button
                                        variant="contained"
                                        color="success"
                                        onClick={handleBulkApprove}
                                    >
                                        Approve Selected ({selectedChanges.length})
                                    </Button>
                                    <Button
                                        variant="contained"
                                        color="error"
                                        onClick={handleBulkReject}
                                    >
                                        Reject Selected ({selectedChanges.length})
                                    </Button>
                                </Box>
                            )}
                        </Box>
                    )}

                    <TableContainer component={Paper}>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    {selectedTab === 1 && (
                                        <TableCell padding="checkbox">
                                            <Checkbox
                                                checked={selectedChanges.length === filteredChanges.length}
                                                indeterminate={selectedChanges.length > 0 && selectedChanges.length < filteredChanges.length}
                                                onChange={(e) => {
                                                    if (e.target.checked) {
                                                        setSelectedChanges(filteredChanges.map(change => change.lastModified));
                                                    } else {
                                                        setSelectedChanges([]);
                                                    }
                                                }}
                                            />
                                        </TableCell>
                                    )}
                                    <TableCell>Version</TableCell>
                                    <TableCell>Description</TableCell>
                                    <TableCell>Author</TableCell>
                                    <TableCell>Tags</TableCell>
                                    <TableCell>Status</TableCell>
                                    <TableCell>Last Modified</TableCell>
                                    <TableCell>Actions</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {(selectedTab === 0 ? configHistory : filteredChanges).map((version) => (
                                    <TableRow key={version.lastModified}>
                                        {selectedTab === 1 && (
                                            <TableCell padding="checkbox">
                                                <Checkbox
                                                    checked={selectedChanges.includes(version.lastModified)}
                                                    onChange={(e) => {
                                                        if (e.target.checked) {
                                                            setSelectedChanges([...selectedChanges, version.lastModified]);
                                                        } else {
                                                            setSelectedChanges(selectedChanges.filter(id => id !== version.lastModified));
                                                        }
                                                    }}
                                                />
                                            </TableCell>
                                        )}
                                        <TableCell>{version.version}</TableCell>
                                        <TableCell>{version.metadata?.description}</TableCell>
                                        <TableCell>{version.metadata?.author}</TableCell>
                                        <TableCell>
                                            <Stack direction="row" spacing={1}>
                                                {version.metadata?.tags?.map(tag => (
                                                    <Chip key={tag} label={tag} size="small" />
                                                ))}
                                            </Stack>
                                        </TableCell>
                                        <TableCell>
                                            <Chip 
                                                label={version.metadata?.status} 
                                                color={
                                                    version.metadata?.status === 'approved' ? 'success' :
                                                    version.metadata?.status === 'rejected' ? 'error' :
                                                    'warning'
                                                }
                                            />
                                        </TableCell>
                                        <TableCell>{new Date(version.lastModified).toLocaleString()}</TableCell>
                                        <TableCell>
                                            <Stack direction="row" spacing={1}>
                                                <MuiTooltip title="Preview Changes">
                                                    <IconButton
                                                        size="small"
                                                        onClick={() => handlePreviewChange(version)}
                                                    >
                                                        <PreviewIcon />
                                                    </IconButton>
                                                </MuiTooltip>
                                                {version.metadata?.status === 'pending' && (
                                                    <>
                                                        <Button
                                                            size="small"
                                                            onClick={() => handleApproveChange(version.lastModified)}
                                                            color="success"
                                                        >
                                                            Approve
                                                        </Button>
                                                        <Button
                                                            size="small"
                                                            onClick={() => handleRejectChange(version.lastModified)}
                                                            color="error"
                                                        >
                                                            Reject
                                                        </Button>
                                                    </>
                                                )}
                                            </Stack>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setHistoryDialogOpen(false)}>Close</Button>
                </DialogActions>
            </Dialog>

            {/* Change Preview Dialog */}
            <Dialog 
                open={previewDialogOpen} 
                onClose={() => setPreviewDialogOpen(false)}
                maxWidth="md"
                fullWidth
            >
                <DialogTitle>Change Preview</DialogTitle>
                <DialogContent>
                    {previewData && (
                        <Box>
                            <Typography variant="h6" gutterBottom>Metadata</Typography>
                            <Grid container spacing={2} sx={{ mb: 3 }}>
                                <Grid item xs={12} md={6}>
                                    <Typography variant="subtitle2">Description</Typography>
                                    <Typography>{previewData.metadata?.description}</Typography>
                                </Grid>
                                <Grid item xs={12} md={6}>
                                    <Typography variant="subtitle2">Author</Typography>
                                    <Typography>{previewData.metadata?.author}</Typography>
                                </Grid>
                                <Grid item xs={12}>
                                    <Typography variant="subtitle2">Tags</Typography>
                                    <Stack direction="row" spacing={1}>
                                        {previewData.metadata?.tags?.map(tag => (
                                            <Chip key={tag} label={tag} />
                                        ))}
                                    </Stack>
                                </Grid>
                            </Grid>

                            <Divider sx={{ my: 3 }} />

                            <Typography variant="h6" gutterBottom>Changes</Typography>
                            <TableContainer component={Paper}>
                                <Table size="small">
                                    <TableHead>
                                        <TableRow>
                                            <TableCell>Setting</TableCell>
                                            <TableCell>Current Value</TableCell>
                                            <TableCell>New Value</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {Object.entries(previewData).map(([key, value]) => {
                                            if (key === 'metadata' || key === 'version' || key === 'lastModified') {
                                                return null;
                                            }
                                            return (
                                                <TableRow key={key}>
                                                    <TableCell>{key}</TableCell>
                                                    <TableCell>
                                                        {JSON.stringify(config[key])}
                                                    </TableCell>
                                                    <TableCell>
                                                        {JSON.stringify(value)}
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        </Box>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setPreviewDialogOpen(false)}>Close</Button>
                </DialogActions>
            </Dialog>

            {/* Settings Dialog */}
            <Dialog open={settingsOpen} onClose={() => setSettingsOpen(false)} maxWidth="md" fullWidth>
                <DialogTitle>Dashboard Settings</DialogTitle>
                <DialogContent>
                    <Box sx={{ mt: 2 }}>
                        <Typography variant="h6" gutterBottom>Thresholds</Typography>
                        <Grid container spacing={2}>
                            <Grid item xs={12}>
                                <Typography>CPU Threshold: {config.thresholds.cpu * 100}%</Typography>
                                <Slider
                                    value={config.thresholds.cpu}
                                    onChange={(_, value) => setConfig({
                                        ...config,
                                        thresholds: { ...config.thresholds, cpu: value }
                                    })}
                                    min={0}
                                    max={1}
                                    step={0.05}
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <Typography>Memory Threshold: {config.thresholds.memory * 100}%</Typography>
                                <Slider
                                    value={config.thresholds.memory}
                                    onChange={(_, value) => setConfig({
                                        ...config,
                                        thresholds: { ...config.thresholds, memory: value }
                                    })}
                                    min={0}
                                    max={1}
                                    step={0.05}
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <Typography>Latency Threshold: {config.thresholds.latency}ms</Typography>
                                <Slider
                                    value={config.thresholds.latency}
                                    onChange={(_, value) => setConfig({
                                        ...config,
                                        thresholds: { ...config.thresholds, latency: value }
                                    })}
                                    min={0}
                                    max={5000}
                                    step={100}
                                />
                            </Grid>
                        </Grid>
                    </Box>

                    <Box sx={{ mt: 3 }}>
                        <Typography variant="h6" gutterBottom>Auto Scaling</Typography>
                        <FormControlLabel
                            control={
                                <Switch
                                    checked={config.autoScaling.enabled}
                                    onChange={(e) => setConfig({
                                        ...config,
                                        autoScaling: {
                                            ...config.autoScaling,
                                            enabled: e.target.checked
                                        }
                                    })}
                                />
                            }
                            label="Enable Auto Scaling"
                        />
                        {config.autoScaling.enabled && (
                            <Grid container spacing={2} sx={{ mt: 1 }}>
                                <Grid item xs={6}>
                                    <TextField
                                        label="Min Instances"
                                        type="number"
                                        value={config.autoScaling.minInstances}
                                        onChange={(e) => setConfig({
                                            ...config,
                                            autoScaling: {
                                                ...config.autoScaling,
                                                minInstances: parseInt(e.target.value)
                                            }
                                        })}
                                    />
                                </Grid>
                                <Grid item xs={6}>
                                    <TextField
                                        label="Max Instances"
                                        type="number"
                                        value={config.autoScaling.maxInstances}
                                        onChange={(e) => setConfig({
                                            ...config,
                                            autoScaling: {
                                                ...config.autoScaling,
                                                maxInstances: parseInt(e.target.value)
                                            }
                                        })}
                                    />
                                </Grid>
                            </Grid>
                        )}
                    </Box>

                    <Box sx={{ mt: 3 }}>
                        <Typography variant="h6" gutterBottom>Display Options</Typography>
                        <FormControlLabel
                            control={
                                <Switch
                                    checked={config.display.showP95}
                                    onChange={(e) => setConfig({
                                        ...config,
                                        display: {
                                            ...config.display,
                                            showP95: e.target.checked
                                        }
                                    })}
                                />
                            }
                            label="Show P95 Latency"
                        />
                        <FormControlLabel
                            control={
                                <Switch
                                    checked={config.display.showP99}
                                    onChange={(e) => setConfig({
                                        ...config,
                                        display: {
                                            ...config.display,
                                            showP99: e.target.checked
                                        }
                                    })}
                                />
                            }
                            label="Show P99 Latency"
                        />
                    </Box>

                    {renderAlertConfig()}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setSettingsOpen(false)}>Close</Button>
                </DialogActions>
            </Dialog>

            {/* Notifications Dialog */}
            <Dialog open={notificationsOpen} onClose={() => setNotificationsOpen(false)}>
                <DialogTitle>Notification Settings</DialogTitle>
                <DialogContent>
                    <Box sx={{ mt: 2 }}>
                        <FormControlLabel
                            control={
                                <Switch
                                    checked={config.alerts.email}
                                    onChange={(e) => setConfig({
                                        ...config,
                                        alerts: {
                                            ...config.alerts,
                                            email: e.target.checked
                                        }
                                    })}
                                />
                            }
                            label="Email Notifications"
                        />
                        <FormControlLabel
                            control={
                                <Switch
                                    checked={config.alerts.slack}
                                    onChange={(e) => setConfig({
                                        ...config,
                                        alerts: {
                                            ...config.alerts,
                                            slack: e.target.checked
                                        }
                                    })}
                                />
                            }
                            label="Slack Notifications"
                        />
                        <FormControlLabel
                            control={
                                <Switch
                                    checked={config.alerts.browser}
                                    onChange={(e) => setConfig({
                                        ...config,
                                        alerts: {
                                            ...config.alerts,
                                            browser: e.target.checked
                                        }
                                    })}
                                />
                            }
                            label="Browser Notifications"
                        />
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setNotificationsOpen(false)}>Close</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default MonitoringDashboard; 