require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoose = require('mongoose');

const scanRoutes = require('./routes/scans');

const app = express();

// If running behind a proxy (nginx, Docker, cloud), enable trust proxy
app.set('trust proxy', true);

// ── Security middleware ────────────────────────────────────────────────────────
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? process.env.FRONTEND_URL || 'http://localhost:3000'
    : '*',
  methods: ['GET', 'POST', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// ── Rate limiting ──────────────────────────────────────────────────────────────
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX) || 20,
  message: { error: 'Too many scan requests. Please wait before scanning again.' },
  standardHeaders: true,
  legacyHeaders: false
});
// ── Body parsing ───────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: false }));

// ── Rate limiting (apply only to POST scan requests) ─────────────────────────────
app.use('/api/scans', (req, res, next) => {
  if (req.method === 'POST') return limiter(req, res, next);
  return next();
});

// ── Routes ─────────────────────────────────────────────────────────────────────
app.use('/api/scans', scanRoutes);

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    version: '2.0.0',
    db: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    uptime: process.uptime()
  });
});

// 404 handler
app.use((req, res) => res.status(404).json({ error: 'Endpoint not found' }));

// Global error handler
app.use((err, req, res, next) => {
  console.error('[Error]', err.message);
  res.status(500).json({ error: 'Internal server error' });
});

// ── Database + start ───────────────────────────────────────────────────────────
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/scantinel';
const PORT = parseInt(process.env.PORT) || 5000;

mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log(`✓ MongoDB connected: ${MONGO_URI}`);
    app.listen(PORT, () => {
      console.log(`✓ Scantinel API running on http://localhost:${PORT}`);
      console.log(`  Health: http://localhost:${PORT}/api/health`);
    });
  })
  .catch(err => {
    console.error('✗ MongoDB connection failed:', err.message);
    process.exit(1);
  });

module.exports = app;
