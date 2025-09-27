import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import axios from "axios";
import { 
  User,
  Shield,
  CreditCard,
  MessageCircle,
  Trash2,
  Download,
  Upload,
  AlertTriangle,
  CheckCircle2,
  Globe,
  Smartphone,
  Instagram,
  Chrome,
  Bot,
  Bell
} from "lucide-react";

const Settings = () => {
  // 🔹 State for profile form
  const [businessName, setBusinessName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");

  const [aiEnabled, setAiEnabled] = useState(true);
  const [notifications, setNotifications] = useState(true);
  const [dataRetention, setDataRetention] = useState(90);

  // Fetch existing settings on mount
 useEffect(() => {
  const token = localStorage.getItem("auth_token");
  axios
    .get("/api/settings/me", {
      headers: { Authorization: `Bearer ${token}` },
    })
    .then(res => {
      const s = res.data.settings;
      if (s) {
        setBusinessName(s.businessName || "");
        setContactEmail(s.contactEmail || "");
        setPhoneNumber(s.phoneNumber || "");
        setWebsiteUrl(s.websiteUrl || "");
        setAiEnabled(s.aiEnabled ?? true);
        setNotifications(s.notifications ?? true);
        setDataRetention(s.dataRetentionDays ?? 90);
      }
    })
    .catch(err => console.error("Load profile failed:", err));
}, []);

   

  // Save handler
  
  const handleSave = async () => {
    try {
      const token = localStorage.getItem("auth_token");
      await axios.put("/api/settings", {
        businessName,
        contactEmail,
        phoneNumber: phoneNumber,    // ✅ match prisma column name
        websiteUrl: websiteUrl,   // ✅ match prisma column name
        aiEnabled,
        notifications,
        dataRetentionDays: dataRetention,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`, // only if backend requires auth
        },
      }
    );
      alert("Profile updated successfully ✅");
    } catch (err) {
      console.error(err);
      alert("Failed to save profile ❌");
    }
  };

  
  const integrations = [
    { name: "WhatsApp Business", icon: Smartphone, status: "connected", description: "Connect your WhatsApp Business account", lastSync: "2 hours ago" },
    { name: "Instagram Business", icon: Instagram, status: "connected", description: "Manage Instagram DMs and comments", lastSync: "1 hour ago" },
    { name: "Website Widget", icon: Chrome, status: "connected", description: "Embed chat widget on your website", lastSync: "Active" }
  ];

  const aiSettings = [
    { name: "Auto-Response", description: "Automatically respond to common queries", enabled: true },
    { name: "Smart Escalation", description: "Escalate complex queries to humans", enabled: true },
    { name: "Learning Mode", description: "AI learns from your responses", enabled: true },
    { name: "Sentiment Analysis", description: "Detect customer emotions", enabled: false }
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Settings</h1>
            <p className="text-muted-foreground">Manage your account and preferences</p>
          </div>
        </div>

        <Tabs defaultValue="general" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 lg:grid-cols-5">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="integrations">Integrations</TabsTrigger>
            <TabsTrigger value="ai">AI Settings</TabsTrigger>
            <TabsTrigger value="privacy">Privacy</TabsTrigger>
            <TabsTrigger value="billing">Billing</TabsTrigger>
          </TabsList>

          {/* General Settings */}
          <TabsContent value="general" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <User className="h-5 w-5" />
                  <span>Profile Information</span>
                </CardTitle>
                <CardDescription>
                  Update your business profile and contact information
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="businessName">Business Name</Label>
                    <Input id="businessName" value={businessName} onChange={(e) => setBusinessName(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="contactEmail">Contact Email</Label>
                    <Input id="contactEmail" type="email" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input id="phone" type="tel" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="website">Website</Label>
                    <Input id="website" type="url" value={websiteUrl} onChange={(e) => setWebsiteUrl(e.target.value)} />
                  </div>
                </div>
                <Button onClick={handleSave}>Save Changes</Button>
              </CardContent>
            </Card>

            {/* Notifications */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Bell className="h-5 w-5" />
                  <span>Notification Preferences</span>
                </CardTitle>
                <CardDescription>
                  Choose how you want to be notified
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">Email Notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive email alerts for important events
                    </p>
                  </div>
                  <Switch checked={notifications} onCheckedChange={setNotifications} />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">SMS Alerts</Label>
                    <p className="text-sm text-muted-foreground">
                      Get SMS for urgent escalations
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">Weekly Reports</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive weekly performance summaries
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Other tabs (integrations, AI, privacy, billing) remain unchanged */}
           {/* Integrations */}
           <TabsContent value="integrations" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <MessageCircle className="h-5 w-5" />
                  <span>Connected Channels</span>
                </CardTitle>
                <CardDescription>
                  Manage your connected messaging platforms
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {integrations.map((integration, index) => {
                    const Icon = integration.icon;
                    return (
                      <div key={index} className="flex items-center justify-between p-4 border border-border rounded-lg">
                        <div className="flex items-center space-x-4">
                          <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                            <Icon className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <h3 className="font-medium text-foreground">{integration.name}</h3>
                            <p className="text-sm text-muted-foreground">{integration.description}</p>
                            <p className="text-xs text-muted-foreground">Last sync: {integration.lastSync}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3">
                          <Badge 
                            variant={integration.status === 'connected' ? 'default' : 'secondary'}
                            className={integration.status === 'connected' ? 'bg-success text-success-foreground' : ''}
                          >
                            {integration.status === 'connected' && <CheckCircle2 className="w-3 h-3 mr-1" />}
                            {integration.status}
                          </Badge>
                          <Button variant="outline" size="sm">
                            {integration.status === 'connected' ? 'Configure' : 'Connect'}
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Add New Integration</CardTitle>
                <CardDescription>
                  Connect additional platforms to expand your reach
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Button variant="outline" className="h-20 flex-col space-y-2">
                    <Globe className="h-6 w-6" />
                    <span>Facebook</span>
                  </Button>
                  <Button variant="outline" className="h-20 flex-col space-y-2">
                    <MessageCircle className="h-6 w-6" />
                    <span>Telegram</span>
                  </Button>
                  <Button variant="outline" className="h-20 flex-col space-y-2">
                    <MessageCircle className="h-6 w-6" />
                    <span>Custom API</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* AI Settings */}
          <TabsContent value="ai" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Bot className="h-5 w-5" />
                  <span>AI Configuration</span>
                </CardTitle>
                <CardDescription>
                  Customize how Mitr's AI handles conversations
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">AI Assistant</Label>
                    <p className="text-sm text-muted-foreground">
                      Enable AI to automatically respond to queries
                    </p>
                  </div>
                  <Switch
                    checked={aiEnabled}
                    onCheckedChange={setAiEnabled}
                  />
                </div>

                <Separator />

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-foreground">AI Features</h3>
                  {aiSettings.map((setting, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label className="text-base">{setting.name}</Label>
                        <p className="text-sm text-muted-foreground">
                          {setting.description}
                        </p>
                      </div>
                      <Switch defaultChecked={setting.enabled} />
                    </div>
                  ))}
                </div>

                <Separator />

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-foreground">AI Training</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Button variant="outline">
                      <Upload className="h-4 w-4 mr-2" />
                      Upload Training Data
                    </Button>
                    <Button variant="outline">
                      <Download className="h-4 w-4 mr-2" />
                      Export Conversations
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Privacy Settings */}
          <TabsContent value="privacy" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Shield className="h-5 w-5" />
                  <span>Privacy & Data</span>
                </CardTitle>
                <CardDescription>
                  Control how your data is stored and used
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div>
                    <Label className="text-base">Data Retention Period</Label>
                    <p className="text-sm text-muted-foreground mb-3">
                      How long should we keep your conversation data?
                    </p>
                    <div className="grid grid-cols-3 gap-3">
                      <Button 
                        variant={dataRetention === 30 ? "default" : "outline"}
                        onClick={() => setDataRetention(30)}
                      >
                        30 days
                      </Button>
                      <Button 
                        variant={dataRetention === 90 ? "default" : "outline"}
                        onClick={() => setDataRetention(90)}
                      >
                        90 days
                      </Button>
                      <Button 
                        variant={dataRetention === 365 ? "default" : "outline"}
                        onClick={() => setDataRetention(365)}
                      >
                        1 year
                      </Button>
                    </div>
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-base">Data Analytics</Label>
                      <p className="text-sm text-muted-foreground">
                        Allow anonymous usage analytics to improve service
                      </p>
                    </div>
                    <Switch defaultChecked />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-base">Data Sharing</Label>
                      <p className="text-sm text-muted-foreground">
                        Share anonymized data for research purposes
                      </p>
                    </div>
                    <Switch />
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-foreground">Data Management</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Button variant="outline">
                        <Download className="h-4 w-4 mr-2" />
                        Export All Data
                      </Button>
                      <Button variant="destructive">
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete All Data
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-destructive/50">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-destructive">
                  <AlertTriangle className="h-5 w-5" />
                  <span>Danger Zone</span>
                </CardTitle>
                <CardDescription>
                  Irreversible actions that will affect your account
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="destructive">
                  Delete Account
                </Button>
                <p className="text-sm text-muted-foreground mt-2">
                  This will permanently delete your account and all associated data. This action cannot be undone.
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Billing */}
          <TabsContent value="billing" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <CreditCard className="h-5 w-5" />
                  <span>Current Plan</span>
                </CardTitle>
                <CardDescription>
                  Manage your subscription and billing
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="border border-border rounded-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-2xl font-bold text-foreground">Growth Plan</h3>
                      <p className="text-muted-foreground">₹1,499/month</p>
                    </div>
                    <Badge className="bg-success text-success-foreground">Active</Badge>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div>
                      <p className="text-sm text-muted-foreground">Queries Used</p>
                      <p className="text-2xl font-bold text-foreground">1,247</p>
                      <p className="text-xs text-muted-foreground">of 2,500</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Next Billing</p>
                      <p className="text-lg font-semibold text-foreground">Jan 15, 2024</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Payment Method</p>
                      <p className="text-lg font-semibold text-foreground">•••• 4242</p>
                    </div>
                  </div>
                  <div className="flex space-x-3">
                    <Button variant="outline">Change Plan</Button>
                    <Button variant="outline">Update Payment</Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Billing History</CardTitle>
                <CardDescription>
                  View and download your previous invoices
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    { date: "Dec 15, 2023", amount: "₹1,499", status: "Paid" },
                    { date: "Nov 15, 2023", amount: "₹1,499", status: "Paid" },
                    { date: "Oct 15, 2023", amount: "₹1,499", status: "Paid" }
                  ].map((invoice, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border border-border rounded-lg">
                      <div>
                        <p className="font-medium text-foreground">{invoice.date}</p>
                        <p className="text-sm text-muted-foreground">Growth Plan</p>
                      </div>
                      <div className="flex items-center space-x-3">
                        <span className="font-semibold text-foreground">{invoice.amount}</span>
                        <Badge variant="outline" className="bg-success-light text-success">
                          {invoice.status}
                        </Badge>
                        <Button variant="outline" size="sm">
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Settings;
