#!/bin/bash

# Create necessary directories
mkdir -p mosquitto/config mosquitto/data mosquitto/log

# Build and start containers
docker-compose up --build -d

# Wait for services to be ready
echo "Waiting for services to start..."
sleep 10

# Check if services are running
echo "Checking service status..."
docker-compose ps

echo "Deployment complete! The IoT Dashboard is now running at:"
echo "Frontend: http://localhost:3000"
echo "Backend API: http://localhost:3001"
echo "MQTT Broker: localhost:1883"
echo "MongoDB: localhost:27017"
