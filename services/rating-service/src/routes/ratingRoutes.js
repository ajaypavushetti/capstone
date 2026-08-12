const express = require('express');
const router = express.Router();
const Rating = require('../models/Rating');

// POST /api/ratings - Submit a new cake rating
router.post('/', async (req, res) => {
  try {
    const { cakeId, userId, userName, rating, comment } = req.body;

    if (!cakeId || !userId || !rating) {
      return res.status(400).json({ success: false, message: 'cakeId, userId, and rating are required fields' });
    }

    const newRating = new Rating({
      cakeId,
      userId,
      userName: userName || 'Satisfied Customer',
      rating: Number(rating),
      comment: comment || 'Awesome cake!'
    });

    const savedRating = await newRating.save();
    res.status(201).json({ success: true, message: 'Rating submitted successfully', data: savedRating });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// GET /api/ratings - List all ratings submitted across all cakes
router.get('/', async (req, res) => {
  try {
    const ratings = await Rating.find().sort({ createdAt: -1 });
    res.json({ success: true, count: ratings.length, data: ratings });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/ratings/cake/:cakeId - Fetch all ratings for a given cake
router.get('/cake/:cakeId', async (req, res) => {
  try {
    const { cakeId } = req.params;
    const ratings = await Rating.find({ cakeId }).sort({ createdAt: -1 });
    res.json({ success: true, count: ratings.length, data: ratings });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/ratings/cake/:cakeId/summary - Calculate & display average rating
router.get('/cake/:cakeId/summary', async (req, res) => {
  try {
    const { cakeId } = req.params;
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

    if (stats.length === 0) {
      return res.json({
        success: true,
        data: {
          cakeId,
          averageRating: 4.8, // Default baseline for demonstration
          totalRatings: 1
        }
      });
    }

    res.json({
      success: true,
      data: {
        cakeId,
        averageRating: Math.round(stats[0].averageRating * 10) / 10,
        totalRatings: stats[0].totalRatings
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/ratings/summaries - Bulk average ratings map for multiple cakes
router.get('/summaries', async (req, res) => {
  try {
    const stats = await Rating.aggregate([
      {
        $group: {
          _id: '$cakeId',
          averageRating: { $avg: '$rating' },
          totalRatings: { $sum: 1 }
        }
      }
    ]);

    const summaryMap = {};
    stats.forEach((s) => {
      summaryMap[s._id] = {
        averageRating: Math.round(s.averageRating * 10) / 10,
        totalRatings: s.totalRatings
      };
    });

    res.json({ success: true, data: summaryMap });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
