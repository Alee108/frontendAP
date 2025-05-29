import React from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Trash2, Check } from 'lucide-react';
import { Notification } from '../../types/notification';
import { useNotifications } from '../../contexts/NotificationContext';
import { cn } from '../../lib/utils';

interface NotificationItemProps {
  notification: Notification;
  onNavigate?: (notification: Notification) => void;
}

const getNotificationIcon = (type: Notification['type']) => {
  switch (type) {
    case 'POST_LIKE':
      return '❤️';
    case 'POST_COMMENT':
      return '💬';
    case 'TRIBE_MEMBERSHIP_REQUEST':
      return '👥';
    case 'TRIBE_MEMBERSHIP_ACCEPTED':
      return '✅';
    case 'TRIBE_MEMBERSHIP_REJECTED':
      return '❌';
    case 'TRIBE_MEMBER_REMOVED':
      return '🚫';
    case 'TRIBE_MEMBER_PROMOTED':
      return '⭐';
    case 'TRIBE_UPDATE':
      return '📢';
    case 'TRIBE_PROMOTION':
      return '🎉';
    case 'NEW_MESSAGE':
      return '✉️';
    case 'SYSTEM':
      return '🔔';
    default:
      return '📌';
  }
};

export const NotificationItem: React.FC<NotificationItemProps> = ({ notification, onNavigate }) => {
  const { markAsRead, deleteNotification } = useNotifications();

  const handleClick = () => {
    if (!notification.read) {
      markAsRead(notification._id);
    }
    if (onNavigate) {
      onNavigate(notification);
    }
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    console.log(notification)
    deleteNotification(notification._id);
  };

  return (
    <div
      onClick={handleClick}
      className={cn(
        'flex items-start gap-3 p-4 cursor-pointer hover:bg-gray-50 transition-colors',
        !notification.read && 'bg-blue-50'
      )}
    >
      <div className="flex-shrink-0 text-2xl">{getNotificationIcon(notification.type)}</div>
      <div className="flex-grow min-w-0">
        <p className="text-sm text-gray-900">{notification.content}</p>
        <p className="mt-1 text-xs text-gray-500">
          {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
        </p>
      </div>
      <div className="flex-shrink-0 flex items-center gap-2">
        {!notification.read && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              markAsRead(notification._id);
            }}
            className="p-1 text-gray-400 hover:text-gray-600"
          >
            <Check className="w-4 h-4" />
          </button>
        )}
        <button
          onClick={handleDelete}
          className="p-1 text-gray-400 hover:text-red-600"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}; 