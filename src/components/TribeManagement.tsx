import { useState } from 'react';
import { useAuth } from '../lib/auth-context';
import { apiService } from '../lib/api';
import { toast } from 'sonner';
import { Button } from './ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from './ui/alert-dialog';

interface TribeManagementProps {
  tribeId: string;
  isFounder: boolean;
  isModerator: boolean;
  onTribeUpdate: () => void;
}

export function TribeManagement({ tribeId, isFounder, isModerator, onTribeUpdate }: TribeManagementProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();

  const handleCloseTribe = async () => {
    if (!isFounder) return;
    
    setIsLoading(true);
    try {
      await apiService.closeTribe(tribeId);
      toast.success('Tribe closed successfully');
      onTribeUpdate();
    } catch (error) {
      toast.error('Failed to close tribe');
    } finally {
      setIsLoading(false);
    }
  };

  const handleExitTribe = async () => {
    if (!user?._id) return;
    
    setIsLoading(true);
    try {
      await apiService.exitTribe(user._id, tribeId);
      toast.success('Successfully exited tribe');
      onTribeUpdate();
    } catch (error) {
      toast.error('Failed to exit tribe');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePendingRequests = async () => {
    if (!isFounder && !isModerator) return;
    
    setIsLoading(true);
    try {
      const requests = await apiService.getTribePendingRequests(tribeId);
      // Handle displaying pending requests in a modal or separate view
      onTribeUpdate();
    } catch (error) {
      toast.error('Failed to fetch pending requests');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRequestAction = async (userId: string, action: 'accept' | 'reject') => {
    if (!isFounder && !isModerator) return;
    
    setIsLoading(true);
    try {
      await apiService.handleTribeRequest(tribeId, userId, action);
      toast.success(`Request ${action}ed successfully`);
      onTribeUpdate();
    } catch (error) {
      toast.error(`Failed to ${action} request`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {isFounder && (
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" disabled={isLoading}>
              Close Tribe
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Close Tribe</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to close this tribe? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleCloseTribe}>
                Close Tribe
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}

      {!isFounder && !isModerator && (
        <Button variant="outline" onClick={handleExitTribe} disabled={isLoading}>
          Exit Tribe
        </Button>
      )}

      {(isFounder || isModerator) && (
        <Button variant="secondary" onClick={handlePendingRequests} disabled={isLoading}>
          View Pending Requests
        </Button>
      )}
    </div>
  );
} 