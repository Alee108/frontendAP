import { useState, useEffect } from 'react';
import { apiService } from '../lib/api';
import { useAuth } from '../lib/auth-context';

export const useUserInTribe = () => {
  const { user } = useAuth();
  const [isInTribe, setIsInTribe] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkMembership = async () => {
      if (!user?._id) {
        setIsInTribe(false);
        setIsLoading(false);
        return;
      }

      try {
        const memberships = await apiService.getUserMemberships(user._id);

       
        setIsInTribe(memberships.length > 0);
      } catch (error) {
        console.error('Error checking user memberships:', error);
        setIsInTribe(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkMembership();
  }, [user]);

  return { isInTribe, isLoading };
};