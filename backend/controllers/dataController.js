const SensorData = require('../models/dataModel');

// Get all data
exports.getData = async (req, res) => {
  try {
    const data = await SensorData.find().sort({ timestamp: -1 }).limit(100);
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get data for specific sensor
exports.getSensorData = async (req, res) => {
  try {
    const { sensorId } = req.params;
    const data = await SensorData.find({ sensorId })
      .sort({ timestamp: -1 })
      .limit(50);
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get aggregated data for charts
exports.getChartData = async (req, res) => {
  try {
    const { timeframe = '24h' } = req.query;
    const now = new Date();
    let startTime;

    switch(timeframe) {
      case '1h':
        startTime = new Date(now - 60 * 60 * 1000);
        break;
      case '6h':
        startTime = new Date(now - 6 * 60 * 60 * 1000);
        break;
      case '24h':
      default:
        startTime = new Date(now - 24 * 60 * 60 * 1000);
    }

    const data = await SensorData.find({
      timestamp: { $gte: startTime }
    }).sort({ timestamp: 1 });

    res.json(data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
