import React, { useEffect, useState } from 'react';
import {
    Box,
    Card,
    CardContent,
    Typography,
    Switch,
    FormGroup,
    FormControlLabel,
    Divider,
    TextField,
    Button,
    Alert,
    CircularProgress,
    Grid,
    Accordion,
    AccordionSummary,
    AccordionDetails,
    Chip
} from '@mui/material';
import { TimePicker } from '@mui/x-date-pickers';
import { ExpandMore as ExpandMoreIcon } from '@mui/icons-material';
import axios from '../utils/axios';
import { useAuth } from '../hooks/useAuth';

interface NotificationPreferences {
    holidays: {
        enabled: boolean;
        preferences: {
            ramadan: boolean;
            christmas: boolean;
            newYear: boolean;
            eid: boolean;
        };
    };
    sports: {
        enabled: boolean;
        preferences: {
            football: boolean;
            basketball: boolean;
            baseball: boolean;
            soccer: boolean;
        };
        favoriteTeams: string[];
    };
    religious: {
        enabled: boolean;
        preferences: {
            prayerTimes: boolean;
            halalRestaurants: boolean;
            charityOpportunities: boolean;
        };
    };
    promos: {
        enabled: boolean;
        preferences: {
            restaurants: boolean;
            rides: boolean;
            events: boolean;
        };
    };
    notificationMethods: {
        push: boolean;
        email: boolean;
        sms: boolean;
    };
    quietHours: {
        enabled: boolean;
        start: string;
        end: string;
    };
    location: {
        enabled: boolean;
    };
}

const NotificationPreferences: React.FC = () => {
    const { user } = useAuth();
    const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [newTeam, setNewTeam] = useState('');

    useEffect(() => {
        fetchPreferences();
    }, []);

    const fetchPreferences = async () => {
        try {
            const response = await axios.get('/api/notifications/preferences');
            setPreferences(response.data.data);
            setError(null);
        } catch (err) {
            setError('Failed to load preferences');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!preferences) return;

        setSaving(true);
        setError(null);
        setSuccess(false);

        try {
            await axios.put('/api/notifications/preferences', { preferences });
            setSuccess(true);
        } catch (err) {
            setError('Failed to save preferences');
        } finally {
            setSaving(false);
        }
    };

    const handleToggle = (section: string, subsection?: string, field?: string) => {
        if (!preferences) return;

        setPreferences(prev => {
            if (!prev) return prev;

            const newPrefs = { ...prev };
            if (!subsection) {
                newPrefs[section as keyof NotificationPreferences] = {
                    ...newPrefs[section as keyof NotificationPreferences],
                    enabled: !newPrefs[section as keyof NotificationPreferences].enabled
                };
            } else if (!field) {
                newPrefs[section as keyof NotificationPreferences].preferences[subsection] =
                    !newPrefs[section as keyof NotificationPreferences].preferences[subsection];
            }
            return newPrefs;
        });
    };

    const handleAddTeam = () => {
        if (!newTeam || !preferences) return;

        setPreferences(prev => {
            if (!prev) return prev;
            return {
                ...prev,
                sports: {
                    ...prev.sports,
                    favoriteTeams: [...prev.sports.favoriteTeams, newTeam]
                }
            };
        });
        setNewTeam('');
    };

    const handleRemoveTeam = (team: string) => {
        if (!preferences) return;

        setPreferences(prev => {
            if (!prev) return prev;
            return {
                ...prev,
                sports: {
                    ...prev.sports,
                    favoriteTeams: prev.sports.favoriteTeams.filter(t => t !== team)
                }
            };
        });
    };

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
                <CircularProgress />
            </Box>
        );
    }

    if (!preferences) {
        return <Alert severity="error">Failed to load preferences</Alert>;
    }

    return (
        <Card>
            <CardContent>
                <Typography variant="h5" gutterBottom>
                    Notification Preferences
                </Typography>

                {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
                {success && <Alert severity="success" sx={{ mb: 2 }}>Preferences saved successfully</Alert>}

                <Grid container spacing={3}>
                    {/* Holiday Preferences */}
                    <Grid item xs={12}>
                        <Accordion defaultExpanded>
                            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                                <Typography variant="h6">Holiday Notifications</Typography>
                            </AccordionSummary>
                            <AccordionDetails>
                                <FormGroup>
                                    <FormControlLabel
                                        control={
                                            <Switch
                                                checked={preferences.holidays.enabled}
                                                onChange={() => handleToggle('holidays')}
                                            />
                                        }
                                        label="Enable Holiday Notifications"
                                    />
                                    {preferences.holidays.enabled && (
                                        <Box sx={{ ml: 3 }}>
                                            <FormControlLabel
                                                control={
                                                    <Switch
                                                        checked={preferences.holidays.preferences.ramadan}
                                                        onChange={() => handleToggle('holidays', 'ramadan')}
                                                    />
                                                }
                                                label="Ramadan"
                                            />
                                            <FormControlLabel
                                                control={
                                                    <Switch
                                                        checked={preferences.holidays.preferences.christmas}
                                                        onChange={() => handleToggle('holidays', 'christmas')}
                                                    />
                                                }
                                                label="Christmas"
                                            />
                                            <FormControlLabel
                                                control={
                                                    <Switch
                                                        checked={preferences.holidays.preferences.newYear}
                                                        onChange={() => handleToggle('holidays', 'newYear')}
                                                    />
                                                }
                                                label="New Year"
                                            />
                                            <FormControlLabel
                                                control={
                                                    <Switch
                                                        checked={preferences.holidays.preferences.eid}
                                                        onChange={() => handleToggle('holidays', 'eid')}
                                                    />
                                                }
                                                label="Eid"
                                            />
                                        </Box>
                                    )}
                                </FormGroup>
                            </AccordionDetails>
                        </Accordion>
                    </Grid>

                    {/* Sports Preferences */}
                    <Grid item xs={12}>
                        <Accordion>
                            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                                <Typography variant="h6">Sports Notifications</Typography>
                            </AccordionSummary>
                            <AccordionDetails>
                                <FormGroup>
                                    <FormControlLabel
                                        control={
                                            <Switch
                                                checked={preferences.sports.enabled}
                                                onChange={() => handleToggle('sports')}
                                            />
                                        }
                                        label="Enable Sports Notifications"
                                    />
                                    {preferences.sports.enabled && (
                                        <Box sx={{ ml: 3 }}>
                                            <FormControlLabel
                                                control={
                                                    <Switch
                                                        checked={preferences.sports.preferences.football}
                                                        onChange={() => handleToggle('sports', 'football')}
                                                    />
                                                }
                                                label="Football"
                                            />
                                            <FormControlLabel
                                                control={
                                                    <Switch
                                                        checked={preferences.sports.preferences.basketball}
                                                        onChange={() => handleToggle('sports', 'basketball')}
                                                    />
                                                }
                                                label="Basketball"
                                            />
                                            <FormControlLabel
                                                control={
                                                    <Switch
                                                        checked={preferences.sports.preferences.baseball}
                                                        onChange={() => handleToggle('sports', 'baseball')}
                                                    />
                                                }
                                                label="Baseball"
                                            />
                                            <FormControlLabel
                                                control={
                                                    <Switch
                                                        checked={preferences.sports.preferences.soccer}
                                                        onChange={() => handleToggle('sports', 'soccer')}
                                                    />
                                                }
                                                label="Soccer"
                                            />
                                            <Box sx={{ mt: 2 }}>
                                                <Typography variant="subtitle1">Favorite Teams</Typography>
                                                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
                                                    {preferences.sports.favoriteTeams.map(team => (
                                                        <Chip
                                                            key={team}
                                                            label={team}
                                                            onDelete={() => handleRemoveTeam(team)}
                                                        />
                                                    ))}
                                                </Box>
                                                <Box sx={{ display: 'flex', gap: 1 }}>
                                                    <TextField
                                                        size="small"
                                                        value={newTeam}
                                                        onChange={(e) => setNewTeam(e.target.value)}
                                                        placeholder="Add team"
                                                    />
                                                    <Button
                                                        variant="contained"
                                                        onClick={handleAddTeam}
                                                        disabled={!newTeam}
                                                    >
                                                        Add
                                                    </Button>
                                                </Box>
                                            </Box>
                                        </Box>
                                    )}
                                </FormGroup>
                            </AccordionDetails>
                        </Accordion>
                    </Grid>

                    {/* Religious Preferences */}
                    <Grid item xs={12}>
                        <Accordion>
                            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                                <Typography variant="h6">Religious Services</Typography>
                            </AccordionSummary>
                            <AccordionDetails>
                                <FormGroup>
                                    <FormControlLabel
                                        control={
                                            <Switch
                                                checked={preferences.religious.enabled}
                                                onChange={() => handleToggle('religious')}
                                            />
                                        }
                                        label="Enable Religious Services"
                                    />
                                    {preferences.religious.enabled && (
                                        <Box sx={{ ml: 3 }}>
                                            <FormControlLabel
                                                control={
                                                    <Switch
                                                        checked={preferences.religious.preferences.prayerTimes}
                                                        onChange={() => handleToggle('religious', 'prayerTimes')}
                                                    />
                                                }
                                                label="Prayer Times"
                                            />
                                            <FormControlLabel
                                                control={
                                                    <Switch
                                                        checked={preferences.religious.preferences.halalRestaurants}
                                                        onChange={() => handleToggle('religious', 'halalRestaurants')}
                                                    />
                                                }
                                                label="Halal Restaurants"
                                            />
                                            <FormControlLabel
                                                control={
                                                    <Switch
                                                        checked={preferences.religious.preferences.charityOpportunities}
                                                        onChange={() => handleToggle('religious', 'charityOpportunities')}
                                                    />
                                                }
                                                label="Charity Opportunities"
                                            />
                                        </Box>
                                    )}
                                </FormGroup>
                            </AccordionDetails>
                        </Accordion>
                    </Grid>

                    {/* Notification Methods */}
                    <Grid item xs={12}>
                        <Accordion>
                            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                                <Typography variant="h6">Notification Methods</Typography>
                            </AccordionSummary>
                            <AccordionDetails>
                                <FormGroup>
                                    <FormControlLabel
                                        control={
                                            <Switch
                                                checked={preferences.notificationMethods.push}
                                                onChange={() => handleToggle('notificationMethods', 'push')}
                                            />
                                        }
                                        label="Push Notifications"
                                    />
                                    <FormControlLabel
                                        control={
                                            <Switch
                                                checked={preferences.notificationMethods.email}
                                                onChange={() => handleToggle('notificationMethods', 'email')}
                                            />
                                        }
                                        label="Email Notifications"
                                    />
                                    <FormControlLabel
                                        control={
                                            <Switch
                                                checked={preferences.notificationMethods.sms}
                                                onChange={() => handleToggle('notificationMethods', 'sms')}
                                            />
                                        }
                                        label="SMS Notifications"
                                    />
                                </FormGroup>
                            </AccordionDetails>
                        </Accordion>
                    </Grid>

                    {/* Quiet Hours */}
                    <Grid item xs={12}>
                        <Accordion>
                            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                                <Typography variant="h6">Quiet Hours</Typography>
                            </AccordionSummary>
                            <AccordionDetails>
                                <FormGroup>
                                    <FormControlLabel
                                        control={
                                            <Switch
                                                checked={preferences.quietHours.enabled}
                                                onChange={() => handleToggle('quietHours')}
                                            />
                                        }
                                        label="Enable Quiet Hours"
                                    />
                                    {preferences.quietHours.enabled && (
                                        <Box sx={{ ml: 3, mt: 2 }}>
                                            <Grid container spacing={2}>
                                                <Grid item xs={12} sm={6}>
                                                    <TimePicker
                                                        label="Start Time"
                                                        value={preferences.quietHours.start}
                                                        onChange={(newValue) => {
                                                            if (newValue) {
                                                                setPreferences(prev => ({
                                                                    ...prev!,
                                                                    quietHours: {
                                                                        ...prev!.quietHours,
                                                                        start: newValue
                                                                    }
                                                                }));
                                                            }
                                                        }}
                                                    />
                                                </Grid>
                                                <Grid item xs={12} sm={6}>
                                                    <TimePicker
                                                        label="End Time"
                                                        value={preferences.quietHours.end}
                                                        onChange={(newValue) => {
                                                            if (newValue) {
                                                                setPreferences(prev => ({
                                                                    ...prev!,
                                                                    quietHours: {
                                                                        ...prev!.quietHours,
                                                                        end: newValue
                                                                    }
                                                                }));
                                                            }
                                                        }}
                                                    />
                                                </Grid>
                                            </Grid>
                                        </Box>
                                    )}
                                </FormGroup>
                            </AccordionDetails>
                        </Accordion>
                    </Grid>

                    {/* Location Services */}
                    <Grid item xs={12}>
                        <Accordion>
                            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                                <Typography variant="h6">Location Services</Typography>
                            </AccordionSummary>
                            <AccordionDetails>
                                <FormGroup>
                                    <FormControlLabel
                                        control={
                                            <Switch
                                                checked={preferences.location.enabled}
                                                onChange={() => handleToggle('location')}
                                            />
                                        }
                                        label="Enable Location Services"
                                    />
                                </FormGroup>
                            </AccordionDetails>
                        </Accordion>
                    </Grid>
                </Grid>

                <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
                    <Button
                        variant="contained"
                        onClick={handleSave}
                        disabled={saving}
                        startIcon={saving ? <CircularProgress size={20} /> : null}
                    >
                        {saving ? 'Saving...' : 'Save Preferences'}
                    </Button>
                </Box>
            </CardContent>
        </Card>
    );
};

export default NotificationPreferences; 