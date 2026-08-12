const express = require('express');
const router = express.Router();
const Basket = require('../models/Basket');
const Order = require('../models/Order');
const { publishOrderCompletedEvent } = require('../amqpPublisher');

// GET /api/orders/basket/:userId - Get user's active shopping basket
router.get('/basket/:userId', async (req, res) => {
  try {
    const mongoose = require('mongoose');
    const { userId } = req.params;
    if (mongoose.connection.readyState === 1) {
      let basket = await Basket.findOne({ userId });
      if (!basket) {
        basket = new Basket({ userId, items: [], totalAmount: 0 });
        await basket.save();
      }
      return res.json({ success: true, data: basket });
    }
    res.json({ success: true, data: { userId, items: [], totalAmount: 0 } });
  } catch (error) {
    res.json({ success: true, data: { userId: req.params.userId, items: [], totalAmount: 0 } });
  }
});

// POST /api/orders/basket/:userId - Add or update item in basket
router.post('/basket/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { cakeId, name, price, quantity = 1, imageUrl, category } = req.body;

    if (!cakeId || !name || price === undefined) {
      return res.status(400).json({ success: false, message: 'cakeId, name, and price are required' });
    }

    let basket = await Basket.findOne({ userId });
    if (!basket) {
      basket = new Basket({ userId, items: [] });
    }

    const existingItemIndex = basket.items.findIndex((item) => item.cakeId === cakeId);

    if (existingItemIndex > -1) {
      basket.items[existingItemIndex].quantity += quantity;
      if (basket.items[existingItemIndex].quantity <= 0) {
        basket.items.splice(existingItemIndex, 1);
      }
    } else if (quantity > 0) {
      basket.items.push({ cakeId, name, price, quantity, imageUrl, category });
    }

    basket.calculateTotal();
    await basket.save();

    res.json({ success: true, message: 'Basket updated', data: basket });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// PUT /api/orders/basket/:userId/item - Set explicit item quantity in basket
router.put('/basket/:userId/item', async (req, res) => {
  try {
    const { userId } = req.params;
    const { cakeId, quantity } = req.body;

    let basket = await Basket.findOne({ userId });
    if (!basket) {
      return res.status(404).json({ success: false, message: 'Basket not found' });
    }

    const itemIndex = basket.items.findIndex((item) => item.cakeId === cakeId);
    if (itemIndex > -1) {
      if (quantity <= 0) {
        basket.items.splice(itemIndex, 1);
      } else {
        basket.items[itemIndex].quantity = quantity;
      }
      basket.calculateTotal();
      await basket.save();
    }

    res.json({ success: true, message: 'Basket item updated', data: basket });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// DELETE /api/orders/basket/:userId/item/:cakeId - Remove item from basket
router.delete('/basket/:userId/item/:cakeId', async (req, res) => {
  try {
    const { userId, cakeId } = req.params;
    let basket = await Basket.findOne({ userId });
    if (basket) {
      basket.items = basket.items.filter((item) => item.cakeId !== cakeId);
      basket.calculateTotal();
      await basket.save();
    }
    res.json({ success: true, message: 'Item removed from basket', data: basket });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// DELETE /api/orders/basket/:userId - Clear entire basket
router.delete('/basket/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    let basket = await Basket.findOne({ userId });
    if (basket) {
      basket.items = [];
      basket.totalAmount = 0;
      await basket.save();
    }
    res.json({ success: true, message: 'Basket cleared', data: basket });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/orders/checkout - Convert basket into Order and publish completion event
router.post('/checkout', async (req, res) => {
  try {
    const { userId, customerName, customerEmail, deliveryAddress, paymentMethod } = req.body;

    if (!userId) {
      return res.status(400).json({ success: false, message: 'userId is required for checkout' });
    }

    const basket = await Basket.findOne({ userId });
    if (!basket || basket.items.length === 0) {
      return res.status(400).json({ success: false, message: 'Shopping basket is empty' });
    }

    const subtotal = basket.calculateTotal();
    const tax = Math.round(subtotal * 0.05 * 100) / 100; // 5% tax
    const deliveryFee = subtotal > 50 ? 0 : 4.99; // Free delivery over $50
    const totalAmount = Math.round((subtotal + tax + deliveryFee) * 100) / 100;

    const order = new Order({
      userId,
      customerName: customerName || 'Valued Customer',
      customerEmail: customerEmail || 'customer@cakedelight.com',
      deliveryAddress: deliveryAddress || '123 Bakers Street, Suite 4',
      items: basket.items,
      subtotal,
      tax,
      deliveryFee,
      totalAmount,
      status: 'COMPLETED',
      paymentMethod: paymentMethod || 'CREDIT_CARD'
    });

    const savedOrder = await order.save();

    // Clear user's basket
    basket.items = [];
    basket.totalAmount = 0;
    await basket.save();

    // Publish ORDER_COMPLETED event asynchronously
    publishOrderCompletedEvent(savedOrder);

    res.status(201).json({
      success: true,
      message: 'Order created successfully! Order completion event published.',
      data: savedOrder
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/orders - List all orders across all users
router.get('/', async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 });
    res.json({ success: true, count: orders.length, data: orders });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/orders/user/:userId - List user orders
router.get('/user/:userId', async (req, res) => {
  try {
    const mongoose = require('mongoose');
    if (mongoose.connection.readyState === 1) {
      const orders = await Order.find({ userId: req.params.userId }).sort({ createdAt: -1 });
      return res.json({ success: true, count: orders.length, data: orders });
    }
    res.json({ success: true, count: 0, data: [] });
  } catch (error) {
    res.json({ success: true, count: 0, data: [] });
  }
});


// GET /api/orders/:id - Get specific order by ID
router.get('/:id', async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }
    res.json({ success: true, data: order });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
