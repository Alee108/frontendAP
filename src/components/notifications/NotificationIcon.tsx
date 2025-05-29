import React from 'react';
import { Bell } from 'lucide-react';
import { useNotifications } from '../../contexts/NotificationContext';
import { cn } from '../../lib/utils';

interface NotificationIconProps {
  onClick: () => void;
  className?: string;
}

export const NotificationIcon: React.FC<NotificationIconProps> = ({ onClick, className }) => {
  const { unreadCount } = useNotifications();

  return (
    <div className="relative">
      <button
        onClick={onClick}
        className={cn(
          'relative p-2 text-gray-600 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-full',
          className
        )}
      >
        <Bell className="w-6 h-6" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-500 rounded-full">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>
    </div>
  );
}; 