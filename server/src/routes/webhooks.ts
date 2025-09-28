import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { messageQueue, webhookQueue } from '../services/jobs-localhost.js';
import { socketManager } from '../services/socket.js';

export const webhookRouter = Router();

// WhatsApp webhook verification
webhookRouter.get('/whatsapp', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  // Verify webhook (use your actual verify token)
  if (mode && token) {
    if (mode === 'subscribe' && token === process.env.WHATSAPP_VERIFY_TOKEN) {
      console.log('✅ WhatsApp webhook verified');
      res.status(200).send(challenge);
    } else {
      console.log('❌ WhatsApp webhook verification failed');
      res.sendStatus(403);
    }
  } else {
    res.sendStatus(400);
  }
});

// WhatsApp webhook - receive messages
webhookRouter.post('/whatsapp', async (req, res) => {
  try {
    console.log('📨 WhatsApp webhook received:', JSON.stringify(req.body, null, 2));

    const body = req.body;

    // WhatsApp sends webhook data in this structure
    if (body.object === 'whatsapp_business_account') {
      if (body.entry && body.entry.changes && body.entry.changes.value.messages) {
        const message = body.entry.changes.value.messages;
        const contact = body.entry.changes.value.contacts;

        // Process message via localhost job queue
        await messageQueue.add('process_incoming_message', {
          platform: 'whatsapp',
          messageData: {
            from: message.from,
            text: { body: message.text?.body || '' },
            timestamp: message.timestamp,
            contact: contact
          }
        });

        console.log('✅ WhatsApp message queued for processing');
      }
    }

    res.sendStatus(200);
  } catch (error) {
    console.error('WhatsApp webhook error:', error);
    res.sendStatus(500);
  }
});

// Instagram webhook verification
webhookRouter.get('/instagram', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode && token) {
    if (mode === 'subscribe' && token === process.env.INSTAGRAM_VERIFY_TOKEN) {
      console.log('✅ Instagram webhook verified');
      res.status(200).send(challenge);
    } else {
      console.log('❌ Instagram webhook verification failed');
      res.sendStatus(403);
    }
  } else {
    res.sendStatus(400);
  }
});

// Instagram webhook - receive messages
webhookRouter.post('/instagram', async (req, res) => {
  try {
    console.log('📨 Instagram webhook received:', JSON.stringify(req.body, null, 2));

    const body = req.body;

    if (body.object === 'instagram') {
      if (body.entry && body.entry.messaging) {
        const messaging = body.entry.messaging;

        if (messaging.message) {
          // Process Instagram message
          await messageQueue.add('process_incoming_message', {
            platform: 'instagram',
            messageData: {
              sender: { id: messaging.sender.id },
              message: { text: messaging.message.text },
              timestamp: messaging.timestamp
            }
          });

          console.log('✅ Instagram message queued for processing');
        }
      }
    }

    res.sendStatus(200);
  } catch (error) {
    console.error('Instagram webhook error:', error);
    res.sendStatus(500);
  }
});

// Generic webhook for testing
webhookRouter.post('/test', async (req, res) => {
  try {
    console.log('🧪 Test webhook received:', req.body);

    // Create a test conversation for localhost development
    const testConversation = await prisma.conversation.create({
      data: {
        channel: 'WEBSITE',
        customerName: 'Test Customer',
        status: 'OPEN',
        subject: 'Test Message from Webhook'
      }
    });

    // Create test message
    const testMessage = await prisma.message.create({
      data: {
        conversationId: testConversation.id,
        content: req.body.message || 'Test message from webhook',
        sender: 'CUSTOMER',
        messageType: 'TEXT'
      }
    });

    // Emit real-time update
    socketManager.emitToConversation(testConversation.id, 'new_conversation', {
      conversation: testConversation,
      message: testMessage
    });

    console.log('✅ Test webhook processed successfully');

    res.json({
      success: true,
      conversationId: testConversation.id,
      messageId: testMessage.id,
      message: 'Test webhook processed successfully'
    });

  } catch (error) {
    console.error('Test webhook error:', error);
    res.status(500).json({ error: 'Failed to process test webhook' });
  }
});

// Voice webhook (for future voice integration)
webhookRouter.post('/voice', async (req, res) => {
  try {
    console.log('📞 Voice webhook received:', req.body);

    // For now, just log voice webhooks
    // In production, this would handle voice call events
    
    res.json({
      success: true,
      message: 'Voice webhook received (localhost development)'
    });

  } catch (error) {
    console.error('Voice webhook error:', error);
    res.sendStatus(500);
  }
});

// Health check for webhooks
webhookRouter.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    webhooks: {
      whatsapp: 'ready',
      instagram: 'ready',
      voice: 'ready',
      test: 'ready'
    },
    timestamp: new Date().toISOString()
  });
});
