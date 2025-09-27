import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  MessageCircle, 
  User,
  Bot,
  Search,
  Filter,
  MoreVertical,
  ArrowUpRight,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Send
} from "lucide-react";
import { api, ApiError } from "@/lib/api";

interface Conversation {
  id: string;
  subject?: string;
  channel: 'WHATSAPP' | 'INSTAGRAM' | 'WEBSITE';
  status: 'OPEN' | 'HUMAN' | 'RESOLVED';
  createdAt: string;
  updatedAt: string;
  customerName?: string;
  messages: Message[];
}

interface Message {
  id: string;
  content: string;
  sender: 'CUSTOMER' | 'AI' | 'HUMAN';
  createdAt: string;
}

const Conversations = () => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch conversations data
  useEffect(() => {
    const fetchConversations = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await api.conversations.getAll();
        setConversations(response.conversations || []);
        // Select first conversation if available
        if (response.conversations && response.conversations.length > 0) {
          setSelectedConversation(response.conversations[0].id);
        }
      } catch (err) {
        const message = err instanceof ApiError ? err.message : 'Failed to load conversations';
        setError(message);
        console.error('Conversations fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchConversations();
  }, []);

  // Get current conversation and its messages
  const currentConversation = conversations.find(c => c.id === selectedConversation);
  const messages = currentConversation?.messages || [];

  const handleSendMessage = async () => {
    if (newMessage.trim() && selectedConversation) {
      try {
        setSendingMessage(true);
        await api.conversations.createMessage(selectedConversation, newMessage.trim(), 'HUMAN');
        setNewMessage("");
        // Refresh conversations to get updated messages
        const response = await api.conversations.getAll();
        setConversations(response.conversations || []);
      } catch (err) {
        const message = err instanceof ApiError ? err.message : 'Failed to send message';
        setError(message);
        console.error('Send message error:', err);
      } finally {
        setSendingMessage(false);
      }
    }
  };

  const handleEscalate = () => {
    // Handle escalation to human agent
    console.log("Escalating to human agent");
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Conversations</h1>
            <p className="text-muted-foreground">Manage customer interactions across all channels</p>
          </div>
          <div className="flex items-center space-x-3 mt-4 md:mt-0">
            <Button variant="outline" size="sm">
              <Filter className="h-4 w-4 mr-2" />
              Filter
            </Button>
            <Button variant="outline" size="sm">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="grid lg:grid-cols-4 gap-6 h-[calc(100vh-200px)]">
          {/* Conversation List */}
          <div className="lg:col-span-1">
            <Card className="h-full">
              <CardHeader>
                <CardTitle className="text-lg">Active Chats</CardTitle>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search conversations..."
                    className="pl-10"
                  />
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin mr-2" />
                    <span className="text-sm text-muted-foreground">Loading conversations...</span>
                  </div>
                ) : conversations.length === 0 ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="text-center">
                      <MessageCircle className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">No conversations yet</p>
                    </div>
                  </div>
                ) : (
                  <div className="divide-y divide-border">
                    {conversations.map((conversation) => {
                      const lastMessage = conversation.messages[conversation.messages.length - 1];
                      const avatar = conversation.customerName ? conversation.customerName.substring(0, 2).toUpperCase() : "AN";
                      
                      return (
                        <div
                          key={conversation.id}
                          className={`p-4 cursor-pointer transition-colors hover:bg-card-hover ${
                            selectedConversation === conversation.id ? 'bg-primary-light border-r-2 border-r-primary' : ''
                          }`}
                          onClick={() => setSelectedConversation(conversation.id)}
                        >
                          <div className="flex items-start space-x-3">
                            <div className="flex-shrink-0">
                              <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center text-sm font-medium">
                                {avatar}
                              </div>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-1">
                                <p className="text-sm font-medium text-foreground truncate">
                                  {conversation.customerName || "Anonymous"}
                                </p>
                              </div>
                              <p className="text-xs text-muted-foreground truncate mb-2">
                                {lastMessage?.content || "No messages"}
                              </p>
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-2">
                                  <Badge 
                                    variant="outline" 
                                    className={`text-xs ${
                                      conversation.status === 'OPEN' ? 'bg-primary-light text-primary border-primary/20' :
                                      conversation.status === 'HUMAN' ? 'bg-accent-light text-accent-foreground border-accent/20' :
                                      'bg-success-light text-success border-success/20'
                                    }`}
                                  >
                                    {conversation.status === 'OPEN' && <Bot className="w-2 h-2 mr-1" />}
                                    {conversation.status === 'HUMAN' && <User className="w-2 h-2 mr-1" />}
                                    {conversation.status === 'RESOLVED' && <CheckCircle2 className="w-2 h-2 mr-1" />}
                                    {conversation.status.toLowerCase()}
                                  </Badge>
                                  <Badge variant="outline" className="text-xs">
                                    {conversation.channel.toLowerCase()}
                                  </Badge>
                                </div>
                              </div>
                              <p className="text-xs text-muted-foreground mt-1">
                                {new Date(conversation.updatedAt).toLocaleString()}
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Chat Area */}
          <div className="lg:col-span-3">
            <Card className="h-full flex flex-col">
              {/* Chat Header */}
              <CardHeader className="border-b border-border">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center text-sm font-medium">
                      {currentConversation?.customerName ? currentConversation.customerName.substring(0, 2).toUpperCase() : "AN"}
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">{currentConversation?.customerName || "Anonymous"}</h3>
                      <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                        <span>via {currentConversation?.channel?.toLowerCase()}</span>
                        <span>•</span>
                        <span>{currentConversation?.status?.toLowerCase()}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button variant="outline" size="sm" onClick={handleEscalate}>
                      <ArrowUpRight className="h-4 w-4 mr-2" />
                      Escalate to Human
                    </Button>
                    <Button variant="outline" size="sm">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>

              {/* Messages */}
              <CardContent className="flex-1 overflow-y-auto p-6">
                {error && (
                  <Alert variant="destructive" className="mb-4">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
                
                {messages.length === 0 ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <MessageCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">No messages yet</p>
                      <p className="text-sm text-muted-foreground">Start a conversation</p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {messages.map((message) => (
                      <div key={message.id} className={`flex ${message.sender === 'CUSTOMER' ? 'justify-start' : 'justify-end'}`}>
                        <div className={`max-w-xs lg:max-w-md ${
                          message.sender === 'CUSTOMER' 
                            ? 'bg-card border border-border' 
                            : message.sender === 'AI'
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-accent text-accent-foreground'
                        } rounded-lg px-4 py-2`}>
                          {message.sender === 'AI' && (
                            <div className="flex items-center space-x-1 mb-1 opacity-80">
                              <Bot className="h-3 w-3" />
                              <span className="text-xs">AI Assistant</span>
                            </div>
                          )}
                          {message.sender === 'HUMAN' && (
                            <div className="flex items-center space-x-1 mb-1 opacity-80">
                              <User className="h-3 w-3" />
                              <span className="text-xs">Human Agent</span>
                            </div>
                          )}
                          <p className="text-sm whitespace-pre-line">{message.content}</p>
                          <div className={`flex items-center justify-between mt-2 text-xs ${
                            message.sender === 'CUSTOMER' ? 'text-muted-foreground' : 'opacity-80'
                          }`}>
                            <span>{new Date(message.createdAt).toLocaleTimeString()}</span>
                            {message.sender !== 'CUSTOMER' && (
                              <div className="flex items-center space-x-1">
                                <CheckCircle2 className="h-3 w-3" />
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>

              {/* Message Input */}
              <div className="border-t border-border p-4">
                <div className="flex items-center space-x-2">
                  <div className="flex-1">
                    <Input
                      placeholder="Type your message..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    />
                  </div>
                  <Button onClick={handleSendMessage} disabled={!newMessage.trim() || sendingMessage}>
                    {sendingMessage ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
                  <div className="flex items-center space-x-2">
                    <Bot className="h-3 w-3" />
                    <span>AI is monitoring this conversation</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Clock className="h-3 w-3" />
                    <span>Response time: 1.2s</span>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Conversations;