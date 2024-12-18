const express = require('express');
const router = express.Router();

router.get('/health', async (req, res) => {
  try {
    // Check MongoDB connection
    const mongoStatus = mongoose.connection.readyState === 1;
    
    // Check MQTT connection
    const mqttStatus = global.mqttClient && global.mqttClient.connected;

    if (mongoStatus && mqttStatus) {
      res.status(200).json({
        status: 'healthy',
        mongo: 'connected',
        mqtt: 'connected',
        timestamp: new Date().toISOString()
      });
    } else {
      res.status(503).json({
        status: 'unhealthy',
        mongo: mongoStatus ? 'connected' : 'disconnected',
        mqtt: mqttStatus ? 'connected' : 'disconnected',
        timestamp: new Date().toISOString()
      });
    }
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});
