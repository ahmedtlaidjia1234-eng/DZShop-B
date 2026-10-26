import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { query } from '../config/db.js';
import { sanitizeString } from '../middleware/security.js';

export async function login(req, res, next) {
  try {
    const { username, password } = req.body;
    const users = await query(
      'SELECT id, username, email, password_hash, role FROM users WHERE username = ? OR email = ? LIMIT 1',
      [username, username]
    );

    if (!users || users.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials. Please verify your username and password.',
      });
    }

    const user = users[0];

    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials. Please verify your username and password.',
      });
    }

    const secret = process.env.JWT_SECRET || 'super_secure_aura_ecommerce_secret_key_928374982347';
    const expiresIn = process.env.JWT_EXPIRES_IN || '24h';

    const token = jwt.sign(
      {
        userId: user.id,
        username: user.username,
        role: user.role,
      },
      secret,
      { expiresIn }
    );

    res.json({
      success: true,
      message: 'Authentication successful.',
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function getProfile(req, res) {
  res.json({
    success: true,
    user: req.user,
  });
}

// Update Admin Username and/or Password
export async function updateProfile(req, res, next) {
  try {
    const userId = req.user.id;
    const { currentPassword, newUsername, newPassword } = req.body;

    if (!currentPassword) {
      return res.status(400).json({
        success: false,
        message: 'Current password is required to update administrative credentials.',
      });
    }

    const users = await query('SELECT id, username, email, password_hash, role FROM users WHERE id = ?', [
      userId,
    ]);

    if (!users || users.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    const user = users[0];

    const isMatch = await bcrypt.compare(currentPassword, user.password_hash);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'Incorrect current password. Changes were not saved.',
      });
    }

    let updatedUsername = user.username;
    if (newUsername && typeof newUsername === 'string' && newUsername.trim().length >= 3) {
      updatedUsername = sanitizeString(newUsername);
    }

    let updatedHash = user.password_hash;
    if (newPassword && typeof newPassword === 'string' && newPassword.length >= 6) {
      const salt = await bcrypt.genSalt(12);
      updatedHash = await bcrypt.hash(newPassword, salt);
    }else if (newPassword && newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters long.',
      });
    }

    await query('UPDATE users SET username = ?, password_hash = ? WHERE id = ?', [
      updatedUsername,
      updatedHash,
      userId,
    ]);

    const secret = process.env.JWT_SECRET || 'super_secure_aura_ecommerce_secret_key_928374982347';
    const expiresIn = process.env.JWT_EXPIRES_IN || '24h';

    const newToken = jwt.sign(
      {
        userId: user.id,
        username: updatedUsername,
        role: user.role,
      },
      secret,
      { expiresIn }
    );

    res.json({
      success: true,
      message: 'Admin security credentials updated successfully!',
      token: newToken,
      user: {
        id: user.id,
        username: updatedUsername,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    next(error);
  }
}
