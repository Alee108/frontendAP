export interface User {
  _id: string;
  name: string;
  surname: string;
  username: string;
  profilePhoto?: string;
  isPublic?: boolean;
}

export interface Tribe {
  _id: string;
  name: string;
  profilePhoto?: string;
}

// Define the structure of comments as they appear within the Post object from the backend
export interface PostCommentInPost {
  _id: string;
  content: string; // Assuming backend sends 'content' for the text within the post object
  userId: { // Assuming this is the structure of userId within a comment in the post object
    _id: string;
    username: string;
    profilePhoto?: string | null;
    name?: string; // Might be included
    surname?: string; // Might be included
  };
  createdAt?: string;
  updatedAt?: string;
  __v?: number;
}

export interface Post {
  _id: string;
  description: string;
  location: string;
  base64Image: string;
  userId: { // This userId structure seems different from the one in comments, note this.
    _id: string;
    name: string;
    surname: string;
    username: string;
    profilePhoto: string | null;
    isPublic?: boolean;
  };
  tribe?: Tribe;
  likes: string[];
  comments: PostCommentInPost[]; // Use the specific type for comments within Post
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
// Note: There is another Comment interface definition in ../lib/api.ts which uses 'text'.
// We will map from PostCommentInPost to the ApiCommentType in PostCard.
