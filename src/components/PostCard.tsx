import { useState } from 'react';
import { Post } from '../types/post';
import { formatDistanceToNow } from 'date-fns';
import { Heart, MessageCircle, Send, User } from 'lucide-react';
import { apiService } from '../lib/api';
import { toast } from 'sonner';
import { useAuth } from '../lib/auth-context';

interface PostCardProps {
  post: Post;
  onPostUpdate: () => void;
}

export function PostCard({ post, onPostUpdate }: PostCardProps) {
  const [comment, setComment] = useState('');
  const { user } = useAuth();
  const [isLiked, setIsLiked] = useState(post.likes.includes(user?._id || ''));
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLike = async () => {
    try {
      if (isLiked) {
        await apiService.unlikePost(post._id);
      } else {
        await apiService.likePost(post._id);
      }
      setIsLiked(!isLiked);
      onPostUpdate();
    } catch (error) {
      toast.error('Failed to update like status');
    }
  };

  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await apiService.addComment(post._id, comment);
      setComment('');
      onPostUpdate();
      toast.success('Comment added successfully');
    } catch (error) {
      toast.error('Failed to add comment');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!post.userId) {
    return null; // Don't render if there's no user data
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-4 mb-4">
      <div className="flex items-center mb-4">
        {post.userId.profilePhoto ? (
          <img
            src={post.userId.profilePhoto}
            alt={post.userId.username}
            className="w-10 h-10 rounded-full mr-3 object-cover"
          />
        ) : (
          <div className="w-10 h-10 rounded-full mr-3 bg-gray-200 flex items-center justify-center">
            <User className="w-6 h-6 text-gray-500" />
          </div>
        )}
        <div>
          <h3 className="font-semibold">
            {post.userId.name} {post.userId.surname}
          </h3>
          <p className="text-sm text-gray-500">@{post.userId.username}</p>
        </div>
      </div>

      <p className="mb-4">{post.description}</p>
      
      <img
        src={post.base64Image}
        alt="Post content"
        className="w-full rounded-lg mb-4 object-contain"
      />

      <div className="flex items-center gap-4 mb-4">
        <button
          onClick={handleLike}
          className={`flex items-center gap-1 ${isLiked ? 'text-red-500' : 'text-gray-500'}`}
        >
          <Heart className={isLiked ? 'fill-current' : ''} />
          <span>{post.likes.length}</span>
        </button>
        <div className="flex items-center gap-1 text-gray-500">
          <MessageCircle />
          <span>{post.comments.length}</span>
        </div>
        <span className="text-sm text-gray-500">
          {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
        </span>
      </div>

      <form onSubmit={handleComment} className="flex gap-2">
        <input
          type="text"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Add a comment..."
          className="flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
        >
          <Send className="w-5 h-5" />
        </button>
      </form>

      {post.comments.length > 0 && (
        <div className="mt-4 space-y-2">
          {post.comments.map((comment) => (
            <div key={comment._id} className="bg-gray-50 p-3 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                {comment.userId.profilePhoto ? (
                  <img
                    src={comment.userId.profilePhoto}
                    alt={comment.userId.username}
                    className="w-6 h-6 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center">
                    <User className="w-4 h-4 text-gray-500" />
                  </div>
                )}
                <span className="font-medium">{comment.userId.username}</span>
              </div>
              <p className="text-sm">{comment.content}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 