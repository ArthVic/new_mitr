import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { api, ApiError } from '@/lib/api';
import { useNavigate } from "react-router-dom"; // ✅ add this



interface User {
  id: string;
  email: string;
  name?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, name?: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  error: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {   
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const isAuthenticated = !!user;

  // Restore session on app start
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem("auth_token");
      if (token) {
        try {   
          const response = await api.auth.getMe();
          setUser(response.user);
        } catch (error) {
          console.error("Auth check failed:", error);
          api.auth.logout();
          localStorage.removeItem("auth_token");
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, []);


  const login = async (email: string, password: string) => {
    try {
      setError(null);
      setLoading(true);
      const response = await api.auth.login(email, password);
      
      // Save token (assuming your backend sends it)
      if (response.token) {
        localStorage.setItem("auth_token", response.token);
        const me = await api.auth.getMe();
        setUser(me.user);
      } else if (response.user) {
      setUser(response.user);
      }
      
      navigate("/dashboard", { replace: true });
    } catch (error) {
      const message = error instanceof ApiError ? error.message : "Login failed";
      setError(message);
      throw error;
    } finally {
      setLoading(false);
    }
  };


  const signup = async (email: string, password: string, name?: string) => {
    try {
      setError(null);
      setLoading(true);
      const response = await api.auth.signup(email, password, name);
      
      if (response.token) {
        localStorage.setItem("auth_token", response.token);
      }

      setUser(response.user);
      navigate("/dashboard", { replace: true });

    } catch (error) {
      const message = error instanceof ApiError ? error.message : "Signup failed";
      setError(message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    api.auth.logout();
    localStorage.removeItem("auth_token");
    setUser(null);
    setError(null);
  };

  const value: AuthContextType = {
    user,
    loading,
    login,
    signup,
    logout,
    isAuthenticated,
    error,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
