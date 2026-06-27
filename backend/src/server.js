import express from 'express';
import cors from 'cors';
import compression from 'compression';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import connectDB from './config/database.js';
import sanitizeInput from './middleware/sanitize.js';
import formRoutes from './routes/formRoutes.js';
import authRoutes from './routes/authRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import stripeRoutes from './routes/stripeRoutes.js';
import pushRoutes from './routes/pushRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import legacyImportRoutes from './routes/legacyImportRoutes.js';
import cronRoutes from './routes/cronRoutes.js';

// Club Nanny sitter-side routes
import sitterRoutes from './routes/sitterRoutes.js';
import sittingFamilyRoutes from './routes/sittingFamilyRoutes.js';
import sittingAdminRoutes from './routes/sittingAdminRoutes.js';
import sittingAuthRoutes from './routes/sittingAuthRoutes.js';

dotenv.config();

// Connect to MongoDB
connectDB();

const app = express();
const PORT = process.env.PORT || 5001;

// Trust nginx reverse proxy
app.set('trust proxy', 1);

// Enable gzip compression
app.use(compression());

// Security headers
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
}));

// Rate limiting for forms
const formLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // 10 form submissions per hour
  message: { success: false, message: 'Too many form submissions, please try again later.' },
});

// Rate limiting for login (strict - prevents brute force)
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 login attempts per 15 minutes
  message: { success: false, message: 'Too many login attempts. Please try again in 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiting for registration (moderate)
const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // 5 registration attempts per hour
  message: { success: false, message: 'Too many registration attempts. Please try again later.' },
});

// Rate limiting for password reset (prevents email bombing)
const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 password reset attempts per hour
  message: { success: false, message: 'Too many password reset attempts. Please try again later.' },
});

// CORS - production domains plus any clone/staging domains configured in env.
const productionCorsOrigins = [
  'https://www.clubnanny.com',
  'https://clubnanny.com',
];

const envCorsOrigins = [
  process.env.FRONTEND_URL,
  ...(process.env.ALLOWED_ORIGINS || '').split(','),
]
  .map(origin => origin?.trim())
  .filter(Boolean);

const corsOrigins = Array.from(new Set([
  ...productionCorsOrigins,
  ...envCorsOrigins,
]));

// Add localhost origins only in development
if (process.env.NODE_ENV !== 'production') {
  corsOrigins.push(
    process.env.FRONTEND_URL || 'http://localhost:5173',
    'http://localhost:8080',
    'http://localhost:8081',
    'http://localhost:3001'
  );
}

app.use(cors({
  origin(origin, callback) {
    if (!origin || corsOrigins.includes(origin)) {
      callback(null, true);
      return;
    }

    callback(new Error(`Origin ${origin} not allowed by CORS`));
  },
  credentials: true
}));

// Stripe webhook needs raw body - must be before express.json()
// The webhook route handles its own body parsing
app.use('/api/stripe/webhook', express.raw({ type: 'application/json' }));

// Body parsing for all other routes
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));

// Input sanitization (skip for stripe webhook)
app.use((req, res, next) => {
  if (req.path === '/api/stripe/webhook') {
    return next();
  }
  sanitizeInput(req, res, next);
});

// Health check
app.get('/', (req, res) => {
  res.json({
    message: 'Club Nanny API',
    status: 'Running',
    timestamp: new Date().toISOString()
  });
});

app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString()
  });
});

const ensureDatabase = async (req, res, next) => {
  try {
    const connection = await connectDB();
    if (!connection) {
      return res.status(503).json({
        success: false,
        message: 'Database is not available. Please try again shortly.'
      });
    }
    next();
  } catch (error) {
    console.error('Database connection middleware error:', error);
    res.status(503).json({
      success: false,
      message: 'Database is not available. Please try again shortly.'
    });
  }
};

app.use('/api', (req, res, next) => {
  if (req.path === '/health' || req.path === '/stripe/webhook') {
    return next();
  }
  return ensureDatabase(req, res, next);
});

// Form routes (contact, family application, nanny application)
app.use('/api/forms', formLimiter, formRoutes);

// Auth routes with rate limiting
app.use('/api/auth/login', loginLimiter);
app.use('/api/auth/register', registerLimiter);
app.use('/api/auth/forgot-password', passwordResetLimiter);
app.use('/api/auth', authRoutes);

// Admin routes
app.use('/api/admin', adminRoutes);

// Token-protected one-time legacy CSV import route. It is inert unless
// LEGACY_IMPORT_TOKEN is configured in the deployment environment.
app.use('/api/legacy-import', legacyImportRoutes);

// Stripe routes (webhook needs raw body, handled inside stripeRoutes)
app.use('/api/stripe', stripeRoutes);

// Push notification routes
app.use('/api/push', pushRoutes);

// In-app notification routes
app.use('/api/notifications', notificationRoutes);

// Scheduled maintenance/notification routes
app.use('/api/cron', cronRoutes);

// Club Nanny sitter-side routes
app.use('/api/sitting/auth', sittingAuthRoutes);
app.use('/api/sitter', sitterRoutes);
app.use('/api/sitting/family', sittingFamilyRoutes);
app.use('/api/admin/sitting', sittingAdminRoutes);

// Vercel imports the Express app as a serverless handler, so only listen when
// running as a normal Node process (local dev / VPS / PM2).
if (process.env.VERCEL !== '1') {
  app.listen(PORT, () => {
    console.log(`🚀 Club Nanny API running on port ${PORT}`);
    console.log(`📧 Email service ready`);
  });
}

export default app;
