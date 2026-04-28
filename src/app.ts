import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import swaggerUi from 'swagger-ui-express';
import path from 'path';

import { env } from './config/env';
import { swaggerSpec } from './docs/swagger';
import routes from './routes/index';
import { errorHandler, notFoundHandler } from './middlewares/error.middleware';
import { globalRateLimit } from './middlewares/rateLimit.middleware';

const app = express();

// ── Security middlewares ─────────────────────────────────────────────────
app.use(helmet());
app.use(cors({
  origin: env.NODE_ENV === 'production' ? process.env.ALLOWED_ORIGINS?.split(',') : '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// ── General middlewares ──────────────────────────────────────────────────
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ── Logging ──────────────────────────────────────────────────────────────
if (env.NODE_ENV !== 'test') {
  app.use(morgan(env.NODE_ENV === 'development' ? 'dev' : 'combined'));
}

// ── Global rate limit ────────────────────────────────────────────────────
app.use(globalRateLimit);

// ── Static files (local uploads) ─────────────────────────────────────────
app.use('/uploads', express.static(path.resolve(env.UPLOAD_DIR)));

// ── Swagger docs ─────────────────────────────────────────────────────────
if (env.NODE_ENV !== 'production') {
  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'CBS API Docs',
  }));
  app.get('/api/docs.json', (_req, res) => res.json(swaggerSpec));
}


// ── Health / Root route ───────────────────────────────────────────
app.get("/", (_req, res) => {
    res.status(200).json({
      status: "success",
      message: "🚀 Content Broadcasting API is running",
    });
  });

// ── Application routes ───────────────────────────────────────────────────
app.use(routes);

// ── Error handlers ───────────────────────────────────────────────────────
app.use(notFoundHandler);
app.use(errorHandler);

export default app;