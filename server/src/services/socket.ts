import { Server as SocketIOServer, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma.js';

interface AuthenticatedSocket extends Socket {
  userId?: string;
  userRole?: string;
}

class SocketManager {
  private io: SocketIOServer | null = null;
  private connectedUsers = new Map<string, Set<string>>(); // userId -> Set of socketIds

  initialize(io: SocketIOServer) {
    this.io = io;
    
    // Authentication middleware
    io.use(async (socket: AuthenticatedSocket, next) => {
      try {
        const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace('Bearer ', '');
        
        if (!token) {
          return next(new Error('Authentication required'));
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };
        const user = await prisma.user.findUnique({
          where: { id: decoded.userId },
          select: { id: true, role: true }
        });

        if (!user) {
          return next(new Error('User not found'));
        }

        socket.userId = user.id;
        socket.userRole = user.role;
        next();
      } catch (error) {
        next(new Error('Invalid token'));
      }
    });

    io.on('connection', (socket: AuthenticatedSocket) => {
      console.log(`User ${socket.userId} connected`);
      
      // Track connected users
      if (socket.userId) {
        if (!this.connectedUsers.has(socket.userId)) {
          this.connectedUsers.set(socket.userId, new Set());
        }
        this.connectedUsers.get(socket.userId)!.add(socket.id);
        
        // Join user-specific room
        socket.join(`user_${socket.userId}`);
        
        // Join conversations where user is involved
        this.joinUserConversations(socket);
      }

      // Handle message events
      socket.on('send_message', async (data) => {
        await this.handleSendMessage(socket, data);
      });

      socket.on('join_conversation', (conversationId) => {
        socket.join(`conversation_${conversationId}`);
      });

      socket.on('leave_conversation', (conversationId) => {
        socket.leave(`conversation_${conversationId}`);
      });

      socket.on('typing_start', (conversationId) => {
        socket.to(`conversation_${conversationId}`).emit('user_typing', {
          userId: socket.userId,
          conversationId
        });
      });

      socket.on('typing_stop', (conversationId) => {
        socket.to(`conversation_${conversationId}`).emit('user_stopped_typing', {
          userId: socket.userId,
          conversationId
        });
      });

      socket.on('disconnect', () => {
        console.log(`User ${socket.userId} disconnected`);
        if (socket.userId && this.connectedUsers.has(socket.userId)) {
          const userSockets = this.connectedUsers.get(socket.userId)!;
          userSockets.delete(socket.id);
          if (userSockets.size === 0) {
            this.connectedUsers.delete(socket.userId);
          }
        }
      });
    });
  }

  private async joinUserConversations(socket: AuthenticatedSocket) {
    if (!socket.userId) return;
    
    const conversations = await prisma.conversation.findMany({
      where: { userId: socket.userId },
      select: { id: true }
    });

    conversations.forEach(conv => {
      socket.join(`conversation_${conv.id}`);
    });
  }

  private async handleSendMessage(socket: AuthenticatedSocket, data: {
    conversationId: string;
    content: string;
    sender: 'CUSTOMER' | 'AI' | 'HUMAN';
  }) {
    try {
      // Validate conversation access
      const conversation = await prisma.conversation.findFirst({
        where: { 
          id: data.conversationId, 
          userId: socket.userId 
        }
      });

      if (!conversation) {
        socket.emit('error', { message: 'Conversation not found' });
        return;
      }

      // Create message
      const message = await prisma.message.create({
        data: {
          conversationId: data.conversationId,
          content: data.content,
          sender: data.sender
        }
      });

      // Update conversation timestamp
      await prisma.conversation.update({
        where: { id: data.conversationId },
        data: { updatedAt: new Date() }
      });

      // Broadcast to conversation participants
      this.io?.to(`conversation_${data.conversationId}`).emit('new_message', {
        message,
        conversationId: data.conversationId
      });

      // Trigger AI response if message is from customer
      if (data.sender === 'CUSTOMER') {
        const { messageQueue } = await import('./queue.js');
        await messageQueue.add('generate_ai_response', {
          conversationId: data.conversationId,
          messageId: message.id,
          customerMessage: data.content
        });
      }

    } catch (error) {
      console.error('Error handling send message:', error);
      socket.emit('error', { message: 'Failed to send message' });
    }
  }

  // Public methods for external use
  emitToUser(userId: string, event: string, data: any) {
    this.io?.to(`user_${userId}`).emit(event, data);
  }

  emitToConversation(conversationId: string, event: string, data: any) {
    this.io?.to(`conversation_${conversationId}`).emit(event, data);
  }

  getConnectedUsers() {
    return Array.from(this.connectedUsers.keys());
  }

  isUserConnected(userId: string): boolean {
    return this.connectedUsers.has(userId) && this.connectedUsers.get(userId)!.size > 0;
  }
}

export const socketManager = new SocketManager();
