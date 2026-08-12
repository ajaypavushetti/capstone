const mongoose = require('mongoose');

const ratingSchema = new mongoose.Schema(
  {
    cakeId: {
      type: String,
      required: [true, 'cakeId is required'],
      index: true
    },
    userId: {
      type: String,
      required: [true, 'userId is required']
    },
    userName: {
      type: String,
      default: 'Anonymous Baker'
    },
    rating: {
      type: Number,
      required: [true, 'Rating value (1-5) is required'],
      min: [1, 'Rating must be at least 1'],
      max: [5, 'Rating cannot exceed 5']
    },
    comment: {
      type: String,
      trim: true,
      default: 'Delightful taste!'
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Rating', ratingSchema);
