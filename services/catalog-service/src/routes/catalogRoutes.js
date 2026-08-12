const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Cake = require('../models/Cake');
const { initialCakes } = require('../seedData');

function filterMemoryCakes({ category, search, minPrice, maxPrice, availability }) {
  return initialCakes.filter((cake) => {
    if (category && category !== 'All' && cake.category !== category) return false;
    if (search) {
      const q = search.toLowerCase();
      const match =
        cake.name.toLowerCase().includes(q) ||
        cake.description.toLowerCase().includes(q) ||
        cake.flavor.toLowerCase().includes(q);
      if (!match) return false;
    }
    if (minPrice && cake.price < Number(minPrice)) return false;
    if (maxPrice && cake.price > Number(maxPrice)) return false;
    if (availability !== undefined && String(cake.availability) !== String(availability)) return false;
    return true;
  });
}

// GET /api/cakes - List all cakes with search, filter, and price range support
router.get('/', async (req, res) => {
  try {
    const { category, search, minPrice, maxPrice, availability } = req.query;

    if (mongoose.connection.readyState === 1) {
      const filter = {};
      if (category && category !== 'All') filter.category = category;
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
      return res.json({ success: true, count: cakes.length, data: cakes });
    } else {
      const memoryCakes = filterMemoryCakes({ category, search, minPrice, maxPrice, availability });
      return res.json({ success: true, count: memoryCakes.length, data: memoryCakes });
    }
  } catch (error) {
    const memoryCakes = filterMemoryCakes(req.query);
    res.json({ success: true, count: memoryCakes.length, data: memoryCakes });
  }
});

// GET /api/cakes/categories - List available categories
router.get('/categories', async (req, res) => {
  try {
    if (mongoose.connection.readyState === 1) {
      const categories = await Cake.distinct('category');
      return res.json({ success: true, data: ['All', ...categories] });
    }
    const categories = Array.from(new Set(initialCakes.map((c) => c.category)));
    res.json({ success: true, data: ['All', ...categories] });
  } catch (error) {
    const categories = Array.from(new Set(initialCakes.map((c) => c.category)));
    res.json({ success: true, data: ['All', ...categories] });
  }
});

// GET /api/cakes/:id - Get detailed cake information
router.get('/:id', async (req, res) => {
  try {
    if (mongoose.connection.readyState === 1) {
      const cake = await Cake.findById(req.params.id);
      if (cake) return res.json({ success: true, data: cake });
    }
    const cake =
      initialCakes.find(
        (c) => c._id === req.params.id || c.name.toLowerCase() === req.params.id.toLowerCase()
      ) || initialCakes[0];
    res.json({ success: true, data: cake });
  } catch (error) {
    res.json({ success: true, data: initialCakes[0] });
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
