import { createContext, useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiService } from './api';
import type { User } from './api';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (formData: FormData) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Get token directly from verifyToken (now sync)
    const token = apiService.verifyToken();
    
    if (token) {
      // If token exists, try to get user from storage
      const currentUser = apiService.getCurrentUser();
      if (currentUser) {
        setUser(currentUser);
      } else {
         // If token exists but user data is not in storage, consider it logged out
         apiService.logout(); // Clear invalid token and user data
      }
    }
    // Set loading to false after checking token and user data
    setLoading(false);
  }, []); // Empty dependency array means this runs once on mount

  const login = async (email: string, password: string) => {
    const { token, user } = await apiService.login(email, password);
    localStorage.setItem('token', token);
    setUser(user);
    navigate('/home');
  };

  const signup = async (formData: FormData) => {
    await apiService.signup(formData);
    navigate('/login');
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    navigate('/login');
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout }}>
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