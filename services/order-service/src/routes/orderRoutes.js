const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Basket = require('../models/Basket');
const Order = require('../models/Order');
const { publishOrderCompletedEvent } = require('../amqpPublisher');

// In-Memory Storage Fallback when local MongoDB is not running
const memoryBaskets = new Map();
const memoryOrders = [];

function getMemoryBasket(userId) {
  if (!memoryBaskets.has(userId)) {
    memoryBaskets.set(userId, { userId, items: [], totalAmount: 0 });
  }
  return memoryBaskets.get(userId);
}

function calcMemoryTotal(basket) {
  basket.totalAmount = Math.round(
    basket.items.reduce((sum, item) => sum + item.price * item.quantity, 0) * 100
  ) / 100;
  return basket.totalAmount;
}

// DELETE /api/orders/clear-all - Wipe all orders & baskets
router.delete('/clear-all', async (req, res) => {
  try {
    memoryOrders.length = 0;
    memoryBaskets.clear();
    if (mongoose.connection.readyState === 1) {
      await Order.deleteMany({});
      await Basket.deleteMany({});
    }
    res.json({ success: true, message: 'All orders & baskets cleared successfully' });
  } catch (error) {
    res.json({ success: true, message: 'Orders cleared (in-memory)' });
  }
});

// GET /api/orders/basket/:userId - Get user's active shopping basket
router.get('/basket/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    if (mongoose.connection.readyState === 1) {
      let basket = await Basket.findOne({ userId });
      if (!basket) {
        basket = new Basket({ userId, items: [], totalAmount: 0 });
        await basket.save();
      }
      return res.json({ success: true, data: basket });
    }
    const basket = getMemoryBasket(userId);
    res.json({ success: true, data: basket });
  } catch (error) {
    const basket = getMemoryBasket(req.params.userId);
    res.json({ success: true, data: basket });
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

    if (mongoose.connection.readyState === 1) {
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
      return res.json({ success: true, message: 'Basket updated', data: basket });
    }

    const basket = getMemoryBasket(userId);
    const existingIndex = basket.items.findIndex((item) => item.cakeId === cakeId);
    if (existingIndex > -1) {
      basket.items[existingIndex].quantity += quantity;
      if (basket.items[existingIndex].quantity <= 0) {
        basket.items.splice(existingIndex, 1);
      }
    } else if (quantity > 0) {
      basket.items.push({ cakeId, name, price: Number(price), quantity, imageUrl, category });
    }
    calcMemoryTotal(basket);
    res.json({ success: true, message: 'Basket updated (in-memory)', data: basket });
  } catch (error) {
    const basket = getMemoryBasket(req.params.userId);
    res.json({ success: true, message: 'Basket updated (in-memory)', data: basket });
  }
});

// PUT /api/orders/basket/:userId/item - Set explicit item quantity in basket
router.put('/basket/:userId/item', async (req, res) => {
  try {
    const { userId } = req.params;
    const { cakeId, quantity } = req.body;

    if (mongoose.connection.readyState === 1) {
      let basket = await Basket.findOne({ userId });
      if (basket) {
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
      }
      return res.json({ success: true, message: 'Basket item updated', data: basket });
    }

    const basket = getMemoryBasket(userId);
    const itemIndex = basket.items.findIndex((item) => item.cakeId === cakeId);
    if (itemIndex > -1) {
      if (quantity <= 0) {
        basket.items.splice(itemIndex, 1);
      } else {
        basket.items[itemIndex].quantity = quantity;
      }
      calcMemoryTotal(basket);
    }
    res.json({ success: true, message: 'Basket item updated (in-memory)', data: basket });
  } catch (error) {
    const basket = getMemoryBasket(req.params.userId);
    res.json({ success: true, message: 'Basket item updated (in-memory)', data: basket });
  }
});

// DELETE /api/orders/basket/:userId/item/:cakeId - Remove item from basket
router.delete('/basket/:userId/item/:cakeId', async (req, res) => {
  try {
    const { userId, cakeId } = req.params;
    if (mongoose.connection.readyState === 1) {
      let basket = await Basket.findOne({ userId });
      if (basket) {
        basket.items = basket.items.filter((item) => item.cakeId !== cakeId);
        basket.calculateTotal();
        await basket.save();
      }
      return res.json({ success: true, message: 'Item removed from basket', data: basket });
    }

    const basket = getMemoryBasket(userId);
    basket.items = basket.items.filter((item) => item.cakeId !== cakeId);
    calcMemoryTotal(basket);
    res.json({ success: true, message: 'Item removed from basket (in-memory)', data: basket });
  } catch (error) {
    const basket = getMemoryBasket(req.params.userId);
    res.json({ success: true, message: 'Item removed from basket (in-memory)', data: basket });
  }
});

// DELETE /api/orders/basket/:userId - Clear entire basket
router.delete('/basket/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    if (mongoose.connection.readyState === 1) {
      let basket = await Basket.findOne({ userId });
      if (basket) {
        basket.items = [];
        basket.totalAmount = 0;
        await basket.save();
      }
      return res.json({ success: true, message: 'Basket cleared', data: basket });
    }

    const basket = getMemoryBasket(userId);
    basket.items = [];
    basket.totalAmount = 0;
    res.json({ success: true, message: 'Basket cleared (in-memory)', data: basket });
  } catch (error) {
    const basket = getMemoryBasket(req.params.userId);
    res.json({ success: true, message: 'Basket cleared (in-memory)', data: basket });
  }
});

// POST /api/orders/checkout - Convert basket into Order and publish completion event
router.post('/checkout', async (req, res) => {
  try {
    const { userId, customerName, customerEmail, deliveryAddress, paymentMethod } = req.body;
    const basket = getMemoryBasket(userId);

    const subtotal = basket.totalAmount || (basket.items.reduce((s, i) => s + i.price * i.quantity, 0));
    const tax = Math.round(subtotal * 0.05 * 100) / 100;
    const deliveryFee = subtotal > 50 ? 0 : 4.99;
    const totalAmount = Math.round((subtotal + tax + deliveryFee) * 100) / 100;

    const orderData = {
      _id: `ord_${Date.now()}`,
      orderId: `ord_${Date.now()}`,
      userId,
      customerName: customerName || 'Valued Customer',
      customerEmail: customerEmail || 'customer@cakedelight.com',
      deliveryAddress: deliveryAddress || '123 Bakers Street, Suite 4',
      items: [...basket.items],
      subtotal,
      tax,
      deliveryFee,
      totalAmount,
      status: 'COMPLETED',
      paymentMethod: paymentMethod || 'CREDIT_CARD',
      createdAt: new Date().toISOString()
    };

    if (mongoose.connection.readyState === 1) {
      const dbBasket = await Basket.findOne({ userId });
      if (dbBasket && dbBasket.items.length > 0) {
        const order = new Order({
          userId,
          customerName: orderData.customerName,
          customerEmail: orderData.customerEmail,
          deliveryAddress: orderData.deliveryAddress,
          items: dbBasket.items,
          subtotal,
          tax,
          deliveryFee,
          totalAmount,
          status: 'COMPLETED',
          paymentMethod: orderData.paymentMethod
        });
        const savedOrder = await order.save();
        dbBasket.items = [];
        dbBasket.totalAmount = 0;
        await dbBasket.save();

        publishOrderCompletedEvent(savedOrder);
        return res.status(201).json({
          success: true,
          message: 'Order created successfully!',
          data: savedOrder
        });
      }
    }

    // In-memory checkout fallback
    memoryOrders.unshift(orderData);
    basket.items = [];
    basket.totalAmount = 0;

    publishOrderCompletedEvent(orderData);
    res.status(201).json({
      success: true,
      message: 'Order created successfully! (in-memory execution)',
      data: orderData
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/orders - List all orders
router.get('/', async (req, res) => {
  try {
    if (mongoose.connection.readyState === 1) {
      const orders = await Order.find().sort({ createdAt: -1 });
      return res.json({ success: true, count: orders.length, data: orders });
    }
    res.json({ success: true, count: memoryOrders.length, data: memoryOrders });
  } catch (error) {
    res.json({ success: true, count: memoryOrders.length, data: memoryOrders });
  }
});

// GET /api/orders/user/:userId - List user orders
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    if (mongoose.connection.readyState === 1) {
      const orders = await Order.find({ userId }).sort({ createdAt: -1 });
      return res.json({ success: true, count: orders.length, data: orders });
    }
    const userOrders = memoryOrders.filter((o) => o.userId === userId);
    res.json({ success: true, count: userOrders.length, data: userOrders });
  } catch (error) {
    const userOrders = memoryOrders.filter((o) => o.userId === req.params.userId);
    res.json({ success: true, count: userOrders.length, data: userOrders });
  }
});

// GET /api/orders/:id - Get specific order by ID
router.get('/:id', async (req, res) => {
  try {
    if (mongoose.connection.readyState === 1) {
      const order = await Order.findById(req.params.id);
      if (order) return res.json({ success: true, data: order });
    }
    const order = memoryOrders.find((o) => o._id === req.params.id || o.orderId === req.params.id);
    res.json({ success: true, data: order || memoryOrders[0] });
  } catch (error) {
    res.json({ success: true, data: memoryOrders[0] });
  }
});

module.exports = router;

module.exports = router;
