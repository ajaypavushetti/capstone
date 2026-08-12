const mongoose = require('mongoose');

const basketItemSchema = new mongoose.Schema({
  cakeId: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: [1, 'Quantity must be at least 1'],
    default: 1
  },
  imageUrl: {
    type: String
  },
  category: {
    type: String
  }
});

const basketSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    items: [basketItemSchema],
    totalAmount: {
      type: Number,
      default: 0
    }
  },
  { timestamps: true }
);

basketSchema.methods.calculateTotal = function () {
  this.totalAmount = this.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  return this.totalAmount;
};

module.exports = mongoose.model('Basket', basketSchema);
