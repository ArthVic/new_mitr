import Queue from 'bull';
import { socketManager } from './socket.js';
import { aiService } from './ai.js';
import { webhookService } from './webhook.js';

// Initialize Redis connection for Bull queue
const redis = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD || undefined
};

// Create job queues
export const webhookQueue = new Queue('webhook processing', { redis });
export const aiQueue = new Queue('ai processing', { redis });
export const notificationQueue = new Queue('notifications', { redis });

// Webhook processing jobs
webhookQueue.process('process_incoming_message', async (job) => {
  try {
    const { platform, messageData } = job.data;
    console.log(`Processing ${platform} message:`, messageData);

    let conversationId: string | null = null;

    if (platform === 'whatsapp') {
      conversationId = await webhookService.processWhatsAppMessage(messageData);
    } else if (platform === 'instagram') {
      conversationId = await webhookService.processInstagramMessage(messageData);
    }

    if (conversationId) {
      // Queue AI response generation
      await aiQueue.add('generate_response', {
        conversationId,
        message: messageData.text || messageData.message?.text,
        platform
      });
    }

  } catch (error) {
    console.error('Webhook processing error:', error);
    throw error;
  }
});

// AI response generation jobs
aiQueue.process('generate_response', async (job) => {
  try {
    const { conversationId, message, platform } = job.data;
    console.log(`Generating AI response for conversation ${conversationId}`);

    // Generate AI response
    const aiResponse = await aiService.generateResponse(conversationId, message);
    
    if (aiResponse) {
      // Send response via appropriate channel
      let sent = false;
      
      if (platform === 'whatsapp') {
        sent = await webhookService.sendWhatsAppMessage(conversationId, aiResponse);
      } else if (platform === 'instagram') {
        sent = await webhookService.sendInstagramMessage(conversationId, aiResponse);
      }

      if (sent) {
        // Emit real-time update
        socketManager.emitToConversation(conversationId, 'new_message', {
          conversationId,
          message: {
            content: aiResponse,
            sender: 'AI',
            createdAt: new Date().toISOString()
          }
        });
      }
    }

  } catch (error) {
    console.error('AI response generation error:', error);
    throw error;
  }
});

// Notification processing jobs
notificationQueue.process('send_notification', async (job) => {
  try {
    const { userId, title, message, type } = job.data;
    console.log(`Sending notification to user ${userId}: ${title}`);

    // Emit real-time notification
    socketManager.emitToUser(userId, 'notification', {
      title,
      message,
      type,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Notification sending error:', error);
    throw error;
  }
});

// Queue monitoring
const queues = [webhookQueue, aiQueue, notificationQueue];

queues.forEach(queue => {
  queue.on('completed', (job) => {
    console.log(`✅ Job ${job.id} completed in queue ${queue.name}`);
  });

  queue.on('failed', (job, err) => {
    console.error(`❌ Job ${job.id} failed in queue ${queue.name}:`, err);
  });

  queue.on('stalled', (job) => {
    console.warn(`⚠️ Job ${job.id} stalled in queue ${queue.name}`);
  });
});

console.log('📋 Job queues initialized successfully');
