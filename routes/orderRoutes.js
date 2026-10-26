import { Router } from 'express';
import {
  createOrder,
  getAllOrders,
  updateOrderStatus,
  deleteOrder,
} from '../controllers/orderController.js';
import { verifyAdmin } from '../middleware/auth.js';
import { validateCheckoutOrder } from '../middleware/validation.js';
import { orderLimiter } from '../middleware/security.js';

const router = Router();

// Public Checkout: Client places an order (Rate-limited & Input Validated)
router.post('/', orderLimiter, validateCheckoutOrder, createOrder);

// Protected Admin Operations
router.get('/', verifyAdmin, getAllOrders);
router.put('/:id/status', verifyAdmin, updateOrderStatus);
router.delete('/:id', verifyAdmin, deleteOrder);

export default router;
