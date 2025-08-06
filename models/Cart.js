// models/Cart.js
const mongoose = require('mongoose');

const cartItemSchema = new mongoose.Schema({
  product_title: String,
  product_image: String,
  product_desc: String,
  product_price: Number,
  quantity: Number,
  added_at: { type: Date, default: Date.now }
});

const cartSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  items: [cartItemSchema]
});

module.exports = mongoose.model('Cart', cartSchema);
