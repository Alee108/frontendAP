import { useLocation } from 'react-router-dom';
import { useAuth } from '../lib/auth-context';
import Navbar from './Navbar';

// Separate component to ensure useAuth is available
function NavbarWithAuth() {
  const { user } = useAuth();
  return <Navbar />;
}

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
      <NavbarWithAuth />
      <main className="pb-16 md:pb-0 md:pt-16 md:pl-64">
        {children}
      </main>
    </div>
  );
} 