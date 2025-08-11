// // routes/admin.js
// const express = require('express');
// const router = express.Router();
// const Product = require('../models/Product');

// // Add a product (POST /api/admin/add-product)
// const { verifyAdmin } = require('../middlewares/auth');

// router.post('/admin/add-product', verifyAdmin, async (req, res) => {

//     const { title, image, description, price, category } = req.body;

//     if (!title || !price) {
//         return res.status(400).json({ message: 'Title and Price are required.' });
//     }

//     try {
//         const newProduct = new Product({
//             title,
//             image: image || null,
//             description: description || '',
//             price: parseFloat(price),
//             category: category || ''
//         });

//         const saved = await newProduct.save();

//         res.status(201).json({ message: 'Product added successfully!', product: saved });
//     } catch (err) {
//         console.error('Error adding product:', err.message);
//         res.status(500).json({ message: 'Failed to add product.', error: err.message });
//     }
// });

// module.exports = router;

// routes/admin.js
//11/08/2025 updated code
// const express = require('express');
// const router = express.Router();
// const Product = require('../models/Product');
// const multer = require('multer');

// // Configure multer for file uploads
// const storage = multer.diskStorage({
//   destination: function (req, file, cb) {
//     cb(null, 'uploads/'); // Make sure this directory exists
//   },
//   filename: function (req, file, cb) {
//     cb(null, Date.now() + '-' + file.originalname);
//   }
// });

// const upload = multer({ storage: storage });

// // The `verifyAdmin` middleware has been removed.
// // The route is now accessible without a token.
// router.post('/admin/add-product', upload.single('imageFile'), async (req, res) => {
//     try {
//         const { title, description, price, category, imageUrl } = req.body;

//         if (!title || !price) {
//             return res.status(400).json({ message: 'Title and Price are required.' });
//         }

//         let imagePath = '';

//         if (req.file) {
//             imagePath = req.file.path;
//         } else if (imageUrl) {
//             imagePath = imageUrl;
//         } else {
//             imagePath = null;
//         }

//         const newProduct = new Product({
//             title,
//             image: imagePath,
//             description: description || '',
//             price: parseFloat(price),
//             category: category || ''
//         });

//         const saved = await newProduct.save();

//         res.status(201).json({ message: 'Product added successfully!', product: saved });
//     } catch (err) {
//         console.error('Error adding product:', err);
//         res.status(500).json({ message: 'Failed to add product.', error: err.message });
//     }
// });

// module.exports = router;

// manage products
// routes/admin.js
const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const multer = require('multer');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/'); // Make sure this directory exists
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ storage: storage });

// The `verifyAdmin` middleware has been removed.
// The route is now accessible without a token.
router.post('/admin/add-product', upload.single('imageFile'), async (req, res) => {
    try {
        const { title, description, price, category, imageUrl } = req.body;

        if (!title || !price) {
            return res.status(400).json({ message: 'Title and Price are required.' });
        }

        let imagePath = '';

        if (req.file) {
            imagePath = req.file.path;
        } else if (imageUrl) {
            imagePath = imageUrl;
        } else {
            imagePath = null;
        }

        const newProduct = new Product({
            title,
            image: imagePath,
            description: description || '',
            price: parseFloat(price),
            category: category || ''
        });

        const saved = await newProduct.save();

        res.status(201).json({ message: 'Product added successfully!', product: saved });
    } catch (err) {
        console.error('Error adding product:', err);
        res.status(500).json({ message: 'Failed to add product.', error: err.message });
    }
});

// ✅ New Route: Get all products for the admin view (unprotected)
router.get('/admin/products', async (req, res) => {
  try {
    const products = await Product.find().sort({ created_at: -1 });
    res.status(200).json({ products });
  } catch (err) {
    console.error('Error fetching admin products:', err);
    res.status(500).json({ message: 'Failed to fetch products.' });
  }
});

// ✅ New Route: Delete a product by its ID (unprotected)
router.delete('/admin/delete-product/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const deletedProduct = await Product.findByIdAndDelete(id);

    if (!deletedProduct) {
      return res.status(404).json({ message: 'Product not found.' });
    }

    res.status(200).json({ message: 'Product deleted successfully.' });
  } catch (err) {
    console.error('Error deleting product:', err);
    res.status(500).json({ message: 'Failed to delete product.', error: err.message });
  }
});

module.exports = router;