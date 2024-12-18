import React from 'react';
import { 
  Card, 
  CardContent, 
  Typography, 
  Box,
  LinearProgress,
  Chip
} from '@mui/material';
import BatteryFullIcon from '@mui/icons-material/BatteryFull';
import BatteryAlertIcon from '@mui/icons-material/BatteryAlert';
import WifiIcon from '@mui/icons-material/Wifi';
import WifiOffIcon from '@mui/icons-material/WifiOff';

const SensorCard = ({ sensorId, data, status }) => {
  const isOnline = status?.status === 'online';
  const batteryLevel = status?.battery || 0;
  const lastUpdate = data?.timestamp ? new Date(data.timestamp).toLocaleTimeString() : 'N/A';

  const getValueColor = (value, min, max) => {
    if (value < min || value > max) return 'error.main';
    if (value < min + (max - min) * 0.2 || value > max - (max - min) * 0.2) return 'warning.main';
    return 'success.main';
  };

  return (
    <Card sx={{ minWidth: 275, m: 1 }}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" component="div">
            {sensorId}
          </Typography>
          <Chip
            icon={isOnline ? <WifiIcon /> : <WifiOffIcon />}
            label={isOnline ? 'Online' : 'Offline'}
            color={isOnline ? 'success' : 'error'}
            size="small"
          />
        </Box>

        <Typography variant="h4" component="div" color={getValueColor(data?.value, data?.minValue, data?.maxValue)}>
          {data?.value?.toFixed(1) || 'N/A'} {data?.unit}
        </Typography>

        <Box sx={{ display: 'flex', alignItems: 'center', mt: 2 }}>
          {batteryLevel > 20 ? <BatteryFullIcon color="success" /> : <BatteryAlertIcon color="error" />}
          <Box sx={{ width: '100%', ml: 1 }}>
            <LinearProgress 
              variant="determinate" 
              value={batteryLevel} 
              color={batteryLevel > 20 ? 'success' : 'error'}
            />
          </Box>
          <Typography variant="body2" sx={{ ml: 1 }}>
            {batteryLevel}%
          </Typography>
        </Box>

        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          Last Update: {lastUpdate}
        </Typography>
      </CardContent>
    </Card>
  );
};

export default SensorCard;
