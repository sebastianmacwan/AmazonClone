// routes/admin.js
const express = require('express');
const router = express.Router();
const Product = require('../models/Product');

// Add a product (POST /api/admin/add-product)
const { verifyAdmin } = require('../middlewares/auth');

router.post('/admin/add-product', verifyAdmin, async (req, res) => {

    const { title, image, description, price, category } = req.body;

    if (!title || !price) {
        return res.status(400).json({ message: 'Title and Price are required.' });
    }

    try {
        const newProduct = new Product({
            title,
            image: image || null,
            description: description || '',
            price: parseFloat(price),
            category: category || ''
        });

        const saved = await newProduct.save();

        res.status(201).json({ message: 'Product added successfully!', product: saved });
    } catch (err) {
        console.error('Error adding product:', err.message);
        res.status(500).json({ message: 'Failed to add product.', error: err.message });
    }
});

module.exports = router;
