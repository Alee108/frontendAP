import { User } from './user';

export interface Comment {
  _id: string;
  text: string;
  userId: {
    _id: string;
    name?: string;
    surname?: string;
    username: string;
    profilePhoto?: string | null;
  };
  postId: string;
  createdAt?: string;
  updatedAt?: string;
  __v?: number;
} 