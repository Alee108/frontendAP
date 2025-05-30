import { useState, useEffect } from 'react';
import { Post } from '../types/post';
import { formatDistanceToNow } from 'date-fns';
import { Heart, MessageCircle, User, UserPlus, Trash2 } from 'lucide-react';
import { apiService, Comment as ApiCommentType } from '../lib/api';
import { toast } from 'sonner';
import { useAuth } from '../lib/auth-context';
import { useNavigate } from 'react-router-dom';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from './ui/alert-dialog';
import { Button } from './ui/button';
import { CommentSection } from './CommentSection';

interface PostCardProps {
  post: Post;
  onPostUpdate: () => void;
}

export function PostCard({ post, onPostUpdate }: PostCardProps) {
  const { user, updateUserFollowing } = useAuth();
  const navigate = useNavigate();
  
  const isAlreadyFollowing = user?.following?.some(
    (followingId: string) => followingId === post.userId._id
  ) || false;
  
  const [isLiked, setIsLiked] = useState(post.likes?.includes(user?._id || '') || false);
  const [isFollowing, setIsFollowing] = useState(isAlreadyFollowing);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // State per gestire la visibilità dei commenti
  const [showComments, setShowComments] = useState(false);
  const [hasNewComment, setHasNewComment] = useState(false);

  useEffect(() => {
    const following = user?.following?.some(
      (followingId: string) => followingId === post.userId._id
    ) || false;
    setIsFollowing(following);
  }, [user?.following, post.userId._id]);

  // Initialize comments state by mapping the incoming post.comments array.
  // We explicitly map fields from the actual data structure to the ApiCommentType structure.
  const [comments, setComments] = useState<ApiCommentType[]>(
    post.comments.map(comment => {
      // Cast the comment object to `any` to safely access properties as they come from the backend.
      // We know from observation/errors that the incoming comment object has 'content' and a userId structure.
      const incomingComment = comment as any;
      
      // Construct an object that strictly adheres to the ApiCommentType structure
      const mappedComment: ApiCommentType = {
        _id: incomingComment._id,
        text: incomingComment.text, // Map the incoming 'content' field to 'text' for ApiCommentType
        userId: { // Map and ensure userId matches the structure expected by ApiCommentType
          _id: incomingComment.userId?._id || '', // Use _id from incoming userId, default to empty string if undefined
          username: incomingComment.userId?.username || '', // Use username, default to empty string
          profilePhoto: incomingComment.userId?.profilePhoto || null, // Use profilePhoto, default to null
          name: incomingComment.userId?.name || '', // Include name if available, default to empty string
          surname: incomingComment.userId?.surname || '', // Include surname if available, default to empty string
        },
        postId: incomingComment.postId || post._id, // Use postId from comment if available, otherwise from post
        createdAt: incomingComment.createdAt || new Date().toISOString(), // Use existing createdAt if available
        updatedAt: incomingComment.updatedAt || new Date().toISOString(), // Use existing updatedAt if available
        __v: incomingComment.__v || 0 // Include __v if it exists
      };
      return mappedComment;
    })
  );

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

  const handleFollow = async () => {
    try {
      if (isFollowing) {
        await apiService.unfollowUser(post.userId._id);
        const newFollowing = (user?.following || []).filter(id => id !== post.userId._id);
        updateUserFollowing(newFollowing);
        setIsFollowing(false);
        toast.success('Unfollowed successfully');
      } else {
        await apiService.followUser(post.userId._id);
        const newFollowing = [...(user?.following || []), post.userId._id];
        updateUserFollowing(newFollowing);
        setIsFollowing(true);
        toast.success('Followed successfully');
      }
    } catch (error) {
      console.error('Error following/unfollowing:', error);
      toast.error('Failed to follow user');
      setIsFollowing(!isFollowing);
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
    } else {
      console.warn('Tribe information is missing for this post.');
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

  const handleCommentAdded = (comment: ApiCommentType) => {
    // Aggiorna lo stato dei commenti aggiungendo il nuovo commento in cima
    // Assuming the received 'comment' already matches the frontend Comment type (ApiCommentType)
    setComments(prev => [comment, ...prev]);
    
    // Mostra automaticamente i commenti quando ne viene aggiunto uno nuovo
    setShowComments(true);
    setHasNewComment(true);
    
    // Aggiorna il post per aggiornare il contatore (richiedendo i post aggiornati dall'API)
    onPostUpdate();
  };

  // Funzione per gestire il click sull'icona dei commenti
  const handleCommentsToggle = () => {
    setShowComments(prev => !prev);
    if (hasNewComment) {
      setHasNewComment(false);
    }
  };

  if (!post.userId) {
    console.error('Post is missing userId data:', post);
    return null;
  }

  const isPostOwner = user?._id === post.userId._id;

  return (
    <div className="bg-white rounded-lg shadow-md p-4 mb-4">
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center">
          {/* User Profile Picture and Name */}
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

        {/* Tribe Info and Post Actions */}
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

          {user?._id !== post.userId._id && (
            <button
              onClick={handleFollow}
              className={`flex items-center gap-1 px-3 py-1 rounded-lg transition-colors ${
                isFollowing
                  ? 'bg-gray-500 hover:bg-gray-600 text-white'
                  : 'bg-blue-500 hover:bg-blue-600 text-white'
              }`}
            >
              {isFollowing ? (
                <>
                  <User className="w-4 h-4" />
                  <span>Unfollow</span>
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4" />
                  <span>Follow</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Post Content */}
      <p className="mb-4">{post.description}</p>
      {post.base64Image && (
        <img
          src={post.base64Image}
          alt="Post content"
          className="w-full rounded-lg mb-4 object-contain"
        />
      )}

      {/* Like and Comment Counts */}
      <div className="flex items-center gap-4 mb-4">
        <button
          onClick={handleLike}
          className={`flex items-center gap-1 ${isLiked ? 'text-red-500' : 'text-gray-500'} hover:text-red-500 transition-colors`}
        >
          <Heart className={isLiked ? 'fill-current' : ''} />
          <span>{post.likes.length}</span>
        </button>
        
        <button
          onClick={handleCommentsToggle}
          className={`flex items-center gap-1 transition-colors relative ${
            showComments ? 'text-blue-500' : 'text-gray-500 hover:text-blue-500'
          }`}
        >
          <MessageCircle className={showComments ? 'fill-current' : ''} />
          <span>{comments.length}</span>
          {/* Indicatore per nuovo commento */}
          {hasNewComment && !showComments && (
            <div className="absolute -top-1 -right-1 w-2 h-2 bg-blue-500 rounded-full"></div>
          )}
        </button>
        
        <span className="text-sm text-gray-500">
          {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
        </span>
      </div>

      {/* Comment Section - Solo se showComments è true */}
      {showComments && (
        <CommentSection
          postId={post._id}
          comments={comments} // Pass the mapped comments state
          onCommentAdded={handleCommentAdded}
        />
      )}
    </div>
  );
}