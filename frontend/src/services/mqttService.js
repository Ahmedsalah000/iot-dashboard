import mqtt from 'mqtt';

class MQTTService {
  constructor() {
    this.client = null;
    this.subscribers = new Map();
    this.connected = false;
  }

  connect() {
    if (this.client) return;

    const brokerUrl = process.env.REACT_APP_MQTT_BROKER_URL || 'ws://localhost:8083/mqtt';
    
    this.client = mqtt.connect(brokerUrl, {
      clientId: `dashboard_${Math.random().toString(16).slice(3)}`,
      clean: true,
      reconnectPeriod: 1000,
    });

    this.client.on('connect', () => {
      console.log('MQTT Connected');
      this.connected = true;
      this.client.subscribe('sensor/+/data');
      this.client.subscribe('sensor/+/status');
    });

    this.client.on('message', (topic, message) => {
      try {
        const data = JSON.parse(message.toString());
        this.notifySubscribers(topic, data);
      } catch (error) {
        console.error('Error processing message:', error);
      }
    });

    this.client.on('error', (error) => {
      console.error('MQTT Error:', error);
      this.connected = false;
    });

    this.client.on('close', () => {
      console.log('MQTT Connection closed');
      this.connected = false;
    });
  }

  subscribe(topic, callback) {
    if (!this.subscribers.has(topic)) {
      this.subscribers.set(topic, new Set());
    }
    this.subscribers.get(topic).add(callback);

    // Return unsubscribe function
    return () => {
      const callbacks = this.subscribers.get(topic);
      if (callbacks) {
        callbacks.delete(callback);
        if (callbacks.size === 0) {
          this.subscribers.delete(topic);
        }
      }
    };
  }

  notifySubscribers(topic, data) {
    const callbacks = this.subscribers.get(topic);
    if (callbacks) {
      callbacks.forEach(callback => callback(data));
    }
  }

  disconnect() {
    if (this.client) {
      this.client.end();
      this.client = null;
      this.connected = false;
      this.subscribers.clear();
    }
  }
}

// Create and export a single instance
const mqttService = new MQTTService();
export default mqttService;
