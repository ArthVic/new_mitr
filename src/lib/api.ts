const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

// Token management
const getToken = () => localStorage.getItem('auth_token');
const setToken = (token: string) => localStorage.setItem('auth_token', token);
const removeToken = () => localStorage.removeItem('auth_token');

// API Error class
export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public data?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// Enhanced API client with all backend endpoints
export const api = {
  async request(endpoint: string, options: RequestInit = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const token = getToken();
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new ApiError(
          errorData.error || `HTTP ${response.status}: ${response.statusText}`,
          response.status,
          errorData
        );
      }

      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        return await response.json();
      }
      return response.text();
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError('Network error', 0, error);
    }
  },

  // Auth methods
  auth: {
    async login(email: string, password: string) {
      const response = await api.request('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      if (response.token) {
        setToken(response.token);
      }
      return response;
    },

    async signup(email: string, password: string, name?: string) {
      const response = await api.request('/auth/signup', {
        method: 'POST',
        body: JSON.stringify({ email, password, name }),
      });
      if (response.token) {
        setToken(response.token);
      }
      return response;
    },

    async getMe() {
      return api.request('/auth/me');
    },

    logout() {
      removeToken();
    },

    isAuthenticated() {
      return !!getToken();
    }
  },

  // Enhanced conversation methods
  conversations: {
    async getAll(page = 1, limit = 50) {
      return api.request(`/conversations?page=${page}&limit=${limit}`);
    },

    async getById(id: string) {
      return api.request(`/conversations/${id}`);
    },

    async createMessage(conversationId: string, content: string, sender: 'CUSTOMER' | 'AI' | 'HUMAN' = 'HUMAN') {
      return api.request(`/conversations/${conversationId}/messages`, {
        method: 'POST',
        body: JSON.stringify({ content, sender }),
      });
    },

    async updateStatus(conversationId: string, status: 'OPEN' | 'HUMAN' | 'RESOLVED') {
      return api.request(`/conversations/${conversationId}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status }),
      });
    },

    async getByChannel(channel: 'WHATSAPP' | 'INSTAGRAM' | 'WEBSITE' | 'VOICE_CALL') {
      return api.request(`/conversations?channel=${channel}`);
    }
  },

  // Voice agent methods
  voice: {
    async getCalls(page = 1, limit = 20) {
      return api.request(`/voice/calls?page=${page}&limit=${limit}`);
    },

    async getActiveCalls() {
      return api.request('/voice/calls/active');
    },

    async initiateCall(phoneNumber: string, customerName?: string) {
      return api.request('/voice/calls/initiate', {
        method: 'POST',
        body: JSON.stringify({ phoneNumber, customerName })
      });
    },

    async transferCall(callId: string, agentId?: string) {
      return api.request('/voice/calls/transfer', {
        method: 'POST',
        body: JSON.stringify({ callId, agentId })
      });
    },

    async getAnalytics(period = '7d') {
      return api.request(`/voice/analytics?period=${period}`);
    }
  },

  // AI methods
  ai: {
    async generateResponse(conversationId: string, message: string) {
      return api.request('/ai/generate-response', {
        method: 'POST',
        body: JSON.stringify({ conversationId, message })
      });
    },

    async getSummary(conversationId: string) {
      return api.request(`/ai/summary/${conversationId}`);
    },

    async shouldEscalate(conversationId: string, message: string) {
      return api.request(`/ai/should-escalate/${conversationId}?message=${encodeURIComponent(message)}`);
    }
  },

  // Analytics methods
  analytics: {
    async getDashboard() {
      return api.request('/analytics/dashboard');
    },

    async getTimeseries(period = '7d', metric = 'conversations') {
      return api.request(`/analytics/timeseries?period=${period}&metric=${metric}`);
    }
  },

  // Settings methods
  settings: {
    async getMe() {
      return api.request('/settings/me');
    },

    async updateSettings(settings: {
      aiEnabled?: boolean;
      notifications?: boolean;
      dataRetentionDays?: number;
      businessName?: string;
      contactEmail?: string;
      phoneNumber?: string;
      websiteUrl?: string;
    }) {
      return api.request('/settings/settings', {
        method: 'PUT',
        body: JSON.stringify(settings),
      });
    },

    async getIntegrations() {
      return api.request('/settings/integrations');
    },

    async createIntegration(provider: string, accessToken: string, config?: any) {
      return api.request('/settings/integrations', {
        method: 'POST',
        body: JSON.stringify({ provider, accessToken, config })
      });
    },

    async deleteIntegration(id: string) {
      return api.request(`/settings/integrations/${id}`, {
        method: 'DELETE'
      });
    }
  },

  // Admin methods (if user has admin role)
  admin: {
    async getUsers(page = 1, limit = 20, search = '') {
      return api.request(`/admin/users?page=${page}&limit=${limit}&search=${search}`);
    },

    async getStats() {
      return api.request('/admin/stats');
    },

    async updateUserRole(userId: string, role: 'USER' | 'ADMIN') {
      return api.request(`/admin/users/${userId}/role`, {
        method: 'PUT',
        body: JSON.stringify({ role })
      });
    }
  }
};
