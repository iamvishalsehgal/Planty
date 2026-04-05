import express from 'express';
import cors from 'cors';
import { getDb } from './db/db.js';
import { runFullPipeline } from './pipelines/pipelineRunner.js';
import plantsRouter from './routes/plants.js';
import eventsRouter from './routes/events.js';
import analyticsRouter from './routes/analytics.js';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`${req.method} ${req.path} ${res.statusCode} ${duration}ms`);
  });
  next();
});

// Routes
app.use('/api/plants', plantsRouter);
app.use('/api/events', eventsRouter);
app.use('/api/analytics', analyticsRouter);

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Initialize DB on startup
getDb();
console.log('Database initialized');

// Run pipeline on startup + every 5 minutes
runFullPipeline().catch(console.error);
setInterval(() => {
  runFullPipeline().catch(console.error);
}, 5 * 60 * 1000);

app.listen(PORT, () => {
  console.log(`PlantCare backend running on http://localhost:${PORT}`);
  console.log('Data engineering pipelines active');
});
