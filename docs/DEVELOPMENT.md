# IoT Dashboard Development Guide

## Development Workflow

### 1. Development Environment Setup

#### VS Code Configuration
```json
// .vscode/settings.json
{
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "eslint.validate": [
    "javascript",
    "javascriptreact"
  ],
  "prettier.singleQuote": true,
  "prettier.trailingComma": "es5"
}
```

#### ESLint Configuration
```json
// .eslintrc.json
{
  "extends": [
    "eslint:recommended",
    "plugin:react/recommended",
    "plugin:react-hooks/recommended"
  ],
  "plugins": [
    "react",
    "react-hooks"
  ],
  "rules": {
    "react-hooks/rules-of-hooks": "error",
    "react-hooks/exhaustive-deps": "warn",
    "no-console": ["warn", { "allow": ["warn", "error"] }],
    "no-unused-vars": "warn"
  }
}
```

#### Git Hooks
```json
// package.json
{
  "husky": {
    "hooks": {
      "pre-commit": "lint-staged",
      "commit-msg": "commitlint -E HUSKY_GIT_PARAMS"
    }
  },
  "lint-staged": {
    "*.{js,jsx}": [
      "eslint --fix",
      "prettier --write"
    ]
  }
}
```

### 2. Git Workflow

#### Branch Naming Convention
```bash
# Feature branches
feature/add-sensor-analytics
feature/implement-alerts

# Bug fix branches
fix/sensor-data-sync
fix/mqtt-connection

# Release branches
release/v1.0.0
release/v1.1.0

# Hotfix branches
hotfix/security-vulnerability
hotfix/data-corruption
```

#### Commit Message Format
```bash
# Format: <type>(<scope>): <subject>
#
# Types:
# feat: New feature
# fix: Bug fix
# docs: Documentation changes
# style: Code style changes (formatting, etc)
# refactor: Code refactoring
# test: Adding tests
# chore: Build process or auxiliary tool changes

# Examples:
git commit -m "feat(sensors): add real-time data streaming"
git commit -m "fix(mqtt): resolve connection timeout issues"
git commit -m "docs(api): update endpoint documentation"
```

### 3. Component Development

#### Component Template
```javascript
// src/components/SensorWidget.js
import React, { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import { useTheme } from '@mui/material/styles';

const SensorWidget = ({ sensorId, onDataUpdate }) => {
  const theme = useTheme();
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      const response = await fetch(`/api/sensors/${sensorId}`);
      const result = await response.json();
      setData(result);
      onDataUpdate?.(result);
    } catch (err) {
      setError(err.message);
    }
  }, [sensorId, onDataUpdate]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, [fetchData]);

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div>
      {/* Widget content */}
    </div>
  );
};

SensorWidget.propTypes = {
  sensorId: PropTypes.string.isRequired,
  onDataUpdate: PropTypes.func
};

export default SensorWidget;
```

#### Component Testing
```javascript
// src/components/__tests__/SensorWidget.test.js
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SensorWidget from '../SensorWidget';

describe('SensorWidget', () => {
  beforeEach(() => {
    fetch.resetMocks();
  });

  it('should render sensor data', async () => {
    fetch.mockResponseOnce(JSON.stringify({ value: 23.5 }));

    render(<SensorWidget sensorId="sensor1" />);

    await waitFor(() => {
      expect(screen.getByText('23.5')).toBeInTheDocument();
    });
  });

  it('should handle errors', async () => {
    fetch.mockRejectOnce(new Error('API Error'));

    render(<SensorWidget sensorId="sensor1" />);

    await waitFor(() => {
      expect(screen.getByText('Error: API Error')).toBeInTheDocument();
    });
  });
});
```

### 4. State Management

#### Custom Hooks
```javascript
// src/hooks/useSensorData.js
import { useState, useEffect } from 'react';
import { useMqttSubscription } from './useMqtt';

export const useSensorData = (sensorId) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Subscribe to real-time updates
  useMqttSubscription(`sensor/${sensorId}/data`, (message) => {
    setData(message);
    setLoading(false);
  });

  // Fetch initial data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(`/api/sensors/${sensorId}`);
        const result = await response.json();
        setData(result);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [sensorId]);

  return { data, loading, error };
};
```

#### Context Provider
```javascript
// src/contexts/SensorContext.js
import React, { createContext, useContext, useReducer } from 'react';

const SensorContext = createContext();

const initialState = {
  sensors: {},
  selectedSensor: null,
  filters: {
    timeRange: '1h',
    dataType: 'all'
  }
};

const reducer = (state, action) => {
  switch (action.type) {
    case 'UPDATE_SENSOR':
      return {
        ...state,
        sensors: {
          ...state.sensors,
          [action.payload.id]: action.payload
        }
      };
    case 'SELECT_SENSOR':
      return {
        ...state,
        selectedSensor: action.payload
      };
    case 'UPDATE_FILTERS':
      return {
        ...state,
        filters: {
          ...state.filters,
          ...action.payload
        }
      };
    default:
      return state;
  }
};

export const SensorProvider = ({ children }) => {
  const [state, dispatch] = useReducer(reducer, initialState);

  return (
    <SensorContext.Provider value={{ state, dispatch }}>
      {children}
    </SensorContext.Provider>
  );
};

export const useSensorContext = () => {
  const context = useContext(SensorContext);
  if (!context) {
    throw new Error('useSensorContext must be used within a SensorProvider');
  }
  return context;
};
```

### 5. API Integration

#### API Client
```javascript
// src/services/api.js
import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL,
  timeout: 5000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      // Handle token expiration
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const sensorApi = {
  getAll: () => api.get('/sensors'),
  getById: (id) => api.get(`/sensors/${id}`),
  getData: (id, params) => api.get(`/sensors/${id}/data`, { params }),
  updateConfig: (id, config) => api.put(`/sensors/${id}/config`, config),
  reset: (id) => api.post(`/sensors/${id}/reset`)
};

export const alertApi = {
  getRules: () => api.get('/alerts/rules'),
  createRule: (rule) => api.post('/alerts/rules', rule),
  updateRule: (id, rule) => api.put(`/alerts/rules/${id}`, rule),
  deleteRule: (id) => api.delete(`/alerts/rules/${id}`)
};

export const groupApi = {
  getAll: () => api.get('/groups'),
  create: (group) => api.post('/groups', group),
  update: (id, group) => api.put(`/groups/${id}`, group),
  delete: (id) => api.delete(`/groups/${id}`)
};
```

### 6. Testing Strategy

#### Unit Testing
```javascript
// src/utils/__tests__/dataTransform.test.js
import { transformSensorData } from '../dataTransform';

describe('transformSensorData', () => {
  const mockData = [
    { timestamp: '2024-12-18T17:00:00Z', value: 23.5 },
    { timestamp: '2024-12-18T17:01:00Z', value: 24.0 }
  ];

  it('should transform timestamps to local time', () => {
    const result = transformSensorData(mockData);
    expect(result[0].timestamp).toBeInstanceOf(Date);
  });

  it('should calculate average value', () => {
    const result = transformSensorData(mockData);
    expect(result.average).toBe(23.75);
  });
});
```

#### Integration Testing
```javascript
// src/integration/__tests__/sensorFlow.test.js
import { renderWithProviders, setupTestServer } from '../testUtils';
import Dashboard from '../../pages/Dashboard';

describe('Sensor Flow', () => {
  const server = setupTestServer();

  beforeAll(() => server.listen());
  afterEach(() => server.resetHandlers());
  afterAll(() => server.close());

  it('should display sensor data and update in real-time', async () => {
    // Mock API responses
    server.use(
      rest.get('/api/sensors', (req, res, ctx) => {
        return res(ctx.json([{ id: 'sensor1', value: 23.5 }]));
      }),
      rest.get('/api/sensors/sensor1/data', (req, res, ctx) => {
        return res(ctx.json([
          { timestamp: '2024-12-18T17:00:00Z', value: 23.5 }
        ]));
      })
    );

    const { getByText, findByText } = renderWithProviders(<Dashboard />);

    // Initial render
    expect(getByText('23.5')).toBeInTheDocument();

    // Simulate MQTT message
    mockMqttMessage('sensor/sensor1/data', { value: 24.0 });

    // Check update
    await findByText('24.0');
  });
});
```

### 7. Performance Optimization

#### Code Splitting
```javascript
// src/App.js
import React, { Suspense, lazy } from 'react';
import { Routes, Route } from 'react-router-dom';
import LoadingSpinner from './components/LoadingSpinner';

const Dashboard = lazy(() => import('./pages/Dashboard'));
const Analytics = lazy(() => import('./pages/Analytics'));
const Settings = lazy(() => import('./pages/Settings'));

const App = () => (
  <Suspense fallback={<LoadingSpinner />}>
    <Routes>
      <Route path="/" element={<Dashboard />} />
      <Route path="/analytics" element={<Analytics />} />
      <Route path="/settings" element={<Settings />} />
    </Routes>
  </Suspense>
);
```

#### Memoization
```javascript
// src/components/SensorChart.js
import React, { useMemo } from 'react';

const SensorChart = ({ data, timeRange }) => {
  const chartData = useMemo(() => {
    return processChartData(data, timeRange);
  }, [data, timeRange]);

  return (
    <Chart data={chartData} />
  );
};
```

### 8. Documentation

#### Component Documentation
```javascript
// src/components/SensorCard.js
/**
 * @component SensorCard
 * @description Displays real-time sensor data with status indicators
 *
 * @param {Object} props
 * @param {string} props.sensorId - Unique identifier for the sensor
 * @param {Object} props.data - Current sensor readings
 * @param {Object} props.status - Sensor status information
 * @param {function} props.onConfigChange - Callback for configuration changes
 *
 * @example
 * ```jsx
 * <SensorCard
 *   sensorId="temp-sensor-1"
 *   data={{ value: 23.5, unit: '°C' }}
 *   status={{ active: true, battery: 85 }}
 *   onConfigChange={(config) => handleConfigChange(config)}
 * />
 * ```
 */
```

#### API Documentation
```javascript
/**
 * @api {get} /api/sensors/:id/data Get Sensor Data
 * @apiName GetSensorData
 * @apiGroup Sensors
 *
 * @apiParam {String} id Sensor unique ID
 * @apiParam {String} [start] Start timestamp (ISO 8601)
 * @apiParam {String} [end] End timestamp (ISO 8601)
 * @apiParam {Number} [interval] Data interval in seconds
 *
 * @apiSuccess {Object[]} data List of sensor readings
 * @apiSuccess {String} data.timestamp Reading timestamp
 * @apiSuccess {Number} data.value Sensor value
 * @apiSuccess {String} data.unit Measurement unit
 *
 * @apiError (404) NotFound Sensor not found
 * @apiError (400) BadRequest Invalid parameters
 */
```

### 9. Release Process

#### Version Management
```json
// package.json
{
  "scripts": {
    "version": "npm version",
    "preversion": "npm test",
    "postversion": "git push && git push --tags"
  }
}
```

#### Changelog Generation
```javascript
// scripts/generateChangelog.js
const { execSync } = require('child_process');
const fs = require('fs');

const getCommits = () => {
  const output = execSync('git log --pretty=format:"%s" $(git describe --tags --abbrev=0)..HEAD')
    .toString()
    .trim()
    .split('\n');

  return output.reduce((acc, commit) => {
    const [type] = commit.match(/^(\w+)/) || [];
    if (!type) return acc;

    if (!acc[type]) {
      acc[type] = [];
    }
    acc[type].push(commit);
    return acc;
  }, {});
};

const generateChangelog = () => {
  const commits = getCommits();
  let changelog = '# Changelog\n\n';

  const typeHeaders = {
    feat: '### New Features',
    fix: '### Bug Fixes',
    docs: '### Documentation',
    style: '### Style Changes',
    refactor: '### Code Refactoring',
    test: '### Tests',
    chore: '### Maintenance'
  };

  Object.entries(commits).forEach(([type, messages]) => {
    if (typeHeaders[type]) {
      changelog += `\n${typeHeaders[type]}\n\n`;
      messages.forEach(msg => {
        changelog += `- ${msg.replace(`${type}:`, '').trim()}\n`;
      });
    }
  });

  fs.writeFileSync('CHANGELOG.md', changelog);
};

generateChangelog();
```

### 10. Debugging

#### Browser Debugging
```javascript
// src/utils/debug.js
const debug = {
  log: (...args) => {
    if (process.env.NODE_ENV === 'development') {
      console.log('[DEBUG]', ...args);
    }
  },

  time: (label) => {
    if (process.env.NODE_ENV === 'development') {
      console.time(`[DEBUG] ${label}`);
    }
  },

  timeEnd: (label) => {
    if (process.env.NODE_ENV === 'development') {
      console.timeEnd(`[DEBUG] ${label}`);
    }
  },

  trace: (message) => {
    if (process.env.NODE_ENV === 'development') {
      console.trace('[DEBUG]', message);
    }
  }
};

export default debug;
```

#### Backend Debugging
```javascript
// backend/src/utils/debug.js
const debug = require('debug');

const api = debug('iot:api');
const db = debug('iot:db');
const mqtt = debug('iot:mqtt');
const ws = debug('iot:websocket');

module.exports = {
  api,
  db,
  mqtt,
  ws
};
```
