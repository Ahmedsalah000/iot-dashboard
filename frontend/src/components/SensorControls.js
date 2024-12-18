import React, { useState } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Slider,
  Button,
  Box,
  TextField,
  Switch,
  FormControlLabel,
  IconButton,
  Tooltip
} from '@mui/material';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import SettingsIcon from '@mui/icons-material/Settings';
import SaveIcon from '@mui/icons-material/Save';
import mqttService from '../services/mqttService';

const SensorControls = ({ sensorId, config }) => {
  const [showSettings, setShowSettings] = useState(false);
  const [updateInterval, setUpdateInterval] = useState(config?.updateInterval || 5000);
  const [minValue, setMinValue] = useState(config?.minValue || 0);
  const [maxValue, setMaxValue] = useState(config?.maxValue || 100);
  const [isActive, setIsActive] = useState(true);

  const handleUpdateInterval = (event, newValue) => {
    setUpdateInterval(newValue);
  };

  const handleSaveSettings = () => {
    const settings = {
      sensorId,
      updateInterval,
      minValue,
      maxValue
    };

    mqttService.publish(`sensor/${sensorId}/config`, settings);
    setShowSettings(false);
  };

  const handleReset = () => {
    mqttService.publish(`sensor/${sensorId}/command`, { action: 'reset' });
  };

  const handleActiveToggle = () => {
    const newState = !isActive;
    setIsActive(newState);
    mqttService.publish(`sensor/${sensorId}/command`, {
      action: newState ? 'start' : 'stop'
    });
  };

  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">
            Sensor Controls
          </Typography>
          <Box>
            <Tooltip title="Reset Sensor">
              <IconButton onClick={handleReset} size="small">
                <RestartAltIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Settings">
              <IconButton onClick={() => setShowSettings(!showSettings)} size="small">
                <SettingsIcon />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        <FormControlLabel
          control={
            <Switch
              checked={isActive}
              onChange={handleActiveToggle}
              color="primary"
            />
          }
          label={isActive ? "Active" : "Inactive"}
        />

        {showSettings && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="body2" gutterBottom>
              Update Interval (ms)
            </Typography>
            <Slider
              value={updateInterval}
              onChange={handleUpdateInterval}
              min={1000}
              max={60000}
              step={1000}
              marks={[
                { value: 1000, label: '1s' },
                { value: 30000, label: '30s' },
                { value: 60000, label: '60s' }
              ]}
              valueLabelDisplay="auto"
              valueLabelFormat={value => `${value / 1000}s`}
            />

            <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
              <TextField
                label="Min Value"
                type="number"
                size="small"
                value={minValue}
                onChange={(e) => setMinValue(Number(e.target.value))}
              />
              <TextField
                label="Max Value"
                type="number"
                size="small"
                value={maxValue}
                onChange={(e) => setMaxValue(Number(e.target.value))}
              />
            </Box>

            <Button
              variant="contained"
              startIcon={<SaveIcon />}
              onClick={handleSaveSettings}
              sx={{ mt: 2 }}
              fullWidth
            >
              Save Settings
            </Button>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default SensorControls;
