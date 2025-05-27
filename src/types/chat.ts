export interface Message {
  id: string;
  message: string;
  sent_at: string;
  senderId: string;
  receiverId: string;
}

export interface Conversation {
  userId: string;
  username: string;
  messages: Message[];
} 