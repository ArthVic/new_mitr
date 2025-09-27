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

// Enhanced API client
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

      return await response.json();
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

  // Conversation methods
  conversations: {
    async getAll() {
      return api.request('/conversations');
    },

    async getById(id: string) {
      return api.request(`/conversations/${id}`);
    },

    async createMessage(conversationId: string, content: string, sender: 'CUSTOMER' | 'AI' | 'HUMAN' = 'CUSTOMER') {
      return api.request(`/conversations/${conversationId}/messages`, {
        method: 'POST',
        body: JSON.stringify({ content, sender }),
      });
    }
  },

  // Settings methods
  settings: {
    async getMe() {
      return api.request('/settings/me');
    },

    async updateSettings(settings: { aiEnabled?: boolean; notifications?: boolean; dataRetentionDays?: number }) {
      return api.request('/settings/settings', {
        method: 'PUT',
        body: JSON.stringify(settings),
      });
    }
  }
};