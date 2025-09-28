// Localhost job processing (no Redis/Bull)
import { socketManager } from './socket.js';
import { aiService } from './ai.js';
import { webhookService } from './webhook.js';

console.log('📋 Localhost job processing initialized (no Redis)');

// Simple in-memory job processing
class LocalhostJobQueue {
  private processingJobs = new Set<string>();

  async add(jobType: string, data: any): Promise<string> {
    const jobId = `localhost-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    console.log(`📋 Processing ${jobType} job locally`);
    
    // Process immediately (no queuing in localhost)
    setImmediate(() => this.processJob(jobType, data, jobId));
    
    return jobId;
  }

  private async processJob(jobType: string, data: any, jobId: string) {
    if (this.processingJobs.has(jobId)) return;
    
    this.processingJobs.add(jobId);
    
    try {
      if (jobType === 'process_incoming_message') {
        await this.processIncomingMessage(data);
      } else if (jobType === 'generate_response') {
        await this.processAIResponse(data);
      } else if (jobType === 'send_notification') {
        await this.processNotification(data);
      }
      
      console.log(`✅ Job ${jobId} completed`);
    } catch (error) {
      console.error(`❌ Job ${jobId} failed:`, error);
    } finally {
      this.processingJobs.delete(jobId);
    }
  }

  private async processIncomingMessage(data: any) {
    const { platform, messageData } = data;
    console.log(`📨 Processing ${platform} message`);

    let conversationId: string | null = null;

    if (platform === 'whatsapp') {
      conversationId = await webhookService.processWhatsAppMessage(messageData);
    } else if (platform === 'instagram') {
      conversationId = await webhookService.processInstagramMessage(messageData);
    }

    if (conversationId) {
      await aiQueue.add('generate_response', {
        conversationId,
        message: messageData.text || messageData.message?.text,
        platform
      });
    }
  }

  private async processAIResponse(data: any) {
    const { conversationId, message, platform } = data;
    console.log(`🤖 Generating AI response for conversation ${conversationId}`);

    const aiResponse = await aiService.generateResponse(conversationId, message);
    
    if (aiResponse) {
      let sent = false;
      
      if (platform === 'whatsapp') {
        sent = await webhookService.sendWhatsAppMessage(conversationId, aiResponse);
      } else if (platform === 'instagram') {
        sent = await webhookService.sendInstagramMessage(conversationId, aiResponse);
      }

      if (sent && socketManager) {
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
  }

  private async processNotification(data: any) {
    const { userId, title, message, type } = data;
    console.log(`🔔 Sending notification to user ${userId}: ${title}`);

    if (socketManager) {
      socketManager.emitToUser(userId, 'notification', {
        title,
        message,
        type,
        timestamp: new Date().toISOString()
      });
    }
  }
}

// Export localhost job queues
export const webhookQueue = new LocalhostJobQueue();
export const aiQueue = new LocalhostJobQueue();
export const messageQueue = new LocalhostJobQueue();
export const notificationQueue = new LocalhostJobQueue();

console.log('✅ Localhost job queues ready');
