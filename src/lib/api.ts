import axios from 'axios';
import { toast } from 'sonner';

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

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3001',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor per aggiungere il token JWT alle richieste
api.interceptors.request.use((config) => {
  const token = tokenManager.getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor per gestire gli errori di rete
api.interceptors.response.use(
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

export interface Post {
  id: string;
  description: string;
  location: string;
  base64Image: string;
  author: User;
  tribe: Tribe;
  likes: number;
  comments: number;
  liked: boolean;
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
      const response = await api.post('/auth/login', { email, password });
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
      const response = await api.post('/auth/signup', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      if (response.data.access_token && response.data.user) {
        const tokenSuccess = tokenManager.setToken(response.data.access_token);
        const userSuccess = userManager.setUser(response.data.user);
        
        if (!tokenSuccess || !userSuccess) {
          toast.error('Failed to save authentication data');
        }
      } else {
        console.error('Token or user data not found in signup response:', response.data);
        toast.error('Invalid signup response');
      }
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
    const response = await api.get<User[]>('/users');
    return response.data;
  },

  getTopUsers: async () => {
    const response = await api.get<User[]>('/users/top');
    return response.data;
  },

  getUserById: async (userId: string) => {
    const response = await api.get<User>(`/users/${userId}`);
    return response.data;
  },

  searchUsers: async (query: string) => {
    const response = await api.get<User[]>(`/users/search?username=${encodeURIComponent(query)}`);
    return response.data;
  },

  updateUser: async (userId: string, userData: Partial<User>) => {
    const dataToUpdate: Partial<User> = {
      username: userData.username,
      name: userData.name,
      surname: userData.surname,
      bio: userData.bio,
    };
    const response = await api.patch<User>(`/users/${userId}`, dataToUpdate);
    if (userManager.getUser()?._id === userId) {
      userManager.setUser(response.data);
    }
    return response.data;
  },

  updateProfilePhoto: async (userId: string, formData: FormData) => {
    const response = await api.patch<User>(`/users/${userId}/profile-photo`, formData, {
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
    const response = await api.patch<User>(`/users/${userId}/visibility`, { isPublic });
    if (userManager.getUser()?._id === userId) {
      userManager.setUser(response.data);
    }
    return response.data;
  },

  getUserPosts: async (userId: string) => {
    const response = await api.get<Post[]>(`posts/user/${userId}`);
    return response.data;
  },

  getUserFollowers: async (userId: string) => {
    const response = await api.get<User[]>(`/users/${userId}/followers`);
    return response.data;
  },

  getUserFollowing: async (userId: string) => {
    const response = await api.get<User[]>(`/users/${userId}/following`);
    return response.data;
  },

  followUser: async (userIdToFollow: string) => {
    const response = await api.post(`/users/${userIdToFollow}/follow`);
    return response.data;
  },

  unfollowUser: async (userIdToUnfollow: string) => {
    const response = await api.post(`/users/${userIdToUnfollow}/unfollow`);
    return response.data;
  },

  // Memberships
  getUserMembershipRequests: async (userId: string) => {
    const response = await api.get<Tribe[]>(`/membership/user/${userId}/requests`);
    return response.data;
  },

  getUserMemberships: async (userId: string) => {
    const response = await api.get<Tribe[]>(`/membership/user/${userId}`);
    return response.data;
  },

  // Posts
  getRecommendedPosts: async () => {
    const response = await api.get<Post[]>('/posts');
    return response.data;
  },

  getPostById: async (postId: string) => {
    const response = await api.get<Post>(`/posts/${postId}`);
    return response.data;
  },

  updatePost: async (postId: string, postData: Partial<Post>) => {
    const response = await api.patch<Post>(`/posts/${postId}`, postData);
    return response.data;
  },

  deletePost: async (postId: string) => {
    const response = await api.delete(`/posts/${postId}`);
    return response.data;
  },

  toggleLike: async (postId: string) => {
    const response = await api.post(`/posts/${postId}/like`);
    return response.data;
  },

  addCommentToPost: async (postId: string, content: string) => {
    const response = await api.post(`/posts/${postId}/comment`, { content });
    return response.data;
  },

  getComments: async (postId: string) => {
    const response = await api.get<Comment[]>(`/comments/post/${postId}`);
    return response.data;
  },

  getAllComments: async () => {
    const response = await api.get<Comment[]>('/comments');
    return response.data;
  },

  getCommentById: async (commentId: string) => {
    const response = await api.get<Comment>(`/comments/${commentId}`);
    return response.data;
  },

  updateComment: async (commentId: string, commentData: Partial<Comment>) => {
    const response = await api.patch<Comment>(`/comments/${commentId}`, commentData);
    return response.data;
  },

  deleteComment: async (commentId: string) => {
    const response = await api.delete(`/comments/${commentId}`);
    return response.data;
  },

  getUserComments: async (userId: string) => {
    const response = await api.get<Comment[]>(`/comments/user/${userId}`);
    return response.data;
  },

  // Tribes
  createTribe: async (formData: FormData) => {
    const response = await api.post<Tribe>('/tribes', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  getAllTribes: async () => {
    const response = await api.get('/tribes');
    return response.data;
  },

  getTribeProfile: async (tribeId: string) => {
    const response = await api.get<Tribe>(`/tribes/${tribeId}`);
    return response.data;
  },

  updateTribe: async (tribeId: string, tribeData: Partial<Tribe>) => {
    const response = await api.patch<Tribe>(`/tribes/${tribeId}`, tribeData);
    return response.data;
  },

  deleteTribe: async (tribeId: string) => {
    const response = await api.delete(`/tribes/${tribeId}`);
    return response.data;
  },

  updateTribeVisibility: async (tribeId: string, visibility: 'PUBLIC' | 'PRIVATE') => {
    const response = await api.patch<Tribe>(`/tribes/${tribeId}/visibility`, { visibility });
    return response.data;
  },

  updateTribePhoto: async (tribeId: string, formData: FormData) => {
    const response = await api.patch<Tribe>(`/tribes/${tribeId}/profile-photo`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  handleMembershipRequest: async (tribeId: string, userId: string, action: 'approve' | 'reject') => {
    const response = await api.patch<any>(`/tribes/${tribeId}/membership/${userId}`, { action });
    return response.data;
  },

  promoteTribeMember: async (tribeId: string, userId: string) => {
    const response = await api.patch<any>(`/tribes/${tribeId}/members/${userId}/promote`);
    return response.data;
  },

  getTribeMembers: async (tribeId: string) => {
    const response = await api.get<User[]>(`/tribes/${tribeId}/members`);
    return response.data;
  },

  getTribePendingRequests: async (tribeId: string) => {
    const response = await api.get<any[]>(`/tribes/${tribeId}/pending-requests`);
    return response.data;
  },

  requestMembership: async (tribeId: string) => {
    const response = await api.post(`/tribes/join/${tribeId}`);
    return response.data;
  },

  getTribePosts: async (tribeId: string) => {
    const response = await api.get<Post[]>(`/tribes/${tribeId}/posts`);
    return response.data;
  },

  searchTribes: async (query: string) => {
    const response = await api.get(`/tribes/search?name=${encodeURIComponent(query)}`);
    return response.data;
  },

  // Membership
  getAllMemberships: async () => {
    const response = await api.get<any[]>('/membership');
    return response.data;
  },

  getMembershipById: async (membershipId: string) => {
    const response = await api.get<any>(`/membership/${membershipId}`);
    return response.data;
  },

  updateMembership: async (membershipId: string, membershipData: any) => {
    const response = await api.patch<any>(`/membership/${membershipId}`, membershipData);
    return response.data;
  },

  deletePendingMembership: async (membershipId: string) => {
    const response = await api.delete(`/membership/${membershipId}`);
    return response.data;
  },

  getMembershipsByTribe: async (tribeId: string) => {
    const response = await api.get<any[]>(`/membership/tribe/${tribeId}`);
    return response.data;
  },

  getMembershipsByTribeAndStatus: async (tribeId: string, status: 'ACTIVE' | 'PENDING') => {
    const response = await api.get<any[]>(`/membership/tribe/${tribeId}/status/${status}`);
    return response.data;
  },

  exitTribe: async (userId: string, tribeId: string) => {
    const response = await api.patch(`/membership/exit/${userId}/${tribeId}`);
    return response.data;
  },

  // Posts
  createPost: async (formData: FormData) => {
    const response = await api.post<Post>('/posts', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
};

export default api; 