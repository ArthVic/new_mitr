import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { 
  MessageSquare, 
  Instagram, 
  Phone, 
  MessageCircle,
  TrendingUp,
  Users,
  Clock,
  CheckCircle
} from 'lucide-react';

interface ChannelMetricsProps {
  stats: any;
}

export const ChannelMetrics: React.FC<ChannelMetricsProps> = ({ stats }) => {
  const channelData = [
    {
      name: 'WhatsApp',
      icon: MessageSquare,
      color: 'bg-green-500',
      stats: {
        conversations: stats?.channelStats?.find((c: any) => c.name === 'WhatsApp')?.queries || 0,
        responseTime: '2.1s',
        satisfaction: '4.2/5',
        resolutionRate: '89%'
      }
    },
    {
      name: 'Instagram',
      icon: Instagram,
      color: 'bg-pink-500',
      stats: {
        conversations: stats?.channelStats?.find((c: any) => c.name === 'Instagram')?.queries || 0,
        responseTime: '1.8s',
        satisfaction: '4.0/5',
        resolutionRate: '82%'
      }
    },
    {
      name: 'Voice Calls',
      icon: Phone,
      color: 'bg-blue-500',
      stats: {
        conversations: stats?.voiceStats?.totalCalls || 0,
        responseTime: '1.2s',
        satisfaction: '4.5/5',
        resolutionRate: '94%'
      }
    },
    {
      name: 'Website',
      icon: MessageCircle,
      color: 'bg-purple-500',
      stats: {
        conversations: stats?.channelStats?.find((c: any) => c.name === 'Website')?.queries || 0,
        responseTime: '0.8s',
        satisfaction: '3.9/5',
        resolutionRate: '76%'
      }
    }
  ];

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {channelData.map((channel, index) => {
        const Icon = channel.icon;
        return (
          <Card key={index}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className={`p-2 rounded-lg ${channel.color} text-white`}>
                  <Icon className="h-4 w-4" />
                </div>
                {channel.name}
                <Badge variant="secondary">{channel.stats.conversations}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Response Time</p>
                  <p className="text-lg font-semibold">{channel.stats.responseTime}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Satisfaction</p>
                  <p className="text-lg font-semibold">{channel.stats.satisfaction}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Resolution Rate</p>
                  <p className="text-lg font-semibold">{channel.stats.resolutionRate}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Status</p>
                  <div className="flex items-center gap-1">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm">Active</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};