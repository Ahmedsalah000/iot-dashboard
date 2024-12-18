const mqtt = require('mqtt');
const Data = require('../models/dataModel');

class MQTTService {
  constructor() {
    this.client = null;
    this.topics = ['sensor/+/data', 'sensor/+/status']; // Support multiple topics with wildcards
    this.connected = false;
    this.init();
  }

  init() {
    try {
      const brokerUrl = process.env.MQTT_BROKER_URL || 'mqtt://localhost:1883';
      console.log('Connecting to MQTT broker:', brokerUrl);

      this.client = mqtt.connect(brokerUrl, {
        clientId: `iot_dashboard_${Math.random().toString(16).slice(3)}`,
        clean: true,
        connectTimeout: 4000,
        reconnectPeriod: 1000,
        keepalive: 60,
        will: {
          topic: 'dashboard/status',
          payload: 'offline',
          qos: 1,
          retain: true
        }
      });

      this.setupEventHandlers();
    } catch (error) {
      console.error('Failed to initialize MQTT service:', error);
      this.connected = false;
    }
  }

  setupEventHandlers() {
    this.client.on('connect', () => {
      console.log('MQTT Connected');
      this.connected = true;
      
      // Subscribe to all topics
      this.topics.forEach(topic => {
        this.client.subscribe(topic, (err) => {
          if (err) {
            console.error(`Error subscribing to ${topic}:`, err);
          } else {
            console.log(`Subscribed to ${topic}`);
          }
        });
      });

      // Publish online status
      this.client.publish('dashboard/status', 'online', { retain: true });
    });

    this.client.on('reconnect', () => {
      console.log('MQTT reconnecting...');
      this.connected = false;
    });

    this.client.on('error', (error) => {
      console.error('MQTT Error:', error);
      this.connected = false;
    });

    this.client.on('message', async (topic, message) => {
      try {
        const data = JSON.parse(message.toString());
        console.log(`Received message on topic ${topic}:`, data);

        if (topic.match(/sensor\/\w+\/data/)) {
          await this.handleSensorData(data);
        } else if (topic.match(/sensor\/\w+\/status/)) {
          await this.handleSensorStatus(data);
        }
      } catch (error) {
        console.error('Error processing MQTT message:', error);
      }
    });

    this.client.on('close', () => {
      console.log('MQTT connection closed');
      this.connected = false;
    });

    this.client.on('offline', () => {
      console.log('MQTT client is offline');
      this.connected = false;
    });
  }

  async handleSensorData(data) {
    try {
      const newData = new Data({
        sensorId: data.sensorId,
        value: data.value,
        timestamp: data.timestamp || new Date(),
        unit: data.unit || 'unknown'
      });
      await newData.save();
      console.log('Sensor data saved:', newData);
    } catch (error) {
      console.error('Error saving sensor data:', error);
    }
  }

  async handleSensorStatus(data) {
    // Handle sensor status updates (online/offline, battery level, etc.)
    console.log('Sensor status update:', data);
  }

  // Method to publish data (can be used for testing or sending commands)
  publish(topic, message, options = {}) {
    if (!this.connected) {
      console.error('Cannot publish: MQTT client not connected');
      return false;
    }
    
    try {
      this.client.publish(topic, JSON.stringify(message), options);
      return true;
    } catch (error) {
      console.error('Error publishing message:', error);
      return false;
    }
  }

  // Method to check connection status
  isConnected() {
    return this.connected;
  }
}

// Create and export a single instance
const mqttService = new MQTTService();
module.exports = mqttService;
