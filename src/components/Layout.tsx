import { useLocation } from 'react-router-dom';
import { useAuth } from '../lib/auth-context';
import Navbar from './Navbar';

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
      <Navbar />
      <main className="pb-16 md:pb-0 md:pt-16">
        {children}
      </main>
    </div>
  );
} 