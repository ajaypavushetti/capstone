const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
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
    required: true
  },
  imageUrl: {
    type: String
  }
});

const orderSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
      index: true
    },
    customerName: {
      type: String,
      default: 'Valued Customer'
    },
    customerEmail: {
      type: String,
      default: 'customer@cakedelight.com'
    },
    deliveryAddress: {
      type: String,
      default: '123 Bakers Street, Suite 4'
    },
    items: [orderItemSchema],
    subtotal: {
      type: Number,
      required: true
    },
    tax: {
      type: Number,
      default: 0
    },
    deliveryFee: {
      type: Number,
      default: 0
    },
    totalAmount: {
      type: Number,
      required: true
    },
    status: {
      type: String,
      enum: ['PENDING', 'CONFIRMED', 'PREPARING', 'OUT_FOR_DELIVERY', 'COMPLETED', 'CANCELLED'],
      default: 'COMPLETED'
    },
    paymentMethod: {
      type: String,
      default: 'CREDIT_CARD'
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Order', orderSchema);
