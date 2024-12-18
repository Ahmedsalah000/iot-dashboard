# IoT Dashboard Troubleshooting Guide

## Common Issues and Solutions

### Connection Issues

#### MQTT Connection Failed
**Symptoms:**
- MQTT client fails to connect
- "Connection refused" errors
- Timeout errors

**Solutions:**
1. Check MQTT broker status:
```bash
# Check if Mosquitto is running
systemctl status mosquitto

# Check broker logs
tail -f /var/log/mosquitto/mosquitto.log
```

2. Verify MQTT configuration:
```bash
# Check Mosquitto configuration
cat /etc/mosquitto/mosquitto.conf

# Ensure WebSocket port is enabled
listener 9001
protocol websockets
```

3. Test MQTT connection:
```bash
# Subscribe to test topic
mosquitto_sub -h localhost -t test/topic

# Publish to test topic
mosquitto_pub -h localhost -t test/topic -m "test message"
```

#### WebSocket Connection Failed
**Symptoms:**
- Browser console shows WebSocket errors
- Real-time updates not working
- "Connection closed" messages

**Solutions:**
1. Check WebSocket URL:
```javascript
// Ensure correct WebSocket URL format
const ws = new WebSocket('ws://localhost:9001');
// For secure connections
const wss = new WebSocket('wss://your-domain:9001');
```

2. Verify CORS settings in backend:
```javascript
// Backend CORS configuration
app.use(cors({
  origin: ['http://localhost:3000'],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
```

### Authentication Issues

#### JWT Token Invalid
**Symptoms:**
- 401 Unauthorized errors
- "Invalid token" messages
- Automatic logouts

**Solutions:**
1. Check token expiration:
```javascript
// Decode JWT token
const decoded = jwt.decode(token);
console.log('Token expires:', new Date(decoded.exp * 1000));
```

2. Verify token in localStorage:
```javascript
// Check stored token
const token = localStorage.getItem('token');
if (!token) {
  console.error('No token found');
}
```

3. Implement token refresh:
```javascript
// Add refresh token logic
const refreshToken = async () => {
  const response = await fetch('/api/auth/refresh', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('refreshToken')}`
    }
  });
  const { token } = await response.json();
  localStorage.setItem('token', token);
};
```

### Data Issues

#### Sensor Data Not Updating
**Symptoms:**
- Stale sensor readings
- Missing data points
- Gaps in charts

**Solutions:**
1. Check sensor connection status:
```javascript
// Monitor sensor status
mqtt.subscribe('sensor/+/status', (message) => {
  const status = JSON.parse(message);
  console.log(`Sensor ${status.sensorId} status:`, status);
});
```

2. Verify data publication:
```bash
# Monitor MQTT messages
mosquitto_sub -v -t 'sensor/#'
```

3. Check data retention settings:
```javascript
// Verify MongoDB TTL index
db.sensorData.createIndex(
  { "timestamp": 1 },
  { expireAfterSeconds: 86400 }
);
```

#### Chart Rendering Issues
**Symptoms:**
- Charts not displaying
- Performance issues
- Visual glitches

**Solutions:**
1. Check data format:
```javascript
// Ensure correct data structure
const chartData = {
  labels: timestamps,
  datasets: [{
    label: 'Sensor Data',
    data: values,
    borderColor: 'rgb(75, 192, 192)',
    tension: 0.1
  }]
};
```

2. Limit data points:
```javascript
// Implement data point limiting
const maxDataPoints = 100;
if (chartData.labels.length > maxDataPoints) {
  chartData.labels = chartData.labels.slice(-maxDataPoints);
  chartData.datasets[0].data = chartData.datasets[0].data.slice(-maxDataPoints);
}
```

### Performance Issues

#### High CPU Usage
**Symptoms:**
- Slow dashboard response
- Browser lag
- High server load

**Solutions:**
1. Implement data aggregation:
```javascript
// Aggregate data by time interval
const aggregateData = (data, interval) => {
  return data.reduce((acc, curr) => {
    const timeKey = Math.floor(curr.timestamp / interval) * interval;
    if (!acc[timeKey]) {
      acc[timeKey] = { sum: 0, count: 0 };
    }
    acc[timeKey].sum += curr.value;
    acc[timeKey].count++;
    return acc;
  }, {});
};
```

2. Use WebWorkers for calculations:
```javascript
// Create WebWorker for data processing
const worker = new Worker('dataWorker.js');
worker.postMessage({ data, operation: 'aggregate' });
worker.onmessage = (e) => {
  updateChart(e.data);
};
```

#### Memory Leaks
**Symptoms:**
- Increasing memory usage
- Browser crashes
- Performance degradation over time

**Solutions:**
1. Clean up event listeners:
```javascript
// Proper cleanup in React components
useEffect(() => {
  const ws = new WebSocket(url);
  return () => {
    ws.close();
  };
}, []);
```

2. Implement garbage collection:
```javascript
// Clear old data periodically
setInterval(() => {
  chartData.labels = chartData.labels.slice(-1000);
  chartData.datasets.forEach(dataset => {
    dataset.data = dataset.data.slice(-1000);
  });
  chart.update();
}, 60000);
```

## Diagnostic Tools

### Network Diagnostics
```bash
# Check MQTT ports
netstat -an | grep 1883
netstat -an | grep 9001

# Monitor network traffic
tcpdump -i any port 1883 -w mqtt.pcap
```

### Database Diagnostics
```bash
# Check MongoDB status
mongosh
db.serverStatus()

# Check collection sizes
db.sensorData.stats()
```

### Application Logs
```bash
# Backend logs
tail -f logs/backend.log

# MQTT broker logs
tail -f /var/log/mosquitto/mosquitto.log

# MongoDB logs
tail -f /var/log/mongodb/mongod.log
```

## Performance Monitoring

### Backend Monitoring
```javascript
// Add performance monitoring
const startTime = process.hrtime();
// ... operation ...
const elapsed = process.hrtime(startTime);
console.log(`Operation took ${elapsed[0]}s ${elapsed[1]/1000000}ms`);
```

### Frontend Monitoring
```javascript
// Monitor render performance
console.time('render');
// ... render operation ...
console.timeEnd('render');

// Monitor memory usage
const used = process.memoryUsage();
console.log(`Memory usage: ${Math.round(used.heapUsed / 1024 / 1024 * 100) / 100} MB`);
```

## Environment-Specific Issues

### Development Environment
- Check Node.js version compatibility
- Verify npm package versions
- Enable debug logging

### Production Environment
- Configure SSL/TLS certificates
- Set up load balancing
- Implement rate limiting
- Monitor resource usage

### Docker Environment
- Check container logs
- Verify network connectivity
- Monitor container resources

## Security Checks

### API Security
- Verify JWT token validation
- Check CORS settings
- Monitor failed authentication attempts

### MQTT Security
- Verify ACL settings
- Check client authentication
- Monitor unauthorized access attempts

## Contact Support

If issues persist after trying these solutions:

1. Create an issue on GitHub with:
   - Detailed description of the problem
   - Steps to reproduce
   - Environment details
   - Relevant logs

2. Contact support team:
   - Email: support@iot-dashboard.com
   - Include diagnostic information
   - Attach relevant logs
