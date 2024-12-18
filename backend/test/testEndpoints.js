const axios = require('axios');
const mongoose = require('mongoose');
const SensorData = require('../models/dataModel');
require('dotenv').config();

const BASE_URL = 'http://localhost:5001/api';

// Function to generate random sensor data
const generateSensorData = (sensorId) => ({
  sensorId,
  value: Math.random() * 100,
  timestamp: new Date()
});

// Function to add test data
async function addTestData() {
  try {
    // Generate test data for two sensors
    const testData = [];
    const now = new Date();
    
    // Generate data for last 24 hours
    for (let i = 0; i < 24; i++) {
      const timestamp = new Date(now - i * 60 * 60 * 1000); // Each hour
      testData.push({
        sensorId: 'sensor1',
        value: Math.random() * 100,
        timestamp
      });
      testData.push({
        sensorId: 'sensor2',
        value: Math.random() * 100,
        timestamp
      });
    }

    await SensorData.insertMany(testData);
    console.log('Test data added successfully');
  } catch (error) {
    console.error('Error adding test data:', error);
  }
}

// Test all endpoints
async function testEndpoints() {
  try {
    console.log('\nTesting endpoints...\n');

    // Test GET /api/data
    console.log('1. Testing GET /api/data');
    const allData = await axios.get(`${BASE_URL}/data`);
    console.log('✓ GET /api/data successful');
    console.log(`  Retrieved ${allData.data.length} records\n`);

    // Test GET /api/sensor/:sensorId
    console.log('2. Testing GET /api/sensor/sensor1');
    const sensorData = await axios.get(`${BASE_URL}/sensor/sensor1`);
    console.log('✓ GET /api/sensor/sensor1 successful');
    console.log(`  Retrieved ${sensorData.data.length} records for sensor1\n`);

    // Test GET /api/chart with different timeframes
    const timeframes = ['1h', '6h', '24h'];
    for (const timeframe of timeframes) {
      console.log(`3. Testing GET /api/chart?timeframe=${timeframe}`);
      const chartData = await axios.get(`${BASE_URL}/chart?timeframe=${timeframe}`);
      console.log(`✓ GET /api/chart?timeframe=${timeframe} successful`);
      console.log(`  Retrieved ${chartData.data.length} records\n`);
    }

  } catch (error) {
    console.error('Error testing endpoints:', error.response?.data || error.message);
  }
}

// Main function to run tests
async function runTests() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to MongoDB');

    // Clear existing test data
    await SensorData.deleteMany({});
    console.log('Cleared existing data');

    // Add test data
    await addTestData();

    // Test endpoints
    await testEndpoints();

  } catch (error) {
    console.error('Error:', error);
  } finally {
    // Close MongoDB connection
    await mongoose.connection.close();
    console.log('\nTest completed and MongoDB connection closed');
  }
}

// Run the tests
runTests();
