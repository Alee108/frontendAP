export interface User {
  _id: string;
  username: string;
  name: string;
  surname: string;
  email: string;
  profilePhoto?: string;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
} 