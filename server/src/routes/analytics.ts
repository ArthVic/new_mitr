import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';

export const analyticsRouter = Router();
analyticsRouter.use(authMiddleware);

// Get dashboard analytics
analyticsRouter.get('/dashboard', async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;
    
    // Get basic stats from database (no Redis needed)
    const [
      totalConversations,
      openConversations, 
      resolvedConversations,
      totalMessages,
      recentConversations
    ] = await Promise.all([
      // Total conversations
      prisma.conversation.count({
        where: { userId }
      }),
      
      // Open conversations
      prisma.conversation.count({
        where: { userId, status: 'OPEN' }
      }),
      
      // Resolved conversations
      prisma.conversation.count({
        where: { userId, status: 'RESOLVED' }
      }),
      
      // Total messages
      prisma.message.count({
        where: { 
          conversation: { userId }
        }
      }),
      
      // Recent conversations for activity
      prisma.conversation.findMany({
        where: { userId },
        include: {
          messages: {
            take: 1,
            orderBy: { createdAt: 'desc' }
          }
        },
        orderBy: { updatedAt: 'desc' },
        take: 10
      })
    ]);

    // Calculate channel stats
    const channelStats = await prisma.conversation.groupBy({
      by: ['channel'],
      where: { userId },
      _count: {
        id: true
      }
    });

    // Calculate daily activity (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const dailyActivity = await prisma.conversation.groupBy({
      by: ['createdAt'],
      where: {
        userId,
        createdAt: {
          gte: sevenDaysAgo
        }
      },
      _count: {
        id: true
      }
    });

    // Format daily activity for charts
    const activityData = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T');
      
      const count = dailyActivity.filter(activity => {
        const activityDate = activity.createdAt.toISOString().split('T');
        return activityDate === dateStr;
      }).reduce((sum, item) => sum + item._count.id, 0);
      
      activityData.push({
        date: dateStr,
        value: count
      });
    }

    // Response time calculation (mock for localhost)
    const avgResponseTime = '1.2s';
    const customerSatisfaction = '4.2/5';
    
    res.json({
      overview: {
        totalConversations,
        openConversations,
        resolvedConversations,
        totalMessages,
        avgResponseTime,
        customerSatisfaction
      },
      channelStats: channelStats.map(stat => ({
        name: stat.channel,
        queries: stat._count.id,
        responseTime: `${Math.random() * 2 + 0.5}s`, // Mock data for localhost
        satisfaction: `${(Math.random() * 1.5 + 3.5).toFixed(1)}/5`
      })),
      activityData,
      recentActivity: recentConversations.map(conv => ({
        id: conv.id,
        customerName: conv.customerName,
        channel: conv.channel,
        status: conv.status,
        lastMessage: conv.messages?.content?.substring(0, 50) + '...' || 'No messages',
        updatedAt: conv.updatedAt
      }))
    });

  } catch (error) {
    console.error('Analytics dashboard error:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard analytics' });
  }
});

// Get conversation analytics
analyticsRouter.get('/conversations', async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;
    
    // Parse query parameters
    const { 
      channel, 
      status, 
      startDate, 
      endDate,
      page = '1',
      limit = '20'
    } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const offset = (pageNum - 1) * limitNum;

    // Build where clause
    const where: any = { userId };
    
    if (channel) where.channel = channel;
    if (status) where.status = status;
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate as string);
      if (endDate) where.createdAt.lte = new Date(endDate as string);
    }

    const [conversations, total] = await Promise.all([
      prisma.conversation.findMany({
        where,
        include: {
          messages: {
            take: 1,
            orderBy: { createdAt: 'desc' }
          },
          _count: {
            messages: true
          }
        },
        orderBy: { createdAt: 'desc' },
        skip: offset,
        take: limitNum
      }),
      prisma.conversation.count({ where })
    ]);

    res.json({
      conversations,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum)
      }
    });

  } catch (error) {
    console.error('Conversation analytics error:', error);
    res.status(500).json({ error: 'Failed to fetch conversation analytics' });
  }
});

// Get performance metrics
analyticsRouter.get('/performance', async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;
    
    // Mock performance data for localhost development
    const performanceData = {
      responseTime: {
        average: 1.2,
        trend: '+0.3s from last week'
      },
      resolutionRate: {
        percentage: 89.5,
        trend: '+2.3% from last week'
      },
      customerSatisfaction: {
        score: 4.2,
        trend: '+0.1 from last week'
      },
      aiAutomation: {
        percentage: 76.8,
        trend: '+5.2% from last week'
      },
      channelPerformance: [
        { channel: 'WHATSAPP', responseTime: 2.1, satisfaction: 4.3, volume: 45 },
        { channel: 'INSTAGRAM', responseTime: 1.8, satisfaction: 4.0, volume: 32 },
        { channel: 'WEBSITE', responseTime: 0.8, satisfaction: 3.9, volume: 28 },
        { channel: 'VOICE_CALL', responseTime: 1.2, satisfaction: 4.5, volume: 15 }
      ]
    };

    res.json(performanceData);

  } catch (error) {
    console.error('Performance analytics error:', error);
    res.status(500).json({ error: 'Failed to fetch performance metrics' });
  }
});

// Export basic stats (for other services)
export async function getBasicAnalytics(userId: string) {
  try {
    const [totalConversations, openConversations, totalMessages] = await Promise.all([
      prisma.conversation.count({ where: { userId } }),
      prisma.conversation.count({ where: { userId, status: 'OPEN' } }),
      prisma.message.count({ where: { conversation: { userId } } })
    ]);

    return {
      totalConversations,
      openConversations,
      totalMessages
    };
  } catch (error) {
    console.error('Basic analytics error:', error);
    return {
      totalConversations: 0,
      openConversations: 0,
      totalMessages: 0
    };
  }
}
