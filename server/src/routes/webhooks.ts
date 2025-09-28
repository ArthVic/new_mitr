import { Router, Request, Response } from 'express';
import { webhookService } from '../services/webhook.js';
import { webhookQueue } from '../services/queue.js';
import { prisma } from '../lib/prisma.js';


export const webhookRouter = Router();

// WhatsApp webhook
webhookRouter.get('/whatsapp', (req: Request, res: Response) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];
  
  if (mode === 'subscribe' && token === process.env.WHATSAPP_VERIFY_TOKEN) {
    res.status(200).send(challenge);
  } else {
    res.status(403).send('Forbidden');
  }
});

webhookRouter.post('/whatsapp', async (req: Request, res: Response) => {
  try {
    const signature = req.headers['x-hub-signature-256'] as string;
    const payload = JSON.stringify(req.body);
    
    if (!webhookService.verifyWhatsAppWebhook(payload, signature)) {
      return res.status(403).send('Unauthorized');
    }
    
    const { entry } = req.body;
    
    if (entry && entry?.changes) {
      for (const change of entry.changes) {
        if (change.field === 'messages') {
          const { messages } = change.value;
          
          if (messages && messages.length > 0) {
            for (const message of messages) {
              await webhookQueue.add('process_incoming_message', {
                platform: 'whatsapp',
                messageData: {
                  from: message.from,
                  text: message.text,
                  timestamp: message.timestamp,
                  messageId: message.id
                }
              });
            }
          }
        }
      }
    }
    
    res.status(200).send('OK');
  } catch (error) {
    console.error('WhatsApp webhook error:', error);
    res.status(500).send('Internal Server Error');
  }
});

// Instagram webhook
webhookRouter.get('/instagram', (req: Request, res: Response) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];
  
  if (mode === 'subscribe' && token === process.env.INSTAGRAM_VERIFY_TOKEN) {
    res.status(200).send(challenge);
  } else {
    res.status(403).send('Forbidden');
  }
});

webhookRouter.post('/instagram', async (req: Request, res: Response) => {
  try {
    const signature = req.headers['x-hub-signature-256'] as string;
    const payload = JSON.stringify(req.body);
    
    if (!webhookService.verifyInstagramWebhook(payload, signature)) {
      return res.status(403).send('Unauthorized');
    }
    
    const { entry } = req.body;
    
    if (entry && entry?.messaging) {
      for (const messagingEvent of entry.messaging) {
        if (messagingEvent.message) {
          await webhookQueue.add('process_incoming_message', {
            platform: 'instagram',
            messageData: {
              sender: messagingEvent.sender,
              message: messagingEvent.message,
              timestamp: messagingEvent.timestamp,
              messageId: messagingEvent.message.mid
            }
          });
        }
      }
    }
    
    res.status(200).send('OK');
  } catch (error) {
    console.error('Instagram webhook error:', error);
    res.status(500).send('Internal Server Error');
  }
});

// Website chat webhook (for embedded chat widgets)
webhookRouter.post('/website', async (req: Request, res: Response) => {
  try {
    const { customerName, message, sessionId } = req.body;
    
    // Find or create conversation
    let conversation = await prisma.conversation.findFirst({
      where: {
        channel: 'WEBSITE',
        customerName: sessionId
      }
    });
    
    if (!conversation) {
      conversation = await prisma.conversation.create({
        data: {
          channel: 'WEBSITE',
          customerName: customerName || 'Anonymous',
          status: 'OPEN'
        }
      });
    }
    
    // Create message
    const newMessage = await prisma.message.create({
      data: {
        conversationId: conversation.id,
        content: message,
        sender: 'CUSTOMER'
      }
    });
    
    // Trigger AI response
    await webhookQueue.add('process_incoming_message', {
      platform: 'website',
      messageData: {
        conversationId: conversation.id,
        text: message,
        messageId: newMessage.id
      }
    });
    
    res.status(200).json({ 
      success: true, 
      conversationId: conversation.id,
      messageId: newMessage.id 
    });
    
  } catch (error) {
    console.error('Website webhook error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});
