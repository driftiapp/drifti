import React, { useState } from 'react';
import {
    Box,
    Typography,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Chip,
    IconButton,
    Menu,
    MenuItem,
    TextField,
    Button,
    Stack,
    FormControl,
    InputLabel,
    Select,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    DatePicker
} from '@mui/material';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import FilterListIcon from '@mui/icons-material/FilterList';
import DownloadIcon from '@mui/icons-material/Download';
import { format, parseISO } from 'date-fns';
import { exportToCSV, exportToPDF, formatAlertDataForExport } from '../../utils/exportUtils';

const RecentAlerts = ({ alerts }) => {
    const [filter, setFilter] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [anchorEl, setAnchorEl] = useState(null);
    const [filterDialogOpen, setFilterDialogOpen] = useState(false);
    const [sortField, setSortField] = useState('timestamp');
    const [sortDirection, setSortDirection] = useState('desc');
    const [dateRange, setDateRange] = useState({ start: null, end: null });
    const [severity, setSeverity] = useState('all');

    if (!alerts) return null;

    const getStatusColor = (type) => {
        switch (type) {
            case 'failure':
                return 'error';
            case 'recovery':
                return 'success';
            case 'warning':
                return 'warning';
            default:
                return 'default';
        }
    };

    const handleSort = (field) => {
        if (sortField === field) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortDirection('asc');
        }
    };

    const filteredAlerts = alerts
        .filter(alert => {
            const matchesFilter = filter === 'all' || alert.type === filter;
            const matchesSearch = searchTerm === '' || 
                alert.component.toLowerCase().includes(searchTerm.toLowerCase()) ||
                alert.message.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesSeverity = severity === 'all' || alert.severity === severity;
            const matchesDateRange = (!dateRange.start || new Date(alert.timestamp) >= dateRange.start) &&
                                  (!dateRange.end || new Date(alert.timestamp) <= dateRange.end);
            return matchesFilter && matchesSearch && matchesSeverity && matchesDateRange;
        })
        .sort((a, b) => {
            const aValue = a[sortField];
            const bValue = b[sortField];
            const direction = sortDirection === 'asc' ? 1 : -1;
            
            if (sortField === 'timestamp') {
                return direction * (new Date(aValue) - new Date(bValue));
            }
            return direction * (aValue > bValue ? 1 : -1);
        });

    const handleMenuClick = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const handleMenuClose = () => {
        setAnchorEl(null);
    };

    const handleFilterDialogOpen = () => {
        setFilterDialogOpen(true);
    };

    const handleFilterDialogClose = () => {
        setFilterDialogOpen(false);
    };

    const handleFilterApply = () => {
        handleFilterDialogClose();
    };

    const handleExport = (format) => {
        const exportData = formatAlertDataForExport(filteredAlerts);
        if (format === 'csv') {
            exportToCSV(exportData, 'alert_history');
        } else if (format === 'pdf') {
            exportToPDF(exportData, 'alert_history', 'Alert History Report');
        }
        handleMenuClose();
    };

    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">Recent Alerts</Typography>
                <Stack direction="row" spacing={2}>
                    <TextField
                        size="small"
                        placeholder="Search alerts..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        sx={{ width: 200 }}
                    />
                    <Button
                        startIcon={<FilterListIcon />}
                        onClick={handleFilterDialogOpen}
                        variant="outlined"
                    >
                        Advanced Filters
                    </Button>
                    <Button
                        startIcon={<DownloadIcon />}
                        onClick={handleMenuClick}
                        variant="outlined"
                    >
                        Export
                    </Button>
                    <Menu
                        anchorEl={anchorEl}
                        open={Boolean(anchorEl)}
                        onClose={handleMenuClose}
                    >
                        <MenuItem onClick={() => handleExport('csv')}>Export as CSV</MenuItem>
                        <MenuItem onClick={() => handleExport('pdf')}>Export as PDF</MenuItem>
                    </Menu>
                </Stack>
            </Box>
            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell onClick={() => handleSort('timestamp')} sx={{ cursor: 'pointer' }}>
                                Time {sortField === 'timestamp' && (sortDirection === 'asc' ? '↑' : '↓')}
                            </TableCell>
                            <TableCell onClick={() => handleSort('component')} sx={{ cursor: 'pointer' }}>
                                Component {sortField === 'component' && (sortDirection === 'asc' ? '↑' : '↓')}
                            </TableCell>
                            <TableCell onClick={() => handleSort('type')} sx={{ cursor: 'pointer' }}>
                                Type {sortField === 'type' && (sortDirection === 'asc' ? '↑' : '↓')}
                            </TableCell>
                            <TableCell onClick={() => handleSort('message')} sx={{ cursor: 'pointer' }}>
                                Message {sortField === 'message' && (sortDirection === 'asc' ? '↑' : '↓')}
                            </TableCell>
                            <TableCell onClick={() => handleSort('status')} sx={{ cursor: 'pointer' }}>
                                Status {sortField === 'status' && (sortDirection === 'asc' ? '↑' : '↓')}
                            </TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {filteredAlerts.map((alert) => (
                            <TableRow key={alert._id}>
                                <TableCell>
                                    {format(new Date(alert.timestamp), 'MMM d, yyyy HH:mm:ss')}
                                </TableCell>
                                <TableCell>{alert.component}</TableCell>
                                <TableCell>
                                    <Chip
                                        label={alert.type}
                                        color={getStatusColor(alert.type)}
                                        size="small"
                                    />
                                </TableCell>
                                <TableCell>{alert.message}</TableCell>
                                <TableCell>
                                    <Chip
                                        label={alert.status}
                                        color={alert.status === 'healthy' ? 'success' : 'error'}
                                        size="small"
                                    />
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>

            <Dialog open={filterDialogOpen} onClose={handleFilterDialogClose}>
                <DialogTitle>Advanced Filters</DialogTitle>
                <DialogContent>
                    <Stack spacing={2} sx={{ mt: 1 }}>
                        <FormControl fullWidth>
                            <InputLabel>Severity</InputLabel>
                            <Select
                                value={severity}
                                label="Severity"
                                onChange={(e) => setSeverity(e.target.value)}
                            >
                                <MenuItem value="all">All</MenuItem>
                                <MenuItem value="critical">Critical</MenuItem>
                                <MenuItem value="high">High</MenuItem>
                                <MenuItem value="medium">Medium</MenuItem>
                                <MenuItem value="low">Low</MenuItem>
                            </Select>
                        </FormControl>
                        <DatePicker
                            label="Start Date"
                            value={dateRange.start}
                            onChange={(date) => setDateRange({ ...dateRange, start: date })}
                            renderInput={(params) => <TextField {...params} fullWidth />}
                        />
                        <DatePicker
                            label="End Date"
                            value={dateRange.end}
                            onChange={(date) => setDateRange({ ...dateRange, end: date })}
                            renderInput={(params) => <TextField {...params} fullWidth />}
                        />
                    </Stack>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleFilterDialogClose}>Cancel</Button>
                    <Button onClick={handleFilterApply} variant="contained">
                        Apply Filters
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default RecentAlerts; 