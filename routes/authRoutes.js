import { Router } from 'express';
import { login, getProfile, updateProfile } from '../controllers/authController.js';
import { authLimiter } from '../middleware/security.js';
import { validateLogin } from '../middleware/validation.js';
import { verifyAdmin } from '../middleware/auth.js';

const router = Router();

// Brute-force protected admin login
router.post('/login', authLimiter, validateLogin, login);

// Admin session verification
router.get('/me', verifyAdmin, getProfile);

// Admin profile & credentials update
router.put('/profile', verifyAdmin, updateProfile);

export default router;
