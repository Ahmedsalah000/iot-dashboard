const mongoose = require('mongoose');

const dataSchema = new mongoose.Schema({
  sensorId: { type: String, required: true },
  value: { type: Number, required: true },
  timestamp: { type: Date, default: Date.now },
}, {
  collection: 'sensor_data', 
  timestamps: true
});

module.exports = mongoose.model('SensorData', dataSchema);
