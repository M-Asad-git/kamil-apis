import { Router } from 'express';
import { addProduct, updateProduct, removeProduct, searchProductsByCategory, getProductById } from '../controllers/productController';
import { verifyAdmin } from '../middleware/auth';

const router = Router();

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
router.get('/products', searchProductsByCategory); // Search by category or name
router.get('/products/:id', getProductById); // Get single product by ID
router.post('/products', verifyAdmin, addProduct); // Admin-only
router.put('/products/:id', verifyAdmin, updateProduct); // Admin-only
router.delete('/products/:id', verifyAdmin, removeProduct); // Admin-only

export default router;