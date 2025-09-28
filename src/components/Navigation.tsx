import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  MessageCircle, 
  BarChart3, 
  Settings, 
  CreditCard,
  Menu,
  X,
  Sparkles,
  LogOut,
  User,
  Phone,
  PhoneCall,
  Mic,
  Bell,
  VolumeX,
  Volume2
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { AuthModal } from "@/components/auth/AuthModal";
import { api } from "@/lib/api";
import { socketManager } from "@/lib/socket";

const Navigation = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [activeCalls, setActiveCalls] = useState(0);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [currentCall, setCurrentCall] = useState<any>(null);
  
  const location = useLocation();
  const { isAuthenticated, user, logout } = useAuth();
  
  const isActive = (path: string) => location.pathname === path;
  
  const navigationItems = [
    { name: "Dashboard", href: "/dashboard", icon: BarChart3 },
    { 
      name: "Conversations", 
      href: "/conversations", 
      icon: MessageCircle,
      badge: unreadMessages > 0 ? unreadMessages : undefined
    },
    { 
      name: "Voice Calls", 
      href: "/voice", 
      icon: Phone,
      badge: activeCalls > 0 ? activeCalls : undefined,
      isNew: true
    },
    { name: "Pricing", href: "/pricing", icon: CreditCard },
    { name: "Settings", href: "/settings", icon: Settings },
  ];

  // Initialize real-time features when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      initializeRealTimeFeatures();
    }

    return () => {
      socketManager.disconnect();
    };
  }, [isAuthenticated]);

  const initializeRealTimeFeatures = () => {
    // Connect to socket
    socketManager.connect();
    socketManager.connectVoice();

    // Listen for real-time updates
    socketManager.on('new_message', handleNewMessage);
    socketManager.on('call_started', handleCallStarted);
    socketManager.on('call_ended', handleCallEnded);
    socketManager.on('conversation_updated', handleConversationUpdated);
    socketManager.on('escalated_to_human', handleEscalation);

    // Fetch initial data
    fetchActiveCalls();
    fetchUnreadMessages();

    // Set up periodic updates
    const interval = setInterval(() => {
      fetchActiveCalls();
      fetchUnreadMessages();
    }, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  };

  const fetchActiveCalls = async () => {
    try {
      const response = await api.voice.getActiveCalls();
      setActiveCalls(response.activeCalls?.length || 0);
    } catch (error) {
      console.error('Failed to fetch active calls:', error);
    }
  };

  const fetchUnreadMessages = async () => {
    try {
      const response = await api.conversations.getAll(1, 100);
      const unread = response.conversations?.filter((conv: any) => 
        conv.status === 'OPEN' && 
        conv.messages.some((msg: any) => 
          msg.sender === 'CUSTOMER' && 
          !msg.read
        )
      ).length || 0;
      setUnreadMessages(unread);
    } catch (error) {
      console.error('Failed to fetch unread messages:', error);
    }
  };

  // Real-time event handlers
  const handleNewMessage = (data: any) => {
    setUnreadMessages(prev => prev + 1);
    addNotification({
      id: Date.now().toString(),
      type: 'message',
      title: 'New Message',
      message: `New message from ${data.customerName || 'Unknown'}`,
      channel: data.channel,
      timestamp: new Date()
    });
  };

  const handleCallStarted = (data: any) => {
    setActiveCalls(prev => prev + 1);
    setCurrentCall(data);
    addNotification({
      id: Date.now().toString(),
      type: 'call',
      title: 'Incoming Call',
      message: `Voice call from ${data.phoneNumber}`,
      timestamp: new Date()
    });
  };

  const handleCallEnded = (data: any) => {
    setActiveCalls(prev => Math.max(0, prev - 1));
    if (currentCall?.callId === data.callId) {
      setCurrentCall(null);
    }
  };

  const handleConversationUpdated = (data: any) => {
    if (data.status === 'RESOLVED') {
      setUnreadMessages(prev => Math.max(0, prev - 1));
    }
  };

  const handleEscalation = (data: any) => {
    addNotification({
      id: Date.now().toString(),
      type: 'escalation',
      title: 'Escalation Alert',
      message: `Conversation escalated to human agent`,
      timestamp: new Date()
    });
  };

  const addNotification = (notification: any) => {
    setNotifications(prev => [notification, ...prev.slice(0, 9)]); // Keep last 10
  };

  const handleQuickCall = async () => {
    const phoneNumber = prompt('Enter phone number to call:');
    if (!phoneNumber) return;

    try {
      const response = await api.voice.initiateCall(phoneNumber);
      // Redirect to voice interface or show call UI
      window.location.href = `/voice?callId=${response.callId}`;
    } catch (error) {
      console.error('Failed to initiate call:', error);
      alert('Failed to initiate call. Please try again.');
    }
  };

  const clearNotifications = () => {
    setNotifications([]);
    setShowNotifications(false);
  };

  return (
    <nav className="bg-card border-b border-border sticky top-0 z-50 mitr-glass">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2 group">
            <img
              src="/logo.png"
              alt="Your Brand"
              className="h-12 w-auto"
            />
            <div className="relative">
              <div className="absolute inset-0 bg-primary/20 rounded-full blur-lg group-hover:bg-primary/30 transition-colors" />
            </div>
            <span className="text-4xl font-bold mitr-gradient-text">
              Mitr
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.name} className="relative">
                  <Link
                    to={item.href}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      isActive(item.href)
                        ? "bg-primary text-primary-foreground shadow-mitr-md"
                        : "text-foreground hover:bg-secondary hover:text-secondary-foreground"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span className="flex items-center gap-2">
                      {item.name}
                      {item.isNew && (
                        <Badge variant="default" className="text-xs px-1 py-0 h-4">
                          NEW
                        </Badge>
                      )}
                    </span>
                    {item.badge && (
                      <Badge 
                        variant="destructive" 
                        className="ml-1 px-1.5 py-0 text-xs min-w-[1.25rem] h-5 flex items-center justify-center"
                      >
                        {item.badge}
                      </Badge>
                    )}
                  </Link>
                </div>
              );
            })}
          </div>

          {/* Right Side Actions */}
          <div className="hidden md:flex items-center space-x-4">
            {isAuthenticated ? (
              <>
                {/* Quick Voice Call Button */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleQuickCall}
                  className="flex items-center gap-2 text-blue-600 border-blue-200 hover:bg-blue-50"
                >
                  <PhoneCall className="h-4 w-4" />
                  <span className="hidden lg:inline">Quick Call</span>
                </Button>

                {/* Active Call Indicator */}
                {currentCall && (
                  <div className="flex items-center gap-2 px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <Mic className="h-3 w-3" />
                    <span className="hidden lg:inline">Active Call</span>
                  </div>
                )}

                {/* Notifications */}
                <div className="relative">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowNotifications(!showNotifications)}
                    className="relative"
                  >
                    <Bell className="h-4 w-4" />
                    {notifications.length > 0 && (
                      <Badge 
                        variant="destructive" 
                        className="absolute -top-1 -right-1 px-1.5 py-0 text-xs min-w-[1.25rem] h-5 flex items-center justify-center"
                      >
                        {notifications.length}
                      </Badge>
                    )}
                  </Button>

                  {/* Notifications Dropdown */}
                  {showNotifications && (
                    <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border z-50">
                      <div className="p-3 border-b flex items-center justify-between">
                        <h3 className="font-semibold">Notifications</h3>
                        {notifications.length > 0 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={clearNotifications}
                            className="text-xs"
                          >
                            Clear All
                          </Button>
                        )}
                      </div>
                      <div className="max-h-64 overflow-y-auto">
                        {notifications.length === 0 ? (
                          <div className="p-4 text-center text-muted-foreground">
                            No new notifications
                          </div>
                        ) : (
                          notifications.map((notif) => (
                            <div key={notif.id} className="p-3 border-b hover:bg-gray-50">
                              <div className="flex items-start gap-2">
                                <div className={`p-1 rounded-full ${
                                  notif.type === 'call' ? 'bg-blue-100' : 
                                  notif.type === 'message' ? 'bg-green-100' : 'bg-orange-100'
                                }`}>
                                  {notif.type === 'call' && <Phone className="h-3 w-3 text-blue-600" />}
                                  {notif.type === 'message' && <MessageCircle className="h-3 w-3 text-green-600" />}
                                  {notif.type === 'escalation' && <User className="h-3 w-3 text-orange-600" />}
                                </div>
                                <div className="flex-1">
                                  <p className="text-sm font-medium">{notif.title}</p>
                                  <p className="text-xs text-muted-foreground">{notif.message}</p>
                                  <p className="text-xs text-muted-foreground mt-1">
                                    {notif.timestamp.toLocaleTimeString()}
                                  </p>
                                </div>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* User Info */}
                <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                  <User className="h-4 w-4" />
                  <span>{user?.name || user?.email}</span>
                </div>

                <Button variant="outline" size="sm" onClick={logout}>
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </Button>
              </>
            ) : (
              <>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    setAuthMode('login');
                    setIsAuthModalOpen(true);
                  }}
                >
                  Sign In
                </Button>
                <Button 
                  variant="default" 
                  size="sm" 
                  className="mitr-glow"
                  onClick={() => {
                    setAuthMode('signup');
                    setIsAuthModalOpen(true);
                  }}
                >
                  Start Free Trial
                </Button>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-border bg-card/95 backdrop-blur-sm">
            <div className="px-2 pt-2 pb-3 space-y-1">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`flex items-center justify-between px-3 py-2 rounded-lg text-base font-medium transition-all ${
                      isActive(item.href)
                        ? "bg-primary text-primary-foreground"
                        : "text-foreground hover:bg-secondary"
                    }`}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <div className="flex items-center space-x-3">
                      <Icon className="h-5 w-5" />
                      <span className="flex items-center gap-2">
                        {item.name}
                        {item.isNew && (
                          <Badge variant="default" className="text-xs px-1 py-0 h-4">
                            NEW
                          </Badge>
                        )}
                      </span>
                    </div>
                    {item.badge && (
                      <Badge variant="destructive" className="px-1.5 py-0 text-xs">
                        {item.badge}
                      </Badge>
                    )}
                  </Link>
                );
              })}
              
              {/* Mobile Actions */}
              <div className="px-3 py-2 space-y-2">
                {isAuthenticated ? (
                  <>
                    {/* Mobile Quick Call */}
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full flex items-center justify-center gap-2"
                      onClick={() => {
                        handleQuickCall();
                        setIsMobileMenuOpen(false);
                      }}
                    >
                      <PhoneCall className="h-4 w-4" />
                      Quick Call
                    </Button>

                    {/* Mobile Active Call Indicator */}
                    {currentCall && (
                      <div className="flex items-center justify-center gap-2 p-2 bg-green-100 text-green-800 rounded-lg text-sm">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                        <Mic className="h-3 w-3" />
                        <span>Active Call</span>
                      </div>
                    )}

                    {/* Mobile Notifications */}
                    {notifications.length > 0 && (
                      <div className="p-2 bg-muted rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium">Notifications</span>
                          <Badge variant="secondary">{notifications.length}</Badge>
                        </div>
                        <div className="space-y-1 max-h-32 overflow-y-auto">
                          {notifications.slice(0, 3).map((notif) => (
                            <div key={notif.id} className="text-xs p-2 bg-background rounded">
                              <p className="font-medium">{notif.title}</p>
                              <p className="text-muted-foreground">{notif.message}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* User Info */}
                    <div className="px-3 py-2 text-sm text-muted-foreground">
                      {user?.name || user?.email}
                    </div>
                    
                    <Button variant="outline" size="sm" className="w-full" onClick={logout}>
                      <LogOut className="h-4 w-4 mr-2" />
                      Logout
                    </Button>
                  </>
                ) : (
                  <>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full"
                      onClick={() => {
                        setAuthMode('login');
                        setIsAuthModalOpen(true);
                        setIsMobileMenuOpen(false);
                      }}
                    >
                      Sign In
                    </Button>
                    <Button 
                      variant="default" 
                      size="sm" 
                      className="w-full"
                      onClick={() => {
                        setAuthMode('signup');
                        setIsAuthModalOpen(true);
                        setIsMobileMenuOpen(false);
                      }}
                    >
                      Start Free Trial
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Auth Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        defaultMode={authMode}
      />
    </nav>
  );
};

export default Navigation;
