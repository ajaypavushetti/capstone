const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const ratingRoutes = require('./routes/ratingRoutes');

const app = express();
const PORT = process.env.RATING_SERVICE_PORT || process.env.PORT || 4003;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/cake_delight';

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/ratings', ratingRoutes);

// Root Service Info & Health check endpoints
app.get('/', (req, res) => {
  res.json({
    service: 'Rating Microservice',
    status: 'UP',
    port: PORT,
    description: 'Manages star rating submissions, reviews, and average rating aggregations',
    endpoints: {
      allRatings: '/api/ratings',
      cakeRatings: '/api/ratings/cake/:cakeId',
      cakeSummary: '/api/ratings/cake/:cakeId/summary',
      allSummaries: '/api/ratings/summaries',
      health: '/health'
    }
  });
});

app.get('/health', (req, res) => {
  res.json({
    service: 'Rating Microservice',
    status: 'UP',
    timestamp: new Date().toISOString(),
    dbState: mongoose.connection.readyState === 1 ? 'CONNECTED' : 'DISCONNECTED'
  });
});

// Database connection & Server initialization with auto-retry
async function connectDBWithRetry() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Rating Service connected to MongoDB database');
  } catch (err) {
    console.error('❌ Failed to connect to MongoDB in Rating Service:', err.message);
    console.log('⚠️ Retrying MongoDB connection in 10 seconds...');
    setTimeout(connectDBWithRetry, 10000);
  }
}

app.listen(PORT, () => {
  console.log(`🚀 Rating Service running on port ${PORT}`);
  connectDBWithRetry();
});
