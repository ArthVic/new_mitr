import axios from 'axios';
import { prisma } from '../lib/prisma.js';
import crypto from 'crypto';

class WebhookService {
  // WhatsApp Business API Integration
  async processWhatsAppMessage(messageData: any): Promise<string | null> {
    try {
      const { from, text, timestamp } = messageData;
      
      // Find or create conversation
      let conversation = await prisma.conversation.findFirst({
        where: {
          channel: 'WHATSAPP',
          customerName: from
        }
      });
      
      if (!conversation) {
        conversation = await prisma.conversation.create({
          data: {
            channel: 'WHATSAPP',
            customerName: from,
            status: 'OPEN'
          }
        });
      }
      
      // Create message
      await prisma.message.create({
        data: {
          conversationId: conversation.id,
          content: text.body,
          sender: 'CUSTOMER',
          createdAt: new Date(parseInt(timestamp) * 1000)
        }
      });
      
      return conversation.id;
      
    } catch (error) {
      console.error('Error processing WhatsApp message:', error);
      return null;
    }
  }
  
  async sendWhatsAppMessage(conversationId: string, message: string): Promise<boolean> {
    try {
      const conversation = await prisma.conversation.findUnique({
        where: { id: conversationId }
      });
      
      if (!conversation || conversation.channel !== 'WHATSAPP') {
        return false;
      }
      
      const whatsappApiUrl = `https://graph.facebook.com/v18.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`;
      
      const response = await axios.post(whatsappApiUrl, {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: conversation.customerName,
        type: 'text',
        text: {
          body: message
        }
      }, {
        headers: {
          'Authorization': `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
          'Content-Type': 'application/json'
        }
      });
      
      return response.status === 200;
      
    } catch (error) {
      console.error('Error sending WhatsApp message:', error);
      return false;
    }
  }
  
  // Instagram Messaging API Integration
  async processInstagramMessage(messageData: any): Promise<string | null> {
    try {
      const { sender, message, timestamp } = messageData;
      
      // Find or create conversation
      let conversation = await prisma.conversation.findFirst({
        where: {
          channel: 'INSTAGRAM',
          customerName: sender.id
        }
      });
      
      if (!conversation) {
        conversation = await prisma.conversation.create({
          data: {
            channel: 'INSTAGRAM',
            customerName: sender.id,
            status: 'OPEN'
          }
        });
      }
      
      // Create message
      await prisma.message.create({
        data: {
          conversationId: conversation.id,
          content: message.text,
          sender: 'CUSTOMER',
          createdAt: new Date(timestamp)
        }
      });
      
      return conversation.id;
      
    } catch (error) {
      console.error('Error processing Instagram message:', error);
      return null;
    }
  }
  
  async sendInstagramMessage(conversationId: string, message: string): Promise<boolean> {
    try {
      const conversation = await prisma.conversation.findUnique({
        where: { id: conversationId }
      });
      
      if (!conversation || conversation.channel !== 'INSTAGRAM') {
        return false;
      }
      
      const instagramApiUrl = `https://graph.facebook.com/v18.0/me/messages`;
      
      const response = await axios.post(instagramApiUrl, {
        recipient: {
          id: conversation.customerName
        },
        message: {
          text: message
        }
      }, {
        headers: {
          'Authorization': `Bearer ${process.env.INSTAGRAM_ACCESS_TOKEN}`,
          'Content-Type': 'application/json'
        }
      });
      
      return response.status === 200;
      
    } catch (error) {
      console.error('Error sending Instagram message:', error);
      return false;
    }
  }
  
  // Webhook verification for WhatsApp
  verifyWhatsAppWebhook(payload: string, signature: string): boolean {
    const expectedSignature = crypto
      .createHmac('sha256', process.env.WHATSAPP_WEBHOOK_SECRET!)
      .update(payload)
      .digest('hex');
    
    return signature === `sha256=${expectedSignature}`;
  }
  
  // Webhook verification for Instagram
  verifyInstagramWebhook(payload: string, signature: string): boolean {
    const expectedSignature = crypto
      .createHmac('sha256', process.env.INSTAGRAM_WEBHOOK_SECRET!)
      .update(payload)
      .digest('hex');
    
    return signature === `sha256=${expectedSignature}`;
  }
}

export const webhookService = new WebhookService();
