import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { authMiddleware, AuthRequest } from "../middleware/auth.js";

export const settingsRouter = Router();

settingsRouter.use(authMiddleware);

settingsRouter.get("/me", async (req: AuthRequest, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.userId! },
    select: { id: true, email: true, name: true },
  });

  const settings = await prisma.setting.findUnique({
    where: { userId: req.userId! },
    select: {
      aiEnabled: true,
      notifications: true,
      dataRetentionDays: true,
      businessName: true,
      phoneNumber: true,
      contactEmail: true,
      websiteUrl: true,
    },
  });

  const subscription = await prisma.subscription.findUnique({
    where: { userId: req.userId! },
  });

  const integrations = await prisma.integration.findMany({
    where: { userId: req.userId! },
  });

  res.json({ user, settings, subscription, integrations });
});

// ✅ Extended schema to include business fields
const updateSettingsSchema = z.object({
  aiEnabled: z.boolean().optional(),
  notifications: z.boolean().optional(),
  dataRetentionDays: z.number().int().min(1).max(365).optional(),
  businessName: z.string().max(255).optional(),
  phoneNumber: z.string().max(20).optional(),
  contactEmail: z.string().email().optional(),
  websiteUrl: z.string().url().optional(),
});

settingsRouter.put("/settings", async (req: AuthRequest, res) => {
  const parsed = updateSettingsSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  const updated = await prisma.setting.upsert({
    where: { userId: req.userId! },
    update: parsed.data,
    create: { userId: req.userId!, ...parsed.data }, 
  });

  res.json({ settings: updated });
});
