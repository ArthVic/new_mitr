import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { authMiddleware, AuthRequest } from "../middleware/auth.js";

export const conversationRouter = Router();

conversationRouter.use(authMiddleware);

conversationRouter.get("/", async (req: AuthRequest, res) => {
  const conversations = await prisma.conversation.findMany({
    where: { userId: req.userId || undefined },
    include: { messages: { orderBy: { createdAt: "asc" } } },
    orderBy: { updatedAt: "desc" },
  });
  res.json({ conversations });
});

conversationRouter.get("/:id", async (req: AuthRequest, res) => {
  const { id } = req.params;
  const conversation = await prisma.conversation.findFirst({
    where: { id, userId: req.userId || undefined },
    include: { messages: { orderBy: { createdAt: "asc" } } },
  });
  if (!conversation) return res.status(404).json({ error: "Not found" });
  res.json({ conversation });
});

const createMessageSchema = z.object({
  content: z.string().min(1),
  sender: z.enum(["CUSTOMER", "AI", "HUMAN"]).default("CUSTOMER"),
});

conversationRouter.post("/:id/messages", async (req: AuthRequest, res) => {
  const { id } = req.params;
  const parsed = createMessageSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const convo = await prisma.conversation.findFirst({ where: { id, userId: req.userId || undefined } });
  if (!convo) return res.status(404).json({ error: "Not found" });
  const message = await prisma.message.create({
    data: { conversationId: id, content: parsed.data.content, sender: parsed.data.sender as any },
  });
  await prisma.conversation.update({ where: { id }, data: { updatedAt: new Date() } });
  res.status(201).json({ message });
});


