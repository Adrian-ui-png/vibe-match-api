import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import helmet from 'helmet';

// Load environment variables
dotenv.config();

import rateLimit from 'express-rate-limit';
import { connectDB } from './config/db';
import apiRouter from './routes/api.routes';
import { globalErrorHandler } from './middleware/error.middleware';
import { AppError } from './utils/appError';
import { initGroq } from './utils/groq';
import logger from './utils/logger';

// Catch uncaught exceptions, log the failure, and exit the process
process.on('uncaughtException', (err) => {
  logger.error(`UNCAUGHT EXCEPTION! 💥 Name: ${err.name}, Message: ${err.message}, Stack: ${err.stack}`);
  process.exit(1);
});

process.on('unhandledRejection', (reason: any) => {
  logger.error(`UNHANDLED REJECTION! 💥 Reason: ${reason}`);
  process.exit(1);
});

const app = express();
app.set('trust proxy', 1);
const PORT = process.env.PORT || 5000;

// Security Middleware: Set HTTP headers to secure Express app
app.use(helmet());

// Secure CORS configuration
const corsOrigin = process.env.CORS_ORIGIN || '*';
if (process.env.NODE_ENV === 'production' && corsOrigin === '*') {
  logger.warn('⚠️ WARNING: CORS origin is set to wildcard (*) in production. Specify CORS_ORIGIN env variable for security.');
}

app.use(cors({
  origin: corsOrigin,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-razorpay-signature']
}));

// Global Rate Limiter: Max 200 requests per 15 minutes per IP
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 200,
  message: {
    status: 'fail',
    message: 'Too many requests from this IP. Please try again after 15 minutes.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Submission-Specific Rate Limiter: Max 15 submissions per minute per IP
const submissionLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 15,
  message: {
    status: 'fail',
    message: 'Too many submissions. Please wait 60 seconds before testing another vibe compatibility.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Apply global rate limiting
app.use(globalLimiter);

// Express JSON parser with raw body verify hook and size limit
app.use(express.json({
  limit: '5mb',
  verify: (req: any, res, buf) => {
    if (req.originalUrl && req.originalUrl.includes('/payment/webhook')) {
      req.rawBody = buf.toString();
    }
  }
}));
app.use(express.urlencoded({ limit: '5mb', extended: true }));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Apply specific rate limiting to the submit route
app.use('/api/quiz/submit', submissionLimiter);

// Sanitize double slashes in URL path to handle misconfigured clients/proxies
app.use((req, res, next) => {
  if (req.url) {
    const [path, query] = req.url.split('?');
    const cleanPath = path.replace(/\/+/g, '/');
    req.url = query ? `${cleanPath}?${query}` : cleanPath;
  }
  next();
});

// Mount API routes
app.use('/api', apiRouter);

// Fallback for unhandled routes - forwards 404 AppError to the handler
app.all(/.*/, (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

// Mount Centralized Global Error Handler Middleware
app.use(globalErrorHandler);

const startServer = async () => {
  try {
    await connectDB();
    initGroq();
    app.listen(PORT, () => {
      logger.info(`🚀 Resilient Server running on http://localhost:${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
    });
  } catch (error) {
    logger.error(`❌ Critical server startup failure: ${(error as Error).message}`);
    process.exit(1);
  }
};

startServer();
