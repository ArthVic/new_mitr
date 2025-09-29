import { Router } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';

export const voiceRouter = Router();
voiceRouter.use(authMiddleware);

// Get active calls
voiceRouter.get('/calls/active', async (req: AuthRequest, res) => {
  try {
    // Mock data for localhost development
    const activeCalls: unknown[] = [];

    res.json({
      success: true,
      activeCalls,
      count: activeCalls.length
    });
  } catch (error) {
    console.error('Get active calls error:', error);
    res.status(500).json({ error: 'Failed to fetch active calls' });
  }
});

// Voice analytics
voiceRouter.get('/analytics', async (req: AuthRequest, res) => {
  try {
    const analytics = {
      totalCalls: 0,
      callDuration: '0m 0s',
      successRate: '100%',
      averageWaitTime: '0s'
    };

    res.json({
      success: true,
      analytics
    });
  } catch (error) {
    console.error('Voice analytics error:', error);
    res.status(500).json({ error: 'Failed to fetch voice analytics' });
  }
});

// Initiate call
voiceRouter.post('/initiate', async (req: AuthRequest, res) => {
  try {
    const { phoneNumber } = req.body;
    const callId = `call_${Date.now()}`;
    
    res.json({
      success: true,
      callId,
      phoneNumber,
      status: 'initiated'
    });
  } catch (error) {
    console.error('Initiate call error:', error);
    res.status(500).json({ error: 'Failed to initiate call' });
  }
});
