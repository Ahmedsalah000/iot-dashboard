const mqttService = require('./mqttService');

class SensorSimulator {
    constructor() {
        this.sensors = new Map();
        this.intervalIds = new Map();
    }

    createSensor(sensorId, config = {}) {
        const defaultConfig = {
            minValue: 20,
            maxValue: 30,
            updateInterval: 5000, // 5 seconds
            unit: 'celsius',
            noise: 0.5 // Random noise factor
        };

        const sensorConfig = { ...defaultConfig, ...config };
        this.sensors.set(sensorId, {
            ...sensorConfig,
            lastValue: (sensorConfig.maxValue + sensorConfig.minValue) / 2
        });

        // Publish initial status
        this.publishSensorStatus(sensorId, 'online');
        
        return sensorConfig;
    }

    startSensor(sensorId) {
        if (!this.sensors.has(sensorId)) {
            throw new Error(`Sensor ${sensorId} not found`);
        }

        if (this.intervalIds.has(sensorId)) {
            console.log(`Sensor ${sensorId} is already running`);
            return;
        }

        const intervalId = setInterval(() => {
            this.generateAndPublishData(sensorId);
        }, this.sensors.get(sensorId).updateInterval);

        this.intervalIds.set(sensorId, intervalId);
        console.log(`Started sensor ${sensorId}`);
    }

    stopSensor(sensorId) {
        if (this.intervalIds.has(sensorId)) {
            clearInterval(this.intervalIds.get(sensorId));
            this.intervalIds.delete(sensorId);
            this.publishSensorStatus(sensorId, 'offline');
            console.log(`Stopped sensor ${sensorId}`);
        }
    }

    generateAndPublishData(sensorId) {
        const sensor = this.sensors.get(sensorId);
        if (!sensor) return;

        // Generate realistic-looking data with some randomness
        const range = sensor.maxValue - sensor.minValue;
        const noise = (Math.random() - 0.5) * 2 * sensor.noise;
        const trend = Math.sin(Date.now() / 10000) * range * 0.1; // Slow sinusoidal variation

        let newValue = sensor.lastValue + noise + trend;
        
        // Keep value within bounds
        newValue = Math.max(sensor.minValue, Math.min(sensor.maxValue, newValue));
        sensor.lastValue = newValue;

        const data = {
            sensorId,
            value: parseFloat(newValue.toFixed(2)),
            unit: sensor.unit,
            timestamp: new Date()
        };

        mqttService.publish(`sensor/${sensorId}/data`, data);
    }

    publishSensorStatus(sensorId, status) {
        const statusData = {
            sensorId,
            status,
            battery: Math.floor(Math.random() * 30 + 70), // Random battery level between 70-100
            timestamp: new Date()
        };

        mqttService.publish(`sensor/${sensorId}/status`, statusData);
    }

    getSensorConfig(sensorId) {
        return this.sensors.get(sensorId);
    }

    getAllSensors() {
        return Array.from(this.sensors.keys());
    }
}

// Create and export a single instance
const simulator = new SensorSimulator();
module.exports = simulator;
