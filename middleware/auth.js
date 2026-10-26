import jwt from 'jsonwebtoken';
import { query } from '../config/db.js';

export async function verifyAdmin(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false, 
        message: 'Access denied. No authentication token provided.',
      });
    }

    const token = authHeader.split(' ')[1];
    const secret = process.env.JWT_SECRET || 'super_secure_aura_ecommerce_secret_key_928374982347';

    const decoded = jwt.verify(token, secret);

    // Verify user still exists in database
    const users = await query('SELECT id, username, email, role FROM users WHERE id = ?', [
      decoded.userId,
    ]);

    if (!users || users.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Invalid session token: User no longer exists.',
      });
    }

    const user = users[0];

    if (user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access forbidden. Administrator privileges required.',
      });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Session has expired. Please log in again.',
      });
    }
    return res.status(401).json({
      success: false,
      message: 'Invalid authentication token.',
    });
  }
}
