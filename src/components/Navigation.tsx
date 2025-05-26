import { Link, useLocation } from 'react-router-dom';
import { Home, Search, LogOut, Users } from 'lucide-react';
import { useAuth } from '../lib/auth-context';
import { Button } from '@/components/ui/button';

export function Navigation() {
  const location = useLocation();
  const { logout, user } = useAuth();

  const isActive = (path: string) => location.pathname === path;

  const tribeButtonText = user?.tribeId ? 'Your Tribe' : 'Discover Tribes';
  const tribeButtonLink = user?.tribeId ? `/tribes/${user.tribeId}` : '/discover-tribes';

  return (
    <nav className="fixed bottom-0 left-0 right-0 border-t bg-background p-4 md:top-0 md:border-b md:border-t-0">
      <div className="container mx-auto flex max-w-4xl items-center justify-between">
        <div className="flex items-center space-x-6">
          <Link
            to="/home"
            className={`flex items-center space-x-2 ${
              isActive('/home')
                ? 'text-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Home className="h-5 w-5" />
            <span className="hidden md:inline">Home</span>
          </Link>
          <Link
            to="/search"
            className={`flex items-center space-x-2 ${
              isActive('/search')
                ? 'text-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Search className="h-5 w-5" />
            <span className="hidden md:inline">Search</span>
          </Link>

          {/* Tribe Button */}
          {user && !user.pendingTribeId && (
            <Link to={tribeButtonLink}>
              <Button
                variant="ghost"
                className={`flex items-center space-x-2 ${
                  isActive(tribeButtonLink)
                    ? 'text-primary'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Users className="h-5 w-5" />
                <span className="hidden md:inline">{tribeButtonText}</span>
              </Button>
            </Link>
          )}
        </div>
        <button
          onClick={logout}
          className="flex items-center space-x-2 text-muted-foreground hover:text-foreground"
        >
          <LogOut className="h-5 w-5" />
          <span className="hidden md:inline">Logout</span>
        </button>
      </div>
    </nav>
  );
} 