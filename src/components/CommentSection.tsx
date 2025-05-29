import { useState } from 'react';
import { apiService, type Comment } from '../lib/api';
import { toast } from 'sonner';
import { Send } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { UserIcon } from 'lucide-react';

interface CommentSectionProps {
  postId: string;
  comments: Comment[];
  onCommentAdded: (comment: Comment) => void;
}

export function CommentSection({ postId, comments, onCommentAdded }: CommentSectionProps) {
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setIsSubmitting(true);
    try {
      const comment = await apiService.addCommentToPost(postId, newComment);
      // Ensure the comment has the correct structure before passing it up
      console.log(comment)
      onCommentAdded(comment);
      setNewComment('');
    } catch (error) {
      toast.error('Failed to add comment');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mt-4 space-y-4">
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Add a comment..."
          className="flex-1 rounded-lg border bg-card px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        />
        <button
          type="submit"
          disabled={isSubmitting || !newComment.trim()}
          className="rounded-lg bg-primary px-3 py-2 text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          <Send className="h-4 w-4" />
        </button>
      </form>

      <div className="space-y-3">
        {comments.map((comment, index) => (
          console.log(comment),
          <div key={comment._id ?? index} className="flex items-start space-x-3 bg-muted/50 rounded-xl p-3">
            <Avatar className="h-8 w-8">
              <AvatarImage
                src={comment.userId?.profilePhoto || undefined}
                alt={comment.userId?.username || 'User'}
              />
              <AvatarFallback>
                <UserIcon className="h-4 w-4" />
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <p className="text-sm font-medium">{comment.userId?.username || 'User'}</p>
              <p className="text-sm text-muted-foreground">{comment.text}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}