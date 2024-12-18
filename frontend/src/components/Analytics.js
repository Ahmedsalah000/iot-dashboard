import React, { useMemo } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Grid,
  Box,
  Tooltip,
  IconButton
} from '@mui/material';
import InfoIcon from '@mui/icons-material/Info';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import { Radar, Pie } from 'react-chartjs-2';

const Analytics = ({ data, sensors }) => {
  const stats = useMemo(() => {
    const result = {};
    
    sensors.forEach(sensor => {
      const sensorData = data.filter(d => d.sensorId === sensor.id);
      if (sensorData.length === 0) return;

      const values = sensorData.map(d => d.value);
      const timestamps = sensorData.map(d => new Date(d.timestamp));
      
      // Basic statistics
      const avg = values.reduce((a, b) => a + b, 0) / values.length;
      const max = Math.max(...values);
      const min = Math.min(...values);
      const latest = values[values.length - 1];
      
      // Trend analysis
      const trend = latest > avg ? 'up' : 'down';
      const variance = values.reduce((a, b) => a + Math.pow(b - avg, 2), 0) / values.length;
      
      // Rate of change (per hour)
      const hourlyChanges = [];
      for (let i = 1; i < values.length; i++) {
        const timeDiff = (timestamps[i] - timestamps[i-1]) / (1000 * 60 * 60); // hours
        const valueDiff = values[i] - values[i-1];
        hourlyChanges.push(valueDiff / timeDiff);
      }
      const avgChange = hourlyChanges.length > 0 
        ? hourlyChanges.reduce((a, b) => a + b, 0) / hourlyChanges.length 
        : 0;

      result[sensor.id] = {
        average: avg.toFixed(2),
        maximum: max.toFixed(2),
        minimum: min.toFixed(2),
        current: latest.toFixed(2),
        trend,
        variance: variance.toFixed(2),
        changeRate: avgChange.toFixed(2),
        unit: sensor.unit
      };
    });

    return result;
  }, [data, sensors]);

  const radarData = {
    labels: sensors.map(s => s.id),
    datasets: [{
      label: 'Current Values',
      data: sensors.map(s => stats[s.id]?.current || 0),
      backgroundColor: 'rgba(75,192,192,0.2)',
      borderColor: 'rgba(75,192,192,1)',
      borderWidth: 1
    }, {
      label: 'Average Values',
      data: sensors.map(s => stats[s.id]?.average || 0),
      backgroundColor: 'rgba(255,99,132,0.2)',
      borderColor: 'rgba(255,99,132,1)',
      borderWidth: 1
    }]
  };

  const pieData = {
    labels: sensors.map(s => s.id),
    datasets: [{
      data: sensors.map(s => stats[s.id]?.variance || 0),
      backgroundColor: [
        'rgba(75,192,192,0.6)',
        'rgba(255,99,132,0.6)',
        'rgba(54,162,235,0.6)',
        'rgba(255,206,86,0.6)',
        'rgba(153,102,255,0.6)'
      ]
    }]
  };

  return (
    <Box>
      <Grid container spacing={3}>
        {/* Statistics Cards */}
        {sensors.map(sensor => (
          <Grid item xs={12} sm={6} md={4} key={sensor.id}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                  <Typography variant="h6">{sensor.id}</Typography>
                  {stats[sensor.id]?.trend === 'up' ? (
                    <TrendingUpIcon color="success" />
                  ) : (
                    <TrendingDownIcon color="error" />
                  )}
                </Box>

                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      Current
                    </Typography>
                    <Typography variant="h6">
                      {stats[sensor.id]?.current} {sensor.unit}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      Average
                    </Typography>
                    <Typography variant="h6">
                      {stats[sensor.id]?.average} {sensor.unit}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Typography variant="body2" color="text.secondary">
                        Change Rate
                      </Typography>
                      <Tooltip title="Average change per hour">
                        <IconButton size="small">
                          <InfoIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                    <Typography variant="h6">
                      {stats[sensor.id]?.changeRate} {sensor.unit}/h
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Typography variant="body2" color="text.secondary">
                        Variance
                      </Typography>
                      <Tooltip title="Measure of data spread">
                        <IconButton size="small">
                          <InfoIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                    <Typography variant="h6">
                      {stats[sensor.id]?.variance}
                    </Typography>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        ))}

        {/* Radar Chart */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Sensor Value Comparison
              </Typography>
              <Box sx={{ height: 300 }}>
                <Radar 
                  data={radarData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                      r: {
                        beginAtZero: true
                      }
                    }
                  }}
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Pie Chart */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Variance Distribution
              </Typography>
              <Box sx={{ height: 300 }}>
                <Pie
                  data={pieData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        position: 'right'
                      }
                    }
                  }}
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Analytics;
