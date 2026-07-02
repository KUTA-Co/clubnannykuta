import { createContext, useContext, useState, useEffect, useRef, useCallback, ReactNode } from 'react';
import { isStandaloneApp } from '@/lib/pwa';

// Simple token expiry check
const isTokenExpired = (token: string): boolean => {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return Date.now() >= payload.exp * 1000;
  } catch {
    return true;
  }
};

interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role: 'family' | 'nanny' | 'sitter' | 'admin';
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  login: ((email: string, password: string) => Promise<{ success: boolean; message?: string; token?: string; user?: User }>) & ((token: string, user: User) => void);
  register: (data: RegisterData) => Promise<{ success: boolean; message?: string; token?: string; user?: User }>;
  logout: () => void;
  updateUser: (user: User) => void;
}

interface RegisterData {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  role?: 'family' | 'nanny';
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const API_URL = import.meta.env.VITE_API_URL || '';
const TOKEN_KEY = 'club_nanny_token';
const USER_KEY = 'club_nanny_user';

function getAuthStorage() {
  if (typeof window === 'undefined') return null;
  return isStandaloneApp() ? window.sessionStorage : window.localStorage;
}

function clearAuthStorage() {
  try {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  } catch {
    // ignored
  }
  try {
    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(USER_KEY);
  } catch {
    // ignored
  }
}

function writeAuthStorage(authToken: string, authUser: User) {
  clearAuthStorage();
  const storage = getAuthStorage();
  storage?.setItem(TOKEN_KEY, authToken);
  storage?.setItem(USER_KEY, JSON.stringify(authUser));
}

function writeStoredUser(authUser: User) {
  const storage = getAuthStorage();
  storage?.setItem(USER_KEY, JSON.stringify(authUser));
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load auth state from secure storage on mount
  useEffect(() => {
    const loadAuth = async () => {
      try {
        if (isStandaloneApp()) {
          // A reinstalled/opened PWA should not silently reuse browser-persistent credentials.
          localStorage.removeItem(TOKEN_KEY);
          localStorage.removeItem(USER_KEY);
        }

        const storage = getAuthStorage();
        const savedToken = storage?.getItem(TOKEN_KEY);
        const savedUser = storage?.getItem(USER_KEY);

        if (savedToken && savedUser) {
          // Check if token is expired locally first
          if (isTokenExpired(savedToken)) {
            clearAuthStorage();
            setIsLoading(false);
            return;
          }

          // Verify token is still valid with server
          const response = await fetch(`${API_URL}/api/auth/me`, {
            headers: {
              'Authorization': `Bearer ${savedToken}`
            }
          });

          if (response.ok) {
            const data = await response.json();
            setToken(savedToken);
            setUser(data.user);
          } else {
            // Token invalid, clear storage
            clearAuthStorage();
          }
        }
      } catch (error) {
        console.error('Auth load error:', error);
        clearAuthStorage();
      } finally {
        setIsLoading(false);
      }
    };

    loadAuth();
  }, []);

  const login = async (emailOrToken: string, passwordOrUser?: string | User): Promise<{ success: boolean; message?: string; token?: string; user?: User }> => {
    // If second arg is a User object, this is a direct token login (from registration)
    if (typeof passwordOrUser === 'object') {
      const directToken = emailOrToken;
      const directUser = passwordOrUser as User;
      setToken(directToken);
      setUser(directUser);
      writeAuthStorage(directToken, directUser);
      return { success: true, token: directToken, user: directUser };
    }

    // Standard email/password login
    const email = emailOrToken;
    const password = passwordOrUser as string;
    try {
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setToken(data.token);
        setUser(data.user);
        writeAuthStorage(data.token, data.user);
        return { success: true, token: data.token, user: data.user };
      }

      return { success: false, message: data.message || 'Login failed' };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, message: 'Network error. Please try again.' };
    }
  };

  const register = async (registerData: RegisterData) => {
    try {
      const response = await fetch(`${API_URL}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(registerData)
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setToken(data.token);
        setUser(data.user);
        writeAuthStorage(data.token, data.user);
        return { success: true, token: data.token, user: data.user };
      }

      return { success: false, message: data.message || 'Registration failed' };
    } catch (error) {
      console.error('Register error:', error);
      return { success: false, message: 'Network error. Please try again.' };
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    clearAuthStorage();
  };

  const updateUser = (updatedUser: User) => {
    setUser(updatedUser);
    writeStoredUser(updatedUser);
  };

  const value: AuthContextType = {
    user,
    token,
    isLoading,
    isAuthenticated: !!user && !!token,
    isAdmin: user?.role === 'admin',
    login,
    register,
    logout,
    updateUser
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Helper hook for making authenticated API requests
export function useAuthFetch() {
  const { token } = useAuth();
  const tokenRef = useRef(token);
  tokenRef.current = token;

  const authFetch = useCallback(async (url: string, options: RequestInit = {}) => {
    const headers = {
      'Content-Type': 'application/json',
      ...(tokenRef.current ? { 'Authorization': `Bearer ${tokenRef.current}` } : {}),
      ...options.headers
    };

    const response = await fetch(`${API_URL}${url}`, {
      ...options,
      headers
    });

    return response;
  }, []);

  return authFetch;
}
