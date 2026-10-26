import rateLimit from 'express-rate-limit';
import helmet from 'helmet';

// Helmet Security Headers Middleware
export const securityHeaders = helmet({
  contentSecurityPolicy: false, // Allows flexible API usage
  crossOriginResourcePolicy: { policy: 'cross-origin' },
});

// General API Rate Limiter
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300, // max 300 requests per IP per window
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests from this IP address. Please try again after 15 minutes.',
  },
});

// Strict Login / Auth Rate Limiter (Brute-Force & Credential Stuffing Protection)
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 8, // max 8 failed login attempts per IP per 15 mins
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  message: {
    success: false,
    message: 'Too many login attempts. Account temporarily locked for 15 minutes to protect against brute-force attacks.',
  },
});

// Checkout Rate Limiter (Prevents automated spam orders)
export const orderLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 30, // max 30 orders per hour per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Order creation rate limit reached. Please wait before placing more orders.',
  },
});

// Input Sanitization helper (XSS Prevention)
export function sanitizeString(str) {
  if (typeof str !== 'string') return str;
  return str
    .replace(/[<>]/g, '') // remove HTML angle brackets to prevent script injection
    .trim();
}
