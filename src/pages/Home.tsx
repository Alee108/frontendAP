import { useEffect, useState } from 'react';
import { apiService, type Post, type Comment } from '../lib/api';
import { toast } from 'sonner';
import { Heart, MessageCircle, Loader2 } from 'lucide-react';
import { CommentSection } from '../components/CommentSection';
import { useAuth } from '../lib/auth-context';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export default function Home() {
  const { user, loading: authLoading } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedPost, setExpandedPost] = useState<string | null>(null);
  const [comments, setComments] = useState<Record<string, Comment[]>>({});
  const [loadingComments, setLoadingComments] = useState<Record<string, boolean>>({});

  useEffect(() => {
    loadPosts();
  }, []);

  useEffect(() => {
    if (expandedPost && !comments[expandedPost]) {
      loadComments(expandedPost);
    }
  }, [expandedPost]);

  const loadPosts = async () => {
    try {
      const data = await apiService.getHomeFeed();
      setPosts(data);
    } catch (error) {
      toast.error('Failed to load posts');
    } finally {
      setLoading(false);
    }
  };

  const loadComments = async (postId: string) => {
    setLoadingComments((prev) => ({ ...prev, [postId]: true }));
    try {
      const data = await apiService.getComments(postId);
      setComments((prev) => ({ ...prev, [postId]: data }));
    } catch (error) {
      toast.error('Failed to load comments');
    } finally {
      setLoadingComments((prev) => ({ ...prev, [postId]: false }));
    }
  };

  const handleLike = async (postId: string) => {
    try {
      await apiService.toggleLike(postId);
      setPosts((prev) =>
        prev.map((post) =>
          post.id === postId
            ? { ...post, likes: post.likes + (post.liked ? -1 : 1), liked: !post.liked }
            : post
        )
      );
    } catch (error) {
      toast.error('Failed to like post');
    }
  };

  const handleCommentAdded = (postId: string, comment: Comment) => {
    setPosts((prev) =>
      prev.map((post) =>
        post.id === postId
          ? { ...post, comments: post.comments + 1 }
          : post
      )
    );
    setComments((prev) => ({
      ...prev,
      [postId]: [comment, ...(prev[postId] || [])],
    }));
  };

  if (loading || authLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gradient-to-br from-purple-50 via-white to-blue-50">
        <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 py-8 px-4">
       <div className="max-w-2xl mx-auto px-4 space-y-6">
        {/* Posts */}
        {posts.map((post) => (
          <article
            key={post.id}
            className="bg-white/80 backdrop-blur-xl rounded-3xl p-6 shadow-xl border border-white/20 flex flex-col"
          >
            <div className="mb-4 flex items-center space-x-3">
              <img
                src={post.author.profilePhoto}
                alt={post.author.name}
                className="h-12 w-12 rounded-full object-cover ring-2 ring-purple-200"
              />
              <div>
                <h3 className="font-semibold text-gray-900">{post.author.name}</h3>
                <p className="text-sm text-gray-600">
                  {post.tribe.name} • {post.location}
                </p>
              </div>
            </div>
            <p className="mb-4 text-gray-700">{post.description}</p>
            {post.base64Image && (
              <img
                src={post.base64Image}
                alt="Post"
                className="mb-4 w-full rounded-2xl object-contain shadow-lg"
              />
            )}
            <div className="flex items-center space-x-6">
              <button
                onClick={() => handleLike(post.id)}
                className="flex items-center space-x-2 text-gray-600 hover:text-purple-600 transition-colors"
              >
                <Heart
                  className={`h-6 w-6 ${
                    post.liked ? 'fill-purple-500 text-purple-500' : ''
                  }`}
                />
                <span>{post.likes}</span>
              </button>
              <button
                onClick={() => setExpandedPost(expandedPost === post.id ? null : post.id)}
                className="flex items-center space-x-2 text-gray-600 hover:text-purple-600 transition-colors"
              >
                <MessageCircle className="h-6 w-6" />
                <span>{post.comments}</span>
              </button>
            </div>
            {expandedPost === post.id && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                {loadingComments[post.id] ? (
                  <div className="flex justify-center py-4">
                    <Loader2 className="h-6 w-6 animate-spin text-purple-500" />
                  </div>
                ) : (
                  <CommentSection
                    postId={post.id}
                    comments={comments[post.id] || []}
                    onCommentAdded={(comment) => handleCommentAdded(post.id, comment)}
                  />
                )}
              </div>
            )}
          </article>
        ))}
      </div>
    </div>
  );
} 