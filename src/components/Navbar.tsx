import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Home, Users, User, LogOut, Search, MessageCircle, PlusCircle, Users2 } from 'lucide-react';
import { useAuth } from '../lib/auth-context';
import { useState, useEffect } from 'react';
import { NotificationIcon } from './notifications/NotificationIcon';
import { NotificationDropdown } from './notifications/NotificationDropdown';
import { useNotificationNavigation } from '../hooks/useNotificationNavigation';
import { apiService } from '../lib/api';
import { Notification } from '@/types/notification';
import { io, Socket } from 'socket.io-client';
import { useTribe } from '../lib/tribe-context';

export default function Navbar() {
  const location = useLocation();
  const { user, logout } = useAuth();
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const { activeTribe } = useTribe();
  const [socket, setSocket] = useState<Socket | null>(null);
  const handleNotificationClick = useNotificationNavigation();

  const isActive = (path: string) => location.pathname === path;

  // Initialize socket connection
  useEffect(() => {
    if (user?._id) {
      const token = apiService.verifyToken();
      if (token) {
        console.log('Initializing socket connection...');
        const newSocket = io('http://localhost:3001', {
          auth: {
            token: token
          },
          extraHeaders: {
            'Authorization': `Bearer ${token}`
          },
          transports: ['websocket'],
          reconnection: true,
          reconnectionAttempts: 5,
          reconnectionDelay: 1000,
          timeout: 10000,
          forceNew: true,
          autoConnect: true
        });

        newSocket.on('connect', () => {
          console.log('Socket connected successfully in Navbar');
          setSocket(newSocket);
        });

        newSocket.on('connect_error', (error) => {
          console.error('Socket connection error in Navbar:', error.message);
        });

        newSocket.on('disconnect', (reason) => {
          console.log('Socket disconnected:', reason);
          if (reason === 'io server disconnect') {
            newSocket.connect();
          }
        });

        newSocket.on('error', (error) => {
          console.error('Socket error:', error);
        });

        return () => {
          console.log('Cleaning up socket connection...');
          if (newSocket.connected) {
            newSocket.disconnect();
          }
        };
      }
    }
  }, [user?._id]);

  // Handle socket events
  useEffect(() => {
    if (socket?.connected) {
      console.log('Setting up socket event listeners...');
      
      socket.on('notification', (notification: Notification) => {
        console.log('Received new notification:', notification);
        
        // Handle only pending request acceptance
        if(notification.type === 'TRIBE_MEMBERSHIP_ACCEPTED'){
          console.log('Tribe membership accepted from pending request, updating tribe info...');
          // The tribe context will handle the refresh
        }
      });

      return () => {
        console.log('Cleaning up socket event listeners...');
        socket.off('notification');
      };
    }
  }, [socket?.connected]);

  return (
    <>
      {/* Mobile Bottom Navbar */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-xl border-t border-gray-200 md:hidden z-50">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex justify-around items-center h-16">
            <Link 
              to="/home" 
              className={`flex flex-col items-center justify-center gap-1 transition-colors ${isActive('/home') ? 'text-purple-600' : 'text-gray-700 hover:text-purple-600'}`}
            >
              <Home className="h-6 w-6" />
              <span className="text-xs">Home</span>
            </Link>
            {user && (
              <Link 
                to="/create-post"
                className={`flex flex-col items-center justify-center gap-1 transition-colors text-gray-700 hover:text-purple-600`}
              >
                <PlusCircle className="h-6 w-6" />
                <span className="text-xs">Create</span>
              </Link>
            )}
            <Link 
              to="/search" 
              className={`flex flex-col items-center justify-center gap-1 transition-colors ${isActive('/search') ? 'text-purple-600' : 'text-gray-700 hover:text-purple-600'}`}
            >
              <Search className="h-6 w-6" />
              <span className="text-xs">Search</span>
            </Link>
            <Link 
              to="/discover" 
              className={`flex flex-col items-center justify-center gap-1 transition-colors ${isActive('/discover') ? 'text-purple-600' : 'text-gray-700 hover:text-purple-600'}`}
            >
              <Users className="h-6 w-6" />
              <span className="text-xs">Discover</span>
            </Link>
            <Link 
              to="/chat" 
              className={`flex flex-col items-center justify-center gap-1 transition-colors ${isActive('/chat') ? 'text-purple-600' : 'text-gray-700 hover:text-purple-600'}`}
            >
              <MessageCircle className="h-6 w-6" />
              <span className="text-xs">Chat</span>
            </Link>
            {activeTribe && (
              <Link 
                to={`/tribes/${activeTribe._id}`}
                className={`flex flex-col items-center justify-center gap-1 transition-colors ${isActive(`/tribes/${activeTribe._id}`) ? 'text-purple-600' : 'text-gray-700 hover:text-purple-600'}`}
              >
                {activeTribe.profilePhoto ? (
                  <img src={activeTribe.profilePhoto} alt={activeTribe.name} className="h-6 w-6 rounded-full object-cover" />
                ) : (
                  <Users2 className="h-6 w-6" />
                )}
                <span className="text-xs">Tribe</span>
              </Link>
            )}
            <Link 
              to="/profile" 
              className={`flex flex-col items-center justify-center gap-1 transition-colors ${isActive('/profile') ? 'text-purple-600' : 'text-gray-700 hover:text-purple-600'}`}
            >
              {user?.profilePhoto ? (
                <img src={user.profilePhoto} alt={user.username} className="h-6 w-6 rounded-full object-cover" />
              ) : (
                <User className="h-6 w-6" />
              )}
              <span className="text-xs">Profile</span>
            </Link>
          </div>
        </div>
      </nav>

      {/* Desktop Sidebar and Top Bar */}
      <div className="hidden md:flex">
        {/* Desktop Sidebar */}
        <nav className="fixed top-0 left-0 h-screen w-64 backdrop-blur-xl p-4 flex flex-col gap-4 z-40">
          {/* Logo in Sidebar - Aligned horizontally */}
          <Link to="/home" className="flex items-center gap-2 mb-8">
            <img 
              src="/tribe purple.png" 
              alt="Tribe Logo" 
              className="h-12 w-auto"
            />
            <span className="text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Tribe
            </span>
          </Link>
          {/* Navigation Links - Left-aligned and spaced from top */}
          <div className="flex flex-col items-start gap-4 w-full mt-4 pl-2">
            <Link 
              to="/home" 
              className={`flex items-center gap-2 p-2 rounded-md transition-colors w-full ${
                isActive('/home')
                  ? 'bg-purple-100 text-purple-600'
                  : 'text-gray-700 hover:bg-gray-100 hover:text-purple-600'
              }`}
            >
              <Home className="h-6 w-6" />
              <span>Home</span>
            </Link>
            {user && (
              <Link 
                to="/create-post"
                className={`flex items-center gap-2 p-2 rounded-md transition-colors text-gray-700 hover:bg-gray-100 hover:text-purple-600 w-full`}
              >
                <PlusCircle className="h-6 w-6" />
                <span>Create Post</span>
              </Link>
            )}
            <Link 
              to="/search" 
              className={`flex items-center gap-2 p-2 rounded-md transition-colors w-full ${
              isActive('/search')
                ? 'bg-purple-100 text-purple-600'
                : 'text-gray-700 hover:bg-gray-100 hover:text-purple-600'
            }`}
          >
            <Search className="h-6 w-6" />
            <span>Search</span>
          </Link>
          <Link 
            to="/discover" 
            className={`flex items-center gap-2 p-2 rounded-md transition-colors w-full ${
              isActive('/discover')
                ? 'bg-purple-100 text-purple-600'
                : 'text-gray-700 hover:bg-gray-100 hover:text-purple-600'
            }`}
          >
            <Users className="h-6 w-6" />
            <span>Discover</span>
          </Link>
          <Link 
            to="/chat" 
            className={`flex items-center gap-2 p-2 rounded-md transition-colors w-full ${
              isActive('/chat')
                ? 'bg-purple-100 text-purple-600'
                : 'text-gray-700 hover:bg-gray-100 hover:text-purple-600'
            }`}
          >
            <MessageCircle className="h-6 w-6" />
            <span>Chat</span>
          </Link>
          {activeTribe && (
            <Link 
              to={`/tribes/${activeTribe._id}`}
              className={`flex items-center gap-2 p-2 rounded-md transition-colors w-full ${
                isActive(`/tribes/${activeTribe._id}`)
                  ? 'bg-purple-100 text-purple-600'
                  : 'text-gray-700 hover:bg-gray-100 hover:text-purple-600'
              }`}
            >
              {activeTribe.profilePhoto ? (
                <img src={activeTribe.profilePhoto} alt={activeTribe.name} className="h-6 w-6 rounded-full object-cover" />
              ) : (
                <Users2 className="h-6 w-6" />
              )}
              <span>{activeTribe.name}</span>
            </Link>
          )}
          <Link 
            to="/profile" 
            className={`flex items-center gap-2 p-2 rounded-md transition-colors w-full ${
              isActive('/profile')
                ? 'bg-purple-100 text-purple-600'
                : 'text-gray-700 hover:bg-gray-100 hover:text-purple-600'
            }`}
          >
            {user?.profilePhoto ? (
              <img src={user.profilePhoto} alt={user.username} className="h-6 w-6 rounded-full object-cover" />
            ) : (
              <User className="h-6 w-6" />
            )}
            <span>Profile</span>
          </Link>
          </div>
        </nav>

        {/* Desktop Top Bar (minimal) - No border-b */}
        <header className="fixed top-0 left-0 md:left-64 right-0 h-16 backdrop-blur-xl flex items-center justify-end px-4 z-40">
          {/* Notification Icon and Dropdown */}
          <div className="relative mr-4">
            <NotificationIcon onClick={() => setIsNotificationOpen(!isNotificationOpen)} />
            <NotificationDropdown
              isOpen={isNotificationOpen}
              onClose={() => setIsNotificationOpen(false)}
              onNavigate={handleNotificationClick}
            />
          </div>

          {/* Logout in Top Bar */}
          <Button
            variant="ghost"
            onClick={logout}
            className="flex items-center gap-2 text-gray-700 hover:text-purple-600 transition-colors"
          >
            <LogOut className="h-6 w-6" />
            <span>Logout</span>
          </Button>
        </header>
      </div>
    </>
  );
} 