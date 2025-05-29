import { useNavigate } from 'react-router-dom';
import { Notification } from '../types/notification';

export const useNotificationNavigation = () => {
  const navigate = useNavigate();

  const handleNotificationClick = (notification: Notification) => {
    switch (notification.type) {
      case 'POST_LIKE':
      case 'POST_COMMENT':
        if (notification.data?.postId) {
          navigate(`/posts/${notification.data.postId}`);
        }
        break;
      case 'TRIBE_MEMBERSHIP_REQUEST':
      case 'TRIBE_MEMBERSHIP_ACCEPTED':
      case 'TRIBE_MEMBERSHIP_REJECTED':
      case 'TRIBE_MEMBER_REMOVED':
      case 'TRIBE_MEMBER_PROMOTED':
      case 'TRIBE_UPDATE':
      case 'TRIBE_PROMOTION':
        if (notification.data?.tribeId) {
          navigate(`/tribes/${notification.data.tribeId}`);
        }
        break;
      case 'NEW_MESSAGE':
        if (notification.data?.chatId) {
          navigate(`/chat/${notification.data.chatId}`);
        }
        break;
      default:
        // For system notifications or unknown types, do nothing
        break;
    }
  };

  return handleNotificationClick;
}; 