import { Router } from 'express';
import {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
} from '../controllers/productController.js';
import { verifyAdmin } from '../middleware/auth.js';
import { validateProduct } from '../middleware/validation.js';

const router = Router();

// Public Catalog Access
router.get('/', getAllProducts);
router.get('/:id', getProductById);

// Protected Admin Operations
router.post('/', verifyAdmin, validateProduct, createProduct);
router.put('/:id', verifyAdmin, validateProduct, updateProduct);
router.delete('/:id', verifyAdmin, deleteProduct);

export default router;
