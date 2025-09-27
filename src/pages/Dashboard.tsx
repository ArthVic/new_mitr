import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  MessageCircle, 
  TrendingUp, 
  Users, 
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  Bot,
  User,
  Settings,
  RefreshCw,
  Loader2,
  AlertTriangle
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

const Dashboard = () => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch conversations data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await api.conversations.getAll();
        setConversations(response.conversations || []);
      } catch (err) {
        const message = err instanceof ApiError ? err.message : 'Failed to load data';
        setError(message);
        console.error('Dashboard data fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleRefresh = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.conversations.getAll();
      setConversations(response.conversations || []);
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Failed to refresh data';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  // Calculate stats from real data
  const totalQueries = conversations.length;
  const aiResolved = conversations.filter(c => c.status === 'RESOLVED').length;
  const aiResolutionRate = totalQueries > 0 ? Math.round((aiResolved / totalQueries) * 100) : 0;
  const activeUsers = new Set(conversations.map(c => c.customerName).filter(Boolean)).size;

  const stats = [
    {
      title: "Total Queries",
      value: totalQueries.toLocaleString(),
      change: "+12.5%",
      trending: "up",
      icon: MessageCircle,
      description: "All time"
    },
    {
      title: "AI Resolution Rate",
      value: `${aiResolutionRate}%`,
      change: "+5.2%",
      trending: "up",
      icon: Bot,
      description: "Automated responses"
    },
    {
      title: "Response Time",
      value: "1.2s",
      change: "-0.3s",
      trending: "up",
      icon: Clock,
      description: "Average response"
    },
    {
      title: "Active Users",
      value: activeUsers.toLocaleString(),
      change: "+8.1%",
      trending: "up",
      icon: Users,
      description: "Unique customers"
    }
  ];

  // Get recent conversations from real data
  const recentConversations = conversations
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 4)
    .map(conv => ({
      id: conv.id,
      customer: conv.customerName || "Anonymous",
      message: conv.messages[conv.messages.length - 1]?.content || "No messages",
      time: new Date(conv.updatedAt).toLocaleString(),
      status: conv.status.toLowerCase(),
      platform: conv.channel.toLowerCase()
    }));

  // Calculate channel stats from real data
  const channelStats = [
    { 
      name: "WhatsApp", 
      queries: conversations.filter(c => c.channel === 'WHATSAPP').length, 
      percentage: totalQueries > 0 ? Math.round((conversations.filter(c => c.channel === 'WHATSAPP').length / totalQueries) * 100) : 0 
    },
    { 
      name: "Instagram", 
      queries: conversations.filter(c => c.channel === 'INSTAGRAM').length, 
      percentage: totalQueries > 0 ? Math.round((conversations.filter(c => c.channel === 'INSTAGRAM').length / totalQueries) * 100) : 0 
    },
    { 
      name: "Website", 
      queries: conversations.filter(c => c.channel === 'WEBSITE').length, 
      percentage: totalQueries > 0 ? Math.round((conversations.filter(c => c.channel === 'WEBSITE').length / totalQueries) * 100) : 0 
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Dashboard</h1>
            <p className="text-muted-foreground">Monitor your customer support performance</p>
          </div>
          <div className="flex items-center space-x-3 mt-4 md:mt-0">
            <Button variant="outline" size="sm" onClick={handleRefresh} disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button variant="outline" size="sm">
              <Settings className="h-4 w-4 mr-2" />
              Configure
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <Card key={index} className="mitr-card-hover">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {stat.title}
                  </CardTitle>
                  <Icon className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-foreground mb-1">
                    {stat.value}
                  </div>
                  <div className="flex items-center text-sm">
                    {stat.trending === "up" ? (
                      <ArrowUpRight className="h-4 w-4 text-success mr-1" />
                    ) : (
                      <ArrowDownRight className="h-4 w-4 text-destructive mr-1" />
                    )}
                    <span className={stat.trending === "up" ? "text-success" : "text-destructive"}>
                      {stat.change}
                    </span>
                    <span className="text-muted-foreground ml-1">
                      {stat.description}
                    </span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive" className="mb-8">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin mr-2" />
            <span>Loading dashboard data...</span>
          </div>
        )}

        {!loading && (
          <div className="grid lg:grid-cols-3 gap-8">
          {/* Recent Conversations */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  Recent Conversations
                  <Button variant="outline" size="sm">
                    View All
                  </Button>
                </CardTitle>
                <CardDescription>
                  Latest customer interactions across all channels
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentConversations.map((conversation) => (
                    <div key={conversation.id} className="flex items-start space-x-4 p-4 rounded-lg border border-border hover:bg-card-hover transition-colors">
                      <div className="flex-shrink-0">
                        <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                          <User className="h-5 w-5 text-primary" />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-sm font-medium text-foreground">
                            {conversation.customer}
                          </p>
                          <div className="flex items-center space-x-2">
                            <Badge 
                              variant={conversation.status === "ai" ? "secondary" : "default"}
                              className={conversation.status === "ai" ? "bg-primary-light text-primary" : "bg-accent-light text-accent-foreground"}
                            >
                              {conversation.status === "ai" ? (
                                <>
                                  <Bot className="h-3 w-3 mr-1" />
                                  AI
                                </>
                              ) : (
                                <>
                                  <User className="h-3 w-3 mr-1" />
                                  Human
                                </>
                              )}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {conversation.platform}
                            </Badge>
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground mb-1">
                          {conversation.message}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {conversation.time}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Channel Statistics */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Channel Performance</CardTitle>
                <CardDescription>
                  Query distribution across platforms
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {channelStats.map((channel, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium text-foreground">{channel.name}</span>
                        <span className="text-muted-foreground">{channel.queries} queries</span>
                      </div>
                      <Progress value={channel.percentage} className="h-2" />
                      <div className="text-right text-xs text-muted-foreground">
                        {channel.percentage}%
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>
                  Manage your support setup
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button className="w-full justify-start" variant="outline">
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Connect WhatsApp
                </Button>
                <Button className="w-full justify-start" variant="outline">
                  <TrendingUp className="h-4 w-4 mr-2" />
                  View Analytics
                </Button>
                <Button className="w-full justify-start" variant="outline">
                  <Settings className="h-4 w-4 mr-2" />
                  AI Settings
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;