const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const catalogRoutes = require('./routes/catalogRoutes');
const seedDatabase = require('./seedData');

const app = express();
const PORT = process.env.CATALOG_SERVICE_PORT || process.env.PORT || 4001;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/cake_delight';

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/cakes', catalogRoutes);

// Root Service Info & Health check endpoints
app.get('/', (req, res) => {
  res.json({
    service: 'Cake Catalog Microservice',
    status: 'UP',
    port: PORT,
    description: 'Manages cake product catalog, details, categories, and price filtering',
    endpoints: {
      listCakes: '/api/cakes',
      categories: '/api/cakes/categories',
      singleCake: '/api/cakes/:id',
      health: '/health'
    }
  });
});

app.get('/health', (req, res) => {
  res.json({
    service: 'Cake Catalog Microservice',
    status: 'UP',
    timestamp: new Date().toISOString(),
    dbState: mongoose.connection.readyState === 1 ? 'CONNECTED' : 'DISCONNECTED'
  });
});

// Database connection & Server initialization
mongoose
  .connect(MONGO_URI)
  .then(async () => {
    console.log('✅ Catalog Service connected to MongoDB database');
    await seedDatabase();
    app.listen(PORT, () => {
      console.log(`🚀 Catalog Service running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('❌ Failed to connect to MongoDB in Catalog Service:', err.message);
    process.exit(1);
  });
