import { GoogleGenerativeAI } from '@google/generative-ai';
import { prisma } from '../lib/prisma.js';

class AIService {
  private genAI!: GoogleGenerativeAI;
  private model!: any;

  constructor() {
    if (process.env.GEMINI_API_KEY) {
      this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
      // CHANGE: Use the new model name
      this.model = this.genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    }
  }

  async generateResponse(conversationId: string, message: string): Promise<string | null> {
    try {
      if (!process.env.GEMINI_API_KEY || !this.model) {
        console.warn('Gemini API key not configured, returning default response');
        return this.getDefaultResponse(message);
      }

      // Get conversation context
      const conversation = await prisma.conversation.findUnique({
        where: { id: conversationId },
        include: {
          messages: {
            orderBy: { createdAt: 'asc' },
            take: 5 // Reduced for better performance
          }
        }
      });

      if (!conversation) {
        throw new Error('Conversation not found');
      }

      // Build conversation history for context
      const contextMessages = conversation.messages
        .map(msg => `${msg.sender === 'CUSTOMER' ? 'Customer' : 'Assistant'}: ${msg.content}`)
        .join('\n');

      // Create system prompt
      const systemPrompt = `You are a helpful customer support assistant. Be professional, concise, and helpful.

Channel: ${conversation.channel}
Customer: ${conversation.customerName || 'Customer'}

Previous conversation:
${contextMessages}

Current customer message: ${message}

Respond as the assistant (keep response under 200 words):`;

      // Generate AI response using Gemini
      const result = await this.model.generateContent(systemPrompt);
      const response = result.response;
      const responseText = response.text();
      
      if (!responseText) {
        throw new Error('No response generated');
      }

      console.log('✅ Gemini AI response generated successfully');
      return responseText;

    } catch (error) {
      if (error instanceof Error) {
        console.error('Gemini AI error:', error.message);
      } else {
        console.error('Gemini AI error:', error);
      }
      return this.getDefaultResponse(message);
    }
  }

  async generateSummary(conversationId: string): Promise<string> {
    try {
      const conversation = await prisma.conversation.findUnique({
        where: { id: conversationId },
        include: {
          messages: {
            orderBy: { createdAt: 'asc' }
          }
        }
      });

      if (!conversation || conversation.messages.length === 0) {
        return 'No conversation data available for summary.';
      }

      if (!process.env.GEMINI_API_KEY || !this.model) {
        return `Conversation summary: Customer ${conversation.customerName} contacted via ${conversation.channel}. ${conversation.messages.length} messages exchanged. Status: ${conversation.status}`;
      }

      const messageHistory = conversation.messages
        .map(msg => `${msg.sender}: ${msg.content}`)
        .join('\n');

      const prompt = `Summarize this customer support conversation in 2-3 sentences:

${messageHistory}

Summary:`;

      const result = await this.model.generateContent(prompt);
      const response = result.response.text();

      return response || 'Unable to generate summary.';

    } catch (error) {
      console.error('Summary generation error:', error);
      return 'Error generating conversation summary.';
    }
  }

  async shouldEscalate(conversationId: string, message: string): Promise<boolean> {
    try {
      // Simple keyword-based escalation for localhost
      const escalationKeywords = [
        'speak to human', 'human agent', 'manager', 'supervisor',
        'complaint', 'refund', 'cancel', 'billing issue',
        'not satisfied', 'unhappy', 'frustrated', 'angry'
      ];

      const lowerMessage = message.toLowerCase();
      const shouldEscalate = escalationKeywords.some(keyword => 
        lowerMessage.includes(keyword)
      );

      if (shouldEscalate) {
        console.log('🔄 Escalation triggered for conversation:', conversationId);
        
        await prisma.conversation.update({
          where: { id: conversationId },
          data: { status: 'HUMAN' }
        });
      }

      return shouldEscalate;

    } catch (error) {
      console.error('Escalation check error:', error);
      return false;
    }
  }

  private getDefaultResponse(message: string): string {
    const defaultResponses = [
      "Thank you for your message. I'm here to help you with your inquiry.",
      "I understand your concern. Let me assist you with that.",
      "Thanks for reaching out. I'll do my best to help resolve your issue.",
      "I appreciate you contacting us. How can I help you today?",
      "Thank you for your patience. I'm working on your request."
    ];

    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('order') || lowerMessage.includes('purchase')) {
      return "I can help you with your order inquiry. Could you please provide your order number?";
    }
    
    if (lowerMessage.includes('refund') || lowerMessage.includes('return')) {
      return "I understand you'd like information about a refund. I'm connecting you with our billing team.";
    }
    
    if (lowerMessage.includes('technical') || lowerMessage.includes('bug') || lowerMessage.includes('error')) {
      return "I see you're experiencing a technical issue. Let me connect you with our technical support team.";
    }

    return defaultResponses[Math.floor(Math.random() * defaultResponses.length)];
  }

  async testConnection(): Promise<boolean> {
    try {
      if (!process.env.GEMINI_API_KEY || !this.model) {
        return false;
      }

      const result = await this.model.generateContent("Reply with just 'OK' if you can see this.");
      const response = result.response.text().trim();
      
      return response.includes('OK');
    } catch (error) {
      if (error instanceof Error) {
        console.error('Gemini connection test failed:', error.message);
      } else {
        console.error('Gemini connection test failed:', error);
      }
      return false;
    }
  }
}

export const aiService = new AIService();

// Test connection on startup
aiService.testConnection().then(connected => {
  if (connected) {
    console.log('✅ Gemini AI connected successfully');
  } else {
    console.log('⚠️ Gemini AI not configured - using fallback responses');
  }
});
