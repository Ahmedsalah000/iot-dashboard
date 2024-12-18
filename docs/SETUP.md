# IoT Dashboard Setup Guide

## Development Environment Setup

### Prerequisites

#### Required Software
- Node.js (v16 or higher)
- MongoDB (v5 or higher)
- MQTT Broker (Mosquitto)
- Git

#### Optional Tools
- Docker & Docker Compose
- MongoDB Compass (GUI)
- MQTT Explorer
- Visual Studio Code

### Installation Steps

#### 1. Basic Setup

##### Windows
```powershell
# Install Chocolatey (Package Manager)
Set-ExecutionPolicy Bypass -Scope Process -Force
iex ((New-Object System.Net.WebClient).DownloadString('https://chocolatey.org/install.ps1'))

# Install Required Software
choco install nodejs mongodb mosquitto git vscode -y

# Start MongoDB
net start MongoDB

# Start Mosquitto
net start Mosquitto
```

##### Linux (Ubuntu/Debian)
```bash
# Update package list
sudo apt update

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_16.x | sudo -E bash -
sudo apt install -y nodejs

# Install MongoDB
sudo apt install -y mongodb

# Install Mosquitto
sudo apt install -y mosquitto mosquitto-clients

# Start services
sudo systemctl start mongodb
sudo systemctl start mosquitto
```

##### macOS
```bash
# Install Homebrew
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Install Required Software
brew install node mongodb-community mosquitto git

# Start services
brew services start mongodb-community
brew services start mosquitto
```

#### 2. Project Setup

```bash
# Clone repository
git clone https://github.com/yourusername/iot-dashboard.git
cd iot-dashboard

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

#### 3. Environment Configuration

##### Backend Configuration
Create `backend/.env`:
```env
# Server Configuration
PORT=3001
NODE_ENV=development

# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/iot-dashboard
MONGODB_TEST_URI=mongodb://localhost:27017/iot-dashboard-test

# MQTT Configuration
MQTT_BROKER_URL=mqtt://localhost:1883
MQTT_USERNAME=your_username
MQTT_PASSWORD=your_password

# JWT Configuration
JWT_SECRET=your_jwt_secret
JWT_EXPIRATION=24h

# Logging
LOG_LEVEL=debug
```

##### Frontend Configuration
Create `frontend/.env`:
```env
# API Configuration
REACT_APP_API_URL=http://localhost:3001
REACT_APP_WS_URL=ws://localhost:9001

# Feature Flags
REACT_APP_ENABLE_NOTIFICATIONS=true
REACT_APP_ENABLE_ANALYTICS=true

# Logging
REACT_APP_LOG_LEVEL=debug
```

##### MQTT Configuration
Edit `/etc/mosquitto/mosquitto.conf`:
```conf
# Basic Configuration
listener 1883
protocol mqtt

# WebSocket Support
listener 9001
protocol websockets

# Security
allow_anonymous false
password_file /etc/mosquitto/passwd

# Logging
log_type all
log_dest file /var/log/mosquitto/mosquitto.log
```

### Docker Setup

#### 1. Install Docker
Follow instructions at [https://docs.docker.com/get-docker/](https://docs.docker.com/get-docker/)

#### 2. Create Docker Compose File
Create `docker-compose.yml`:
```yaml
version: '3.8'

services:
  frontend:
    build: ./frontend
    ports:
      - "3000:3000"
    environment:
      - REACT_APP_API_URL=http://localhost:3001
      - REACT_APP_WS_URL=ws://localhost:9001
    depends_on:
      - backend

  backend:
    build: ./backend
    ports:
      - "3001:3001"
    environment:
      - MONGODB_URI=mongodb://mongodb:27017/iot-dashboard
      - MQTT_BROKER_URL=mqtt://mosquitto:1883
    depends_on:
      - mongodb
      - mosquitto

  mongodb:
    image: mongo:5
    ports:
      - "27017:27017"
    volumes:
      - mongodb_data:/data/db

  mosquitto:
    image: eclipse-mosquitto:2
    ports:
      - "1883:1883"
      - "9001:9001"
    volumes:
      - ./mosquitto/config:/mosquitto/config
      - ./mosquitto/data:/mosquitto/data
      - ./mosquitto/log:/mosquitto/log

volumes:
  mongodb_data:
```

#### 3. Start Docker Environment
```bash
# Build and start containers
docker-compose up -d

# View logs
docker-compose logs -f

# Stop environment
docker-compose down
```

### Development Tools Setup

#### Visual Studio Code Extensions
Install recommended extensions:
- ESLint
- Prettier
- Docker
- MongoDB for VS Code
- MQTT Explorer

#### MongoDB Compass
1. Download and install [MongoDB Compass](https://www.mongodb.com/try/download/compass)
2. Connect to `mongodb://localhost:27017`

#### MQTT Explorer
1. Download and install [MQTT Explorer](http://mqtt-explorer.com/)
2. Connect to `mqtt://localhost:1883`

### Testing Environment

#### 1. Setup Test Database
```bash
# Create test database
mongosh
use iot-dashboard-test
db.createUser({
  user: "test",
  pwd: "test123",
  roles: ["readWrite"]
})
```

#### 2. Configure Test Environment
Create `backend/.env.test`:
```env
NODE_ENV=test
MONGODB_URI=mongodb://localhost:27017/iot-dashboard-test
```

#### 3. Run Tests
```bash
# Backend tests
cd backend
npm test

# Frontend tests
cd frontend
npm test
```

### Production Environment Setup

#### 1. Server Requirements
- Ubuntu Server 20.04 LTS
- 2 CPU cores
- 4GB RAM
- 20GB SSD

#### 2. Security Setup
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Configure firewall
sudo ufw allow 22
sudo ufw allow 80
sudo ufw allow 443
sudo ufw allow 1883
sudo ufw allow 9001
sudo ufw enable

# Install SSL certificate
sudo apt install certbot
sudo certbot certonly --standalone -d your-domain.com
```

#### 3. Nginx Configuration
Install and configure Nginx:
```bash
# Install Nginx
sudo apt install nginx

# Configure SSL
sudo nano /etc/nginx/sites-available/iot-dashboard
```

Add configuration:
```nginx
server {
    listen 443 ssl;
    server_name your-domain.com;

    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    location /ws {
        proxy_pass http://localhost:9001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

#### 4. Process Management
Install PM2:
```bash
# Install PM2
npm install -g pm2

# Start applications
pm2 start backend/dist/index.js --name iot-backend
pm2 start frontend/build/index.js --name iot-frontend

# Configure startup
pm2 startup
pm2 save
```

### Monitoring Setup

#### 1. Application Monitoring
```bash
# Install monitoring tools
npm install -g clinic

# Monitor Node.js performance
clinic doctor -- node backend/dist/index.js
```

#### 2. System Monitoring
```bash
# Install monitoring tools
sudo apt install htop iotop nethogs

# Monitor system resources
htop
```

#### 3. Log Management
```bash
# Configure log rotation
sudo nano /etc/logrotate.d/iot-dashboard

/var/log/iot-dashboard/*.log {
    daily
    rotate 7
    compress
    delaycompress
    notifempty
    create 640 node node
    sharedscripts
    postrotate
        systemctl reload iot-dashboard
    endscript
}
```

### Backup Configuration

#### 1. Database Backup
Create backup script `backup.sh`:
```bash
#!/bin/bash
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/var/backups/mongodb"
mkdir -p $BACKUP_DIR

# Backup MongoDB
mongodump --out $BACKUP_DIR/$TIMESTAMP

# Compress backup
tar -czf $BACKUP_DIR/$TIMESTAMP.tar.gz $BACKUP_DIR/$TIMESTAMP

# Remove uncompressed backup
rm -rf $BACKUP_DIR/$TIMESTAMP

# Keep only last 7 days of backups
find $BACKUP_DIR -type f -mtime +7 -delete
```

#### 2. Configure Automatic Backups
Add to crontab:
```bash
# Edit crontab
crontab -e

# Add backup schedule (daily at 2 AM)
0 2 * * * /path/to/backup.sh
```

### Troubleshooting Tools

#### 1. Logging Setup
Configure Winston for backend logging:
```javascript
const winston = require('winston');

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});
```

#### 2. Monitoring Tools
```bash
# Monitor MQTT traffic
mosquitto_sub -v -t '#'

# Monitor MongoDB queries
mongosh --eval "db.setProfilingLevel(2)"

# View MongoDB profiler data
mongosh --eval "db.system.profile.find().pretty()"
```

### Maintenance Procedures

#### 1. Database Maintenance
```bash
# Compact database
mongosh
db.runCommand({ compact: 'sensorData' })

# Repair database
mongod --repair
```

#### 2. Log Rotation
```bash
# Configure logrotate
sudo nano /etc/logrotate.d/mongodb

/var/log/mongodb/*.log {
    daily
    rotate 7
    compress
    delaycompress
    notifempty
    create 640 mongodb mongodb
    sharedscripts
    postrotate
        systemctl reload mongodb
    endscript
}
```

#### 3. SSL Certificate Renewal
```bash
# Auto-renew SSL certificates
sudo certbot renew --dry-run
```
