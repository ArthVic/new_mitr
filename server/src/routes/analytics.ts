import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';
import { redis } from '../index.js';

export const analyticsRouter = Router();
analyticsRouter.use(authMiddleware);

// Dashboard analytics
analyticsRouter.get('/dashboard', async (req: AuthRequest, res) => {
  try {
    const userId = req.userId;
    const cacheKey = `analytics:dashboard:${userId}`;
    
    // Check cache first
    const cached = await redis.get(cacheKey);
    if (cached) {
      return res.json(JSON.parse(cached));
    }
    
    // Calculate date ranges
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
    
    // Get current month conversations
    const currentMonthConversations = await prisma.conversation.findMany({
      where: {
        userId,
        createdAt: { gte: startOfMonth }
      },
      include: { messages: true }
    });
    
    // Get last month conversations for comparison
    const lastMonthConversations = await prisma.conversation.findMany({
      where: {
        userId,
        createdAt: { 
          gte: startOfLastMonth,
          lte: endOfLastMonth
        }
      },
      include: { messages: true }
    });
    
    // Calculate metrics
    const totalQueries = currentMonthConversations.length;
    const lastMonthQueries = lastMonthConversations.length;
    const queriesChange = lastMonthQueries > 0 ? 
      ((totalQueries - lastMonthQueries) / lastMonthQueries * 100).toFixed(1) : 0;
    
    // AI resolution rate
    const aiResolved = currentMonthConversations.filter(c => 
      c.status === 'RESOLVED' && 
      c.messages.some(m => m.sender === 'AI')
    ).length;
    const aiResolutionRate = totalQueries > 0 ? 
      ((aiResolved / totalQueries) * 100).toFixed(1) : 0;
    
    // Average response time (mock data - would calculate from actual timestamps)
    const avgResponseTime = currentMonthConversations.length > 0 ? 
      calculateAverageResponseTime(currentMonthConversations) : 0;
    
    // Active users
    const activeUsers = new Set(
      currentMonthConversations.map(c => c.customerName).filter(Boolean)
    ).size;
    
    // Channel distribution
    const channelStats = [
      {
        name: 'WhatsApp',
        queries: currentMonthConversations.filter(c => c.channel === 'WHATSAPP').length,
        percentage: totalQueries > 0 ? 
          Math.round((currentMonthConversations.filter(c => c.channel === 'WHATSAPP').length / totalQueries) * 100) : 0
      },
      {
        name: 'Instagram', 
        queries: currentMonthConversations.filter(c => c.channel === 'INSTAGRAM').length,
        percentage: totalQueries > 0 ? 
          Math.round((currentMonthConversations.filter(c => c.channel === 'INSTAGRAM').length / totalQueries) * 100) : 0
      },
      {
        name: 'Website',
        queries: currentMonthConversations.filter(c => c.channel === 'WEBSITE').length,
        percentage: totalQueries > 0 ? 
          Math.round((currentMonthConversations.filter(c => c.channel === 'WEBSITE').length / totalQueries) * 100) : 0
      }
    ];
    
    const analytics = {
      totalQueries,
      queriesChange: `${queriesChange > 0 ? '+' : ''}${queriesChange}%`,
      aiResolutionRate: `${aiResolutionRate}%`,
      avgResponseTime: `${avgResponseTime}s`,
      activeUsers,
      channelStats,
      recentActivity: await getRecentActivity(userId)
    };
    
    // Cache for 10 minutes
    await redis.setex(cacheKey, 600, JSON.stringify(analytics));
    
    res.json(analytics);
    
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

// Time series data for charts
analyticsRouter.get('/timeseries', async (req: AuthRequest, res) => {
  try {
    const { period = '7d', metric = 'conversations' } = req.query;
    const userId = req.userId;
    
    let days = 7;
    if (period === '30d') days = 30;
    if (period === '90d') days = 90;
    
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    const conversations = await prisma.conversation.findMany({
      where: {
        userId,
        createdAt: { gte: startDate }
      },
      include: { messages: true }
    });
    
    // Group by date
    const dataPoints = [];
    for (let i = 0; i < days; i++) {
      const date = new Date();
      date.setDate(date.getDate() - (days - 1 - i));
      const dateStr = date.toISOString().split('T');
      
      const dayConversations = conversations.filter(c => 
        c.createdAt.toISOString().split('T') === dateStr
      );
      
      let value = 0;
      if (metric === 'conversations') {
        value = dayConversations.length;
      } else if (metric === 'messages') {
        value = dayConversations.reduce((sum, c) => sum + c.messages.length, 0);
      } else if (metric === 'ai_responses') {
        value = dayConversations.reduce((sum, c) => 
          sum + c.messages.filter(m => m.sender === 'AI').length, 0
        );
      }
      
      dataPoints.push({
        date: dateStr,
        value
      });
    }
    
    res.json({ dataPoints });
    
  } catch (error) {
    console.error('Timeseries analytics error:', error);
    res.status(500).json({ error: 'Failed to fetch timeseries data' });
  }
});

// Helper functions
function calculateAverageResponseTime(conversations: any[]): number {
  // This would calculate actual response times based on message timestamps
  // For now, return a mock value
  return Math.round(Math.random() * 5 + 1); // 1-6 seconds
}

async function getRecentActivity(userId: string) {
  const recentConversations = await prisma.conversation.findMany({
    where: { userId },
    orderBy: { updatedAt: 'desc' },
    take: 5,
    include: { 
      messages: { 
        orderBy: { createdAt: 'desc' },
        take: 1 
      } 
    }
  });
  
  return recentConversations.map(conv => ({
    id: conv.id,
    customer: conv.customerName || 'Anonymous',
    channel: conv.channel.toLowerCase(),
    status: conv.status.toLowerCase(),
    lastMessage: conv.messages?.content || 'No messages',
    time: conv.updatedAt.toISOString()
  }));
}
