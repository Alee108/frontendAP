import { useEffect, useState } from 'react';
import { Post } from '../types/post';
import { PostCard } from '../components/PostCard';
import { apiService } from '../lib/api';
import { toast } from 'sonner';
import { useAuth } from '../lib/auth-context';
import { Navigate } from 'react-router-dom';

export function Home() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user, loading: authLoading } = useAuth();

  const fetchPosts = async () => {
    try {
      console.log('Starting to fetch posts...'); // Debug log
      const data = await apiService.getRecommendedPosts();
      console.log('Raw posts data:', data); // Debug log
      
      if (!Array.isArray(data)) {
        console.error('Received non-array data:', data);
        toast.error('Invalid data received from server');
        return;
      }

      // Filter out posts without complete user data
      const validPosts = data.filter(post => {
        const isValid = post.userId && post.userId._id;
        if (!isValid) {
          console.log('Filtered out post due to missing user data:', post);
        }
        return isValid;
      });

      console.log('Number of valid posts:', validPosts.length); // Debug log
      console.log('Valid posts:', validPosts); // Debug log
      
      setPosts(validPosts);
    } catch (error) {
      console.error('Error fetching posts:', error);
      toast.error('Failed to fetch posts');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      console.log('User authenticated, fetching posts...'); // Debug log
      fetchPosts();
    }
  }, [user]);

  if (authLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      {posts.length === 0 ? (
        <div className="text-center text-gray-500">
          No posts found. Follow some users or tribes to see their posts here!
        </div>
      ) : (
        <div className="space-y-6">
          {posts.map((post) => (
            <PostCard
              key={post._id}
              post={post}
              onPostUpdate={fetchPosts}
            />
          ))}
        </div>
      )}
    </div>
  );
} 