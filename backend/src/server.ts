import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import http from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import mongoose from 'mongoose';
import { config } from './config';
import chatRouter from './routes/chat.router';
import personaRouter from './routes/persona.router';
import authRouter from './routes/auth.router';
import { handleVoiceConnection } from './websocket/voiceHandler';

const app = express();
const server = http.createServer(app);

// ── Middleware ──────────────────────────────────
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: config.frontendUrl, credentials: true }));
app.use(express.json({ limit: '10mb' }));

// ── Request Logging ────────────────────────────
app.use((req, res, next) => {
  const start = Date.now();
  const method = req.method;
  const path = req.path;

  res.on('finish', () => {
    const duration = Date.now() - start;
    const status = res.statusCode;
    const color = status >= 400 ? '\x1b[31m' : status >= 300 ? '\x1b[33m' : '\x1b[32m';
    console.log(`${color}${method}\x1b[0m ${path} → ${color}${status}\x1b[0m (${duration}ms)`);
  });

  next();
});

// ── Health check ───────────────────────────────
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'voice-buddy',
    timestamp: new Date().toISOString(),
    mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
  });
});

// ── REST Routes ────────────────────────────────
app.use('/api/auth', authRouter);
app.use('/api/chat', chatRouter);
app.use('/api/persona', personaRouter);


// ── WebSocket Server ───────────────────────────
const wss = new WebSocketServer({ server, path: '/ws/voice' });

wss.on('connection', (ws: WebSocket) => {
  handleVoiceConnection(ws);
});

wss.on('error', (error) => {
  console.error('[WSS] Server error:', error);
});

// ── MongoDB Connection ─────────────────────────
async function connectDB(): Promise<void> {
  try {
    await mongoose.connect(config.mongodbUri);
    console.log('✅ MongoDB connected');
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error);
    console.log('⚠️  Server will run without database persistence');
  }
}

// ── Start Server ───────────────────────────────
async function start(): Promise<void> {
  await connectDB();

  server.listen(config.port, () => {
    console.log(`
╔══════════════════════════════════════════════╗
║          🧠 Voice Buddy Server              ║
╠══════════════════════════════════════════════╣
║  REST API:   http://localhost:${config.port}         ║
║  WebSocket:  ws://localhost:${config.port}/ws/voice   ║
║  Health:     http://localhost:${config.port}/api/health║
║                                              ║
║  NVIDIA:     ${config.nvidia.apiKey ? '✅ configured' : '❌ not set'}              ║
║  Groq:       ${config.groq.apiKey ? '✅ configured' : '❌ not set'}              ║
╚══════════════════════════════════════════════╝
    `);

    if (!config.nvidia.apiKey && !config.groq.apiKey) {
      console.warn('⚠️  No LLM API keys configured! Set NVIDIA_API_KEY or GROQ_API_KEY in .env');
    }
  });
}

start().catch(console.error);

export { app, server };
