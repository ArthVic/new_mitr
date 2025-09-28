import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  MessageCircle,
  User,
  Bot,
  Search,
  Filter,
  Send,
  Phone,
  PhoneCall,
  MessageSquare,
  Instagram,
  Loader2,
  AlertTriangle,
  UserPlus,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  PhoneOff
} from "lucide-react";
import { api, ApiError } from "@/lib/api";
import { socketManager } from "@/lib/socket";

interface Message {
  id: string;
  content: string;
  sender: 'CUSTOMER' | 'AI' | 'HUMAN';
  messageType: 'TEXT' | 'AUDIO';
  createdAt: string;
  transcription?: string;
  audioUrl?: string;
  audioDuration?: number;
}

interface Conversation {
  id: string;
  subject?: string;
  channel: 'WHATSAPP' | 'INSTAGRAM' | 'WEBSITE' | 'VOICE_CALL';
  status: 'OPEN' | 'HUMAN' | 'RESOLVED';
  createdAt: string;
  updatedAt: string;
  customerName?: string;
  customerPhone?: string;
  callDuration?: number;
  messages: Message[];
}

const Conversations = () => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeChannel, setActiveChannel] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [typingTimeout, setTypingTimeout] = useState<NodeJS.Timeout | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messageInputRef = useRef<HTMLInputElement>(null);

  // Initialize socket connection
  useEffect(() => {
    socketManager.connect();
    
    // Listen for real-time updates
    socketManager.on('new_message', handleNewMessage);
    socketManager.on('conversation_updated', handleConversationUpdated);
    socketManager.on('escalated_to_human', handleEscalatedToHuman);
    socketManager.on('user_typing', handleUserTyping);
    socketManager.on('user_stopped_typing', handleUserStoppedTyping);

    return () => {
      socketManager.off('new_message', handleNewMessage);
      socketManager.off('conversation_updated', handleConversationUpdated);
      socketManager.off('escalated_to_human', handleEscalatedToHuman);
      socketManager.off('user_typing', handleUserTyping);
      socketManager.off('user_stopped_typing', handleUserStoppedTyping);
    };
  }, []);

  // Fetch conversations
  useEffect(() => {
    fetchConversations();
  }, [activeChannel]);

  // Join conversation room when selected
  useEffect(() => {
    if (selectedConversation) {
      socketManager.joinConversation(selectedConversation);
      
      return () => {
        socketManager.leaveConversation(selectedConversation);
      };
    }
  }, [selectedConversation]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [conversations, selectedConversation]);

  const fetchConversations = async () => {
    try {
      setLoading(true);
      setError(null);

      let response;
      if (activeChannel === "all") {
        response = await api.conversations.getAll(1, 100);
      } else {
        response = await api.conversations.getByChannel(activeChannel as any);
      }

      setConversations(response.conversations || []);

      // Select first conversation if none selected
      if (!selectedConversation && response.conversations?.length > 0) {
        setSelectedConversation(response.conversations.id);
      }
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Failed to load conversations';
      setError(message);
      console.error('Conversations fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Real-time event handlers
  const handleNewMessage = (data: any) => {
    setConversations(prev => 
      prev.map(conv => 
        conv.id === data.conversationId
          ? { ...conv, messages: [...conv.messages, data.message] }
          : conv
      )
    );
  };

  const handleConversationUpdated = (data: any) => {
    setConversations(prev =>
      prev.map(conv =>
        conv.id === data.conversationId
          ? { ...conv, ...data.updates }
          : conv
      )
    );
  };

  const handleEscalatedToHuman = (data: any) => {
    setError(`Conversation ${data.conversationId} has been escalated to human support`);
  };

  const handleUserTyping = (data: any) => {
    if (data.conversationId === selectedConversation) {
      setIsTyping(true);
    }
  };

  const handleUserStoppedTyping = (data: any) => {
    if (data.conversationId === selectedConversation) {
      setIsTyping(false);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation) return;

    try {
      setSendingMessage(true);
      
      // Send via API
      await api.conversations.createMessage(selectedConversation, newMessage.trim(), 'HUMAN');
      
      // Send via socket for real-time updates
      socketManager.sendMessage(selectedConversation, newMessage.trim(), 'HUMAN');
      
      setNewMessage("");
      messageInputRef.current?.focus();
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Failed to send message';
      setError(message);
      console.error('Send message error:', err);
    } finally {
      setSendingMessage(false);
    }
  };

  const handleTyping = () => {
    if (selectedConversation) {
      socketManager.startTyping(selectedConversation);
      
      // Clear existing timeout
      if (typingTimeout) {
        clearTimeout(typingTimeout);
      }
      
      // Set new timeout to stop typing indicator
      const timeout = setTimeout(() => {
        socketManager.stopTyping(selectedConversation);
      }, 2000);
      
      setTypingTimeout(timeout);
    }
  };

  const handleEscalate = async () => {
    if (!selectedConversation) return;

    try {
      await api.conversations.updateStatus(selectedConversation, 'HUMAN');
      fetchConversations();
    } catch (error) {
      console.error('Failed to escalate conversation:', error);
    }
  };

  const handleStartVoiceCall = async () => {
    if (!selectedConversation) return;

    const conversation = conversations.find(c => c.id === selectedConversation);
    if (!conversation?.customerPhone) {
      setError('No phone number available for this customer');
      return;
    }

    try {
      const response = await api.voice.initiateCall(
        conversation.customerPhone,
        conversation.customerName
      );
      console.log('Voice call initiated:', response);
    } catch (error) {
      console.error('Failed to initiate voice call:', error);
      setError('Failed to initiate voice call');
    }
  };

  // Filter conversations based on search and channel
  const filteredConversations = conversations.filter(conv => {
    const matchesSearch = !searchQuery || 
      conv.customerName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      conv.messages.some(msg => msg.content.toLowerCase().includes(searchQuery.toLowerCase()));
    
    return matchesSearch;
  });

  const currentConversation = conversations.find(c => c.id === selectedConversation);

  const getChannelIcon = (channel: string) => {
    switch (channel) {
      case 'WHATSAPP': return <MessageSquare className="h-4 w-4" />;
      case 'INSTAGRAM': return <Instagram className="h-4 w-4" />;
      case 'VOICE_CALL': return <Phone className="h-4 w-4" />;
      default: return <MessageCircle className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'OPEN': return 'bg-primary text-primary-foreground';
      case 'HUMAN': return 'bg-yellow-500 text-white';
      case 'RESOLVED': return 'bg-green-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  return (
    <div className="container mx-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Conversations</h1>
          <p className="text-muted-foreground">
            Manage customer interactions across all channels
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Select value={activeChannel} onValueChange={setActiveChannel}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Channels</SelectItem>
              <SelectItem value="WHATSAPP">WhatsApp</SelectItem>
              <SelectItem value="INSTAGRAM">Instagram</SelectItem>
              <SelectItem value="WEBSITE">Website</SelectItem>
              <SelectItem value="VOICE_CALL">Voice Calls</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-200px)]">
        {/* Conversation List */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Active Conversations</span>
              <Badge variant="secondary">{filteredConversations.length}</Badge>
            </CardTitle>
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="max-h-[calc(100vh-350px)] overflow-y-auto">
              {loading ? (
                <div className="flex items-center justify-center p-6">
                  <Loader2 className="h-6 w-6 animate-spin" />
                  <span className="ml-2">Loading conversations...</span>
                </div>
              ) : filteredConversations.length === 0 ? (
                <div className="text-center p-6">
                  <MessageCircle className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                  <p className="text-muted-foreground">No conversations yet</p>
                  <p className="text-sm text-muted-foreground">
                    Conversations will appear here when customers reach out
                  </p>
                </div>
              ) : (
                <div className="space-y-1">
                  {filteredConversations.map((conversation) => {
                    const lastMessage = conversation.messages[conversation.messages.length - 1];
                    const isSelected = selectedConversation === conversation.id;
                    
                    return (
                      <div
                        key={conversation.id}
                        className={`p-4 cursor-pointer transition-colors hover:bg-muted/50 border-b ${
                          isSelected ? 'bg-primary/10 border-r-2 border-r-primary' : ''
                        }`}
                        onClick={() => setSelectedConversation(conversation.id)}
                      >
                        <div className="flex items-start space-x-3">
                          <div className="flex-shrink-0">
                            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                              {conversation.customerName
                                ? conversation.customerName.substring(0, 2).toUpperCase()
                                : "?"}
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <p className="text-sm font-medium truncate">
                                {conversation.customerName || "Anonymous"}
                              </p>
                              <div className="flex items-center space-x-1">
                                {getChannelIcon(conversation.channel)}
                                <Badge
                                  variant="secondary"
                                  className={`text-xs ${getStatusColor(conversation.status)}`}
                                >
                                  {conversation.status.toLowerCase()}
                                </Badge>
                              </div>
                            </div>
                            <p className="text-sm text-muted-foreground truncate mt-1">
                              {lastMessage?.content || "No messages"}
                            </p>
                            <div className="flex items-center justify-between mt-2">
                              <p className="text-xs text-muted-foreground">
                                {new Date(conversation.updatedAt).toLocaleString()}
                              </p>
                              {conversation.callDuration && (
                                <Badge variant="outline" className="text-xs">
                                  {Math.round(conversation.callDuration / 60)}min call
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Chat Area */}
        <Card className="lg:col-span-2 flex flex-col">
          {currentConversation ? (
            <>
              {/* Chat Header */}
              <CardHeader className="border-b">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      {currentConversation.customerName
                        ? currentConversation.customerName.substring(0, 2).toUpperCase()
                        : "?"}
                    </div>
                    <div>
                      <h3 className="font-semibold">
                        {currentConversation.customerName || "Anonymous"}
                      </h3>
                      <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                        {getChannelIcon(currentConversation.channel)}
                        <span>{currentConversation.channel.toLowerCase()}</span>
                        <span>•</span>
                        <Badge variant="outline" className={getStatusColor(currentConversation.status)}>
                          {currentConversation.status.toLowerCase()}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {currentConversation.customerPhone && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleStartVoiceCall}
                        className="flex items-center gap-2"
                      >
                        <PhoneCall className="h-4 w-4" />
                        Call
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleEscalate}
                      className="flex items-center gap-2"
                    >
                      <UserPlus className="h-4 w-4" />
                      Escalate
                    </Button>
                  </div>
                </div>
              </CardHeader>

              {/* Messages */}
              <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
                {error && (
                  <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                {currentConversation.messages.length === 0 ? (
                  <div className="text-center py-8">
                    <MessageCircle className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                    <p className="text-muted-foreground">No messages yet</p>
                    <p className="text-sm text-muted-foreground">
                      Start a conversation with this customer
                    </p>
                  </div>
                ) : (
                  <>
                    {currentConversation.messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex ${
                          message.sender === 'CUSTOMER' ? 'justify-start' : 'justify-end'
                        }`}
                      >
                        <div
                          className={`max-w-[70%] rounded-lg px-4 py-2 ${
                            message.sender === 'CUSTOMER'
                              ? 'bg-muted'
                              : message.sender === 'AI'
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-accent text-accent-foreground'
                          }`}
                        >
                          {message.sender !== 'CUSTOMER' && (
                            <div className="flex items-center gap-1 text-xs opacity-80 mb-1">
                              {message.sender === 'AI' ? (
                                <>
                                  <Bot className="h-3 w-3" />
                                  AI Assistant
                                </>
                              ) : (
                                <>
                                  <User className="h-3 w-3" />
                                  Human Agent
                                </>
                              )}
                            </div>
                          )}
                          
                          {message.messageType === 'AUDIO' ? (
                            <div className="space-y-2">
                              {message.audioUrl && (
                                <audio controls className="w-full">
                                  <source src={message.audioUrl} type="audio/mpeg" />
                                  Your browser does not support the audio element.
                                </audio>
                              )}
                              {message.transcription && (
                                <p className="text-sm italic opacity-80">
                                  Transcription: "{message.transcription}"
                                </p>
                              )}
                              {message.audioDuration && (
                                <p className="text-xs opacity-60">
                                  Duration: {message.audioDuration}s
                                </p>
                              )}
                            </div>
                          ) : (
                            <p className="whitespace-pre-wrap">{message.content}</p>
                          )}
                          
                          <div
                            className={`text-xs mt-1 ${
                              message.sender === 'CUSTOMER'
                                ? 'text-muted-foreground'
                                : 'opacity-70'
                            }`}
                          >
                            {new Date(message.createdAt).toLocaleTimeString()}
                          </div>
                        </div>
                      </div>
                    ))}
                    
                    {isTyping && (
                      <div className="flex justify-start">
                        <div className="bg-muted rounded-lg px-4 py-2">
                          <div className="flex items-center space-x-1">
                            <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"></div>
                            <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                            <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    <div ref={messagesEndRef} />
                  </>
                )}
              </CardContent>

              {/* Message Input */}
              <div className="border-t p-4">
                <div className="flex items-center space-x-2">
                  <Input
                    ref={messageInputRef}
                    placeholder="Type your message..."
                    value={newMessage}
                    onChange={(e) => {
                      setNewMessage(e.target.value);
                      handleTyping();
                    }}
                    onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                    disabled={sendingMessage}
                    className="flex-1"
                  />
                  <Button
                    onClick={handleSendMessage}
                    disabled={!newMessage.trim() || sendingMessage}
                    size="sm"
                  >
                    {sendingMessage ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                
                <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
                  <span>
                    {currentConversation.channel === 'VOICE_CALL' && '🎤 Voice conversation'}
                    {currentConversation.channel === 'WHATSAPP' && '📱 WhatsApp conversation'}
                    {currentConversation.channel === 'INSTAGRAM' && '📷 Instagram conversation'}
                    {currentConversation.channel === 'WEBSITE' && '💬 Website chat'}
                  </span>
                  <span>
                    AI monitoring • Response time: 1.2s
                  </span>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <MessageCircle className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Select a conversation</h3>
                <p className="text-muted-foreground">
                  Choose a conversation from the left to start messaging
                </p>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default Conversations;
