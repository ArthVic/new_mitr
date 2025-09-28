import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';

export const adminRouter = Router();

// Admin authentication middleware
const adminMiddleware = async (req: AuthRequest, res: any, next: any) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: { role: true }
    });

    if (!user || user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    next();
  } catch (error) {
    console.error('Admin middleware error:', error);
    res.status(500).json({ error: 'Authorization check failed' });
  }
};

adminRouter.use(authMiddleware);
adminRouter.use(adminMiddleware);

// Get system overview
adminRouter.get('/overview', async (req: AuthRequest, res) => {
  try {
    // Get system-wide stats from database (no Redis needed)
    const [
      totalUsers,
      totalConversations,
      totalMessages,
      activeUsers,
      systemHealth
    ] = await Promise.all([
      prisma.user.count(),
      prisma.conversation.count(),
      prisma.message.count(),
      prisma.user.count({
        where: {
          conversations: {
            some: {
              updatedAt: {
                gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
              }
            }
          }
        }
      }),
      // Mock system health for localhost
      Promise.resolve({
        database: 'healthy',
        ai_service: process.env.GEMINI_API_KEY ? 'healthy' : 'misconfigured',
        memory_usage: process.memoryUsage(),
        uptime: process.uptime()
      })
    ]);

    // Channel distribution
    const channelStats = await prisma.conversation.groupBy({
      by: ['channel'],
      _count: { id: true }
    });

    // Recent activity (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentActivity = await prisma.conversation.findMany({
      where: {
        createdAt: { gte: sevenDaysAgo }
      },
      include: {
        user: {
          select: { name: true, email: true }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 20
    });

    res.json({
      overview: {
        totalUsers,
        totalConversations,
        totalMessages,
        activeUsers,
        systemHealth
      },
      channelStats: channelStats.map(stat => ({
        channel: stat.channel,
        count: stat._count.id
      })),
      recentActivity: recentActivity.map(conv => ({
        id: conv.id,
        customerName: conv.customerName,
        channel: conv.channel,
        status: conv.status,
        agent: conv.user?.name || 'Unassigned',
        createdAt: conv.createdAt
      }))
    });

  } catch (error) {
    console.error('Admin overview error:', error);
    res.status(500).json({ error: 'Failed to fetch system overview' });
  }
});

// Get all users
adminRouter.get('/users', async (req: AuthRequest, res) => {
  try {
    const { page = '1', limit = '20', search } = req.query;
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const offset = (pageNum - 1) * limitNum;

    const where: any = {};
    if (search) {
      where.OR = [
        { name: { contains: search as string, mode: 'insensitive' } },
        { email: { contains: search as string, mode: 'insensitive' } }
      ];
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          createdAt: true,
          _count: {
            conversations: true
          }
        },
        orderBy: { createdAt: 'desc' },
        skip: offset,
        take: limitNum
      }),
      prisma.user.count({ where })
    ]);

    res.json({
      users,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum)
      }
    });

  } catch (error) {
    console.error('Admin users error:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Update user role
const updateUserSchema = z.object({
  role: z.enum(['USER', 'ADMIN'])
});

adminRouter.patch('/users/:id', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const parsed = updateUserSchema.safeParse(req.body);
    
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.flatten() });
    }

    const user = await prisma.user.update({
      where: { id },
      data: { role: parsed.data.role },
      select: {
        id: true,
        email: true,
        name: true,
        role: true
      }
    });

    res.json({ user });

  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ error: 'Failed to update user' });
  }
});

// System configuration
adminRouter.get('/config', async (req: AuthRequest, res) => {
  try {
    // Mock system configuration for localhost
    const config = {
      ai_service: {
        provider: 'Gemini',
        status: process.env.GEMINI_API_KEY ? 'configured' : 'not_configured',
        model: 'gemini-1.5-pro'
      },
      database: {
        status: 'connected',
        type: 'PostgreSQL'
      },
      features: {
        voice_calls: true,
        ai_responses: !!process.env.GEMINI_API_KEY,
        multi_channel: true,
        real_time: true
      },
      limits: {
        max_conversations_per_user: 1000,
        max_messages_per_conversation: 10000,
        rate_limit_per_minute: 60
      }
    };

    res.json(config);

  } catch (error) {
    console.error('Admin config error:', error);
    res.status(500).json({ error: 'Failed to fetch configuration' });
  }
});

// System logs (mock for localhost)
adminRouter.get('/logs', async (req: AuthRequest, res) => {
  try {
    const { level = 'info', limit = '50' } = req.query;
    const limitNum = parseInt(limit as string);

    // Mock logs for localhost development
    const mockLogs = [
      {
        timestamp: new Date().toISOString(),
        level: 'info',
        message: 'Server started successfully',
        service: 'main'
      },
      {
        timestamp: new Date(Date.now() - 60000).toISOString(),
        level: 'info',
        message: 'Gemini AI connected',
        service: 'ai'
      },
      {
        timestamp: new Date(Date.now() - 120000).toISOString(),
        level: 'warn',
        message: 'Redis disabled for localhost development',
        service: 'jobs'
      },
      {
        timestamp: new Date(Date.now() - 180000).toISOString(),
        level: 'info',
        message: 'Database connection established',
        service: 'database'
      }
    ].slice(0, limitNum);

    res.json({ logs: mockLogs });

  } catch (error) {
    console.error('Admin logs error:', error);
    res.status(500).json({ error: 'Failed to fetch logs' });
  }
});

// Bulk operations
adminRouter.post('/bulk/reset-passwords', async (req: AuthRequest, res) => {
  try {
    // Mock bulk operation for security
    res.json({ 
      message: 'Bulk password reset disabled in localhost development',
      affected: 0 
    });
  } catch (error) {
    console.error('Bulk reset error:', error);
    res.status(500).json({ error: 'Bulk operation failed' });
  }
});

// System health check
adminRouter.get('/health', async (req: AuthRequest, res) => {
  try {
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        database: 'healthy',
        ai_service: process.env.GEMINI_API_KEY ? 'healthy' : 'misconfigured',
        job_processing: 'healthy',
        socket_io: 'healthy'
      },
      metrics: {
        uptime: process.uptime(),
        memory_usage: process.memoryUsage(),
        cpu_usage: process.cpuUsage()
      }
    };

    res.json(health);

  } catch (error) {
    console.error('Admin health check error:', error);
    res.status(500).json({ error: 'Health check failed' });
  }
});
