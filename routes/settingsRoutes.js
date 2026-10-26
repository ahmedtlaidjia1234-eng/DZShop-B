import { Router } from 'express';
import { getSettings, updateSettings } from '../controllers/settingsController.js';
import { verifyAdmin } from '../middleware/auth.js';
import { validateSettings } from '../middleware/validation.js';

const router = Router();

// Public: Retrieve store branding and settings
router.get('/', getSettings);

// Protected: Update site settings (Admin only)
router.put('/', verifyAdmin, validateSettings, updateSettings);

export default router;
