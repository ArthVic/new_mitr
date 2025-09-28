import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';

export const settingsRouter = Router();
settingsRouter.use(authMiddleware);

// Get user settings
settingsRouter.get('/me', async (req: AuthRequest, res) => {
  try {
    const settings = await prisma.setting.findUnique({
      where: { userId: req.userId! }
    });

    if (!settings) {
      // Create default settings
      const newSettings = await prisma.setting.create({
        data: {
          userId: req.userId!,
          aiEnabled: true,
          notifications: true,
          dataRetentionDays: 90
        }
      });
      return res.json({ settings: newSettings });
    }

    res.json({ settings });
  } catch (error) {
    console.error('Get settings error:', error);
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
});

const updateSettingsSchema = z.object({
  aiEnabled: z.boolean().optional(),
  notifications: z.boolean().optional(),
  dataRetentionDays: z.number().min(1).max(365).optional(),
  businessName: z.string().optional(),
  contactEmail: z.string().email().optional(),
  phoneNumber: z.string().optional(),
  websiteUrl: z.string().url().optional()
});

// Update settings
settingsRouter.put('/settings', async (req: AuthRequest, res) => {
  try {
    const parsed = updateSettingsSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.flatten() });
    }

    const settings = await prisma.setting.upsert({
      where: { userId: req.userId! },
      update: parsed.data,
      create: {
        userId: req.userId!,
        ...parsed.data
      }
    });

    res.json({ settings });
  } catch (error) {
    console.error('Update settings error:', error);
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

// Get user integrations
settingsRouter.get('/integrations', async (req: AuthRequest, res) => {
  try {
    const integrations = await prisma.integration.findMany({
      where: { userId: req.userId! },
      select: {
        id: true,
        provider: true,
        status: true,
        lastSyncAt: true
      }
    });

    res.json({ integrations });
  } catch (error) {
    console.error('Get integrations error:', error);
    res.status(500).json({ error: 'Failed to fetch integrations' });
  }
});

const createIntegrationSchema = z.object({
  provider: z.string(),
  accessToken: z.string(),
  refreshToken: z.string().optional(),
  config: z.record(z.any()).optional()
});

// Create integration
settingsRouter.post('/integrations', async (req: AuthRequest, res) => {
  try {
    const parsed = createIntegrationSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.flatten() });
    }

    const integration = await prisma.integration.create({
      data: {
        userId: req.userId!,
        provider: parsed.data.provider,
        status: 'connected'
      }
    });

    res.status(201).json({ integration });
  } catch (error) {
    console.error('Create integration error:', error);
    res.status(500).json({ error: 'Failed to create integration' });
  }
});

// Delete integration
settingsRouter.delete('/integrations/:id', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    const integration = await prisma.integration.findFirst({
      where: { id, userId: req.userId! }
    });

    if (!integration) {
      return res.status(404).json({ error: 'Integration not found' });
    }

    await prisma.integration.delete({
      where: { id }
    });

    res.json({ message: 'Integration deleted successfully' });
  } catch (error) {
    console.error('Delete integration error:', error);
    res.status(500).json({ error: 'Failed to delete integration' });
  }
});