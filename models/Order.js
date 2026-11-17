const mongoose = require('mongoose');

const OrderItemSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
  customId: { type: String },
  name: { type: String, required: true },
  price: { type: Number, required: true },
  qty: { type: Number, required: true },
  image: { type: String },
  category: { type: String }
});

const OrderSchema = new mongoose.Schema({
  orderNumber: { type: String, required: true, unique: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  items: [OrderItemSchema],
  subtotal: { type: Number, required: true },
  discount: { type: Number, default: 0 },
  couponCode: { type: String },
  shippingFee: { type: Number, default: 0 },
  total: { type: Number, required: true },
  address: {
    fullName: { type: String, required: true },
    phone: { type: String, required: true },
    street: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    pincode: { type: String, required: true }
  },
  paymentMethod: { type: String, enum: ['COD', 'UPI', 'Card'], default: 'COD' },
  paymentStatus: { type: String, enum: ['Paid', 'Pending'], default: 'Pending' },
  status: { type: String, enum: ['Confirmed', 'Handcrafting', 'Shipped', 'Delivered'], default: 'Confirmed' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Order', OrderSchema);
