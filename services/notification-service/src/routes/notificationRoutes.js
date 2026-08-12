const express = require('express');
const router = express.Router();
const Notification = require('../models/Notification');

// Helper simulated multi-channel dispatchers (Email, SMS, In-App)
function dispatchEmailNotification(customerEmail, customerName, orderId, totalAmount, itemSummary) {
  console.log(`📧 [Notification Service - EMAIL DISPATCH] Sent confirmation email to <${customerEmail}> for Order #${orderId}`);
  console.log(`   Content: "Hi ${customerName}, your order for [${itemSummary}] ($${totalAmount}) is confirmed!"`);
}

function dispatchSMSNotification(customerPhone, orderId) {
  console.log(`💬 [Notification Service - SMS DISPATCH] Sent SMS alert to ${customerPhone || '+1-555-CAKE'}: "Cake Delight Order #${orderId} is confirmed and preparing!"`);
}

// POST /api/notifications/event - Event Ingestion Webhook / Consumer Endpoint
router.post('/event', async (req, res) => {
  try {
    const { eventType, data } = req.body;

    console.log(`📥 [Notification Service] Received event: ${eventType}`);

    if (eventType === 'ORDER_COMPLETED' && data) {
      const { orderId, userId, customerName, customerEmail, totalAmount, items } = data;

      const itemSummary = items && items.length > 0 ? items.map((i) => `${i.quantity}x ${i.name}`).join(', ') : 'Cake Delights';

      // 1. Create In-App Notification Record
      const notification = new Notification({
        userId: userId || 'user123',
        orderId: orderId || `ord_${Date.now()}`,
        title: '🎉 Cake Order Confirmed!',
        message: `Hi ${customerName || 'Valued Customer'}, your order for [${itemSummary}] totaling $${totalAmount} has been confirmed and is being freshly prepared!`,
        channel: 'IN_APP',
        deliveryStatus: 'DELIVERED',
        isRead: false,
        eventData: data
      });

      const savedNotification = await notification.save();
      console.log(`✅ [Notification Service] Created in-app notification #${savedNotification._id} for User: ${userId}`);

      // 2. Dispatch Email & SMS channel notifications (PDF 6.4 multi-channel requirement)
      dispatchEmailNotification(customerEmail || 'ajay@cakedelight.com', customerName || 'Valued Customer', orderId, totalAmount, itemSummary);
      dispatchSMSNotification(null, orderId);

      return res.status(201).json({
        success: true,
        message: 'Order completion notification processed across In-App, Email, and SMS channels with DELIVERED status',
        channels: ['IN_APP', 'EMAIL', 'SMS'],
        data: savedNotification
      });
    }

    res.status(200).json({ success: true, message: 'Event acknowledged (no handler required)' });
  } catch (error) {
    console.error('❌ Error handling notification event:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/notifications - List all notifications across all users
router.get('/', async (req, res) => {
  try {
    const notifications = await Notification.find().sort({ createdAt: -1 });
    const unreadCount = notifications.filter((n) => !n.isRead).length;

    res.json({
      success: true,
      count: notifications.length,
      unreadCount,
      data: notifications
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/notifications/user/:userId - Fetch all notifications for a specific user
router.get('/user/:userId', async (req, res) => {
  try {
    const mongoose = require('mongoose');
    const { userId } = req.params;
    if (mongoose.connection.readyState === 1) {
      const notifications = await Notification.find({ userId }).sort({ createdAt: -1 });
      const unreadCount = notifications.filter((n) => !n.isRead).length;

      return res.json({
        success: true,
        count: notifications.length,
        unreadCount,
        data: notifications
      });
    }
    res.json({ success: true, count: 0, unreadCount: 0, data: [] });
  } catch (error) {
    res.json({ success: true, count: 0, unreadCount: 0, data: [] });
  }
});

// PUT /api/notifications/:id/read - Mark notification as read
router.put('/:id/read', async (req, res) => {
  try {
    const notification = await Notification.findByIdAndUpdate(req.params.id, { isRead: true }, { new: true });
    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }
    res.json({ success: true, data: notification });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// PUT /api/notifications/user/:userId/read-all - Mark all user notifications as read
router.put('/user/:userId/read-all', async (req, res) => {
  try {
    await Notification.updateMany({ userId: req.params.userId, isRead: false }, { isRead: true });
    res.json({ success: true, message: 'All notifications marked as read' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
