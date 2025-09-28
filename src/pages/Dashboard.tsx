import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  MessageCircle,
  TrendingUp,
  Users,
  Clock,
  ArrowUpRight,
  Bot,
  Phone,
  PhoneCall,
  MessageSquare,
  Instagram,
  RefreshCw,
  Loader2,
  AlertTriangle,
  Mic,
  Volume2
} from "lucide-react";
import { api, ApiError } from "@/lib/api";
import { socketManager } from "@/lib/socket";
import { VoiceCallInterface } from "@/components/VoiceCallInterface";
import { ChannelMetrics } from "@/components/ChannelMetrics";
import { RealtimeChart } from "@/components/RealtimeChart";

interface DashboardStats {
  totalQueries: number;
  aiResolutionRate: number;
  avgResponseTime: string;
  activeUsers: number;
  voiceStats: {
    totalCalls: number;
    averageDuration: number;
    aiResolutionRate: number;
    activeCalls: number;
  };
  channelStats: Array<{
    name: string;
    queries: number;
    percentage: number;
  }>;
  recentActivity: Array<{
    id: string;
    customer: string;
    channel: string;
    status: string;
    lastMessage: string;
    time: string;
  }>;
}

const Dashboard = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeCall, setActiveCall] = useState<string | null>(null);
  const [realTimeData, setRealTimeData] = useState<any[]>([]);

  // Initialize socket connection
  useEffect(() => {
    socketManager.connect();
    socketManager.connectVoice();

    // Listen for real-time updates
    socketManager.on('new_message', handleNewMessage);
    socketManager.on('call_started', handleCallStarted);
    socketManager.on('call_ended', handleCallEnded);
    socketManager.on('conversation_updated', handleConversationUpdated);

    return () => {
      socketManager.off('new_message', handleNewMessage);
      socketManager.off('call_started', handleCallStarted);
      socketManager.off('call_ended', handleCallEnded);
      socketManager.off('conversation_updated', handleConversationUpdated);
    };
  }, []);

  // Fetch dashboard data
  useEffect(() => {
    fetchDashboardData();
    
    // Refresh every 30 seconds
    const interval = setInterval(fetchDashboardData, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [dashboardData, voiceAnalytics, timeseriesData] = await Promise.all([
        api.analytics.getDashboard(),
        api.voice.getAnalytics('7d'),
        api.analytics.getTimeseries('7d', 'conversations')
      ]);

      setStats({
        ...dashboardData,
        voiceStats: voiceAnalytics.totals || {
          totalCalls: 0,
          averageDuration: 0,
          aiResolutionRate: 0,
          activeCalls: 0
        }
      });

      setRealTimeData(timeseriesData.dataPoints || []);
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Failed to load dashboard data';
      setError(message);
      console.error('Dashboard data fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Real-time event handlers
  const handleNewMessage = (data: any) => {
    // Update stats in real-time
    fetchDashboardData();
  };

  const handleCallStarted = (data: any) => {
    setActiveCall(data.callId);
    fetchDashboardData();
  };

  const handleCallEnded = (data: any) => {
    if (activeCall === data.callId) {
      setActiveCall(null);
    }
    fetchDashboardData();
  };

  const handleConversationUpdated = (data: any) => {
    fetchDashboardData();
  };

  const handleRefresh = () => {
    fetchDashboardData();
  };

  const handleInitiateCall = async () => {
    try {
      const phoneNumber = prompt('Enter phone number to call:');
      if (!phoneNumber) return;

      const response = await api.voice.initiateCall(phoneNumber);
      setActiveCall(response.callId);
    } catch (error) {
      console.error('Failed to initiate call:', error);
    }
  };

  if (loading && !stats) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading dashboard...</span>
      </div>
    );
  }

  if (error && !stats) {
    return (
      <div className="container mx-auto p-6">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  // Calculate combined stats
  const combinedStats = [
    {
      title: "Total Conversations",
      value: stats?.totalQueries?.toLocaleString() || "0",
      change: "+12.5%",
      trending: "up" as const,
      icon: MessageCircle,
      description: "All channels"
    },
    {
      title: "Voice Calls",
      value: stats?.voiceStats?.totalCalls?.toLocaleString() || "0",
      change: "+18.2%",
      trending: "up" as const,
      icon: Phone,
      description: "Total calls handled"
    },
    {
      title: "AI Resolution Rate",
      value: `${stats?.aiResolutionRate || 0}%`,
      change: "+5.2%",
      trending: "up" as const,
      icon: Bot,
      description: "Automated responses"
    },
    {
      title: "Avg Response Time",
      value: stats?.avgResponseTime || "0s",
      change: "-0.8s",
      trending: "up" as const,
      icon: Clock,
      description: "Across all channels"
    },
    {
      title: "Active Users",
      value: stats?.activeUsers?.toLocaleString() || "0",
      change: "+8.1%",
      trending: "up" as const,
      icon: Users,
      description: "Unique customers"
    },
    {
      title: "Avg Call Duration",
      value: `${Math.round(stats?.voiceStats?.averageDuration || 0)}s`,
      change: "-12s",
      trending: "up" as const,
      icon: Volume2,
      description: "Voice conversations"
    }
  ];

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Unified Dashboard</h1>
          <p className="text-muted-foreground">
            Monitor your omnichannel customer support performance
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleInitiateCall}
            className="flex items-center gap-2"
          >
            <PhoneCall className="h-4 w-4" />
            Start Call
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      {/* Active Call Interface */}
      {activeCall && (
        <Card className="border-primary">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mic className="h-5 w-5 animate-pulse text-primary" />
              Active Voice Call
            </CardTitle>
          </CardHeader>
          <CardContent>
            <VoiceCallInterface
              callId={activeCall}
              onCallEnd={() => setActiveCall(null)}
            />
          </CardContent>
        </Card>
      )}

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Stats Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {combinedStats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index} className="relative overflow-hidden">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {stat.title}
                </CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <div className="flex items-center text-xs">
                  {stat.trending === "up" ? (
                    <ArrowUpRight className="h-3 w-3 text-green-500" />
                  ) : (
                    <ArrowUpRight className="h-3 w-3 text-red-500 rotate-90" />
                  )}
                  <span className={stat.trending === "up" ? "text-green-500" : "text-red-500"}>
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

      {/* Tabs for different views */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="channels">Channels</TabsTrigger>
          <TabsTrigger value="voice">Voice Analytics</TabsTrigger>
          <TabsTrigger value="realtime">Real-time</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>
                  Latest customer interactions across all channels
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {stats?.recentActivity?.map((activity, index) => (
                    <div key={index} className="flex items-center space-x-4">
                      <div className="flex-shrink-0">
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                          {activity.channel === 'whatsapp' && <MessageSquare className="h-4 w-4" />}
                          {activity.channel === 'instagram' && <Instagram className="h-4 w-4" />}
                          {activity.channel === 'voice_call' && <Phone className="h-4 w-4" />}
                          {activity.channel === 'website' && <MessageCircle className="h-4 w-4" />}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-foreground">
                            {activity.customer}
                          </p>
                          <Badge
                            variant={activity.status === "resolved" ? "default" : "secondary"}
                            className="text-xs"
                          >
                            {activity.status}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {activity.channel}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground truncate">
                          {activity.lastMessage}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(activity.time).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Channel Performance */}
            <Card>
              <CardHeader>
                <CardTitle>Channel Performance</CardTitle>
                <CardDescription>
                  Conversation distribution across platforms
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {stats?.channelStats?.map((channel, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">{channel.name}</span>
                        <span className="text-sm text-muted-foreground">
                          {channel.queries} conversations
                        </span>
                      </div>
                      <Progress value={channel.percentage} className="h-2" />
                      <div className="text-right">
                        <span className="text-xs text-muted-foreground">
                          {channel.percentage}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="channels">
          <ChannelMetrics stats={stats} />
        </TabsContent>

        <TabsContent value="voice">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Voice Call Metrics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span>Total Calls</span>
                    <span className="font-medium">{stats?.voiceStats?.totalCalls || 0}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Average Duration</span>
                    <span className="font-medium">
                      {Math.round(stats?.voiceStats?.averageDuration || 0)}s
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>AI Resolution Rate</span>
                    <span className="font-medium">
                      {stats?.voiceStats?.aiResolutionRate || 0}%
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Active Calls</span>
                    <span className="font-medium text-primary">
                      {stats?.voiceStats?.activeCalls || 0}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Call Quality Insights</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-500">98.2%</div>
                    <div className="text-sm text-muted-foreground">Connection Success Rate</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-500">1.8s</div>
                    <div className="text-sm text-muted-foreground">Average Response Latency</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-500">94.5%</div>
                    <div className="text-sm text-muted-foreground">Transcription Accuracy</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="realtime">
          <RealtimeChart data={realTimeData} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Dashboard;