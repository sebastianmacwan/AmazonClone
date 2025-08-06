// routes/cart.js
const express = require('express');
const router = express.Router();
const Cart = require('../models/Cart');
const mongoose = require('mongoose');

// Middleware to get and validate user_id
const authenticateUser = (req, res, next) => {
    const user_id =
        req.method === 'POST' || req.method === 'PUT'
            ? req.body?.user_id
            : req.query?.user_id;

    if (!user_id || !mongoose.Types.ObjectId.isValid(user_id)) {
        return res.status(401).json({ message: 'Unauthorized: Invalid user ID is required.' });
    }

    req.userId = new mongoose.Types.ObjectId(user_id);
    next();
};

// --- Add product to cart ---
router.post('/add', authenticateUser, async (req, res) => {
    const { product_title, product_image, product_desc, product_price, quantity } = req.body;
    const user_id = req.userId;

    try {
        let cart = await Cart.findOne({ user_id });

        if (!cart) {
            cart = new Cart({ user_id, items: [] });
        }

        const existingItem = cart.items.find(item => item.product_title === product_title);

        if (existingItem) {
            existingItem.quantity += quantity;
            existingItem.added_at = new Date();
        } else {
            cart.items.push({
                product_title,
                product_image,
                product_desc,
                product_price,
                quantity
            });
        }

        await cart.save();
        res.status(200).json({ message: 'Cart updated successfully!', cart });
    } catch (err) {
        console.error('Add to cart error:', err.message);
        res.status(500).json({ message: 'Server error while adding to cart.', error: err.message });
    }
});

// --- Get all cart items ---
router.get('/', authenticateUser, async (req, res) => {
    const user_id = req.userId;

    try {
        const cart = await Cart.findOne({ user_id });

        if (!cart) {
            return res.status(200).json({ message: 'Cart is empty.', cartItems: [] });
        }

        res.status(200).json({ message: 'Cart retrieved.', cartItems: cart.items });
    } catch (err) {
        console.error('Get cart error:', err.message);
        res.status(500).json({ message: 'Server error retrieving cart.', error: err.message });
    }
});

// --- Remove an item from cart ---
router.delete('/remove/:cartItemId', authenticateUser, async (req, res) => {
    const { cartItemId } = req.params;
    const user_id = req.userId;

    // Validate if the provided ID is a valid MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(cartItemId)) {
        return res.status(400).json({ message: 'Invalid cart item ID.' });
    }

    try {
        // Use $pull to remove the item from the array
        const result = await Cart.updateOne(
            { user_id: user_id },
            { $pull: { items: { _id: new mongoose.Types.ObjectId(cartItemId) } } }
        );

        if (result.modifiedCount === 0) {
            return res.status(404).json({ message: 'Item not found in cart.' });
        }

        res.status(200).json({ message: 'Item removed from cart.' });
    } catch (err) {
        console.error('Remove from cart error:', err.message);
        res.status(500).json({ message: 'Server error removing item.', error: err.message });
    }
});

// --- Update item quantity ---
router.put('/update/:cartItemId', authenticateUser, async (req, res) => {
    const { cartItemId } = req.params;
    const { quantity } = req.body;
    const user_id = req.userId;

    if (!mongoose.Types.ObjectId.isValid(cartItemId)) {
        return res.status(400).json({ message: 'Invalid cart item ID.' });
    }

    try {
        const result = await Cart.updateOne(
            { user_id: user_id, 'items._id': new mongoose.Types.ObjectId(cartItemId) },
            { $set: { 'items.$.quantity': quantity, 'items.$.added_at': new Date() } }
        );

        if (result.modifiedCount === 0) {
            return res.status(404).json({ message: 'Item not found in cart.' });
        }
        
        res.status(200).json({ message: 'Cart item updated.' });
    } catch (err) {
        console.error('Update cart error:', err.message);
        res.status(500).json({ message: 'Server error updating cart.', error: err.message });
    }
});

module.exports = router;