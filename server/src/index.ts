import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
import { createBullBoard } from '@bull-board/api';
import { BullAdapter } from '@bull-board/api/bullAdapter';
import { ExpressAdapter } from '@bull-board/express';
import Redis from 'ioredis';

// Import routes
import { authRouter } from './routes/auth.js';
import { conversationRouter } from './routes/conversations.js';
import { webhookRouter } from './routes/webhooks.js';
import { aiRouter } from './routes/ai.js';
import { analyticsRouter } from './routes/analytics.js';
import { settingsRouter } from './routes/settings.js';
import { adminRouter } from './routes/admin.js';

// Import services
import { socketManager } from './services/socket.js';
import { messageQueue } from './services/queue.js';
//import './services/jobs.js';
import './services/jobs-localhost.js';

dotenv.config();

const app = express();
const server = createServer(app);
const io = new SocketIOServer(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    methods: ["GET", "POST"]
  }
});

// Redis connection
export const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // limit each IP to 1000 requests per windowMs
  message: 'Too many requests from this IP'
});

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:5173",
  credentials: true
}));
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use('/api', limiter);

// Bull Dashboard for monitoring jobs
const serverAdapter = new ExpressAdapter();
serverAdapter.setBasePath('/admin/queues');
createBullBoard({
  queues: [new BullAdapter(messageQueue)],
  serverAdapter
});
app.use('/admin/queues', serverAdapter.getRouter());

// Socket.IO connection handling
socketManager.initialize(io);

// API Routes
app.use('/api/auth', authRouter);
app.use('/api/conversations', conversationRouter);
app.use('/api/webhooks', webhookRouter);
app.use('/api/ai', aiRouter);
app.use('/api/analytics', analyticsRouter);
app.use('/api/settings', settingsRouter);
app.use('/api/admin', adminRouter);

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    services: {
      redis: redis.status,
      database: 'connected' // Add actual DB health check
    }
  });
});

// Error handling
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});


const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Bull Dashboard available at http://localhost:${PORT}/admin/queues`);
});
