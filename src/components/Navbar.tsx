import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Home, Users, User, LogOut, Search } from 'lucide-react';
import { useAuth } from '../lib/auth-context';

export default function Navbar() {
  const location = useLocation();
  const { user, logout } = useAuth();

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-xl border-t border-gray-200 md:top-0 md:bottom-auto">
      <div className="max-w-4xl mx-auto px-4">
        <div className="flex justify-around md:justify-between items-center h-16">
          {/* Logo and Tribe text */}
          <Link to="/home" className="hidden md:flex items-center gap-2">
            <img 
              src="/tribe purple.png" 
              alt="Tribe Logo" 
              className="h-12 w-auto"
            />
            <span className="text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Tribe
            </span>
          </Link>

          <div className="flex justify-around md:justify-end gap-8 w-full md:w-auto">
            <Link 
              to="/home" 
              className={`flex items-center gap-2 transition-colors ${
                isActive('/home')
                  ? 'text-purple-600'
                  : 'text-gray-700 hover:text-purple-600'
              }`}
            >
              <Home className="h-6 w-6" />
              <span className="hidden md:inline">Home</span>
            </Link>

            <Link 
              to="/search" 
              className={`flex items-center gap-2 transition-colors ${
                isActive('/search')
                  ? 'text-purple-600'
                  : 'text-gray-700 hover:text-purple-600'
              }`}
            >
              <Search className="h-6 w-6" />
              <span className="hidden md:inline">Search</span>
            </Link>
            
            <Link 
              to="/discover" 
              className={`flex items-center gap-2 transition-colors ${
                isActive('/discover')
                  ? 'text-purple-600'
                  : 'text-gray-700 hover:text-purple-600'
              }`}
            >
              <Users className="h-6 w-6" />
              <span className="hidden md:inline">Discover</span>
            </Link>

            <Link 
              to="/profile" 
              className={`flex items-center gap-2 transition-colors ${
                isActive('/profile')
                  ? 'text-purple-600'
                  : 'text-gray-700 hover:text-purple-600'
              }`}
            >
              {user?.profilePhoto ? (
                <img
                  src={user.profilePhoto}
                  alt={user.username}
                  className="h-6 w-6 rounded-full object-cover"
                />
              ) : (
                <User className="h-6 w-6" />
              )}
              <span className="hidden md:inline">Profile</span>
            </Link>

            <Button
              variant="ghost"
              onClick={logout}
              className="flex items-center gap-2 text-gray-700 hover:text-purple-600 transition-colors"
            >
              <LogOut className="h-6 w-6" />
              <span className="hidden md:inline">Logout</span>
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
} 