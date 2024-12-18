import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  IconButton,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Box,
  Chip,
  Switch,
  FormControlLabel
} from '@mui/material';
import NotificationsIcon from '@mui/icons-material/Notifications';
import WarningIcon from '@mui/icons-material/Warning';
import ErrorIcon from '@mui/icons-material/Error';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import mqttService from '../services/mqttService';

const Alerts = ({ sensors }) => {
  const [alerts, setAlerts] = useState([]);
  const [rules, setRules] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [newRule, setNewRule] = useState({
    sensorId: '',
    condition: 'above',
    value: '',
    severity: 'warning',
    enabled: true
  });

  // Load saved rules from localStorage
  useEffect(() => {
    const savedRules = localStorage.getItem('alertRules');
    if (savedRules) {
      setRules(JSON.parse(savedRules));
    }
  }, []);

  // Save rules to localStorage when they change
  useEffect(() => {
    localStorage.setItem('alertRules', JSON.stringify(rules));
  }, [rules]);

  // Subscribe to MQTT messages and check for alerts
  useEffect(() => {
    const handleData = (data) => {
      rules.forEach(rule => {
        if (!rule.enabled || rule.sensorId !== data.sensorId) return;

        const value = parseFloat(data.value);
        const threshold = parseFloat(rule.value);
        let triggered = false;

        switch (rule.condition) {
          case 'above':
            triggered = value > threshold;
            break;
          case 'below':
            triggered = value < threshold;
            break;
          case 'equal':
            triggered = Math.abs(value - threshold) < 0.001;
            break;
          default:
            break;
        }

        if (triggered) {
          const alert = {
            id: Date.now(),
            timestamp: new Date(),
            sensorId: data.sensorId,
            value: data.value,
            message: `${data.sensorId} value is ${rule.condition} ${rule.value} ${data.unit}`,
            severity: rule.severity
          };

          setAlerts(prev => [alert, ...prev].slice(0, 50)); // Keep last 50 alerts
          
          // Show browser notification if permitted
          if (Notification.permission === 'granted') {
            new Notification('IoT Dashboard Alert', {
              body: alert.message,
              icon: '/favicon.ico'
            });
          }
        }
      });
    };

    const unsubscribe = mqttService.subscribe('sensor/+/data', handleData);
    return () => unsubscribe();
  }, [rules]);

  const handleAddRule = () => {
    if (newRule.sensorId && newRule.value) {
      setRules(prev => [...prev, { ...newRule, id: Date.now() }]);
      setOpenDialog(false);
      setNewRule({
        sensorId: '',
        condition: 'above',
        value: '',
        severity: 'warning',
        enabled: true
      });
    }
  };

  const handleDeleteRule = (ruleId) => {
    setRules(prev => prev.filter(rule => rule.id !== ruleId));
  };

  const handleToggleRule = (ruleId) => {
    setRules(prev => prev.map(rule =>
      rule.id === ruleId ? { ...rule, enabled: !rule.enabled } : rule
    ));
  };

  const getSeverityIcon = (severity) => {
    switch (severity) {
      case 'error':
        return <ErrorIcon color="error" />;
      case 'warning':
        return <WarningIcon color="warning" />;
      default:
        return <NotificationsIcon color="info" />;
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h6">Alert Rules</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setOpenDialog(true)}
        >
          Add Rule
        </Button>
      </Box>

      {/* Alert Rules */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <List>
            {rules.map(rule => (
              <ListItem
                key={rule.id}
                secondaryAction={
                  <>
                    <Switch
                      edge="end"
                      checked={rule.enabled}
                      onChange={() => handleToggleRule(rule.id)}
                    />
                    <IconButton
                      edge="end"
                      onClick={() => handleDeleteRule(rule.id)}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </>
                }
              >
                <ListItemIcon>
                  {getSeverityIcon(rule.severity)}
                </ListItemIcon>
                <ListItemText
                  primary={rule.sensorId}
                  secondary={`${rule.condition} ${rule.value}`}
                />
              </ListItem>
            ))}
          </List>
        </CardContent>
      </Card>

      {/* Recent Alerts */}
      <Typography variant="h6" gutterBottom>Recent Alerts</Typography>
      <Card>
        <CardContent>
          <List>
            {alerts.map(alert => (
              <ListItem key={alert.id}>
                <ListItemIcon>
                  {getSeverityIcon(alert.severity)}
                </ListItemIcon>
                <ListItemText
                  primary={alert.message}
                  secondary={new Date(alert.timestamp).toLocaleString()}
                />
              </ListItem>
            ))}
          </List>
        </CardContent>
      </Card>

      {/* Add Rule Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
        <DialogTitle>Add Alert Rule</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            <FormControl fullWidth>
              <InputLabel>Sensor</InputLabel>
              <Select
                value={newRule.sensorId}
                label="Sensor"
                onChange={(e) => setNewRule(prev => ({ ...prev, sensorId: e.target.value }))}
              >
                {sensors.map(sensor => (
                  <MenuItem key={sensor.id} value={sensor.id}>
                    {sensor.id}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth>
              <InputLabel>Condition</InputLabel>
              <Select
                value={newRule.condition}
                label="Condition"
                onChange={(e) => setNewRule(prev => ({ ...prev, condition: e.target.value }))}
              >
                <MenuItem value="above">Above</MenuItem>
                <MenuItem value="below">Below</MenuItem>
                <MenuItem value="equal">Equal to</MenuItem>
              </Select>
            </FormControl>

            <TextField
              label="Value"
              type="number"
              value={newRule.value}
              onChange={(e) => setNewRule(prev => ({ ...prev, value: e.target.value }))}
              fullWidth
            />

            <FormControl fullWidth>
              <InputLabel>Severity</InputLabel>
              <Select
                value={newRule.severity}
                label="Severity"
                onChange={(e) => setNewRule(prev => ({ ...prev, severity: e.target.value }))}
              >
                <MenuItem value="info">Info</MenuItem>
                <MenuItem value="warning">Warning</MenuItem>
                <MenuItem value="error">Error</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button onClick={handleAddRule} variant="contained">
            Add Rule
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Alerts;
