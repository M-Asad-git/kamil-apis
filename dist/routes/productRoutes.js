"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const productController_1 = require("../controllers/productController");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// Admin Login Route (No DB, hardcoded for simplicity)
router.post('/admin/login', (req, res) => {
    const { username, password } = req.body;
    if (username !== 'admin' || password !== 'adminpass') {
        return res.status(401).json({ error: 'Invalid credentials' });
    }
    const token = require('jsonwebtoken').sign({ username }, process.env.JWT_SECRET, { expiresIn: '1h' });
    res.json({ token });
});
// Product Routes
router.get('/products', productController_1.searchProductsByCategory); // Search by category or name
router.get('/products/:id', productController_1.getProductById); // Get single product by ID
router.post('/products', auth_1.verifyAdmin, productController_1.addProduct); // Admin-only
router.put('/products/:id', auth_1.verifyAdmin, productController_1.updateProduct); // Admin-only
router.delete('/products/:id', auth_1.verifyAdmin, productController_1.removeProduct); // Admin-only
exports.default = router;
