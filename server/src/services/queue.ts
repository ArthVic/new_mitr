import Queue from 'bull';
import { redis } from '../index.js';
import { aiService } from './ai.js';
import { socketManager } from './socket.js';
import { prisma } from '../lib/prisma.js';
import { webhookService } from './webhook.js';

// Create job queues
export const messageQueue = new Queue('message processing', {
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD
  }
});

export const webhookQueue = new Queue('webhook processing', {
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD
  }
});

export const notificationQueue = new Queue('notifications', {
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD
  }
});

// Message processing jobs
messageQueue.process('generate_ai_response', async (job) => {
  const { conversationId, messageId, customerMessage } = job.data;
  
  try {
    console.log(`Processing AI response for conversation: ${conversationId}`);
    
    // Check if conversation should be escalated
    const shouldEscalate = await aiService.shouldEscalateToHuman(conversationId, customerMessage);
    
    if (shouldEscalate) {
      // Mark conversation for human escalation
      await prisma.conversation.update({
        where: { id: conversationId },
        data: { status: 'HUMAN' }
      });
      
      // Notify human agents
      await notificationQueue.add('human_escalation', {
        conversationId,
        reason: 'AI escalation criteria met'
      });
      
      socketManager.emitToConversation(conversationId, 'escalated_to_human', {
        message: 'This conversation has been escalated to a human agent.'
      });
      
      return;
    }
    
    // Generate AI response
    const aiResponse = await aiService.generateResponse(conversationId, customerMessage);
    
    // Create AI message in database
    const aiMessage = await prisma.message.create({
      data: {
        conversationId,
        content: aiResponse,
        sender: 'AI'
      }
    });
    
    // Update conversation
    await prisma.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() }
    });
    
    // Send real-time response
    socketManager.emitToConversation(conversationId, 'new_message', {
      message: aiMessage,
      conversationId
    });
    
    // Send response to external platform if needed
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      select: { channel: true, customerName: true }
    });
    
    if (conversation?.channel === 'WHATSAPP') {
      await webhookService.sendWhatsAppMessage(conversationId, aiResponse);
    } else if (conversation?.channel === 'INSTAGRAM') {
      await webhookService.sendInstagramMessage(conversationId, aiResponse);
    }
    
    console.log(`AI response sent for conversation: ${conversationId}`);
    
  } catch (error) {
    console.error('Error processing AI response:', error);
    throw error;
  }
});

// Webhook processing jobs
webhookQueue.process('process_incoming_message', async (job) => {
  const { platform, messageData } = job.data;
  
  try {
    console.log(`Processing incoming ${platform} message`);
    
    let conversationId;
    
    if (platform === 'whatsapp') {
      conversationId = await webhookService.processWhatsAppMessage(messageData);
    } else if (platform === 'instagram') {
      conversationId = await webhookService.processInstagramMessage(messageData);
    }
    
    if (conversationId) {
      // Trigger AI response
      await messageQueue.add('generate_ai_response', {
        conversationId,
        messageId: messageData.messageId,
        customerMessage: messageData.text
      });
    }
    
  } catch (error) {
    console.error(`Error processing ${platform} message:`, error);
    throw error;
  }
});

// Notification jobs
notificationQueue.process('human_escalation', async (job) => {
  const { conversationId, reason } = job.data;
  
  try {
    // Get conversation details
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: { user: true }
    });
    
    if (conversation?.user?.email) {
      // Send email notification (implement email service)
      // await emailService.sendEscalationAlert(conversation.user.email, conversationId, reason);
    }
    
    // Emit real-time notification to all connected admins/agents
    socketManager.emitToUser('admin_notifications', 'conversation_escalated', {
      conversationId,
      customerName: conversation?.customerName,
      channel: conversation?.channel,
      reason
    });
    
  } catch (error) {
    console.error('Error sending escalation notification:', error);
  }
});

// Analytics processing
messageQueue.process('update_analytics', async (job) => {
  const { conversationId, messageId } = job.data;
  
  try {
    // Update conversation analytics
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: { messages: true }
    });
    
    if (conversation) {
      // Calculate response times, resolution rates, etc.
      // This would integrate with your analytics service
      console.log(`Updated analytics for conversation: ${conversationId}`);
    }
    
  } catch (error) {
    console.error('Error updating analytics:', error);
  }
});

// Queue event handlers
messageQueue.on('completed', (job) => {
  console.log(`Job ${job.id} completed successfully`);
});

messageQueue.on('failed', (job, err) => {
  console.error(`Job ${job.id} failed:`, err);
});

messageQueue.on('stalled', (job) => {
  console.warn(`Job ${job.id} stalled`);
});

// Clean up completed jobs
messageQueue.clean(24 * 60 * 60 * 1000, 'completed'); // Clean completed jobs after 24 hours
messageQueue.clean(24 * 60 * 60 * 1000, 'failed'); // Clean failed jobs after 24 hours
