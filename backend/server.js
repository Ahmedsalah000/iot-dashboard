const express = require('express');
const mongoose = require('mongoose');
require('dotenv').config();
const dbConnection = require('./config/db');
const mqttService = require('./services/mqttService');
const dataRoutes = require('./routes/dataRoutes');

const app = express();

// Connect to MongoDB
dbConnection();

app.use(express.json());
app.use('/api', dataRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
