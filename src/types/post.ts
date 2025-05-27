export interface User {
  _id: string;
  name: string;
  surname: string;
  username: string;
  profilePhoto?: string;
}

export interface Tribe {
  _id: string;
  name: string;
}

export interface Comment {
  _id: string;
  content: string;
  userId: User;
  createdAt: string;
}

export interface Post {
  _id: string;
  description: string;
  location: string;
  base64Image: string;
  userId: {
    _id: string;
    name: string;
    surname: string;
    username: string;
    profilePhoto: string | null;
  };
  likes: string[];
  comments: Array<{
    _id: string;
    content: string;
    userId: {
      _id: string;
      username: string;
      profilePhoto: string | null;
    };
  }>;
  commentCount: number;
  liked: boolean;
  metadata: {
    sentiment: string | null;
    keywords: string[];
    language: string | null;
    category: string | null;
    createdAt: string | null;
    _id: string;
    analyzedAt: string;
  };
  createdAt: string;
  updatedAt: string;
  archived: boolean;
} 