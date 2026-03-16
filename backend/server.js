// backend/server.js — Express server for HK18 Prophet
import express from 'express';
import cors from 'cors';
import { config } from './config.js';
import { initDatabase } from './db/database.js';
import { apiRouter } from './routes/api.js';
import { startRAGRefresh, ragStats } from './data-sources/rag-store.js';

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API routes
app.use('/api', apiRouter);

// Initialize database and start server
try {
  initDatabase();
  console.log('✅ Database initialized');
} catch (err) {
  console.error('❌ Database initialization failed:', err.message);
  process.exit(1);
}

app.listen(config.server.port, () => {
  console.log(`\n🏠 HK18 Prophet API running on http://localhost:${config.server.port}`);
  console.log(`🤖 LLM: ${config.llm.baseUrl} / ${config.llm.modelName}`);
  console.log(`🔄 Simulation rounds: ${config.simulation.rounds}`);
  console.log(`📊 Districts: ${config.districts.length}`);

  // Start RAG news refresh in background (every 30 min)
  startRAGRefresh(30 * 60 * 1000).then(async () => {
    const stats = await ragStats();
    console.log(`📦 RAG: ${stats.indexed} articles indexed\n`);
  }).catch(err => {
    console.warn('⚠️ RAG startup failed (non-fatal):', err.message);
  });
});
