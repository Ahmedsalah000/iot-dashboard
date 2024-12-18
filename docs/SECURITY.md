# IoT Dashboard Security Guide

## Security Best Practices

### 1. Authentication & Authorization

#### JWT Implementation
```javascript
// Generate secure JWT
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const generateToken = (user) => {
  const secret = process.env.JWT_SECRET;
  const payload = {
    id: user.id,
    role: user.role,
    // Don't include sensitive data in JWT
    iat: Math.floor(Date.now() / 1000)
  };
  
  return jwt.sign(payload, secret, {
    expiresIn: '24h',
    algorithm: 'HS256'
  });
};

// Verify JWT
const verifyToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    throw new Error('Invalid token');
  }
};
```

#### Role-Based Access Control (RBAC)
```javascript
// RBAC middleware
const checkRole = (requiredRole) => {
  return (req, res, next) => {
    const { role } = req.user;
    if (role !== requiredRole) {
      return res.status(403).json({
        error: 'Insufficient permissions'
      });
    }
    next();
  };
};

// Apply RBAC to routes
app.put('/api/sensors/:id/config', 
  authenticate, 
  checkRole('admin'),
  updateSensorConfig
);
```

### 2. Data Protection

#### Encryption at Rest
```javascript
// Database encryption configuration
const mongoose = require('mongoose');
const encrypt = require('mongoose-encryption');

const secret = process.env.DB_ENCRYPTION_KEY;
const encKey = crypto.scryptSync(secret, 'salt', 32);
const sigKey = crypto.scryptSync(secret, 'salt', 32);

const sensorSchema = new mongoose.Schema({
  // ... schema fields
});

// Encrypt sensitive fields
sensorSchema.plugin(encrypt, {
  encryptionKey: encKey,
  signingKey: sigKey,
  encryptedFields: ['value', 'configuration']
});
```

#### Data Sanitization
```javascript
const sanitize = require('sanitize-html');

// Sanitize input
const sanitizeInput = (data) => {
  if (typeof data === 'string') {
    return sanitize(data, {
      allowedTags: [],
      allowedAttributes: {}
    });
  }
  return data;
};

// Apply sanitization middleware
app.use((req, res, next) => {
  req.body = JSON.parse(JSON.stringify(req.body), (key, value) => 
    sanitizeInput(value)
  );
  next();
});
```

### 3. Network Security

#### HTTPS Configuration
```javascript
// Express HTTPS configuration
const https = require('https');
const fs = require('fs');

const options = {
  key: fs.readFileSync('private-key.pem'),
  cert: fs.readFileSync('certificate.pem'),
  ciphers: [
    'ECDHE-ECDSA-AES128-GCM-SHA256',
    'ECDHE-RSA-AES128-GCM-SHA256',
    'ECDHE-ECDSA-AES256-GCM-SHA384',
    'ECDHE-RSA-AES256-GCM-SHA384'
  ].join(':'),
  honorCipherOrder: true,
  minVersion: 'TLSv1.2'
};

https.createServer(options, app).listen(443);
```

#### CORS Configuration
```javascript
const cors = require('cors');

// Strict CORS policy
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS.split(','),
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  credentials: true,
  maxAge: 86400
}));
```

### 4. MQTT Security

#### TLS Configuration
```javascript
// MQTT broker TLS configuration
const aedes = require('aedes')();
const tls = require('tls');

const options = {
  key: fs.readFileSync('private-key.pem'),
  cert: fs.readFileSync('certificate.pem'),
  requestCert: true,
  rejectUnauthorized: true,
  ca: [fs.readFileSync('ca-certificate.pem')]
};

const server = tls.createServer(options, aedes.handle);
```

#### Access Control Lists
```javascript
// MQTT ACL configuration
aedes.authenticate = (client, username, password, callback) => {
  // Verify credentials
  const authorized = verifyCredentials(username, password);
  if (authorized) {
    client.user = username;
    callback(null, true);
  } else {
    callback(new Error('Authentication failed'), false);
  }
};

aedes.authorizePublish = (client, packet, callback) => {
  // Check ACL for publish
  const allowed = checkPublishPermission(client.user, packet.topic);
  callback(allowed ? null : new Error('Unauthorized'));
};

aedes.authorizeSubscribe = (client, sub, callback) => {
  // Check ACL for subscribe
  const allowed = checkSubscribePermission(client.user, sub.topic);
  callback(null, allowed ? sub : null);
};
```

### 5. Input Validation

#### Request Validation
```javascript
const Joi = require('joi');

// Validation schemas
const schemas = {
  sensorData: Joi.object({
    value: Joi.number().required(),
    timestamp: Joi.date().iso().required(),
    unit: Joi.string().required()
  }),
  
  sensorConfig: Joi.object({
    interval: Joi.number().min(1000).max(3600000),
    minValue: Joi.number(),
    maxValue: Joi.number().greater(Joi.ref('minValue')),
    active: Joi.boolean()
  })
};

// Validation middleware
const validate = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({
        error: error.details[0].message
      });
    }
    next();
  };
};

// Apply validation to routes
app.post('/api/sensors/:id/data',
  validate(schemas.sensorData),
  saveSensorData
);
```

### 6. Rate Limiting

#### API Rate Limiting
```javascript
const rateLimit = require('express-rate-limit');
const RedisStore = require('rate-limit-redis');
const Redis = require('ioredis');

const redis = new Redis({
  host: process.env.REDIS_HOST,
  password: process.env.REDIS_PASSWORD
});

// Configure rate limiter
const limiter = rateLimit({
  store: new RedisStore({
    client: redis,
    prefix: 'rate-limit:'
  }),
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests, please try again later'
  }
});

// Apply rate limiting to all routes
app.use('/api/', limiter);
```

### 7. Logging & Monitoring

#### Security Logging
```javascript
const winston = require('winston');

// Configure security logger
const securityLogger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({
      filename: 'security.log',
      level: 'info'
    })
  ]
});

// Log security events
const logSecurityEvent = (event) => {
  securityLogger.info({
    timestamp: new Date(),
    type: event.type,
    user: event.user,
    ip: event.ip,
    action: event.action,
    status: event.status
  });
};

// Security event monitoring
app.use((req, res, next) => {
  const originalSend = res.send;
  res.send = function(data) {
    logSecurityEvent({
      type: 'api_access',
      user: req.user?.id,
      ip: req.ip,
      action: `${req.method} ${req.path}`,
      status: res.statusCode
    });
    originalSend.call(this, data);
  };
  next();
});
```

### 8. Dependency Security

#### NPM Audit Configuration
```json
{
  "scripts": {
    "security-check": "npm audit && snyk test",
    "outdated": "npm outdated"
  },
  "husky": {
    "hooks": {
      "pre-commit": "npm run security-check"
    }
  }
}
```

#### Container Security
```dockerfile
# Use specific version
FROM node:16-alpine

# Run as non-root user
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser

# Install security updates
RUN apk update && apk upgrade

# Copy only necessary files
COPY --chown=appuser:appgroup package*.json ./
RUN npm ci --only=production
COPY --chown=appuser:appgroup . .

# Remove unnecessary files
RUN rm -rf tests/ docs/

# Set secure permissions
RUN chmod -R 500 .
```

### 9. Security Headers

#### Helmet Configuration
```javascript
const helmet = require('helmet');

// Configure security headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "wss:", "https:"],
      frameSrc: ["'none'"],
      objectSrc: ["'none'"]
    }
  },
  crossOriginEmbedderPolicy: true,
  crossOriginOpenerPolicy: true,
  crossOriginResourcePolicy: { policy: "same-site" },
  dnsPrefetchControl: { allow: false },
  expectCt: {
    maxAge: 30,
    enforce: true
  },
  frameguard: { action: "deny" },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  },
  ieNoOpen: true,
  noSniff: true,
  originAgentCluster: true,
  permittedCrossDomainPolicies: { permittedPolicies: "none" },
  referrerPolicy: { policy: "strict-origin-when-cross-origin" },
  xssFilter: true
}));
```

### 10. Secure Configuration Management

#### Environment Variables
```javascript
const envalid = require('envalid');
const { str, num, bool, url } = envalid;

// Validate environment variables
const env = envalid.cleanEnv(process.env, {
  NODE_ENV: str({
    choices: ['development', 'test', 'production']
  }),
  PORT: num(),
  MONGODB_URI: url(),
  JWT_SECRET: str({
    minLength: 32
  }),
  MQTT_USERNAME: str(),
  MQTT_PASSWORD: str(),
  ALLOWED_ORIGINS: str(),
  REDIS_HOST: str(),
  REDIS_PASSWORD: str(),
  SSL_KEY_PATH: str(),
  SSL_CERT_PATH: str()
});

// Use validated environment variables
module.exports = env;
```

### 11. Security Testing

#### Security Test Suite
```javascript
const request = require('supertest');
const app = require('../app');

describe('Security Tests', () => {
  test('Should reject invalid JWT', async () => {
    const response = await request(app)
      .get('/api/sensors')
      .set('Authorization', 'Bearer invalid-token');
    
    expect(response.status).toBe(401);
  });

  test('Should prevent SQL injection', async () => {
    const response = await request(app)
      .get('/api/sensors')
      .query({ id: "' OR '1'='1" });
    
    expect(response.status).toBe(400);
  });

  test('Should prevent XSS', async () => {
    const response = await request(app)
      .post('/api/sensors')
      .send({
        name: '<script>alert("xss")</script>'
      });
    
    expect(response.body.name).not.toContain('<script>');
  });
});
```

### 12. Incident Response

#### Security Incident Handler
```javascript
const notifier = require('./notifier');

class SecurityIncidentHandler {
  constructor() {
    this.incidents = new Map();
  }

  async handleIncident(incident) {
    // Log incident
    securityLogger.error({
      type: 'security_incident',
      ...incident
    });

    // Store incident
    this.incidents.set(incident.id, {
      ...incident,
      timestamp: new Date(),
      status: 'new'
    });

    // Notify security team
    await notifier.sendAlert({
      type: 'security',
      severity: incident.severity,
      message: incident.message
    });

    // Take automated action
    switch (incident.type) {
      case 'brute_force':
        await this.blockIP(incident.ip);
        break;
      case 'data_leak':
        await this.revokeTokens(incident.userId);
        break;
      default:
        break;
    }
  }

  async blockIP(ip) {
    // Implement IP blocking logic
  }

  async revokeTokens(userId) {
    // Implement token revocation logic
  }
}

module.exports = new SecurityIncidentHandler();
```
