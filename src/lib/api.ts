import axios from 'axios';
import { toast } from 'sonner';
import type { Post } from '../types/post';

// Token and user management utilities
const TOKEN_KEY = 'auth_token';
const USER_KEY = 'current_user';

const tokenManager = {
  setToken: (token: string) => {
    try {
      // Try sessionStorage first
      sessionStorage.setItem(TOKEN_KEY, token);
      // Backup in localStorage
      localStorage.setItem(TOKEN_KEY, token);
      return true;
    } catch (error) {
      console.error('Error saving token:', error);
      return false;
    }
  },

  getToken: () => {
    try {
      // Try sessionStorage first
      let token = sessionStorage.getItem(TOKEN_KEY);
      if (!token) {
        // Fallback to localStorage
        token = localStorage.getItem(TOKEN_KEY);
        if (token) {
          // If found in localStorage, sync to sessionStorage
          sessionStorage.setItem(TOKEN_KEY, token);
        }
      }
      return token;
    } catch (error) {
      console.error('Error retrieving token:', error);
      return null;
    }
  },

  removeToken: () => {
    try {
      sessionStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(TOKEN_KEY);
      sessionStorage.removeItem(USER_KEY);
      localStorage.removeItem(USER_KEY);
      return true;
    } catch (error) {
      console.error('Error removing token:', error);
      return false;
    }
  }
};

const userManager = {
  setUser: (user: User) => {
    try {
      const userData = JSON.stringify(user);
      sessionStorage.setItem(USER_KEY, userData);
      localStorage.setItem(USER_KEY, userData);
      return true;
    } catch (error) {
      console.error('Error saving user data:', error);
      return false;
    }
  },

  getUser: (): User | null => {
    try {
      let userData = sessionStorage.getItem(USER_KEY);
      if (!userData) {
        userData = localStorage.getItem(USER_KEY);
        if (userData) {
          sessionStorage.setItem(USER_KEY, userData);
        }
      }
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.error('Error retrieving user data:', error);
      return null;
    }
  }
};

const API_URL = 'http://localhost:3001';

const axiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests if available
axiosInstance.interceptors.request.use((config) => {
  const token = tokenManager.getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor per gestire gli errori di rete
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      // Handle 401 Unauthorized errors
      if (error.response.status === 401) {
        tokenManager.removeToken();
        window.location.href = '/login';
        toast.error('Session expired. Please login again.');
        return Promise.reject(error);
      }
      
      const message = error.response.data?.message || 'An error occurred';
      toast.error(message);
    } else if (error.request) {
      toast.error('No response from server. Please check your connection.');
    } else {
      toast.error('An error occurred while setting up the request.');
    }
    return Promise.reject(error);
  }
);

export interface User {
  id: string;
  _id: string;
  username: string;
  email: string;
  name?: string;
  surname?: string;
  profilePhoto?: string;
  bio?: string;
  createdAt: string;
  updatedAt: string;
  followers?: string[];
  following?: string[];
}

export interface Tribe {
  id: string;
  _id: string;
  name: string;
  description: string;
  visibility: 'PUBLIC' | 'PRIVATE';
  profilePhoto?: string;
  founder: User;
  memberships: Array<{
    user: User;
    role: 'FOUNDER' | 'MODERATOR' | 'MEMBER';
    status: 'ACTIVE' | 'PENDING';
    joinedAt: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

export interface Comment {
  id: string;
  content: string;
  author: User;
  postId: string;
}

export const apiService = {
  // Auth
  login: async (email: string, password: string) => {
    try {
      const response = await axiosInstance.post('/auth/login', { email, password });
      if (response.data.access_token && response.data.user) {
        const tokenSuccess = tokenManager.setToken(response.data.access_token);
        const userSuccess = userManager.setUser(response.data.user);
        
        if (!tokenSuccess || !userSuccess) {
          toast.error('Failed to save authentication data');
        }
      } else {
        console.error('Token or user data not found in login response:', response.data);
        toast.error('Invalid login response');
      }
      return response.data;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  },

  verifyToken: () => {
    return tokenManager.getToken();
  },

  getCurrentUser: () => {
    return userManager.getUser();
  },

  signup: async (formData: FormData) => {
    try {
      const response = await axiosInstance.post('/auth/signup', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      console.error('Signup error:', error);
      throw error;
    }
  },

  logout: () => {
    tokenManager.removeToken();
  },

  // Users
  getAllUsers: async () => {
    const response = await axiosInstance.get<User[]>('/users');
    return response.data;
  },

  getTopUsers: async () => {
    const response = await axiosInstance.get<User[]>('/users/top');
    return response.data;
  },

  getUserById: async (userId: string) => {
    const response = await axiosInstance.get<User>(`/users/${userId}`);
    return response.data;
  },

  searchUsers: async (query: string) => {
    const response = await axiosInstance.get<User[]>(`/users/search?username=${encodeURIComponent(query)}`);
    return response.data;
  },

  updateUser: async (userId: string, userData: Partial<User>) => {
    const dataToUpdate: Partial<User> = {
      username: userData.username,
      name: userData.name,
      surname: userData.surname,
      bio: userData.bio,
    };
    const response = await axiosInstance.patch<User>(`/users/${userId}`, dataToUpdate);
    if (userManager.getUser()?._id === userId) {
      userManager.setUser(response.data);
    }
    return response.data;
  },

  updateProfilePhoto: async (userId: string, formData: FormData) => {
    const response = await axiosInstance.patch<User>(`/users/${userId}/profile-photo`, formData, {
       headers: {
          'Content-Type': 'multipart/form-data',
       },
    });
    if (userManager.getUser()?._id === userId) {
      userManager.setUser(response.data);
    }
    return response.data;
  },

  updateUserVisibility: async (userId: string, isPublic: boolean) => {
    const response = await axiosInstance.patch<User>(`/users/${userId}/visibility`, { isPublic });
    if (userManager.getUser()?._id === userId) {
      userManager.setUser(response.data);
    }
    return response.data;
  },

  getUserPosts: async (userId: string) => {
    const response = await axiosInstance.get<Post[]>(`posts/user/${userId}`);
    return response.data;
  },

  getUserFollowers: async (userId: string) => {
    const response = await axiosInstance.get<User[]>(`/users/${userId}/followers`);
    return response.data;
  },

  getUserFollowing: async (userId: string) => {
    const response = await axiosInstance.get<User[]>(`/users/${userId}/following`);
    return response.data;
  },

  followUser: async (userIdToFollow: string) => {
    const response = await axiosInstance.post(`/users/${userIdToFollow}/follow`);
    return response.data;
  },

  unfollowUser: async (userIdToUnfollow: string) => {
    const response = await axiosInstance.post(`/users/${userIdToUnfollow}/unfollow`);
    return response.data;
  },

  // Memberships
  getUserMembershipRequests: async (userId: string) => {
    const response = await axiosInstance.get<Tribe[]>(`/membership/user/${userId}/requests`);
    return response.data;
  },

  getUserMemberships: async (userId: string) => {
    const response = await axiosInstance.get<Tribe[]>(`/membership/user/${userId}`);
    return response.data;
  },

  // Posts
  getRecommendedPosts: async (limit?: number) => {
    try {
      console.log('Fetching recommended posts...'); // Debug log
      const response = await axiosInstance.get('/recommendations/posts', {
        params: { limit }
      });
      console.log('Recommended posts response:', response.data); // Debug log
      return response.data;
    } catch (error) {
      console.error('Error fetching recommended posts:', error);
      if (error.response) {
        console.error('Error response:', error.response.data);
      }
      throw error;
    }
  },

  getPostById: async (postId: string) => {
    const response = await axiosInstance.get<Post>(`/posts/${postId}`);
    return response.data;
  },

  updatePost: async (postId: string, postData: Partial<Post>) => {
    const response = await axiosInstance.patch<Post>(`/posts/${postId}`, postData);
    return response.data;
  },

  deletePost: async (postId: string) => {
    const response = await axiosInstance.delete(`/posts/${postId}`);
    return response.data;
  },

  toggleLike: async (postId: string) => {
    const response = await axiosInstance.post(`/posts/${postId}/like`);
    return response.data;
  },

  addCommentToPost: async (postId: string, content: string) => {
    const response = await axiosInstance.post(`/posts/${postId}/comment`, { content });
    return response.data;
  },

  getComments: async (postId: string) => {
    const response = await axiosInstance.get<Comment[]>(`/comments/post/${postId}`);
    return response.data;
  },

  getAllComments: async () => {
    const response = await axiosInstance.get<Comment[]>('/comments');
    return response.data;
  },

  getCommentById: async (commentId: string) => {
    const response = await axiosInstance.get<Comment>(`/comments/${commentId}`);
    return response.data;
  },

  updateComment: async (commentId: string, commentData: Partial<Comment>) => {
    const response = await axiosInstance.patch<Comment>(`/comments/${commentId}`, commentData);
    return response.data;
  },

  deleteComment: async (commentId: string) => {
    const response = await axiosInstance.delete(`/comments/${commentId}`);
    return response.data;
  },

  getUserComments: async (userId: string) => {
    const response = await axiosInstance.get<Comment[]>(`/comments/user/${userId}`);
    return response.data;
  },

  // Tribes
  createTribe: async (formData: FormData) => {
    const response = await axiosInstance.post<Tribe>('/tribes', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  getAllTribes: async () => {
    const response = await axiosInstance.get('/tribes');
    return response.data;
  },

  getTribeProfile: async (tribeId: string) => {
    const response = await axiosInstance.get<Tribe>(`/tribes/${tribeId}`);
    return response.data;
  },

  updateTribe: async (tribeId: string, tribeData: Partial<Tribe>) => {
    const response = await axiosInstance.patch<Tribe>(`/tribes/${tribeId}`, tribeData);
    return response.data;
  },

  deleteTribe: async (tribeId: string) => {
    const response = await axiosInstance.delete(`/tribes/${tribeId}`);
    return response.data;
  },

  updateTribeVisibility: async (tribeId: string, visibility: 'PUBLIC' | 'PRIVATE') => {
    const response = await axiosInstance.patch<Tribe>(`/tribes/${tribeId}/visibility`, { visibility });
    return response.data;
  },

  updateTribePhoto: async (tribeId: string, formData: FormData) => {
    const response = await axiosInstance.patch<Tribe>(`/tribes/${tribeId}/profile-photo`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  handleMembershipRequest: async (tribeId: string, userId: string, action: 'approve' | 'reject') => {
    const response = await axiosInstance.patch<any>(`/tribes/${tribeId}/membership/${userId}`, { action });
    return response.data;
  },

  promoteTribeMember: async (tribeId: string, userId: string) => {
    const response = await axiosInstance.patch<any>(`/tribes/${tribeId}/members/${userId}/promote`);
    return response.data;
  },

  getTribeMembers: async (tribeId: string) => {
    const response = await axiosInstance.get<User[]>(`/tribes/${tribeId}/members`);
    return response.data;
  },

  getTribePendingRequests: async (tribeId: string) => {
    const response = await axiosInstance.get<any[]>(`/tribes/${tribeId}/pending-requests`);
    return response.data;
  },

  requestMembership: async (tribeId: string) => {
    const response = await axiosInstance.post(`/tribes/join/${tribeId}`);
    return response.data;
  },

  getTribePosts: async (tribeId: string) => {
    const response = await axiosInstance.get<Post[]>(`/tribes/${tribeId}/posts`);
    return response.data;
  },

  searchTribes: async (query: string) => {
    const response = await axiosInstance.get(`/tribes/search?name=${encodeURIComponent(query)}`);
    return response.data;
  },

  // Membership
  getAllMemberships: async () => {
    const response = await axiosInstance.get<any[]>('/membership');
    return response.data;
  },

  getMembershipById: async (membershipId: string) => {
    const response = await axiosInstance.get<any>(`/membership/${membershipId}`);
    return response.data;
  },

  updateMembership: async (membershipId: string, membershipData: any) => {
    const response = await axiosInstance.patch<any>(`/membership/${membershipId}`, membershipData);
    return response.data;
  },

  deletePendingMembership: async (membershipId: string) => {
    const response = await axiosInstance.delete(`/membership/${membershipId}`);
    return response.data;
  },

  getMembershipsByTribe: async (tribeId: string) => {
    const response = await axiosInstance.get<any[]>(`/membership/tribe/${tribeId}`);
    return response.data;
  },

  getMembershipsByTribeAndStatus: async (tribeId: string, status: 'ACTIVE' | 'PENDING') => {
    const response = await axiosInstance.get<any[]>(`/membership/tribe/${tribeId}/status/${status}`);
    return response.data;
  },

  exitTribe: async (userId: string, tribeId: string) => {
    const response = await axiosInstance.patch(`/membership/exit/${userId}/${tribeId}`);
    return response.data;
  },

  // Posts
  createPost: async (formData: FormData) => {
    const response = await axiosInstance.post<Post>('/posts', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  recordPostView: async (postId: string) => {
    try {
      await axiosInstance.post(`/recommendations/record-view/${postId}`);
    } catch (error) {
      console.error('Error recording post view:', error);
      throw error;
    }
  },

  likePost: async (postId: string) => {
    try {
      const response = await axiosInstance.post(`/posts/${postId}/like`);
      return response.data;
    } catch (error) {
      console.error('Error liking post:', error);
      throw error;
    }
  },

  unlikePost: async (postId: string) => {
    try {
      const response = await axiosInstance.delete(`/posts/${postId}/like`);
      return response.data;
    } catch (error) {
      console.error('Error unliking post:', error);
      throw error;
    }
  },

  addComment: async (postId: string, content: string) => {
    try {
      const response = await axiosInstance.post(`/posts/${postId}/comments`, { content });
      return response.data;
    } catch (error) {
      console.error('Error adding comment:', error);
      throw error;
    }
  },
};

export default axiosInstance; 