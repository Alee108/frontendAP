import { useEffect, useState, useRef, useCallback } from 'react';
import { Post } from '../types/post';
import { PostCard } from '../components/PostCard';
import { apiService } from '../lib/api';
import { toast } from 'sonner';
import { useAuth } from '../lib/auth-context';
import { Navigate } from 'react-router-dom';

export function Home() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const { user, loading: authLoading } = useAuth();
  const observer = useRef<IntersectionObserver>();

  const lastPostElementRef = useCallback((node: HTMLDivElement) => {
    if (isLoading) return;
    if (observer.current) observer.current.disconnect();
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore && !isLoading) {
        setPage(prevPage => prevPage + 1);
      }
    });
    if (node) observer.current.observe(node);
  }, [isLoading, hasMore]);

  const fetchPosts = async (pageNum: number) => {
    if (isLoading) return;
    setIsLoading(true);
    try {
      const data = await apiService.getRecommendedPosts(20);
      
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

      if (pageNum === 1) {
        setPosts(validPosts);
      } else {
        setPosts(prevPosts => [...prevPosts, ...validPosts]);
      }

      // If we received fewer posts than the limit, there are no more posts
      setHasMore(validPosts.length === 20);
    } catch (error) {
      console.error('Error fetching posts:', error);
      toast.error('Failed to fetch posts');
    } finally {
      setIsLoading(false);
    }
  };

  const updatePost = async (postId: string) => {
    try {
      const updatedPost = await apiService.getPostById(postId);
      setPosts(prevPosts => 
        prevPosts.map(post => 
          post._id === postId ? updatedPost : post
        )
      );
    } catch (error) {
      console.error('Error updating post:', error);
      toast.error('Failed to update post');
    }
  };

  useEffect(() => {
    if (user && !authLoading) {
      fetchPosts(page);
    }
  }, [user?._id, page]);

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

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      {posts.length === 0 && !isLoading ? (
        <div className="text-center text-gray-500">
          No posts found. Follow some users or tribes to see their posts here!
        </div>
      ) : (
        <div className="space-y-6">
          {posts.map((post, index) => (
            <div
              key={post._id}
              ref={index === posts.length - 1 ? lastPostElementRef : undefined}
            >
              <PostCard
                post={post}
                onPostUpdate={() => updatePost(post._id)}
              />
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-center py-4">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          )}
          {!hasMore && posts.length > 0 && (
            <div className="text-center text-gray-500 py-4">
              No more posts to load
            </div>
          )}
        </div>
      )}
    </div>
  );
} 