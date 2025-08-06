const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  title: { type: String, required: true },
  image: String,
  description: String,
  price: { type: Number, required: true },
  category: String,
  created_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Product', productSchema);
