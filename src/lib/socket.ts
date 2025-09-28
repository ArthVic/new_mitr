import { io, Socket } from 'socket.io-client';
import { api } from './api';

class SocketManager {
  private socket: Socket | null = null;
  private voiceSocket: Socket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  // Initialize main socket connection
  connect() {
    if (this.socket?.connected) return;

    const token = localStorage.getItem('auth_token');
    if (!token) return;

    this.socket = io(import.meta.env.VITE_API_URL || 'http://localhost:3000', {
      auth: { token },
      transports: ['websocket', 'polling']
    });

    this.socket.on('connect', () => {
      console.log('Socket connected');
      this.reconnectAttempts = 0;
    });

    this.socket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
      if (reason === 'io server disconnect') {
        // Server disconnected, try to reconnect
        this.reconnect();
      }
    });

    this.socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      this.reconnect();
    });

    // Message events
    this.socket.on('new_message', (data) => {
      this.emit('new_message', data);
    });

    this.socket.on('conversation_updated', (data) => {
      this.emit('conversation_updated', data);
    });

    this.socket.on('escalated_to_human', (data) => {
      this.emit('escalated_to_human', data);
    });

    return this.socket;
  }

  // Initialize voice socket connection
  connectVoice() {
    if (this.voiceSocket?.connected) return;

    const token = localStorage.getItem('auth_token');
    if (!token) return;

    this.voiceSocket = io('/voice', {
      auth: { token }
    });

    this.voiceSocket.on('connect', () => {
      console.log('Voice socket connected');
    });

    this.voiceSocket.on('call_started', (data) => {
      this.emit('call_started', data);
    });

    this.voiceSocket.on('call_answered', (data) => {
      this.emit('call_answered', data);
    });

    this.voiceSocket.on('call_ended', (data) => {
      this.emit('call_ended', data);
    });

    this.voiceSocket.on('audio_response', (data) => {
      this.emit('audio_response', data);
    });

    this.voiceSocket.on('call_transferred', (data) => {
      this.emit('call_transferred', data);
    });

    return this.voiceSocket;
  }

  private reconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.log('Max reconnection attempts reached');
      return;
    }

    this.reconnectAttempts++;
    const delay = Math.pow(2, this.reconnectAttempts) * 1000; // Exponential backoff

    setTimeout(() => {
      console.log(`Reconnection attempt ${this.reconnectAttempts}`);
      this.connect();
    }, delay);
  }

  // Event emitter functionality
  private listeners: { [event: string]: Function[] } = {};

  on(event: string, callback: Function) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(callback);
  }

  off(event: string, callback: Function) {
    if (this.listeners[event]) {
      this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
    }
  }

  private emit(event: string, data: any) {
    if (this.listeners[event]) {
      this.listeners[event].forEach(callback => callback(data));
    }
  }

  // Socket methods
  joinConversation(conversationId: string) {
    this.socket?.emit('join_conversation', conversationId);
  }

  leaveConversation(conversationId: string) {
    this.socket?.emit('leave_conversation', conversationId);
  }

  sendMessage(conversationId: string, content: string, sender: string) {
    this.socket?.emit('send_message', { conversationId, content, sender });
  }

  startTyping(conversationId: string) {
    this.socket?.emit('typing_start', conversationId);
  }

  stopTyping(conversationId: string) {
    this.socket?.emit('typing_stop', conversationId);
  }

  // Voice methods
  joinCall(callId: string, userId: string) {
    this.voiceSocket?.emit('join_call', { callId, userId });
  }

  answerCall(callId: string) {
    this.voiceSocket?.emit('answer_call', { callId });
  }

  endCall(callId: string) {
    this.voiceSocket?.emit('end_call', { callId });
  }

  transferCall(callId: string, agentId: string) {
    this.voiceSocket?.emit('transfer_call', { callId, agentId });
  }

  muteCall(callId: string, muted: boolean) {
    this.voiceSocket?.emit('mute_call', { callId, muted });
  }

  sendAudioChunk(callId: string, audioData: ArrayBuffer) {
    this.voiceSocket?.emit('audio_chunk', { callId, audioData });
  }

  disconnect() {
    this.socket?.disconnect();
    this.voiceSocket?.disconnect();
  }
}

export const socketManager = new SocketManager();
