import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { 
  Settings as SettingsIcon, 
  MessageSquare, 
  Instagram, 
  Phone, 
  Bot, 
  Bell, 
  Shield, 
  Trash2,
  Plus,
  CheckCircle,
  XCircle,
  Loader2,
  AlertTriangle
} from "lucide-react";
import { api, ApiError } from "@/lib/api";

interface UserSettings {
  aiEnabled: boolean;
  notifications: boolean;
  dataRetentionDays: number;
  businessName?: string;
  contactEmail?: string;
  phoneNumber?: string;
  websiteUrl?: string;
}

interface Integration {
  id: string;
  provider: string;
  status: string;
  lastSyncAt: string;
}

const Settings = () => {
  const [settings, setSettings] = useState<UserSettings>({
    aiEnabled: true,
    notifications: true,
    dataRetentionDays: 90
  });
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    fetchSettings();
    fetchIntegrations();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await api.settings.getMe();
      setSettings(response.settings || {
        aiEnabled: true,
        notifications: true,
        dataRetentionDays: 90
      });
    } catch (err) {
      console.error('Failed to fetch settings:', err);
    }
  };

  const fetchIntegrations = async () => {
    try {
      const response = await api.settings.getIntegrations();
      setIntegrations(response.integrations || []);
    } catch (err) {
      console.error('Failed to fetch integrations:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    try {
      setSaving(true);
      setError(null);
      
      await api.settings.updateSettings(settings);
      setSuccess('Settings saved successfully');
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Failed to save settings';
      setError(message);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteIntegration = async (integrationId: string) => {
    try {
      await api.settings.deleteIntegration(integrationId);
      setIntegrations(prev => prev.filter(i => i.id !== integrationId));
      setSuccess('Integration removed successfully');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Failed to remove integration';
      setError(message);
    }
  };

  const getIntegrationIcon = (provider: string) => {
    switch (provider.toLowerCase()) {
      case 'whatsapp': return <MessageSquare className="h-4 w-4" />;
      case 'instagram': return <Instagram className="h-4 w-4" />;
      case 'voice': return <Phone className="h-4 w-4" />;
      default: return <SettingsIcon className="h-4 w-4" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'connected':
        return <Badge variant="default" className="bg-green-500"><CheckCircle className="h-3 w-3 mr-1" />Connected</Badge>;
      case 'error':
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Error</Badge>;
      default:
        return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading settings...</span>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="text-muted-foreground">
            Configure your Mitr platform preferences and integrations
          </p>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="border-green-500 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-500" />
          <AlertDescription className="text-green-700">{success}</AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="integrations">Integrations</TabsTrigger>
          <TabsTrigger value="ai">AI Settings</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Business Information</CardTitle>
              <CardDescription>
                Update your business details for customer-facing communications
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="businessName">Business Name</Label>
                  <Input
                    id="businessName"
                    value={settings.businessName || ''}
                    onChange={(e) => setSettings(prev => ({ ...prev, businessName: e.target.value }))}
                    placeholder="Your Business Name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contactEmail">Contact Email</Label>
                  <Input
                    id="contactEmail"
                    type="email"
                    value={settings.contactEmail || ''}
                    onChange={(e) => setSettings(prev => ({ ...prev, contactEmail: e.target.value }))}
                    placeholder="contact@yourbusiness.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phoneNumber">Phone Number</Label>
                  <Input
                    id="phoneNumber"
                    value={settings.phoneNumber || ''}
                    onChange={(e) => setSettings(prev => ({ ...prev, phoneNumber: e.target.value }))}
                    placeholder="+1 234 567 8900"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="websiteUrl">Website URL</Label>
                  <Input
                    id="websiteUrl"
                    type="url"
                    value={settings.websiteUrl || ''}
                    onChange={(e) => setSettings(prev => ({ ...prev, websiteUrl: e.target.value }))}
                    placeholder="https://yourbusiness.com"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Data Management</CardTitle>
              <CardDescription>
                Control how your data is stored and managed
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="dataRetention">Data Retention Period (days)</Label>
                <Input
                  id="dataRetention"
                  type="number"
                  min="30"
                  max="365"
                  value={settings.dataRetentionDays}
                  onChange={(e) => setSettings(prev => ({ ...prev, dataRetentionDays: parseInt(e.target.value) }))}
                />
                <p className="text-sm text-muted-foreground">
                  Conversations older than this will be automatically archived
                </p>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button onClick={handleSaveSettings} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Settings'
              )}
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="integrations" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Platform Integrations</CardTitle>
              <CardDescription>
                Manage your connected messaging platforms and communication channels
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {integrations.length === 0 ? (
                <div className="text-center py-8">
                  <SettingsIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No integrations configured</h3>
                  <p className="text-muted-foreground mb-4">
                    Connect your messaging platforms to start receiving messages
                  </p>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Integration
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {integrations.map((integration) => (
                    <div key={integration.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-muted rounded-lg">
                          {getIntegrationIcon(integration.provider)}
                        </div>
                        <div>
                          <h4 className="font-semibold capitalize">{integration.provider}</h4>
                          <p className="text-sm text-muted-foreground">
                            Last sync: {new Date(integration.lastSyncAt).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {getStatusBadge(integration.status)}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteIntegration(integration.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <Separator />

              <div className="space-y-4">
                <h4 className="font-semibold">Available Integrations</h4>
                <div className="grid gap-4 md:grid-cols-3">
                  <Card className="p-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <MessageSquare className="h-5 w-5 text-green-500" />
                      <span className="font-medium">WhatsApp</span>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">
                      Connect WhatsApp Business API for messaging
                    </p>
                    <Button size="sm" variant="outline" className="w-full">
                      Configure
                    </Button>
                  </Card>

                  <Card className="p-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <Instagram className="h-5 w-5 text-pink-500" />
                      <span className="font-medium">Instagram</span>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">
                      Handle Instagram direct messages
                    </p>
                    <Button size="sm" variant="outline" className="w-full">
                      Configure
                    </Button>
                  </Card>

                  <Card className="p-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <Phone className="h-5 w-5 text-blue-500" />
                      <span className="font-medium">Voice Calls</span>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">
                      Enable voice call support with Twilio
                    </p>
                    <Button size="sm" variant="outline" className="w-full">
                      Configure
                    </Button>
                  </Card>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ai" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bot className="h-5 w-5" />
                AI Assistant Settings
              </CardTitle>
              <CardDescription>
                Configure how the AI assistant responds to customers
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <div className="text-base">Enable AI Assistant</div>
                  <div className="text-sm text-muted-foreground">
                    Allow AI to automatically respond to customer messages
                  </div>
                </div>
                <Switch
                  checked={settings.aiEnabled}
                  onCheckedChange={(checked) => setSettings(prev => ({ ...prev, aiEnabled: checked }))}
                />
              </div>

              <Separator />

              <div className="space-y-4">
                <h4 className="font-semibold">AI Performance</h4>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <div className="text-sm">Response Quality</div>
                    <div className="text-2xl font-bold text-green-500">94.2%</div>
                    <div className="text-xs text-muted-foreground">Customer satisfaction</div>
                  </div>
                  <div className="space-y-2">
                    <div className="text-sm">Resolution Rate</div>
                    <div className="text-2xl font-bold text-blue-500">87.5%</div>
                    <div className="text-xs text-muted-foreground">Auto-resolved queries</div>
                  </div>
                  <div className="space-y-2">
                    <div className="text-sm">Response Time</div>
                    <div className="text-2xl font-bold text-purple-500">1.2s</div>
                    <div className="text-xs text-muted-foreground">Average response</div>
                  </div>
                  <div className="space-y-2">
                    <div className="text-sm">Escalations</div>
                    <div className="text-2xl font-bold text-orange-500">12.5%</div>
                    <div className="text-xs text-muted-foreground">To human agents</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notification Preferences
              </CardTitle>
              <CardDescription>
                Choose how you want to be notified about important events
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <div className="text-base">Enable Notifications</div>
                  <div className="text-sm text-muted-foreground">
                    Receive notifications for new messages and important events
                  </div>
                </div>
                <Switch
                  checked={settings.notifications}
                  onCheckedChange={(checked) => setSettings(prev => ({ ...prev, notifications: checked }))}
                />
              </div>

              <Separator />

              <div className="space-y-4">
                <h4 className="font-semibold">Notification Types</h4>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <div className="text-sm">New Messages</div>
                      <div className="text-xs text-muted-foreground">
                        When customers send new messages
                      </div>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <div className="text-sm">Escalations</div>
                      <div className="text-xs text-muted-foreground">
                        When AI escalates to human agents
                      </div>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <div className="text-sm">Voice Calls</div>
                      <div className="text-xs text-muted-foreground">
                        Incoming voice call notifications
                      </div>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <div className="text-sm">System Alerts</div>
                      <div className="text-xs text-muted-foreground">
                        Integration errors and system issues
                      </div>
                    </div>
                    <Switch defaultChecked />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Settings;
