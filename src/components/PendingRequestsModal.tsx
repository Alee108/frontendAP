import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { apiService } from '../lib/api';
import { toast } from 'sonner';
import { User } from '../types/post';

interface PendingRequestsModalProps {
  isOpen: boolean;
  onClose: () => void;
  tribeId: string;
  onRequestHandled: () => void;
}

interface PendingRequest {
  _id: string;
  userId: User;
  status: 'pending';
  createdAt: string;
}

export function PendingRequestsModal({ isOpen, onClose, tribeId, onRequestHandled }: PendingRequestsModalProps) {
  const [requests, setRequests] = useState<PendingRequest[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchPendingRequests();
    }
  }, [isOpen, tribeId]);

  const fetchPendingRequests = async () => {
    setIsLoading(true);
    try {
      const response = await apiService.getPendingRequests(tribeId);
      setRequests(response.data);
    } catch (error) {
      toast.error('Failed to fetch pending requests');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRequest = async (userId: string, action: 'accept' | 'reject') => {
    setIsLoading(true);
    try {
      await apiService.handleTribeRequest(tribeId, userId, action);
      toast.success(`Request ${action}ed successfully`);
      setRequests(requests.filter(req => req.userId._id !== userId));
      onRequestHandled();
    } catch (error) {
      toast.error(`Failed to ${action} request`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Pending Join Requests</DialogTitle>
        </DialogHeader>
        <div className="mt-4 space-y-4">
          {isLoading ? (
            <div className="text-center">Loading...</div>
          ) : requests.length === 0 ? (
            <div className="text-center text-gray-500">No pending requests</div>
          ) : (
            requests.map((request) => (
              <div key={request._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  {request.userId.profilePhoto ? (
                    <img
                      src={request.userId.profilePhoto}
                      alt={request.userId.username}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                      <span className="text-gray-500">
                        {request.userId.username.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                  <div>
                    <p className="font-medium">{request.userId.name} {request.userId.surname}</p>
                    <p className="text-sm text-gray-500">@{request.userId.username}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleRequest(request.userId._id, 'reject')}
                    disabled={isLoading}
                  >
                    Reject
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => handleRequest(request.userId._id, 'accept')}
                    disabled={isLoading}
                  >
                    Accept
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
} 