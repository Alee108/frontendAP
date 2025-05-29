import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { io, Socket } from 'socket.io-client';
import { Notification, NotificationContextType, NotificationState } from '../types/notification';
import { useAuth } from '../lib/auth-context';
import { toast } from 'sonner';
import { apiService } from '../lib/api';

const initialState: NotificationState = {
  notifications: [],
  unreadCount: 0,
  isLoading: false,
  error: null,
};
const API_URL = 'http://localhost:3001';

type NotificationAction =
  | { type: 'SET_NOTIFICATIONS'; payload: Notification[] }
  | { type: 'ADD_NOTIFICATION'; payload: Notification }
  | { type: 'MARK_AS_READ'; payload: string }
  | { type: 'MARK_ALL_AS_READ' }
  | { type: 'DELETE_NOTIFICATION'; payload: string }
  | { type: 'CLEAR_ALL' }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null };

const notificationReducer = (state: NotificationState, action: NotificationAction): NotificationState => {
  switch (action.type) {
    case 'SET_NOTIFICATIONS':
      return {
        ...state,
        notifications: action.payload,
        unreadCount: action.payload.filter(n => !n.read).length,
      };
    case 'ADD_NOTIFICATION':
      return {
        ...state,
        notifications: [action.payload, ...state.notifications],
        unreadCount: state.unreadCount + 1,
      };
    case 'MARK_AS_READ':
      return {
        ...state,
        notifications: state.notifications.map(n =>
          n._id === action.payload ? { ...n, read: true } : n
        ),
        unreadCount: Math.max(0, state.unreadCount - 1),
      };
    case 'MARK_ALL_AS_READ':
      return {
        ...state,
        notifications: state.notifications.map(n => ({ ...n, read: true })),
        unreadCount: 0,
      };
    case 'DELETE_NOTIFICATION':
      return {
        ...state,
        notifications: state.notifications.filter(n => n._id !== action.payload),
        unreadCount: state.notifications.find(n => n._id === action.payload)?.read
          ? state.unreadCount
          : Math.max(0, state.unreadCount - 1),
      };
    case 'CLEAR_ALL':
      return {
        ...state,
        notifications: [],
        unreadCount: 0,
      };
    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload,
      };
    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload,
      };
    default:
      return state;
  }
};

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(notificationReducer, initialState);
  const { user } = useAuth();
  const [socket, setSocket] = React.useState<Socket | null>(null);

  useEffect(() => {
    if (user) {
      const token = apiService.verifyToken();
      if (!token) return;

      console.log('Connecting to socket...');

      const newSocket = io(API_URL, {
        auth: { 
          token: apiService.verifyToken(),
          type: 'user'
        },
        transports: ['websocket'],
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        timeout: 10000,
        autoConnect: true,
        forceNew: true
      });

      newSocket.on('connect', () => {
        console.log('Socket connected successfully');
        dispatch({ type: 'SET_ERROR', payload: null });
        fetchNotifications();
      });

      newSocket.on('connect_error', (error) => {
        console.error('Socket connection error:', error);
        console.error('Error details:', {
          message: error.message,
          name: error.name,
          stack: error.stack
        });
        dispatch({ type: 'SET_ERROR', payload: `Failed to connect to notification service: ${error.message}` });
      });

      newSocket.on('error', (error) => {
        console.error('Socket error:', error);
        dispatch({ type: 'SET_ERROR', payload: `Socket error: ${error.message}` });
      });

      newSocket.on('disconnect', (reason) => {
        console.log('Socket disconnected:', reason);
        
        switch (reason) {
          case 'io server disconnect':
            console.log('Server disconnected, attempting to reconnect...');
            setTimeout(() => {
              newSocket.connect();
            }, 1000);
            break;
          case 'transport close':
            console.log('Connection lost, attempting to reconnect...');
            break;
          case 'transport error':
            console.log('Transport error, attempting to reconnect...');
            break;
          default:
            console.log('Disconnected for reason:', reason);
        }
      });

      newSocket.on('unauthorized', (error) => {
        console.error('Socket unauthorized:', error);
        dispatch({ type: 'SET_ERROR', payload: 'Authentication failed for notification service' });
      });

      newSocket.on('notification', (notification: Notification) => {
        console.log('Received new notification:', notification);
        dispatch({ type: 'ADD_NOTIFICATION', payload: notification });
        toast(notification.content, {
          icon: '🔔',
          duration: 5000,
        });
      });

      setSocket(newSocket);

      fetchNotifications();

      return () => {
        if (newSocket.connected) {
          newSocket.disconnect();
        }
      };
    }
  }, [user]);

  const fetchNotifications = async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const data = await apiService.getNotifications();
      dispatch({ type: 'SET_NOTIFICATIONS', payload: data });
    } catch (error) {
      console.error('Error fetching notifications:', error);
      dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'An error occurred' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const markAsRead = async (id: string) => {
    try {
      await apiService.markNotificationAsRead(id);
      dispatch({ type: 'MARK_AS_READ', payload: id });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'An error occurred' });
    }
  };

  const markAllAsRead = async () => {
    try {
      await apiService.markAllNotificationsAsRead();
      dispatch({ type: 'MARK_ALL_AS_READ' });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'An error occurred' });
    }
  };

  const deleteNotification = async (id: string) => {
    try {
      await apiService.deleteNotification(id);
      dispatch({ type: 'DELETE_NOTIFICATION', payload: id });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'An error occurred' });
    }
  };

  const clearAllNotifications = async () => {
    try {
      await apiService.clearAllNotifications();
      dispatch({ type: 'CLEAR_ALL' });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'An error occurred' });
    }
  };

  useEffect(() => {
    if (user) {
      fetchNotifications();
    }
  }, [user]);

  return (
    <NotificationContext.Provider
      value={{
        ...state,
        fetchNotifications,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        clearAllNotifications,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}; 