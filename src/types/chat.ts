export interface PopulatedUser {
  _id: string;
  username: string;
  email: string;
  profilePhoto?: string;
}

export interface Message {
  id: string; // Can be temporary frontend ID or backend _id
  message: string;
  sent_at: string;
  senderId: string; // User ID as string
  receiverId: string; // User ID as string
  // Populated sender and receiver objects when received from backend
  sender: PopulatedUser;
  receiver: PopulatedUser;
}

export interface ReceivedMessage extends Message {
  // This interface represents the message structure received from the backend via WebSocket
  // It's essentially the same as Message but explicitly confirms populated sender/receiver.
  // Can add other fields if the backend sends more data on receive event.
}

export interface Conversation {
  userId: string; // The ID of the other user in the chat
  username: string;
  email: string;
  profilePhoto?: string;
  messages: Message[];
  lastMessage?: {
    text: string;
    sent_at: string;
  };
} 