import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';
import { redis } from '../index.js';

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
    res.status(500).json({ error: 'Authorization check failed' });
  }
};

adminRouter.use(authMiddleware);
adminRouter.use(adminMiddleware);

// Get all users
adminRouter.get('/users', async (req: AuthRequest, res) => {
  try {
    const { page = 1, limit = 20, search = '' } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const users = await prisma.user.findMany({
      where: search ? {
        OR: [
          { email: { contains: search as string, mode: 'insensitive' } },
          { name: { contains: search as string, mode: 'insensitive' } }
        ]
      } : {},
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        _count: {
          select: {
            conversations: true
          }
        }
      },
      skip,
      take: Number(limit),
      orderBy: { createdAt: 'desc' }
    });

    const total = await prisma.user.count({
      where: search ? {
        OR: [
          { email: { contains: search as string, mode: 'insensitive' } },
          { name: { contains: search as string, mode: 'insensitive' } }
        ]
      } : {}
    });

    res.json({
      users,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Get system stats
adminRouter.get('/stats', async (req: AuthRequest, res) => {
  try {
    const cacheKey = 'admin:stats';
    const cached = await redis.get(cacheKey);

    if (cached) {
      return res.json(JSON.parse(cached));
    }

    const [
      totalUsers,
      totalConversations,
      totalMessages,
      activeConversations,
      resolvedConversations
    ] = await Promise.all([
      prisma.user.count(),
      prisma.conversation.count(),
      prisma.message.count(),
      prisma.conversation.count({ where: { status: 'OPEN' } }),
      prisma.conversation.count({ where: { status: 'RESOLVED' } })
    ]);

    // Get conversations by channel
    const channelStats = await prisma.conversation.groupBy({
        by: ['channel'],
        _count: {
          _all: true
        }
      });

    // Get daily conversation stats for last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const dailyStats = await prisma.$queryRaw`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as conversations
      FROM "Conversation"
      WHERE created_at >= ${thirtyDaysAgo}
      GROUP BY DATE(created_at)
      ORDER BY date DESC
    `;

    const stats = {
      totalUsers,
      totalConversations,
      totalMessages,
      activeConversations,
      resolvedConversations,
      resolutionRate: totalConversations > 0 ? 
        Math.round((resolvedConversations / totalConversations) * 100) : 0,
      channelStats: channelStats.map((stat: { channel: string; _count: { _all: number } }) => ({
        channel: stat.channel,
        count: stat._count._all
      })),
      dailyStats
    };

    // Cache for 5 minutes
    await redis.setex(cacheKey, 300, JSON.stringify(stats));

    res.json(stats);
  } catch (error) {
    console.error('Get admin stats error:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

// Update user role
adminRouter.put('/users/:userId/role', async (req: AuthRequest, res) => {
  try {
    const { userId } = req.params;
    const { role } = req.body;

    if (!['USER', 'ADMIN'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: { role },
      select: { id: true, email: true, name: true, role: true }
    });

    res.json({ user });
  } catch (error) {
    console.error('Update user role error:', error);
    res.status(500).json({ error: 'Failed to update user role' });
  }
});

// Delete user
adminRouter.delete('/users/:userId', async (req: AuthRequest, res) => {
  try {
    const { userId } = req.params;

    // Delete user and all related data
    await prisma.$transaction([
      prisma.message.deleteMany({
        where: {
          conversation: { userId }
        }
      }),
      prisma.conversation.deleteMany({
        where: { userId }
      }),
      prisma.setting.deleteMany({
        where: { userId }
      }),
      prisma.integration.deleteMany({
        where: { userId }
      }),
      prisma.subscription.deleteMany({
        where: { userId }
      }),
      prisma.user.delete({
        where: { id: userId }
      })
    ]);

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});