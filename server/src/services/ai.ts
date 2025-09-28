import { GoogleGenerativeAI } from '@google/generative-ai';
import { prisma } from '../lib/prisma.js';

class AIService {
  private genAI: GoogleGenerativeAI;
  private model: any;

  constructor() {
    if (process.env.GEMINI_API_KEY) {
      this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
      this.model = this.genAI.getGenerativeModel({ model: "gemini-pro" });
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
            take: 10 // Last 10 messages for context
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
      const systemPrompt = `You are a helpful customer support assistant for ${conversation.customerName || 'our company'}. 
Be professional, concise, and helpful. If you cannot resolve the issue, suggest escalating to a human agent.
Channel: ${conversation.channel}
Customer: ${conversation.customerName || 'Unknown'}

Previous conversation:
${contextMessages}

Current customer message: ${message}

Respond as the assistant:`;

      // Generate AI response using Gemini
      const result = await this.model.generateContent(systemPrompt);
      const response = result.response;
      const responseText = response.text();
      
      if (!responseText) {
        throw new Error('No response generated');
      }

      console.log('Gemini AI response generated for conversation:', conversationId);
      return responseText;

    } catch (error) {
      console.error('Gemini AI response generation error:', error);
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

      const messageHistory = conversation.messages
        .map(msg => `${msg.sender}: ${msg.content}`)
        .join('\n');

      if (!process.env.GEMINI_API_KEY || !this.model) {
        return `Conversation summary: Customer ${conversation.customerName} contacted via ${conversation.channel}. ${conversation.messages.length} messages exchanged. Status: ${conversation.status}`;
      }

      const prompt = `Summarize this customer support conversation in 2-3 sentences. Focus on the main issue and resolution:

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
      // Enhanced escalation detection using Gemini AI
      if (process.env.GEMINI_API_KEY && this.model) {
        const prompt = `Analyze this customer message and determine if it should be escalated to a human agent.

Customer message: "${message}"

Consider escalation if the message contains:
- Explicit requests for human agents/managers
- Complaints or dissatisfaction
- Complex technical issues
- Billing/refund demands
- Frustrated or angry tone
- Legal threats or serious complaints

Respond with only "YES" if should escalate, or "NO" if AI can handle it:`;

        try {
          const result = await this.model.generateContent(prompt);
          const response = result.response.text().trim().toUpperCase();
          
          if (response === 'YES') {
            console.log('AI-based escalation triggered for conversation:', conversationId);
            
            // Update conversation status
            await prisma.conversation.update({
              where: { id: conversationId },
              data: { status: 'HUMAN' }
            });
            
            return true;
          }
        } catch (error) {
          console.error('AI escalation analysis failed, using fallback:', error);
        }
      }

      // Fallback: keyword-based escalation
      const escalationKeywords = [
        'speak to human', 'human agent', 'manager', 'supervisor',
        'complaint', 'refund', 'cancel', 'billing issue',
        'not satisfied', 'unhappy', 'frustrated', 'angry',
        'lawsuit', 'legal action', 'terrible service'
      ];

      const lowerMessage = message.toLowerCase();
      const shouldEscalate = escalationKeywords.some(keyword => 
        lowerMessage.includes(keyword)
      );

      if (shouldEscalate) {
        console.log('Keyword-based escalation triggered for conversation:', conversationId);
        
        // Update conversation status
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

  async analyzeCustomerSentiment(message: string): Promise<{
    sentiment: 'positive' | 'neutral' | 'negative';
    confidence: number;
    emotions: string[];
  }> {
    try {
      if (!process.env.GEMINI_API_KEY || !this.model) {
        return {
          sentiment: 'neutral',
          confidence: 0.5,
          emotions: ['neutral']
        };
      }

      const prompt = `Analyze the sentiment and emotions in this customer message:

"${message}"

Respond in exactly this JSON format:
{
  "sentiment": "positive/neutral/negative",
  "confidence": 0.0-1.0,
  "emotions": ["emotion1", "emotion2"]
}`;

      const result = await this.model.generateContent(prompt);
      const responseText = result.response.text();
      
      try {
        const analysis = JSON.parse(responseText);
        return {
          sentiment: analysis.sentiment || 'neutral',
          confidence: analysis.confidence || 0.5,
          emotions: analysis.emotions || ['neutral']
        };
      } catch (parseError) {
        console.error('Failed to parse sentiment analysis:', parseError);
        return {
          sentiment: 'neutral',
          confidence: 0.5,
          emotions: ['neutral']
        };
      }

    } catch (error) {
      console.error('Sentiment analysis error:', error);
      return {
        sentiment: 'neutral',
        confidence: 0.5,
        emotions: ['neutral']
      };
    }
  }

  async generateVoiceCallSummary(transcription: string, callDuration: number): Promise<string> {
    try {
      if (!process.env.GEMINI_API_KEY || !this.model) {
        return `Voice call completed. Duration: ${Math.round(callDuration / 60)} minutes.`;
      }

      const prompt = `Create a professional summary for this customer service voice call:

Call Duration: ${Math.round(callDuration / 60)} minutes
Transcription:
${transcription}

Provide a concise summary including:
- Main issue discussed
- Resolution provided
- Customer satisfaction level
- Any follow-up actions needed

Summary:`;

      const result = await this.model.generateContent(prompt);
      return result.response.text() || 'Voice call summary unavailable.';

    } catch (error) {
      console.error('Voice call summary error:', error);
      return `Voice call completed. Duration: ${Math.round(callDuration / 60)} minutes.`;
    }
  }

  private getDefaultResponse(message: string): string {
    // Enhanced fallback responses
    const defaultResponses = [
      "Thank you for your message. I'm here to help you with your inquiry.",
      "I understand your concern. Let me assist you with that.",
      "Thanks for reaching out. I'll do my best to help resolve your issue.",
      "I appreciate you contacting us. How can I help you today?",
      "Thank you for your patience. I'm working on your request."
    ];

    // Smart keyword-based responses
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('order') || lowerMessage.includes('purchase') || lowerMessage.includes('buy')) {
      return "I can help you with your order inquiry. Could you please provide your order number so I can check the status for you?";
    }
    
    if (lowerMessage.includes('refund') || lowerMessage.includes('return') || lowerMessage.includes('money back')) {
      return "I understand you'd like information about a refund. I'm connecting you with our billing team who can review your account and assist with your refund request.";
    }
    
    if (lowerMessage.includes('technical') || lowerMessage.includes('bug') || lowerMessage.includes('error') || lowerMessage.includes('not working')) {
      return "I see you're experiencing a technical issue. Let me connect you with our technical support team who can provide specialized assistance to resolve this problem.";
    }

    if (lowerMessage.includes('billing') || lowerMessage.includes('payment') || lowerMessage.includes('charge')) {
      return "I can help with billing questions. Let me review your account details and connect you with our billing specialist if needed.";
    }

    if (lowerMessage.includes('cancel') || lowerMessage.includes('subscription') || lowerMessage.includes('account')) {
      return "I understand you have questions about your account or subscription. I'll help you with the necessary steps or connect you with the right team member.";
    }

    // Return contextual or random default response
    return defaultResponses[Math.floor(Math.random() * defaultResponses.length)];
  }

  // Method to test AI connection
  async testConnection(): Promise<boolean> {
    try {
      if (!process.env.GEMINI_API_KEY || !this.model) {
        return false;
      }

      const result = await this.model.generateContent("Reply with just 'OK' if you can see this message.");
      const response = result.response.text().trim();
      
      return response.includes('OK');
    } catch (error) {
      console.error('Gemini AI connection test failed:', error);
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
