import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Switch,
  Divider,
  Alert,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  SelectChangeEvent
} from '@mui/material';
import LazyLoad from '@/components/LazyLoad';
import LoadingState from '@/components/LoadingState';

interface Preferences {
  language: string;
  timezone: string;
  dateFormat: string;
  currency: string;
  theme: 'light' | 'dark' | 'system';
  notifications: {
    email: boolean;
    push: boolean;
    sms: boolean;
  };
  privacy: {
    showOnlineStatus: boolean;
    showLastSeen: boolean;
    allowFriendRequests: boolean;
  };
}

const defaultPreferences: Preferences = {
  language: 'en',
  timezone: 'UTC',
  dateFormat: 'MM/DD/YYYY',
  currency: 'USD',
  theme: 'system',
  notifications: {
    email: true,
    push: true,
    sms: false
  },
  privacy: {
    showOnlineStatus: true,
    showLastSeen: true,
    allowFriendRequests: true
  }
};

const PreferencesPage: React.FC = () => {
  const [preferences, setPreferences] = useState<Preferences>(defaultPreferences);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    const loadPreferences = () => {
      try {
        const savedPreferences = localStorage.getItem('userPreferences');
        if (savedPreferences) {
          setPreferences(JSON.parse(savedPreferences));
        }
      } catch (err) {
        setError('Failed to load preferences');
      } finally {
        setLoading(false);
      }
    };

    loadPreferences();
  }, []);

  const handlePreferenceChange = (setting: keyof Preferences) => (
    event: SelectChangeEvent
  ) => {
    setPreferences(prev => ({
      ...prev,
      [setting]: event.target.value
    }));
  };

  const handleNestedPreferenceChange = (
    category: 'notifications' | 'privacy',
    setting: string
  ) => (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const newValue = event.target.checked;

    setPreferences(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [setting]: newValue
      }
    }));
  };

  const handleSave = () => {
    try {
      localStorage.setItem('userPreferences', JSON.stringify(preferences));
      setSuccess('Preferences saved successfully!');
    } catch (err) {
      setError('Failed to save preferences');
    }
  };

  if (loading) {
    return <LoadingState message="Loading preferences..." />;
  }

  return (
    <LazyLoad>
      <Box maxWidth="800px" mx="auto" p={3}>
        <Paper elevation={3} sx={{ p: 4 }}>
          <Typography variant="h4" gutterBottom>
            User Preferences
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {success && (
            <Alert severity="success" sx={{ mb: 2 }}>
              {success}
            </Alert>
          )}

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
              <Box sx={{ flex: '1 1 300px' }}>
                <FormControl fullWidth>
                  <InputLabel>Language</InputLabel>
                  <Select
                    value={preferences.language}
                    label="Language"
                    onChange={handlePreferenceChange('language')}
                  >
                    <MenuItem value="en">English</MenuItem>
                    <MenuItem value="es">Spanish</MenuItem>
                    <MenuItem value="fr">French</MenuItem>
                    <MenuItem value="de">German</MenuItem>
                    <MenuItem value="it">Italian</MenuItem>
                  </Select>
                </FormControl>
              </Box>

              <Box sx={{ flex: '1 1 300px' }}>
                <FormControl fullWidth>
                  <InputLabel>Theme</InputLabel>
                  <Select
                    value={preferences.theme}
                    label="Theme"
                    onChange={handlePreferenceChange('theme')}
                  >
                    <MenuItem value="light">Light</MenuItem>
                    <MenuItem value="dark">Dark</MenuItem>
                    <MenuItem value="system">System</MenuItem>
                  </Select>
                </FormControl>
              </Box>

              <Box sx={{ flex: '1 1 300px' }}>
                <FormControl fullWidth>
                  <InputLabel>Timezone</InputLabel>
                  <Select
                    value={preferences.timezone}
                    label="Timezone"
                    onChange={handlePreferenceChange('timezone')}
                  >
                    <MenuItem value="UTC">UTC</MenuItem>
                    <MenuItem value="EST">Eastern Time</MenuItem>
                    <MenuItem value="CST">Central Time</MenuItem>
                    <MenuItem value="PST">Pacific Time</MenuItem>
                  </Select>
                </FormControl>
              </Box>

              <Box sx={{ flex: '1 1 300px' }}>
                <FormControl fullWidth>
                  <InputLabel>Currency</InputLabel>
                  <Select
                    value={preferences.currency}
                    label="Currency"
                    onChange={handlePreferenceChange('currency')}
                  >
                    <MenuItem value="USD">USD ($)</MenuItem>
                    <MenuItem value="EUR">EUR (€)</MenuItem>
                    <MenuItem value="GBP">GBP (£)</MenuItem>
                    <MenuItem value="JPY">JPY (¥)</MenuItem>
                  </Select>
                </FormControl>
              </Box>
            </Box>

            <Divider />

            <Typography variant="h6" gutterBottom>
              Notifications
            </Typography>
            <List>
              <ListItem>
                <ListItemText primary="Email Notifications" />
                <ListItemSecondaryAction>
                  <Switch
                    edge="end"
                    checked={preferences.notifications.email}
                    onChange={handleNestedPreferenceChange('notifications', 'email')}
                  />
                </ListItemSecondaryAction>
              </ListItem>
              <ListItem>
                <ListItemText primary="Push Notifications" />
                <ListItemSecondaryAction>
                  <Switch
                    edge="end"
                    checked={preferences.notifications.push}
                    onChange={handleNestedPreferenceChange('notifications', 'push')}
                  />
                </ListItemSecondaryAction>
              </ListItem>
              <ListItem>
                <ListItemText primary="SMS Notifications" />
                <ListItemSecondaryAction>
                  <Switch
                    edge="end"
                    checked={preferences.notifications.sms}
                    onChange={handleNestedPreferenceChange('notifications', 'sms')}
                  />
                </ListItemSecondaryAction>
              </ListItem>
            </List>

            <Divider />

            <Typography variant="h6" gutterBottom>
              Privacy Settings
            </Typography>
            <List>
              <ListItem>
                <ListItemText primary="Show Online Status" />
                <ListItemSecondaryAction>
                  <Switch
                    edge="end"
                    checked={preferences.privacy.showOnlineStatus}
                    onChange={handleNestedPreferenceChange('privacy', 'showOnlineStatus')}
                  />
                </ListItemSecondaryAction>
              </ListItem>
              <ListItem>
                <ListItemText primary="Show Last Seen" />
                <ListItemSecondaryAction>
                  <Switch
                    edge="end"
                    checked={preferences.privacy.showLastSeen}
                    onChange={handleNestedPreferenceChange('privacy', 'showLastSeen')}
                  />
                </ListItemSecondaryAction>
              </ListItem>
              <ListItem>
                <ListItemText primary="Allow Friend Requests" />
                <ListItemSecondaryAction>
                  <Switch
                    edge="end"
                    checked={preferences.privacy.allowFriendRequests}
                    onChange={handleNestedPreferenceChange('privacy', 'allowFriendRequests')}
                  />
                </ListItemSecondaryAction>
              </ListItem>
            </List>

            <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Button
                variant="contained"
                color="primary"
                onClick={handleSave}
              >
                Save Preferences
              </Button>
            </Box>
          </Box>
        </Paper>
      </Box>
    </LazyLoad>
  );
};

export default PreferencesPage; 