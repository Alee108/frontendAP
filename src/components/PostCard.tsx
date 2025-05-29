import { useState } from 'react';
import { Post } from '../types/post';
import { formatDistanceToNow } from 'date-fns';
import { Heart, MessageCircle, Send, User, UserPlus, Trash2 } from 'lucide-react';
import { apiService } from '../lib/api';
import { toast } from 'sonner';
import { useAuth } from '../lib/auth-context';
import { useNavigate } from 'react-router-dom';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from './ui/alert-dialog';
import { Button } from './ui/button';

interface PostCardProps {
  post: Post;
  onPostUpdate: () => void;
}

export function PostCard({ post, onPostUpdate }: PostCardProps) {
  const [comment, setComment] = useState('');
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isLiked, setIsLiked] = useState(post.likes?.includes(user?._id || '') || false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

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
    console.log('Comment value:', comment);
    console.log('IsSubmitting value:', isSubmitting);
    if (!comment.trim() || isSubmitting) {
      console.log('Comment is empty or already submitting. Returning.');
      return;
    }

    setIsSubmitting(true);
    console.log('Setting isSubmitting to true and attempting API call.');
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

  const handleFollow = async () => {
    try {
      await apiService.followUser(post.userId._id);
      setIsFollowing(true);
      toast.success('Successfully followed user');
    } catch (error) {
      toast.error('Failed to follow user');
    }
  };

  const handleUserClick = () => {
    if (post.userId.isPublic || isFollowing) {
      navigate(`/profile/${post.userId._id}`);
    } else {
      toast.error('This profile is private. Follow the user to view their profile.');
    }
  };

  const handleTribeClick = () => {
    if (post.tribe) {
      navigate(`/tribe/${post.tribe._id}`);
    }
  };

  const handleDeletePost = async () => {
    if (!user || user._id !== post.userId._id) return;
    
    setIsDeleting(true);
    try {
      await apiService.deletePost(post._id);
      toast.success('Post deleted successfully');
      onPostUpdate();
    } catch (error) {
      toast.error('Failed to delete post');
    } finally {
      setIsDeleting(false);
    }
  };

  if (!post.userId) {
    return null;
  }

  const isPostOwner = user?._id === post.userId._id;

  return (
    <div className="bg-white rounded-lg shadow-md p-4 mb-4">
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center">
          {post.userId.profilePhoto ? (
            <img
              src={post.userId.profilePhoto}
              alt={post.userId.username || 'User'}
              className="w-10 h-10 rounded-full mr-3 object-cover cursor-pointer"
              onClick={handleUserClick}
            />
          ) : (
            <div 
              className="w-10 h-10 rounded-full mr-3 bg-gray-200 flex items-center justify-center cursor-pointer"
              onClick={handleUserClick}
            >
              <User className="w-6 h-6 text-gray-500" />
            </div>
          )}
          <div>
            <h3 
              className="font-semibold cursor-pointer hover:text-blue-500"
              onClick={handleUserClick}
            >
              {post.userId.name} {post.userId.surname}
            </h3>
            <p className="text-sm text-gray-500">@{post.userId.username}</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {post.tribe && (
            <div 
              className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-2 rounded-lg"
              onClick={handleTribeClick}
            >
              {post.tribe.profilePhoto ? (
                <img
                  src={post.tribe.profilePhoto}
                  alt={post.tribe.name}
                  className="w-8 h-8 rounded-full object-cover"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                  <span className="text-gray-500">
                    {post.tribe.name.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
              <span className="font-medium text-gray-700">{post.tribe.name}</span>
            </div>
          )}

          {isPostOwner && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="icon" className="text-gray-500 hover:text-red-500">
                  <Trash2 className="w-5 h-5" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Post</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete this post? This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDeletePost} disabled={isDeleting}>
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}

          {!isFollowing && user?._id !== post.userId._id && (
            <button
              onClick={handleFollow}
              className="flex items-center gap-1 px-3 py-1 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
            >
              <UserPlus className="w-4 h-4" />
              <span>Follow</span>
            </button>
          )}
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
          className={`flex items-center gap-1 ${isLiked ? 'text-red-500' : 'text-gray-500'} hover:text-red-500 transition-colors`}
        >
          <Heart className={isLiked ? 'fill-current' : ''} />
          <span>{post.likes.length}</span>
        </button>
        <div className="flex items-center gap-1 text-gray-500 hover:text-blue-500 transition-colors">
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
                    alt={comment.userId.username || 'User'}
                    className="w-6 h-6 rounded-full object-cover cursor-pointer"
                    onClick={() => navigate(`/profile/${comment.userId._id}`)}
                  />
                ) : (
                  <div 
                    className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center cursor-pointer"
                    onClick={() => navigate(`/profile/${comment.userId._id}`)}
                  >
                    <User className="w-4 h-4 text-gray-500" />
                  </div>
                )}
                <span 
                  className="font-medium cursor-pointer hover:text-blue-500"
                  onClick={() => navigate(`/profile/${comment.userId._id}`)}
                >
                  {comment.userId?.username || 'user'}
                </span>
              </div>
              <p className="text-sm">{comment.content}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 