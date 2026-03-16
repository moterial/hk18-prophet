// backend/server.js — Express server for HK18 Prophet
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { config } from './config.js';
import { initDatabase } from './db/database.js';
import { apiRouter } from './routes/api.js';
import { startRAGRefresh, ragStats } from './data-sources/rag-store.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const isProd = config.server.nodeEnv === 'production';

// Security headers
app.use(helmet({ contentSecurityPolicy: false, crossOriginEmbedderPolicy: false }));

// CORS — restrict in production
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map(s => s.trim())
  : null;
app.use(cors(allowedOrigins ? { origin: allowedOrigins } : {}));

app.use(express.json({ limit: '1mb' }));

// Trust proxy (for rate limiting behind nginx/cloudflare)
if (isProd) app.set('trust proxy', 1);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API routes
app.use('/api', apiRouter);

// Serve frontend static files in production
const frontendDist = path.resolve(__dirname, '..', 'frontend', 'dist');
app.use(express.static(frontendDist));
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api') || req.path === '/health') return next();
  res.sendFile(path.join(frontendDist, 'index.html'), err => {
    if (err) next();
  });
});

// Validate LLM API key
if (!config.llm.apiKey) {
  console.error('❌ LLM_API_KEY is required. Set it in .env');
  process.exit(1);
}

// Initialize database and start server
try {
  initDatabase();
  console.log('✅ Database initialized');
} catch (err) {
  console.error('❌ Database initialization failed:', err.message);
  process.exit(1);
}

const server = app.listen(config.server.port, () => {
  console.log(`\n🏠 HK18 Prophet API running on http://localhost:${config.server.port}`);
  console.log(`🤖 LLM: ${config.llm.baseUrl} / ${config.llm.modelName}`);
  console.log(`⏱️ Cache TTL: ${config.cache.ttlHours}h`);
  console.log(`🛡️ Rate limit: ${config.rateLimit.customEstatePerHour} custom/h, ${config.rateLimit.districtPerHour} district/h, ${config.rateLimit.globalPerMinute} global/min`);
  console.log(`🔗 LLM concurrency: max ${config.llmConcurrency} simultaneous calls`);
  console.log(`🌍 Mode: ${config.server.nodeEnv}`);
  console.log(`📊 Districts: ${config.districts.length}`);

  // Start RAG news refresh in background (every 30 min)
  startRAGRefresh(30 * 60 * 1000).then(async () => {
    const stats = await ragStats();
    console.log(`📦 RAG: ${stats.indexed} articles indexed\n`);
  }).catch(err => {
    console.warn('⚠️ RAG startup failed (non-fatal):', err.message);
  });
});

// Graceful shutdown
function shutdown(signal) {
  console.log(`\n🛑 ${signal} received — shutting down gracefully...`);
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
  setTimeout(() => { process.exit(1); }, 10000);
}
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
