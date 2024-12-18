# IoT Dashboard API Documentation

## REST API

### Authentication

All API endpoints require JWT authentication. Include the token in the Authorization header:
```
Authorization: Bearer <token>
```

### Endpoints

#### Sensor Management

##### Get All Sensors
```http
GET /api/sensors
```
Returns list of all sensors.

**Response**
```json
[
  {
    "id": "sensor1",
    "name": "Temperature Sensor 1",
    "type": "temperature",
    "unit": "°C",
    "location": "Room 101",
    "lastValue": 23.5,
    "lastUpdate": "2024-12-18T17:21:32Z",
    "status": {
      "active": true,
      "battery": 85,
      "connection": "strong"
    }
  }
]
```

##### Get Sensor Details
```http
GET /api/sensors/:id
```
Returns detailed information about a specific sensor.

**Parameters**
- `id`: Sensor ID

**Response**
```json
{
  "id": "sensor1",
  "name": "Temperature Sensor 1",
  "type": "temperature",
  "unit": "°C",
  "location": "Room 101",
  "config": {
    "interval": 5000,
    "minValue": 0,
    "maxValue": 100,
    "active": true
  },
  "status": {
    "active": true,
    "battery": 85,
    "connection": "strong"
  },
  "lastValue": 23.5,
  "lastUpdate": "2024-12-18T17:21:32Z"
}
```

##### Get Sensor Data
```http
GET /api/sensors/:id/data
```
Returns historical data for a sensor.

**Parameters**
- `id`: Sensor ID
- `start`: Start timestamp (ISO 8601)
- `end`: End timestamp (ISO 8601)
- `interval`: Data interval in seconds (optional)

**Response**
```json
{
  "sensorId": "sensor1",
  "data": [
    {
      "timestamp": "2024-12-18T17:21:32Z",
      "value": 23.5,
      "unit": "°C"
    }
  ],
  "metadata": {
    "count": 1,
    "interval": 5000
  }
}
```

#### Sensor Configuration

##### Update Sensor Config
```http
PUT /api/sensors/:id/config
```
Update sensor configuration settings.

**Parameters**
- `id`: Sensor ID

**Request Body**
```json
{
  "interval": 5000,
  "minValue": 0,
  "maxValue": 100,
  "active": true
}
```

**Response**
```json
{
  "success": true,
  "message": "Configuration updated successfully",
  "config": {
    "interval": 5000,
    "minValue": 0,
    "maxValue": 100,
    "active": true
  }
}
```

##### Reset Sensor
```http
POST /api/sensors/:id/reset
```
Reset sensor to default settings.

**Parameters**
- `id`: Sensor ID

**Response**
```json
{
  "success": true,
  "message": "Sensor reset successfully",
  "config": {
    "interval": 1000,
    "minValue": 0,
    "maxValue": 100,
    "active": true
  }
}
```

#### Alert Management

##### Get Alert Rules
```http
GET /api/alerts/rules
```
Returns all alert rules.

**Response**
```json
[
  {
    "id": "rule1",
    "sensorId": "sensor1",
    "condition": "above",
    "value": 30,
    "severity": "warning",
    "enabled": true,
    "createdAt": "2024-12-18T17:21:32Z"
  }
]
```

##### Create Alert Rule
```http
POST /api/alerts/rules
```
Create a new alert rule.

**Request Body**
```json
{
  "sensorId": "sensor1",
  "condition": "above",
  "value": 30,
  "severity": "warning"
}
```

**Response**
```json
{
  "success": true,
  "message": "Alert rule created successfully",
  "rule": {
    "id": "rule1",
    "sensorId": "sensor1",
    "condition": "above",
    "value": 30,
    "severity": "warning",
    "enabled": true
  }
}
```

#### Group Management

##### Get Sensor Groups
```http
GET /api/groups
```
Returns all sensor groups.

**Response**
```json
[
  {
    "id": "group1",
    "name": "Temperature Sensors",
    "description": "All temperature sensors",
    "sensors": ["sensor1", "sensor2"],
    "color": "#FF5733",
    "stats": {
      "avgValue": 24.5,
      "minValue": 20,
      "maxValue": 29,
      "activeCount": 2
    }
  }
]
```

##### Create Sensor Group
```http
POST /api/groups
```
Create a new sensor group.

**Request Body**
```json
{
  "name": "Temperature Sensors",
  "description": "All temperature sensors",
  "sensors": ["sensor1", "sensor2"],
  "color": "#FF5733"
}
```

**Response**
```json
{
  "success": true,
  "message": "Group created successfully",
  "group": {
    "id": "group1",
    "name": "Temperature Sensors",
    "description": "All temperature sensors",
    "sensors": ["sensor1", "sensor2"],
    "color": "#FF5733"
  }
}
```

## MQTT Protocol

### Topics Structure

#### Data Topics
- `sensor/+/data`: Real-time sensor data
- `sensor/+/status`: Sensor status updates
- `sensor/+/config`: Configuration updates
- `alerts/notifications`: Alert notifications

### Message Formats

#### Sensor Data
```json
{
  "sensorId": "sensor1",
  "value": 23.5,
  "unit": "°C",
  "timestamp": "2024-12-18T17:21:32Z"
}
```

#### Sensor Status
```json
{
  "sensorId": "sensor1",
  "active": true,
  "battery": 85,
  "connection": "strong",
  "lastUpdate": "2024-12-18T17:21:32Z"
}
```

#### Configuration Update
```json
{
  "sensorId": "sensor1",
  "interval": 5000,
  "minValue": 0,
  "maxValue": 100,
  "active": true
}
```

#### Alert Notification
```json
{
  "id": "alert1",
  "sensorId": "sensor1",
  "message": "Temperature above threshold",
  "severity": "warning",
  "value": 31,
  "threshold": 30,
  "timestamp": "2024-12-18T17:21:32Z"
}
```

## WebSocket Events

### Client to Server
- `subscribe`: Subscribe to sensor updates
- `unsubscribe`: Unsubscribe from sensor updates
- `setInterval`: Update data refresh interval
- `command`: Send command to sensor

### Server to Client
- `data`: Real-time sensor data
- `status`: Sensor status update
- `alert`: Alert notification
- `error`: Error message

## Error Codes

| Code | Description |
|------|-------------|
| `AUTH_001` | Invalid authentication token |
| `AUTH_002` | Token expired |
| `SENSOR_001` | Sensor not found |
| `SENSOR_002` | Invalid sensor configuration |
| `ALERT_001` | Invalid alert rule |
| `GROUP_001` | Invalid group configuration |
| `MQTT_001` | MQTT connection error |

## Rate Limiting

- API endpoints: 100 requests per minute per IP
- WebSocket connections: 10 connections per IP
- MQTT publications: 50 messages per second per client

## Data Retention

- Real-time data: 24 hours
- Hourly aggregated data: 30 days
- Daily aggregated data: 1 year
- Alert history: 90 days
- Sensor logs: 30 days
