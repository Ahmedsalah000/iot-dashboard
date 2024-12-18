const sensorSimulator = require('../services/sensorSimulator');

// Create multiple simulated sensors
const sensors = [
    {
        id: 'temp-room1',
        config: {
            minValue: 18,
            maxValue: 28,
            unit: 'celsius',
            updateInterval: 3000
        }
    },
    {
        id: 'temp-room2',
        config: {
            minValue: 20,
            maxValue: 30,
            unit: 'celsius',
            updateInterval: 4000
        }
    },
    {
        id: 'humidity-room1',
        config: {
            minValue: 30,
            maxValue: 70,
            unit: 'percent',
            updateInterval: 5000
        }
    }
];

// Initialize and start sensors
console.log('Initializing sensors...');
sensors.forEach(sensor => {
    sensorSimulator.createSensor(sensor.id, sensor.config);
    sensorSimulator.startSensor(sensor.id);
});

// Print active sensors
console.log('\nActive sensors:', sensorSimulator.getAllSensors());

// After 30 seconds, stop one sensor to simulate a failure
setTimeout(() => {
    console.log('\nSimulating sensor failure...');
    sensorSimulator.stopSensor('temp-room1');
}, 30000);

// After 45 seconds, restart the sensor
setTimeout(() => {
    console.log('\nRestarting failed sensor...');
    sensorSimulator.startSensor('temp-room1');
}, 45000);

// Run the simulation for 1 minute
setTimeout(() => {
    console.log('\nStopping all sensors...');
    sensors.forEach(sensor => {
        sensorSimulator.stopSensor(sensor.id);
    });
    console.log('Test complete');
    process.exit(0);
}, 60000);
