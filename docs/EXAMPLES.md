# IoT Dashboard API Examples

## REST API Examples

### Authentication

```javascript
// Login
const response = await fetch('http://localhost:3001/api/auth/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    username: 'admin',
    password: 'password123'
  })
});

const { token } = await response.json();
```

### Sensor Operations

#### Fetch Sensor Data
```javascript
// Get all sensors
const sensors = await fetch('http://localhost:3001/api/sensors', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

// Get specific sensor with historical data
const sensorData = await fetch(
  'http://localhost:3001/api/sensors/sensor1/data?' + 
  new URLSearchParams({
    start: '2024-12-17T00:00:00Z',
    end: '2024-12-18T00:00:00Z',
    interval: '3600'
  }), {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  }
);
```

#### Update Sensor Configuration
```javascript
// Update sensor settings
const updateConfig = await fetch('http://localhost:3001/api/sensors/sensor1/config', {
  method: 'PUT',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    interval: 5000,
    minValue: 10,
    maxValue: 50,
    active: true
  })
});
```

### Alert Management

#### Create Alert Rule
```javascript
// Create new alert
const createAlert = await fetch('http://localhost:3001/api/alerts/rules', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    sensorId: 'sensor1',
    condition: 'above',
    value: 30,
    severity: 'warning'
  })
});
```

### Group Management

#### Create and Update Groups
```javascript
// Create new group
const createGroup = await fetch('http://localhost:3001/api/groups', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    name: 'Temperature Sensors',
    description: 'All temperature sensors',
    sensors: ['sensor1', 'sensor2'],
    color: '#FF5733'
  })
});

// Update group
const updateGroup = await fetch('http://localhost:3001/api/groups/group1', {
  method: 'PUT',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    sensors: ['sensor1', 'sensor2', 'sensor3']
  })
});
```

## MQTT Examples

### Node.js MQTT Client
```javascript
const mqtt = require('mqtt');

// Connect to MQTT broker
const client = mqtt.connect('mqtt://localhost:1883', {
  username: 'user',
  password: 'pass'
});

// Subscribe to sensor data
client.on('connect', () => {
  client.subscribe('sensor/+/data');
  client.subscribe('sensor/+/status');
});

// Handle incoming messages
client.on('message', (topic, message) => {
  const data = JSON.parse(message.toString());
  console.log(`Received ${topic}:`, data);
});

// Publish sensor data
client.publish('sensor/sensor1/data', JSON.stringify({
  sensorId: 'sensor1',
  value: 23.5,
  unit: '°C',
  timestamp: new Date().toISOString()
}));
```

### Browser WebSocket Client
```javascript
// Connect to MQTT over WebSocket
const ws = new WebSocket('ws://localhost:9001');

ws.onopen = () => {
  // Subscribe to topics
  ws.send(JSON.stringify({
    type: 'subscribe',
    topics: ['sensor/+/data']
  }));
};

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log('Received:', data);
};
```

## Data Export Examples

### CSV Export
```javascript
// Export sensor data to CSV
const exportData = await fetch(
  'http://localhost:3001/api/export/csv?' +
  new URLSearchParams({
    sensors: ['sensor1', 'sensor2'].join(','),
    start: '2024-12-17T00:00:00Z',
    end: '2024-12-18T00:00:00Z'
  }), {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  }
);

const blob = await exportData.blob();
const url = window.URL.createObjectURL(blob);
const a = document.createElement('a');
a.href = url;
a.download = 'sensor_data.csv';
a.click();
```

### JSON Export
```javascript
// Export sensor data to JSON
const exportData = await fetch(
  'http://localhost:3001/api/export/json?' +
  new URLSearchParams({
    sensors: ['sensor1', 'sensor2'].join(','),
    start: '2024-12-17T00:00:00Z',
    end: '2024-12-18T00:00:00Z',
    format: 'pretty'
  }), {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  }
);

const data = await exportData.json();
```

## Error Handling Examples

### API Error Handling
```javascript
try {
  const response = await fetch('http://localhost:3001/api/sensors/invalid-id');
  if (!response.ok) {
    const error = await response.json();
    switch (error.code) {
      case 'SENSOR_001':
        console.error('Sensor not found');
        break;
      case 'AUTH_001':
        console.error('Authentication failed');
        break;
      default:
        console.error('Unknown error:', error.message);
    }
  }
} catch (err) {
  console.error('Network error:', err);
}
```

### MQTT Error Handling
```javascript
const client = mqtt.connect('mqtt://localhost:1883');

client.on('error', (error) => {
  console.error('MQTT Error:', error);
});

client.on('offline', () => {
  console.warn('MQTT Client offline');
});

client.on('reconnect', () => {
  console.log('MQTT Client reconnecting');
});
```

## WebSocket Examples

### Real-time Chart Updates
```javascript
const ws = new WebSocket('ws://localhost:9001');
const chart = new Chart(ctx, {
  type: 'line',
  data: {
    labels: [],
    datasets: [{
      label: 'Sensor Data',
      data: []
    }]
  }
});

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  
  // Update chart with new data
  chart.data.labels.push(new Date(data.timestamp).toLocaleTimeString());
  chart.data.datasets[0].data.push(data.value);
  
  // Remove old data points
  if (chart.data.labels.length > 50) {
    chart.data.labels.shift();
    chart.data.datasets[0].data.shift();
  }
  
  chart.update();
};
```

### Alert Notifications
```javascript
const ws = new WebSocket('ws://localhost:9001');

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  
  if (data.type === 'alert') {
    // Show browser notification
    if (Notification.permission === 'granted') {
      new Notification('IoT Alert', {
        body: data.message,
        icon: '/alert-icon.png'
      });
    }
    
    // Update UI
    showAlert({
      message: data.message,
      severity: data.severity,
      timestamp: new Date(data.timestamp)
    });
  }
};
```
