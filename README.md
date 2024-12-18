# IoT Dashboard

A modern, feature-rich dashboard for monitoring and managing IoT sensors in real-time.

## Features

### Real-time Monitoring
- Live sensor data updates via MQTT
- Multiple visualization types (line charts, bar charts, gauges)
- Customizable time ranges and chart types
- Sensor status monitoring (active/inactive, battery levels)

### Analytics
- Statistical analysis (average, min, max, variance)
- Trend analysis and change rate calculations
- Comparative visualizations (radar charts, pie charts)
- Real-time statistics updates

### Alerts
- Configurable alert rules
- Multiple condition types (above, below, equal)
- Severity levels (info, warning, error)
- Browser notifications
- Historical alert logging
- Rule management (enable/disable)

### Sensor Groups
- Custom grouping with names and descriptions
- Color-coding for organization
- Group statistics
- Visual group comparisons
- Persistent group storage

### Data Management
- Export data in multiple formats (CSV, JSON, Excel)
- Date range filtering
- Sensor selection
- Historical data access

### Sensor Controls
- Update intervals configuration
- Min/max value settings
- Active/inactive status management
- Sensor reset functionality

## Technology Stack

### Frontend
- React.js
- Material-UI
- Chart.js
- MQTT.js
- date-fns

### Backend
- Node.js
- Express
- MQTT Broker (Mosquitto)
- MongoDB

## Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/iot-dashboard.git
cd iot-dashboard
```

2. Install dependencies:
```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

3. Configure environment variables:
```bash
# Backend (.env)
PORT=3001
MONGODB_URI=mongodb://localhost:27017/iot-dashboard
MQTT_BROKER_URL=mqtt://localhost:1883

# Frontend (.env)
REACT_APP_API_URL=http://localhost:3001
REACT_APP_MQTT_BROKER_URL=ws://localhost:9001
```

4. Start the services:
```bash
# Start MongoDB
mongod

# Start MQTT Broker
mosquitto -c mosquitto.conf

# Start Backend
cd backend
npm start

# Start Frontend
cd frontend
npm start
```

## API Documentation

### REST API Endpoints

#### Sensor Data
- `GET /api/sensors`
  - Get list of all sensors
  - Response: `[{id, name, type, unit, location}]`

- `GET /api/sensors/:id`
  - Get specific sensor details
  - Response: `{id, name, type, unit, location, lastValue, lastUpdate}`

- `GET /api/sensors/:id/data`
  - Get historical data for a sensor
  - Query params: 
    - `start`: Start timestamp
    - `end`: End timestamp
    - `interval`: Data interval
  - Response: `[{timestamp, value, unit}]`

#### Sensor Configuration
- `PUT /api/sensors/:id/config`
  - Update sensor configuration
  - Body: `{interval, minValue, maxValue, active}`
  - Response: `{success, message}`

- `POST /api/sensors/:id/reset`
  - Reset sensor to default settings
  - Response: `{success, message}`

#### Alert Rules
- `GET /api/alerts/rules`
  - Get all alert rules
  - Response: `[{id, sensorId, condition, value, severity, enabled}]`

- `POST /api/alerts/rules`
  - Create new alert rule
  - Body: `{sensorId, condition, value, severity}`
  - Response: `{id, success, message}`

- `PUT /api/alerts/rules/:id`
  - Update alert rule
  - Body: `{condition, value, severity, enabled}`
  - Response: `{success, message}`

- `DELETE /api/alerts/rules/:id`
  - Delete alert rule
  - Response: `{success, message}`

#### Sensor Groups
- `GET /api/groups`
  - Get all sensor groups
  - Response: `[{id, name, description, sensors, color}]`

- `POST /api/groups`
  - Create new sensor group
  - Body: `{name, description, sensors, color}`
  - Response: `{id, success, message}`

- `PUT /api/groups/:id`
  - Update sensor group
  - Body: `{name, description, sensors, color}`
  - Response: `{success, message}`

- `DELETE /api/groups/:id`
  - Delete sensor group
  - Response: `{success, message}`

### MQTT Topics

#### Sensor Data
- `sensor/+/data`
  - Real-time sensor data
  - Payload: `{sensorId, value, unit, timestamp}`

- `sensor/+/status`
  - Sensor status updates
  - Payload: `{sensorId, active, battery, lastUpdate}`

- `sensor/+/config`
  - Sensor configuration updates
  - Payload: `{sensorId, interval, minValue, maxValue, active}`

#### Commands
- `sensor/+/command`
  - Send commands to sensors
  - Payload: `{command, parameters}`

#### Alerts
- `alerts/notifications`
  - Real-time alert notifications
  - Payload: `{id, sensorId, message, severity, timestamp}`

## Security

- MQTT authentication and TLS encryption
- JWT-based API authentication
- Rate limiting on API endpoints
- Input validation and sanitization
- CORS configuration
- Environment variable protection

## Error Handling

The API uses standard HTTP status codes:
- 200: Success
- 400: Bad Request
- 401: Unauthorized
- 403: Forbidden
- 404: Not Found
- 500: Internal Server Error

Error responses follow the format:
```json
{
  "error": true,
  "message": "Error description",
  "code": "ERROR_CODE",
  "details": {}
}
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

MIT License - see LICENSE.md for details
