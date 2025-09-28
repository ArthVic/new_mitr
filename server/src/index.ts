import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';

// Import routes
import { authRouter } from './routes/auth.js';
import { conversationRouter } from './routes/conversations.js';
import { webhookRouter } from './routes/webhooks.js';
import { aiRouter } from './routes/ai.js';
import { analyticsRouter } from './routes/analytics.js';
import { settingsRouter } from './routes/settings.js';
import { adminRouter } from './routes/admin.js';

// Import services (localhost version - no Redis)
import { socketManager } from './services/socket.js';
import './services/jobs-localhost.js';  // ← Localhost jobs only

dotenv.config();

const app = express();
const server = createServer(app);

// Socket.IO setup
const io = new SocketIOServer(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    methods: ["GET", "POST"]
  }
});

// Rate limiting (reduced for localhost)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // requests per windowMs
  message: { error: 'Too many requests from this IP' }
});

// Middleware
app.use(helmet({
  contentSecurityPolicy: false // Disable for development
}));

app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:5173",
  credentials: true
}));

app.use(morgan('dev')); // Use 'dev' for cleaner localhost logs
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use('/api', limiter);

// Initialize Socket.IO
socketManager.initialize(io);

// API Routes
app.use('/api/auth', authRouter);
app.use('/api/conversations', conversationRouter);
app.use('/api/webhooks', webhookRouter);
app.use('/api/ai', aiRouter);
app.use('/api/analytics', analyticsRouter);
app.use('/api/settings', settingsRouter);
app.use('/api/admin', adminRouter);

// Health check (localhost version)
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    mode: 'localhost-development',
    services: {
      database: 'connected',
      gemini_ai: process.env.GEMINI_API_KEY ? 'configured' : 'missing',
      redis: 'disabled-for-localhost',
      socket_io: 'active'
    }
  });
});

// Localhost development status endpoint
app.get('/api/status', (req, res) => {
  res.json({
    environment: 'development',
    features: {
      ai_responses: !!process.env.GEMINI_API_KEY,
      real_time_messaging: true,
      job_processing: 'in-memory',
      webhooks: true
    },
    uptime: process.uptime(),
    memory_usage: process.memoryUsage()
  });
});

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('🚨 API Error:', err);
  
  // Don't expose internal errors in production
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
    ...(isDevelopment && { 
      stack: err.stack,
      url: req.url,
      method: req.method
    })
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ 
    error: 'Route not found',
    path: req.originalUrl,
    method: req.method
  });
});

// Graceful shutdown handlers
const gracefulShutdown = () => {
  console.log('🛑 Received shutdown signal, closing server...');
  
  server.close(() => {
    console.log('✅ HTTP server closed');
    process.exit(0);
  });
  
  // Force close after 10 seconds
  setTimeout(() => {
    console.log('⚠️ Forcing server shutdown');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

// Start server
const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log('🚀 Mitr Server Started');
  console.log(`📡 Port: ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:5173'}`);
  console.log(`💡 Mode: Localhost Development (Redis-free)`);
  console.log(`🤖 Gemini AI: ${process.env.GEMINI_API_KEY ? '✅ Configured' : '❌ Missing API Key'}`);
  console.log(`📊 Health Check: http://localhost:${PORT}/health`);
  console.log(`📈 Status Check: http://localhost:${PORT}/api/status`);
});

// Log startup completion
setTimeout(() => {
  console.log('✅ Server startup complete - ready for connections!');
}, 1000);
