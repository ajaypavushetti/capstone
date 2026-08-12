const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Rating = require('../models/Rating');

const memoryRatings = [];

// POST /api/ratings - Submit a new cake rating
router.post('/', async (req, res) => {
  try {
    const { cakeId, userId, userName, rating, comment } = req.body;

    if (!cakeId || !userId || !rating) {
      return res.status(400).json({ success: false, message: 'cakeId, userId, and rating are required fields' });
    }

    const ratingObj = {
      _id: `rat_${Date.now()}`,
      cakeId,
      userId,
      userName: userName || 'Satisfied Customer',
      rating: Number(rating),
      comment: comment || 'Awesome cake!',
      createdAt: new Date().toISOString()
    };

    if (mongoose.connection.readyState === 1) {
      const newRating = new Rating({
        cakeId,
        userId,
        userName: ratingObj.userName,
        rating: ratingObj.rating,
        comment: ratingObj.comment
      });
      const savedRating = await newRating.save();
      return res.status(201).json({ success: true, message: 'Rating submitted successfully', data: savedRating });
    }

    memoryRatings.unshift(ratingObj);
    res.status(201).json({ success: true, message: 'Rating submitted successfully (in-memory)', data: ratingObj });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// GET /api/ratings - List all ratings submitted across all cakes
router.get('/', async (req, res) => {
  try {
    if (mongoose.connection.readyState === 1) {
      const ratings = await Rating.find().sort({ createdAt: -1 });
      return res.json({ success: true, count: ratings.length, data: ratings });
    }
    res.json({ success: true, count: memoryRatings.length, data: memoryRatings });
  } catch (error) {
    res.json({ success: true, count: memoryRatings.length, data: memoryRatings });
  }
});

// GET /api/ratings/cake/:cakeId - Fetch all ratings for a given cake
router.get('/cake/:cakeId', async (req, res) => {
  try {
    const { cakeId } = req.params;
    if (mongoose.connection.readyState === 1) {
      const ratings = await Rating.find({ cakeId }).sort({ createdAt: -1 });
      return res.json({ success: true, count: ratings.length, data: ratings });
    }
    const filtered = memoryRatings.filter((r) => r.cakeId === cakeId);
    res.json({ success: true, count: filtered.length, data: filtered });
  } catch (error) {
    const filtered = memoryRatings.filter((r) => r.cakeId === req.params.cakeId);
    res.json({ success: true, count: filtered.length, data: filtered });
  }
});

// DELETE /api/ratings/clear-all - Clear all submitted ratings & reviews
router.delete('/clear-all', async (req, res) => {
  try {
    memoryRatings.length = 0;
    if (mongoose.connection.readyState === 1) {
      await Rating.deleteMany({});
    }
    res.json({ success: true, message: 'All ratings & reviews cleared successfully' });
  } catch (error) {
    res.json({ success: true, message: 'Ratings cleared (in-memory)' });
  }
});

// GET /api/ratings/cake/:cakeId/summary - Calculate & display average rating
router.get('/cake/:cakeId/summary', async (req, res) => {
  try {
    const { cakeId } = req.params;
    if (mongoose.connection.readyState === 1) {
      const stats = await Rating.aggregate([
        { $match: { cakeId } },
        {
          $group: {
            _id: '$cakeId',
            averageRating: { $avg: '$rating' },
            totalRatings: { $sum: 1 }
          }
        }
      ]);

      if (stats.length > 0) {
        return res.json({
          success: true,
          data: {
            cakeId,
            averageRating: Math.round(stats[0].averageRating * 10) / 10,
            totalRatings: stats[0].totalRatings
          }
        });
      }
    }

    const filtered = memoryRatings.filter((r) => r.cakeId === cakeId);
    if (filtered.length > 0) {
      const avg = filtered.reduce((s, r) => s + r.rating, 0) / filtered.length;
      return res.json({
        success: true,
        data: { cakeId, averageRating: Math.round(avg * 10) / 10, totalRatings: filtered.length }
      });
    }

    res.json({
      success: true,
      data: { cakeId, averageRating: 0, totalRatings: 0 }
    });
  } catch (error) {
    res.json({
      success: true,
      data: { cakeId: req.params.cakeId, averageRating: 0, totalRatings: 0 }
    });
  }
});

// GET /api/ratings/summaries - Bulk average ratings map for multiple cakes
router.get('/summaries', async (req, res) => {
  try {
    const summaryMap = {};
    if (mongoose.connection.readyState === 1) {
      const stats = await Rating.aggregate([
        {
          $group: {
            _id: '$cakeId',
            averageRating: { $avg: '$rating' },
            totalRatings: { $sum: 1 }
          }
        }
      ]);

      stats.forEach((s) => {
        summaryMap[s._id] = {
          averageRating: Math.round(s.averageRating * 10) / 10,
          totalRatings: s.totalRatings
        };
      });

      return res.json({ success: true, data: summaryMap });
    }

    // In-memory rating aggregation
    memoryRatings.forEach((r) => {
      if (!summaryMap[r.cakeId]) {
        summaryMap[r.cakeId] = { sum: 0, totalRatings: 0 };
      }
      summaryMap[r.cakeId].sum += r.rating;
      summaryMap[r.cakeId].totalRatings += 1;
    });

    Object.keys(summaryMap).forEach((id) => {
      summaryMap[id] = {
        averageRating: Math.round((summaryMap[id].sum / summaryMap[id].totalRatings) * 10) / 10,
        totalRatings: summaryMap[id].totalRatings
      };
    });

    res.json({ success: true, data: summaryMap });
  } catch (error) {
    res.json({ success: true, data: {} });
  }
});

module.exports = router;
