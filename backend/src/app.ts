import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import { corsOrigins, env } from './config/env';
import { httpLogger } from './config/logger';
import { errorHandler, notFoundHandler } from './middlewares/errorHandler';
import { apiLimiter } from './middlewares/rateLimiter';
import apiRoutes from './routes';

export const app = express();

app.disable('x-powered-by');

// --- Security headers ---
app.use(helmet());

// --- Structured request logging ---
app.use(httpLogger);

// --- CORS (credentials enabled for the cookie-based auth flow) ---
app.use(
  cors({
    origin: corsOrigins,
    credentials: true,
  }),
);

// --- Body parsing ---
app.use(express.json({ limit: '50mb' }));
app.use(cookieParser());

// --- Global API rate limiting ---
app.use('/api', apiLimiter);

// --- Versioned API routes ---
app.use('/api', apiRoutes);

// --- 404 + centralized error handling (must be last) ---
app.use(notFoundHandler);
app.use(errorHandler);
