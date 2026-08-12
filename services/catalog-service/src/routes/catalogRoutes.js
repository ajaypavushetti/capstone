const express = require('express');
const router = express.Router();
const Cake = require('../models/Cake');

// GET /api/cakes - List all cakes with search, filter, and price range support
router.get('/', async (req, res) => {
  try {
    const { category, search, minPrice, maxPrice, availability } = req.query;
    const filter = {};

    if (category && category !== 'All') {
      filter.category = category;
    }

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { flavor: { $regex: search, $options: 'i' } }
      ];
    }

    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = Number(minPrice);
      if (maxPrice) filter.price.$lte = Number(maxPrice);
    }

    if (availability !== undefined) {
      filter.availability = availability === 'true';
    }

    const cakes = await Cake.find(filter).sort({ createdAt: -1 });
    res.json({
      success: true,
      count: cakes.length,
      data: cakes
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/cakes/categories - List available categories
router.get('/categories', async (req, res) => {
  try {
    const categories = await Cake.distinct('category');
    res.json({
      success: true,
      data: ['All', ...categories]
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/cakes/:id - Get detailed cake information
router.get('/:id', async (req, res) => {
  try {
    const cake = await Cake.findById(req.params.id);
    if (!cake) {
      return res.status(404).json({ success: false, message: 'Cake product not found' });
    }
    res.json({ success: true, data: cake });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/cakes - Create a new cake product
router.post('/', async (req, res) => {
  try {
    const newCake = new Cake(req.body);
    const savedCake = await newCake.save();
    res.status(201).json({ success: true, data: savedCake });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// PUT /api/cakes/:id - Update cake details
router.put('/:id', async (req, res) => {
  try {
    const updatedCake = await Cake.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });
    if (!updatedCake) {
      return res.status(404).json({ success: false, message: 'Cake product not found' });
    }
    res.json({ success: true, data: updatedCake });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// DELETE /api/cakes/:id - Remove a cake
router.delete('/:id', async (req, res) => {
  try {
    const cake = await Cake.findByIdAndDelete(req.params.id);
    if (!cake) {
      return res.status(404).json({ success: false, message: 'Cake product not found' });
    }
    res.json({ success: true, message: 'Cake deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
