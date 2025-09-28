import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

interface RealtimeChartProps {
  data: Array<{
    date: string;
    value: number;
  }>;
}

export const RealtimeChart: React.FC<RealtimeChartProps> = ({ data }) => {
  // Transform data for better display
  const chartData = data.map(point => ({
    ...point,
    time: new Date(point.date).toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit' 
    })
  }));

  return (
    <div className="space-y-6">
      {/* Conversation Volume Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Conversation Volume (Last 7 Days)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="time" 
                  tick={{ fontSize: 12 }}
                  interval="preserveStartEnd"
                />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip 
                  labelFormatter={(value) => `Time: ${value}`}
                  formatter={(value: any) => [value, 'Conversations']}
                />
                <Line 
                  type="monotone" 
                  dataKey="value" 
                  stroke="#8884d8" 
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Channel Distribution */}
      <Card>
        <CardHeader>
          <CardTitle>Channel Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={[
                { channel: 'WhatsApp', conversations: 45, color: '#25D366' },
                { channel: 'Instagram', conversations: 32, color: '#E4405F' },
                { channel: 'Voice', conversations: 28, color: '#1DA1F2' },
                { channel: 'Website', conversations: 38, color: '#7C3AED' }
              ]}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="channel" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="conversations" fill="#8884d8" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
