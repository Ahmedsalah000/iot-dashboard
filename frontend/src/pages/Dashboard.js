import React, { useEffect, useState } from 'react';
import {
  Container,
  Grid,
  Paper,
  Box,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tab,
  Tabs
} from '@mui/material';
import Chart from '../components/Chart';
import Gauge from '../components/Gauge';
import SensorCard from '../components/SensorCard';
import SensorControls from '../components/SensorControls';
import DataExport from '../components/DataExport';
import Analytics from '../components/Analytics';
import Alerts from '../components/Alerts';
import SensorGroups from '../components/SensorGroups';
import mqttService from '../services/mqttService';
import { fetchData } from '../services/apiService';

const Dashboard = () => {
  const [historicalData, setHistoricalData] = useState([]);
  const [realtimeData, setRealtimeData] = useState({});
  const [sensorStatus, setSensorStatus] = useState({});
  const [sensorConfigs, setSensorConfigs] = useState({});
  const [chartType, setChartType] = useState('line');
  const [timeRange, setTimeRange] = useState('1h');
  const [activeSensors, setActiveSensors] = useState([]);
  const [selectedTab, setSelectedTab] = useState(0);
  const [selectedSensor, setSelectedSensor] = useState(null);

  // Fetch historical data
  useEffect(() => {
    const fetchHistoricalData = async () => {
      const result = await fetchData();
      setHistoricalData(result);
      
      // Extract unique sensors from data
      const sensors = [...new Set(result.map(d => d.sensorId))].map(id => ({
        id,
        unit: result.find(d => d.sensorId === id)?.unit || 'unknown'
      }));
      setActiveSensors(sensors);
      if (sensors.length > 0) {
        setSelectedSensor(sensors[0].id);
      }
    };
    fetchHistoricalData();
  }, []);

  // Setup MQTT subscriptions
  useEffect(() => {
    mqttService.connect();

    const dataUnsubscribe = mqttService.subscribe('sensor/+/data', (data) => {
      setRealtimeData(prev => ({
        ...prev,
        [data.sensorId]: data
      }));
      
      setHistoricalData(prev => {
        const newData = [...prev, data];
        const timeLimit = {
          '1h': 60 * 60 * 1000,
          '24h': 24 * 60 * 60 * 1000,
          '7d': 7 * 24 * 60 * 60 * 1000
        }[timeRange];
        const cutoffTime = new Date(Date.now() - timeLimit);
        return newData.filter(d => new Date(d.timestamp) > cutoffTime);
      });
    });

    const statusUnsubscribe = mqttService.subscribe('sensor/+/status', (data) => {
      setSensorStatus(prev => ({
        ...prev,
        [data.sensorId]: data
      }));
    });

    const configUnsubscribe = mqttService.subscribe('sensor/+/config', (data) => {
      setSensorConfigs(prev => ({
        ...prev,
        [data.sensorId]: data
      }));
    });

    return () => {
      dataUnsubscribe();
      statusUnsubscribe();
      configUnsubscribe();
      mqttService.disconnect();
    };
  }, [timeRange]);

  const handleChartTypeChange = (event, newType) => {
    if (newType !== null) {
      setChartType(newType);
    }
  };

  const handleTimeRangeChange = (event) => {
    setTimeRange(event.target.value);
  };

  const handleTabChange = (event, newValue) => {
    setSelectedTab(newValue);
  };

  return (
    <Container maxWidth="xl">
      <Box sx={{ my: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <Typography variant="h4" component="h1">
            IoT Dashboard
          </Typography>
          <DataExport data={historicalData} sensors={activeSensors} />
        </Box>

        {/* Sensor Cards */}
        <Grid container spacing={2} sx={{ mb: 4 }}>
          {activeSensors.map(sensor => (
            <Grid item xs={12} sm={6} md={4} key={sensor.id}>
              <SensorCard
                sensorId={sensor.id}
                data={realtimeData[sensor.id]}
                status={sensorStatus[sensor.id]}
              />
            </Grid>
          ))}
        </Grid>

        {/* Visualization Tabs */}
        <Paper sx={{ mb: 4 }}>
          <Tabs value={selectedTab} onChange={handleTabChange} sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tab label="Charts" />
            <Tab label="Gauges" />
            <Tab label="Analytics" />
            <Tab label="Alerts" />
            <Tab label="Groups" />
            <Tab label="Controls" />
          </Tabs>

          {/* Charts View */}
          {selectedTab === 0 && (
            <Box sx={{ p: 2 }}>
              <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 2 }}>
                <ToggleButtonGroup
                  value={chartType}
                  exclusive
                  onChange={handleChartTypeChange}
                  size="small"
                >
                  <ToggleButton value="line">Line Chart</ToggleButton>
                  <ToggleButton value="bar">Bar Chart</ToggleButton>
                </ToggleButtonGroup>

                <FormControl size="small" sx={{ minWidth: 120 }}>
                  <InputLabel>Time Range</InputLabel>
                  <Select
                    value={timeRange}
                    label="Time Range"
                    onChange={handleTimeRangeChange}
                  >
                    <MenuItem value="1h">Last Hour</MenuItem>
                    <MenuItem value="24h">Last 24 Hours</MenuItem>
                    <MenuItem value="7d">Last 7 Days</MenuItem>
                  </Select>
                </FormControl>
              </Box>

              <Chart
                data={historicalData}
                type={chartType}
                timeRange={timeRange}
                sensors={activeSensors}
                title="Sensor Readings Over Time"
              />
            </Box>
          )}

          {/* Gauges View */}
          {selectedTab === 1 && (
            <Box sx={{ p: 2 }}>
              <Grid container spacing={3}>
                {activeSensors.map(sensor => {
                  const data = realtimeData[sensor.id];
                  const config = sensorConfigs[sensor.id];
                  return (
                    <Grid item xs={12} sm={6} md={4} key={sensor.id}>
                      <Gauge
                        value={data?.value || 0}
                        min={config?.minValue || 0}
                        max={config?.maxValue || 100}
                        unit={sensor.unit}
                        title={sensor.id}
                      />
                    </Grid>
                  );
                })}
              </Grid>
            </Box>
          )}

          {/* Analytics View */}
          {selectedTab === 2 && (
            <Box sx={{ p: 2 }}>
              <Analytics
                data={historicalData}
                sensors={activeSensors}
              />
            </Box>
          )}

          {/* Alerts View */}
          {selectedTab === 3 && (
            <Box sx={{ p: 2 }}>
              <Alerts sensors={activeSensors} />
            </Box>
          )}

          {/* Groups View */}
          {selectedTab === 4 && (
            <Box sx={{ p: 2 }}>
              <SensorGroups
                sensors={activeSensors}
                realtimeData={realtimeData}
              />
            </Box>
          )}

          {/* Controls View */}
          {selectedTab === 5 && (
            <Box sx={{ p: 2 }}>
              <Grid container spacing={3}>
                {activeSensors.map(sensor => (
                  <Grid item xs={12} sm={6} md={4} key={sensor.id}>
                    <SensorControls
                      sensorId={sensor.id}
                      config={sensorConfigs[sensor.id]}
                    />
                  </Grid>
                ))}
              </Grid>
            </Box>
          )}
        </Paper>
      </Box>
    </Container>
  );
};

export default Dashboard;
