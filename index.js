const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const userRoutes = require('./routes/userRoutes');
const analyzeRoutes = require('./routes/analyzeRoutes');

const app = express();
app.use(cors());
app.use(express.json());

// cron job ping every 15 minutes to prevent Heroku from sleeping
app.get('/', (req, res) => {
    res.status(200).json({ 
        status: 'ok', 
        message: 'SmartAgri Server is running' 
    });
});

app.use('/api/users', userRoutes);
app.use('/api/analyze', analyzeRoutes);

mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log("Connected to MongoDB"))
    .catch(err => console.log(err));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));