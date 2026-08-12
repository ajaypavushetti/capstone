const mongoose = require('mongoose');

const cakeSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Cake name is required'],
      trim: true
    },
    description: {
      type: String,
      required: [true, 'Description is required']
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      enum: ['Chocolate', 'Fruit', 'Vanilla', 'Cheesecake', 'Red Velvet', 'Custom Special'],
      default: 'Chocolate'
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: [0, 'Price must be positive']
    },
    availability: {
      type: Boolean,
      default: true
    },
    imageUrl: {
      type: String,
      default: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=600&auto=format&fit=crop&q=60'
    },
    flavor: {
      type: String,
      default: 'Delicious Signature'
    },
    weightKg: {
      type: Number,
      default: 1.0
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Cake', cakeSchema);
