import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { initDatabase } from './config/db.js';
import { securityHeaders, apiLimiter } from './middleware/security.js';
import { notFoundHandler, globalErrorHandler } from './middleware/errorHandler.js';

import authRoutes from './routes/authRoutes.js';
import productRoutes from './routes/productRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import settingsRoutes from './routes/settingsRoutes.js';
import uploadRoutes from './routes/uploadRoutes.js';
 
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// Apply Helmet Security Headers
app.use(securityHeaders);

// CORS Configuration
const allowedOrigins = [
  process.env.CORS_ORIGIN || 'https://dzshop-self.vercel.app',
 'http://dzshop-self.vercel.app'
];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Blocked by CORS policy: Origin not allowed.'));
      }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  })
);

// Payload size limits to defeat DOS / Memory exhaustion attacks
app.use(express.json({ limit: '10mb' })); // Allow base64 or larger uploads
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static Uploads Folder
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// General Rate Limiting
app.use('/api', apiLimiter);

// Health & Status
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    security: {
      rateLimiting: 'Active',
      helmetProtection: 'Active',
      sqlInjectionProtection: 'Parameterized Queries',
      authentication: 'JWT + bcrypt (12 rounds)',
    },
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/upload', uploadRoutes);

// Error Handling
app.use(notFoundHandler);
app.use(globalErrorHandler);
 
async function startServer() {
  await initDatabase();  
  
  app.listen(PORT, () => { 
    console.log(`
🛡️  ==============================================================
   Aura Commerce Secure Backend Running on port ${PORT}
   URL: http://localhost:${PORT}
   Uploads: http://localhost:${PORT}/uploads
   Health: http://localhost:${PORT}/api/health
   Mode: ${process.env.NODE_ENV || 'development'}
   Security: Helmet, Rate Limiter, Parameterized SQL, JWT, bcrypt
==============================================================
    `);
  });
}

startServer();
