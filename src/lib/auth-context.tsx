import React, { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import { apiService } from './api';

export interface User {
  _id: string;
  name: string;
  surname: string;
  email: string;
  username: string;
  profilePhoto?: string;
  bio?: string;
  gender?: string;
  role?: string;
  following?: string[];
  followers?: string[]; 
  createdAt?: string;
  updatedAt?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  socket: Socket | null;
  signup: (formData: FormData) => Promise<void>;
  updateUserFollowing: (following: string[]) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [socket, setSocket] = useState<Socket | null>(null);
  const navigate = useNavigate();

  const connectSocket = (token: string) => {
    if (socket) {
      socket.disconnect();
    }

    console.log('Connecting socket with token:', token);
    const newSocket = io('http://localhost:3001', {
      auth: {
        token: token
      },
      extraHeaders: {
        'Authorization': `Bearer ${token}`
      },
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 2000,
      timeout: 20000,
      forceNew: true
    });

    newSocket.on('connect', () => {
      console.log('Socket connected successfully');
      toast.success('Connected to chat server');
    });

    newSocket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      if (error.message.includes('xhr poll error')) {
        toast.error('Unable to connect to chat server. Please check your internet connection.');
      } else {
        toast.error('Connection error. Please refresh the page.');
      }
    });

    newSocket.on('error', (error) => {
      console.error('Socket error:', error);
      toast.error('Connection error occurred');
    });

    newSocket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
      if (reason === 'io server disconnect') {
        toast.warning('Connection lost. Please refresh the page.');
      } else if (reason === 'transport close') {
        toast.warning('Connection closed. Attempting to reconnect...');
      } else if (reason === 'ping timeout') {
        toast.warning('Connection timeout. Attempting to reconnect...');
      }
    });

    newSocket.on('reconnect_attempt', (attemptNumber) => {
      console.log('Reconnection attempt:', attemptNumber);
      if (attemptNumber === 1) {
        toast.info('Attempting to reconnect to chat server...');
      }
    });

    newSocket.on('reconnect', (attemptNumber) => {
      console.log('Reconnected after', attemptNumber, 'attempts');
      toast.success('Reconnected to chat server');
    });

    newSocket.on('reconnect_error', (error) => {
      console.error('Reconnection error:', error);
      toast.error('Failed to reconnect to chat server');
    });

    newSocket.on('reconnect_failed', () => {
      console.error('Failed to reconnect after all attempts');
      toast.error('Unable to reconnect to chat server. Please refresh the page.');
    });

    setSocket(newSocket);
  };

  const clearAuthData = () => {
    apiService.logout();
    setUser(null);
    if (socket) {
      socket.disconnect();
      setSocket(null);
    }
  };

  // Funzione updateUserFollowing dichiarata separatamente
  const updateUserFollowing = (following: string[]) => {
    if (user) {
      const updatedUser = { ...user, following };
      setUser(updatedUser);
      apiService.setUser(updatedUser);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const response = await apiService.login(email, password);
      const { access_token, user: userData } = response;
      
      apiService.setToken(access_token);
      
      const user: User = {
        _id: userData._id,
        name: userData.name,
        surname: userData.surname,
        email: userData.email,
        username: userData.username,
        profilePhoto: userData.profilePhoto,
        bio: userData.bio,
        gender: userData.gender,
        role: userData.role,
        following: userData.following || [],
        followers: userData.followers || [],
        createdAt: userData.createdAt,
        updatedAt: userData.updatedAt
      };
      
      setUser(user);
      apiService.setUser(user);
      
      connectSocket(access_token);
      
      toast.success('Login successful');
      navigate('/home', { replace: true });
    } catch (error) {
      console.error('Login error:', error);
      toast.error('Login failed');
      throw error;
    }
  };

  const signup = async (formData: FormData) => {
    try {
      const response = await apiService.signup(formData);
      const { access_token, user: userData } = response;
      
      apiService.setToken(access_token);
      
      const user: User = {
        _id: userData._id,
        name: userData.name,
        surname: userData.surname,
        email: userData.email,
        username: userData.username,
        profilePhoto: userData.profilePhoto,
        bio: userData.bio,
        gender: userData.gender,
        role: userData.role,
        following: userData.following || [],
        followers: userData.followers || [],
        createdAt: userData.createdAt,
        updatedAt: userData.updatedAt
      };
      
      setUser(user);
      apiService.setUser(user);
      
      connectSocket(access_token);
      
      toast.success('Signup successful');
      navigate('/home');
    } catch (error) {
      console.error('Signup error:', error);
      toast.error('Signup failed');
      throw error;
    }
  };

  const logout = () => {
    clearAuthData();
    navigate('/login');
  };

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const token = apiService.verifyToken();
        
        if (token) {
          const decoded = jwtDecode(token);
          const currentTime = Date.now() / 1000;
          
          if (decoded.exp && decoded.exp > currentTime) {
            const userData = apiService.getUser();
            if (userData) {
              // Assicurati che following e followers siano array
              const user: User = {
                ...userData,
                following: userData.following || [],
                followers: userData.followers || []
              };
              setUser(user);
              connectSocket(token);
            } else {
              clearAuthData();
            }
          } else {
            clearAuthData();
          }
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        clearAuthData();
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  return (
    <AuthContext.Provider value={{ 
      user, 
      loading, 
      login, 
      signup, 
      logout, 
      socket,
      updateUserFollowing 
    }}>
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