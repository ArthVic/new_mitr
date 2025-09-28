// Simple job processing without Redis (for development)
import { socketManager } from './socket.js';
import { aiService } from './ai.js';
import { webhookService } from './webhook.js';

interface Job {
  id: string;
  type: string;
  data: any;
  createdAt: Date;
}

class SimpleJobQueue {
  private jobs: Job[] = [];
  private processing = false;
  
  constructor(private name: string) {}

  async add(type: string, data: any): Promise<string> {
    const job: Job = {
      id: `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      data,
      createdAt: new Date()
    };
    
    this.jobs.push(job);
    console.log(`📋 Job added to ${this.name}: ${type}`);
    
    // Process immediately (in real apps, this would be queued)
    this.processJobs();
    
    return job.id;
  }

  private async processJobs() {
    if (this.processing || this.jobs.length === 0) return;
    
    this.processing = true;
    
    while (this.jobs.length > 0) {
      const job = this.jobs.shift()!;
      
      try {
        await this.processJob(job);
        console.log(`✅ Job ${job.id} completed in ${this.name}`);
      } catch (error) {
        console.error(`❌ Job ${job.id} failed in ${this.name}:`, error);
      }
    }
    
    this.processing = false;
  }

  private async processJob(job: Job) {
    // Process different job types
    if (this.name === 'webhook processing' && job.type === 'process_incoming_message') {
      await this.processIncomingMessage(job.data);
    } else if (this.name === 'ai processing' && job.type === 'generate_response') {
      await this.processAIResponse(job.data);
    } else if (this.name === 'notifications' && job.type === 'send_notification') {
      await this.processNotification(job.data);
    }
  }

  private async processIncomingMessage(data: any) {
    const { platform, messageData } = data;
    console.log(`Processing ${platform} message:`, messageData);

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
    console.log(`Generating AI response for conversation ${conversationId}`);

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
    console.log(`Sending notification to user ${userId}: ${title}`);

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

// Create simple job queues
export const webhookQueue = new SimpleJobQueue('webhook processing');
export const aiQueue = new SimpleJobQueue('ai processing');
export const notificationQueue = new SimpleJobQueue('notifications');

console.log('📋 Simple job queues initialized successfully (Redis-free)');
