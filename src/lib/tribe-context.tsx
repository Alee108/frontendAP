import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiService } from './api';
import { useAuth } from './auth-context';
import { Tribe } from './api';

interface TribeContextType {
  activeTribe: Tribe | null;
  refreshActiveTribe: () => Promise<void>;
  clearActiveTribe: () => void;
}

const TribeContext = createContext<TribeContextType | undefined>(undefined);

export function TribeProvider({ children }: { children: React.ReactNode }) {
  const [activeTribe, setActiveTribe] = useState<Tribe | null>(null);
  const { user } = useAuth();

  const clearActiveTribe = () => {
    setActiveTribe(null);
  };

  const refreshActiveTribe = async () => {
    if (!user?._id) {
      clearActiveTribe();
      return;
    }

    try {
      const memberships = await apiService.getAllUserMemberships(user._id);
      const activeMembership = memberships.find(m => m.status === 'ACTIVE');
      console.log("ACTIVE MEMBERSHIP: ",activeMembership)
      const tribeID = activeMembership?.tribe
      if (activeMembership) {
        const tribe = await apiService.getTribeProfile(activeMembership?.tribe);
        setActiveTribe(tribe);
      } else {
        clearActiveTribe();
      }
    } catch (error) {
      console.error('Error refreshing active tribe:', error);
      clearActiveTribe();
    }
  };

  // Refresh tribe when user changes
  useEffect(() => {
    refreshActiveTribe();
  }, [user?._id]);

  // Cleanup when component unmounts
  useEffect(() => {
    return () => {
      clearActiveTribe();
    };
  }, []);

  return (
    <TribeContext.Provider value={{ activeTribe, refreshActiveTribe, clearActiveTribe }}>
      {children}
    </TribeContext.Provider>
  );
}

export function useTribe() {
  const context = useContext(TribeContext);
  if (context === undefined) {
    throw new Error('useTribe must be used within a TribeProvider');
  }
  return context;
} 