import { Router } from 'express';
import { z } from 'zod';
import { aiService } from '../services/ai.js';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';
import { prisma } from '../lib/prisma.js';

export const aiRouter = Router();
aiRouter.use(authMiddleware);

const generateResponseSchema = z.object({
  conversationId: z.string(),
  message: z.string().min(1)
});

// Generate AI response manually
aiRouter.post('/generate-response', async (req: AuthRequest, res) => {
  try {
    const parsed = generateResponseSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.flatten() });
    }

    const { conversationId, message } = parsed.data;

    // Verify user owns conversation
    const conversation = await prisma.conversation.findFirst({
      where: { id: conversationId, userId: req.userId }
    });

    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    const response = await aiService.generateResponse(conversationId, message);

    res.json({ response });
  } catch (error) {
    console.error('AI response error:', error);
    res.status(500).json({ error: 'Failed to generate response' });
  }
});

// Get conversation summary
aiRouter.get('/summary/:conversationId', async (req: AuthRequest, res) => {
  try {
    const { conversationId } = req.params;

    const conversation = await prisma.conversation.findFirst({
      where: { id: conversationId, userId: req.userId }
    });

    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    const summary = await aiService.generateSummary(conversationId);

    res.json({ summary });
  } catch (error) {
    console.error('Summary generation error:', error);
    res.status(500).json({ error: 'Failed to generate summary' });
  }
});

// Check if conversation should be escalated
aiRouter.get('/should-escalate/:conversationId', async (req: AuthRequest, res) => {
  try {
    const { conversationId } = req.params;
    const { message } = req.query;

    const conversation = await prisma.conversation.findFirst({
      where: { id: conversationId, userId: req.userId }
    });

    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    const shouldEscalate = await aiService.shouldEscalateToHuman(
      conversationId, 
      message as string || ''
    );

    res.json({ shouldEscalate });
  } catch (error) {
    console.error('Escalation check error:', error);
    res.status(500).json({ error: 'Failed to check escalation' });
  }
});
