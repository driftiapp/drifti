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
  ListItemSecondaryAction
} from '@mui/material';
import LazyLoad from '@/components/LazyLoad';

interface Settings {
  emailNotifications: boolean;
  pushNotifications: boolean;
  darkMode: boolean;
  language: string;
}

const defaultSettings: Settings = {
  emailNotifications: true,
  pushNotifications: true,
  darkMode: false,
  language: 'en'
};

const SettingsPage: React.FC = () => {
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    // Load user settings from localStorage or API
    const loadSettings = () => {
      try {
        const savedSettings = localStorage.getItem('userSettings');
        if (savedSettings) {
          setSettings(JSON.parse(savedSettings));
        }
      } catch (err) {
        setError('Failed to load settings');
      } finally {
        setLoading(false);
      }
    };

    loadSettings();
  }, []);

  const handleSettingChange = (setting: keyof Settings) => (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const newValue = event.target.type === 'checkbox' 
      ? event.target.checked 
      : event.target.value;

    setSettings(prev => ({
      ...prev,
      [setting]: newValue
    }));
  };

  const handleSave = () => {
    try {
      localStorage.setItem('userSettings', JSON.stringify(settings));
      setSuccess('Settings saved successfully!');
    } catch (err) {
      setError('Failed to save settings');
    }
  };

  return (
    <LazyLoad>
      <Box maxWidth="800px" mx="auto" p={3}>
        <Paper elevation={3} sx={{ p: 4 }}>
          <Typography variant="h4" gutterBottom>
            Application Settings
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

          <List>
            <ListItem>
              <ListItemText
                primary="Email Notifications"
                secondary="Receive email notifications about your account"
              />
              <ListItemSecondaryAction>
                <Switch
                  edge="end"
                  checked={settings.emailNotifications}
                  onChange={handleSettingChange('emailNotifications')}
                />
              </ListItemSecondaryAction>
            </ListItem>

            <Divider />

            <ListItem>
              <ListItemText
                primary="Push Notifications"
                secondary="Receive push notifications on your device"
              />
              <ListItemSecondaryAction>
                <Switch
                  edge="end"
                  checked={settings.pushNotifications}
                  onChange={handleSettingChange('pushNotifications')}
                />
              </ListItemSecondaryAction>
            </ListItem>

            <Divider />

            <ListItem>
              <ListItemText
                primary="Dark Mode"
                secondary="Enable dark mode for better visibility in low-light conditions"
              />
              <ListItemSecondaryAction>
                <Switch
                  edge="end"
                  checked={settings.darkMode}
                  onChange={handleSettingChange('darkMode')}
                />
              </ListItemSecondaryAction>
            </ListItem>
          </List>

          <Box mt={3} display="flex" justifyContent="flex-end">
            <Button
              variant="contained"
              color="primary"
              onClick={handleSave}
              disabled={loading}
            >
              Save Settings
            </Button>
          </Box>
        </Paper>
      </Box>
    </LazyLoad>
  );
};

export default SettingsPage; 