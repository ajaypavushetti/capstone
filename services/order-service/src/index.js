const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const orderRoutes = require('./routes/orderRoutes');

const app = express();
const PORT = process.env.ORDER_SERVICE_PORT || process.env.PORT || 4002;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/cake_delight';

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/orders', orderRoutes);

// Root Service Info & Health check endpoints
app.get('/', (req, res) => {
  res.json({
    service: 'Order Microservice',
    status: 'UP',
    port: PORT,
    description: 'Manages shopping basket (+/- quantity), checkout execution, order totals, and event publishing',
    endpoints: {
      getBasket: '/api/orders/basket/:userId',
      checkout: '/api/orders/checkout',
      userOrders: '/api/orders/user/:userId',
      allOrders: '/api/orders',
      health: '/health'
    }
  });
});

app.get('/health', (req, res) => {
  res.json({
    service: 'Order Microservice',
    status: 'UP',
    timestamp: new Date().toISOString(),
    dbState: mongoose.connection.readyState === 1 ? 'CONNECTED' : 'DISCONNECTED'
  });
});

// Database connection & Server initialization with auto-retry
async function connectDBWithRetry() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Order Service connected to MongoDB database');
  } catch (err) {
    console.error('❌ Failed to connect to MongoDB in Order Service:', err.message);
    console.log('⚠️ Retrying MongoDB connection in 10 seconds...');
    setTimeout(connectDBWithRetry, 10000);
  }
}

app.listen(PORT, () => {
  console.log(`🚀 Order Service running on port ${PORT}`);
  connectDBWithRetry();
});
