const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const notificationRoutes = require('./routes/notificationRoutes');
const { startAMQPConsumer } = require('./amqpConsumer');

const app = express();
const PORT = process.env.NOTIFICATION_SERVICE_PORT || process.env.PORT || 4004;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/cake_delight';

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/notifications', notificationRoutes);

// Root Service Info & Health check endpoints
app.get('/', (req, res) => {
  res.json({
    service: 'Notification Microservice',
    status: 'UP',
    port: PORT,
    description: 'Ingests ORDER_COMPLETED events via RabbitMQ AMQP & Webhook, handles multi-channel delivery (In-App, Email, SMS)',
    endpoints: {
      allNotifications: '/api/notifications',
      userNotifications: '/api/notifications/user/:userId',
      eventWebhook: '/api/notifications/event',
      markRead: '/api/notifications/:id/read',
      markAllRead: '/api/notifications/user/:userId/read-all',
      health: '/health'
    }
  });
});

app.get('/health', (req, res) => {
  res.json({
    service: 'Notification Microservice',
    status: 'UP',
    timestamp: new Date().toISOString(),
    dbState: mongoose.connection.readyState === 1 ? 'CONNECTED' : 'DISCONNECTED'
  });
});

// Database connection & Server initialization
mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log('✅ Notification Service connected to MongoDB database');
    app.listen(PORT, () => {
      console.log(`🚀 Notification Service running on port ${PORT}`);
      // Start RabbitMQ AMQP Consumer
      startAMQPConsumer();
    });
  })
  .catch((err) => {
    console.error('❌ Failed to connect to MongoDB in Notification Service:', err.message);
    process.exit(1);
  });
