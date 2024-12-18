const mqttService = require('../services/mqttService');

// Wait for connection
setTimeout(() => {
  // Test publishing sensor data
  const testData = {
    sensorId: 'test-sensor-1',
    value: 25.5,
    unit: 'celsius',
    timestamp: new Date()
  };

  console.log('Publishing test data...');
  mqttService.publish('sensor/test-sensor-1/data', testData);

  // Test publishing sensor status
  const statusData = {
    sensorId: 'test-sensor-1',
    status: 'online',
    battery: 95
  };

  console.log('Publishing status data...');
  mqttService.publish('sensor/test-sensor-1/status', statusData);

  // Keep the script running for a while to see the results
  setTimeout(() => {
    console.log('Test complete');
    process.exit(0);
  }, 5000);
}, 2000);
