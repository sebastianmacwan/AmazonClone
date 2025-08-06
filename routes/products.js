const express = require('express');
const router = express.Router();
const Product = require('../models/Product'); // import Mongoose model

// Get all products
router.get('/products', async (req, res) => {
  try {
    const products = await Product.find().sort({ created_at: -1 });

    if (products.length === 0) {
      return res.status(200).json({
        message: 'No products available at the moment.',
        products: []
      });
    }

    res.status(200).json({
      message: 'Products retrieved successfully!',
      products
    });
  } catch (err) {
    console.error('MongoDB error in /api/products:', err.message);
    res.status(500).json({
      message: 'Server error while fetching products.',
      error: err.message
    });
  }
});

module.exports = router;
