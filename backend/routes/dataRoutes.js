const express = require('express');
const { getData, getSensorData, getChartData } = require('../controllers/dataController');

const router = express.Router();

router.get('/data', getData);
router.get('/sensor/:sensorId', getSensorData);
router.get('/chart', getChartData);

module.exports = router;
