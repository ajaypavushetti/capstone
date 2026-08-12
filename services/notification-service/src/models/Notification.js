const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
      index: true
    },
    orderId: {
      type: String,
      required: true
    },
    title: {
      type: String,
      default: '🎂 Order Confirmed!'
    },
    message: {
      type: String,
      required: true
    },
    channel: {
      type: String,
      enum: ['IN_APP', 'EMAIL', 'SMS'],
      default: 'IN_APP'
    },
    deliveryStatus: {
      type: String,
      enum: ['PENDING', 'SENT', 'DELIVERED', 'FAILED'],
      default: 'DELIVERED'
    },
    isRead: {
      type: Boolean,
      default: false
    },
    eventData: {
      type: mongoose.Schema.Types.Mixed
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Notification', notificationSchema);
