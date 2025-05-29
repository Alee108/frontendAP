export type NotificationType =
  | 'POST_LIKE'
  | 'POST_COMMENT'
  | 'TRIBE_MEMBERSHIP_REQUEST'
  | 'TRIBE_MEMBERSHIP_ACCEPTED'
  | 'TRIBE_MEMBERSHIP_REJECTED'
  | 'TRIBE_MEMBER_REMOVED'
  | 'TRIBE_MEMBER_PROMOTED'
  | 'TRIBE_UPDATE'
  | 'TRIBE_PROMOTION'
  | 'NEW_MESSAGE'
  | 'SYSTEM';

export interface Notification {
  _id: string;
  type: NotificationType;
  content: string;
  createdAt: string;
  read: boolean;
  data?: Record<string, any>;
}

export interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  error: string | null;
}

export interface NotificationContextType extends NotificationState {
  fetchNotifications: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
  clearAllNotifications: () => Promise<void>;
} 