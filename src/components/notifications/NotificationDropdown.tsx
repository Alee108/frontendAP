import React, { useRef, useEffect } from 'react';
import { format, isToday, isYesterday, isThisWeek } from 'date-fns';
import { CheckCheck, Trash2 } from 'lucide-react';
import { Notification } from '../../types/notification';
import { useNotifications } from '../../contexts/NotificationContext';
import { NotificationItem } from './NotificationItem';

interface NotificationDropdownProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate?: (notification: Notification) => void;
}

const groupNotificationsByDate = (notifications: Notification[]) => {
  const groups: { [key: string]: Notification[] } = {
    today: [],
    yesterday: [],
    thisWeek: [],
    older: [],
  };

  notifications.forEach((notification) => {
    const date = new Date(notification.createdAt);
    if (isToday(date)) {
      groups.today.push(notification);
    } else if (isYesterday(date)) {
      groups.yesterday.push(notification);
    } else if (isThisWeek(date)) {
      groups.thisWeek.push(notification);
    } else {
      groups.older.push(notification);
    }
  });

  return groups;
};

export const NotificationDropdown: React.FC<NotificationDropdownProps> = ({
  isOpen,
  onClose,
  onNavigate,
}) => {
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { notifications, isLoading, markAllAsRead, clearAllNotifications } = useNotifications();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const groupedNotifications = groupNotificationsByDate(notifications);

  return (
    <div
      ref={dropdownRef}
      className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-50"
    >
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-900">Notifications</h3>
          <div className="flex items-center gap-2">
            <button
              onClick={markAllAsRead}
              className="p-1 text-gray-400 hover:text-gray-600"
              title="Mark all as read"
            >
              <CheckCheck className="w-5 h-5" />
            </button>
            <button
              onClick={clearAllNotifications}
              className="p-1 text-gray-400 hover:text-red-600"
              title="Clear all notifications"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      <div className="max-h-96 overflow-y-auto">
        {isLoading ? (
          <div className="p-4 text-center text-gray-500">Loading notifications...</div>
        ) : notifications.length === 0 ? (
          <div className="p-4 text-center text-gray-500">No notifications</div>
        ) : (
          Object.entries(groupedNotifications).map(([group, groupNotifications]) => {
            if (groupNotifications.length === 0) return null;

            let groupTitle = '';
            switch (group) {
              case 'today':
                groupTitle = 'Today';
                break;
              case 'yesterday':
                groupTitle = 'Yesterday';
                break;
              case 'thisWeek':
                groupTitle = 'This Week';
                break;
              case 'older':
                groupTitle = 'Older';
                break;
            }

            return (
              <div key={group}>
                <div className="px-4 py-2 bg-gray-50 text-xs font-medium text-gray-500">
                  {groupTitle}
                </div>
                {groupNotifications.map((notification) => (
                  <NotificationItem
                    key={notification.id}
                    notification={notification}
                    onNavigate={onNavigate}
                  />
                ))}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}; 