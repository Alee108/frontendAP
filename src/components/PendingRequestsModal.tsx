import { useState, useEffect } from 'react';
import { apiService, type Membership } from '../lib/api';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2, Check, X } from 'lucide-react';
import { toast } from 'sonner';

interface PendingRequestsModalProps {
  isOpen: boolean;
  onClose: () => void;
  tribeId: string;
  onRequestHandled: () => void;
}

export function PendingRequestsModal({ isOpen, onClose, tribeId, onRequestHandled }: PendingRequestsModalProps) {
  const [pendingRequests, setPendingRequests] = useState<Membership[]>([]);
  const [loading, setLoading] = useState(true);
  const [handlingRequest, setHandlingRequest] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadPendingRequests();
    }
  }, [isOpen, tribeId]);

  const loadPendingRequests = async () => {
    try {
      const requests = await apiService.getTribePendingRequests(tribeId);
      setPendingRequests(requests);
    } catch (error) {
      toast.error('Failed to load pending requests');
    } finally {
      setLoading(false);
    }
  };

  const handleRequest = async (userId: string, action: string) => {
    setHandlingRequest(userId);
    try {
      await apiService.handleMembershipRequest(tribeId, userId, action);
      const updatedRequests = pendingRequests.filter(req => req.user._id !== userId);
      setPendingRequests(updatedRequests);
      toast.success(`Request ${action}ed successfully`);
      onRequestHandled();
      
      // Close the modal if there are no more pending requests
      if (updatedRequests.length === 0) {
        onClose();
      }
    } catch (error) {
      toast.error(`Failed to ${action} request`);
    } finally {
      setHandlingRequest(null);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Pending Requests</DialogTitle>
        </DialogHeader>
        
        {loading ? (
          <div className="flex justify-center items-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
          </div>
        ) : pendingRequests.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No pending requests
          </div>
        ) : (
          <div className="space-y-4">
            {pendingRequests.map((request) => (
              <div
                key={request._id}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <img
                    src={request.user.profilePhoto || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=200&h=200&q=80'}
                    alt={request.user.username}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                  <div>
                    <p className="font-medium text-gray-900">{request.user.username}</p>
                    <p className="text-sm text-gray-500">Requested {new Date(request.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-green-600 border-green-200 hover:bg-green-50"
                    onClick={() => handleRequest(request.user._id, 'accept')}
                    disabled={handlingRequest === request.user._id}
                  >
                    {handlingRequest === request.user._id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Check className="h-4 w-4" />
                    )}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-red-600 border-red-200 hover:bg-red-50"
                    onClick={() => handleRequest(request.user._id, 'reject')}
                    disabled={handlingRequest === request.user._id}
                  >
                    {handlingRequest === request.user._id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <X className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
} 