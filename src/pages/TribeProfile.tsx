import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiService, type Tribe, type User, type Comment as ApiComment } from '../lib/api';
import { type Post } from '../types/post';
import { toast } from 'sonner';
import { Loader2, Heart, MessageCircle, Users, Lock, Globe, User as UserIcon } from 'lucide-react';
import { CommentSection } from '../components/CommentSection';
import { Button } from '@/components/ui/button';
import { useAuth } from '../lib/auth-context';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

// Placeholder images
const TRIBE_PLACEHOLDER_IMAGE = 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=200&h=200&q=80';
const USER_PLACEHOLDER_IMAGE = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=200&h=200&q=80';

export default function TribeProfile() {
  const { tribeId } = useParams<{ tribeId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [tribe, setTribe] = useState<Tribe | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedPost, setExpandedPost] = useState<string | null>(null);
  const [comments, setComments] = useState<Record<string, ApiComment[]>>({});
  const [loadingComments, setLoadingComments] = useState<Record<string, boolean>>({});
  const [joining, setJoining] = useState(false);
  const [showMembersList, setShowMembersList] = useState(false);

  useEffect(() => {
    const fetchTribeData = async () => {
      if (!tribeId) return;
      
      try {
        const [tribeData, postsData] = await Promise.all([
          apiService.getTribeProfile(tribeId),
          apiService.getTribePosts(tribeId)
        ]);
        setTribe(tribeData);
        // Assuming postsData from backend includes commentCount and liked status per post
        // Add liked status based on whether current user's id is in likes array
        const postsWithLikedStatus = postsData.map(post => ({
            ...post,
            liked: post.likes.includes(user?._id || '')
        }));
        setPosts(postsWithLikedStatus);
      } catch (error) {
        toast.error('Failed to load tribe data');
        navigate('/discover');
      } finally {
        setLoading(false);
      }
    };

    fetchTribeData();
  }, [tribeId, navigate, user]); // Added user to dependency array

  useEffect(() => {
    if (expandedPost && !comments[expandedPost]) {
      loadComments(expandedPost);
    }
  }, [expandedPost, comments]); // Added comments to dependency array

  const loadTribeProfile = async (id: string) => {
    try {
      const data = await apiService.getTribeProfile(id);
      setTribe(data);
    } catch (error) {
      toast.error('Failed to load tribe profile');
    }
  };

  const loadTribePosts = async (id: string) => {
    try {
      const data = await apiService.getTribePosts(id);
      setPosts(data);
    } catch (error) {
      toast.error('Failed to load tribe posts');
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

  const handleCommentAdded = (postId: string, comment: ApiComment) => {
    setPosts((prev) =>
      prev.map((post) =>
        post._id === postId
          ? { ...post, commentCount: post.commentCount + 1 }
          : post
      )
    );
    setComments((prev) => ({
      ...prev,
      [postId]: [comment, ...(prev[postId] || [])],
    }));
  };

  const handleLike = async (postId: string) => {
    try {
      await apiService.toggleLike(postId);
      setPosts((prev) =>
        prev.map((post) =>
          post._id === postId
            ? { 
                ...post, 
                likes: post.liked 
                       ? post.likes.filter(id => id !== user?._id) // Remove user id if already liked
                       : [...post.likes, user?._id || ''], // Add user id if not liked
                liked: !post.liked // Toggle liked status
              }
            : post
        )
      );
    } catch (error) {
      toast.error('Failed to like post');
    }
  };

  const handleJoinTribe = async () => {
    if (!tribeId) return;
    
    setJoining(true);
    try {
      if (tribe?.visibility === 'PRIVATE') {
        await apiService.requestMembership(tribeId);
        toast.success('Join request sent successfully');
      } else {
        await apiService.requestMembership(tribeId);
        toast.success('Successfully joined the tribe!');
      }
      // Refresh tribe data to update membership status
      const tribeData = await apiService.getTribeProfile(tribeId);
      setTribe(tribeData);
    } catch (error) {
      toast.error(tribe?.visibility === 'PRIVATE' 
        ? 'Failed to send join request' 
        : 'Failed to join tribe'
      );
    } finally {
      setJoining(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
      </div>
    );
  }

  if (!tribe) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
        <Users className="h-12 w-12 text-red-500 mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Failed to Load Tribe</h2>
        <p className="text-gray-600 mb-4">We couldn't load the tribe data. Please try again.</p>
        <Button onClick={() => navigate('/discover')}>Browse Tribes</Button>
      </div>
    );
  }

  const isMember = tribe.memberships.some(m => m.status === 'ACTIVE');
  const hasPendingRequest = tribe.memberships.some(m => m.status === 'PENDING');
  const isPrivate = tribe.visibility === 'PRIVATE';
  const isFounderOfTribe = tribe.founder._id === user?._id;
  const isAlreadyInTribe = isFounderOfTribe || isMember;

  // Calculate total active members including founder, moderators, and members
  const totalActiveMembers = tribe.memberships.filter(m => m.status === 'ACTIVE').length;

  // If tribe is private and user is not a member, show limited view
  if (isPrivate && !isMember) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-8 shadow-xl border border-white/20">
            <div className="flex flex-col md:flex-row items-center gap-8">
              <div className="relative">
                <img
                  src={tribe.profilePhoto || TRIBE_PLACEHOLDER_IMAGE}
                  alt={tribe.name}
                  className="w-32 h-32 rounded-full object-cover ring-4 ring-purple-200"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = TRIBE_PLACEHOLDER_IMAGE;
                  }}
                />
              </div>
              
              <div className="flex-grow text-center md:text-left">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">{tribe.name}</h1>
                <p className="text-gray-500 mb-4">This is a private tribe. Request to join to see more details.</p>
                
                <div className="flex items-center gap-4 mb-4">
                  <div className="flex items-center gap-2 text-gray-700">
                    <Lock className="h-5 w-5 text-red-500" />
                    <span>Private Tribe</span>
                  </div>
                </div>

                {/* Show join/request buttons if not already a member */}
                {!isAlreadyInTribe && !hasPendingRequest && (
                  <Button
                    onClick={handleJoinTribe}
                    disabled={joining}
                    className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"
                  >
                    {joining ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Requesting...
                      </>
                    ) : (
                      'Request to Join'
                    )}
                  </Button>
                )}
                
                {hasPendingRequest && !isAlreadyInTribe && (
                  <Button disabled className="bg-gray-100 text-gray-500">
                    Request Pending
                  </Button>
                )}

                {/* Show Already a Member if is member but not founder */}
                 {isAlreadyInTribe && !isFounderOfTribe && (
                  <Button disabled className="bg-gray-100 text-gray-500 mt-4">
                    {'Already a Member'}
                  </Button>
                )}

              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 py-8 px-4">
      <div className="max-w-4xl mx-auto relative">
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-8 shadow-xl border border-white/20">
          <div className="flex flex-col md:flex-row items-center gap-8">
            <div className="relative">
              <img
                src={tribe.profilePhoto || TRIBE_PLACEHOLDER_IMAGE}
                alt={tribe.name}
                className="w-32 h-32 rounded-full object-cover ring-4 ring-purple-200"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = TRIBE_PLACEHOLDER_IMAGE;
                }}
              />
            </div>
            
            <div className="flex-grow text-center md:text-left">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{tribe.name}</h1>
              <p className="text-gray-700 mb-4">{tribe.description}</p>
              
              <div className="flex items-center gap-4 mb-4">
                <div className="flex items-center gap-2 text-gray-700">
                  {isPrivate ? (
                    <Lock className="h-5 w-5 text-red-500" />
                  ) : (
                    <Globe className="h-5 w-5 text-green-500" />
                  )}
                  <span>{isPrivate ? 'Private' : 'Public'} Tribe</span>
                </div>
                
                <button 
                  onClick={() => setShowMembersList(true)} 
                  className="flex items-center gap-2 text-gray-700 hover:text-purple-600 transition-colors"
                >
                  <Users className="h-5 w-5" />
                  <span>{totalActiveMembers} members</span>
                </button>
              </div>

              {/* Founder Info in top right */}
              <div className="absolute top-8 right-8 flex items-center gap-2 bg-purple-50 px-4 py-2 rounded-full">
                <div className="flex items-center gap-2">
                  {tribe.founder.profilePhoto ? (
                    <img
                      src={tribe.founder.profilePhoto}
                      alt={tribe.founder.username}
                      className="w-8 h-8 rounded-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = USER_PLACEHOLDER_IMAGE;
                      }}
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
                      <UserIcon className="w-5 h-5 text-purple-500" />
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-medium text-gray-900">{tribe.founder.username}</p>
                    <p className="text-xs text-purple-600">Founder</p>
                  </div>
                </div>
              </div>

            </div>

            {/* Only show the main join/request button if not already a member and no pending request */}
            {!isAlreadyInTribe && !hasPendingRequest && (
              <Button
                onClick={handleJoinTribe}
                disabled={joining}
                className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"
              >
                {joining ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {isPrivate ? 'Requesting...' : 'Joining...'}
                  </>
                ) : (
                  isPrivate ? 'Request to Join' : 'Join Tribe'
                )}
              </Button>
            )}

            {/* Show 'Already a Member' button only if member AND NOT founder, positioned lower */}
            {isAlreadyInTribe && !isFounderOfTribe && (
              <Button disabled className="bg-gray-100 text-gray-500 mt-4">
                {'Already a Member'}
              </Button>
            )}

            {/* Only show the request pending button if there is a pending request and not already a member */}
            {hasPendingRequest && !isAlreadyInTribe && (
              <Button disabled className="bg-gray-100 text-gray-500">
                Request Pending
              </Button>
            )}

          </div>
        </div>

        {/* Only show posts section if user is a member or tribe is public */}
        {(isMember || !isPrivate) && ( // Ensure posts are only shown to members or in public tribes
          <div className="mt-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Posts</h2>
            {posts.length === 0 ? (
              <p className="text-center text-gray-600">No posts yet</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {posts.map(post => (
                  <div key={post._id} className="bg-white/80 backdrop-blur-xl rounded-3xl p-6 shadow-xl border border-white/20">
                    <div className="flex items-center gap-4 mb-4">
                      {post.userId?.profilePhoto ? (
                        <img
                          src={post.userId.profilePhoto}
                          alt={post.userId.username}
                          className="w-10 h-10 rounded-full object-cover"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = USER_PLACEHOLDER_IMAGE;
                          }}
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                          <UserIcon className="w-6 h-6 text-purple-500" />
                        </div>
                      )}
                      <div>
                        <h3 className="font-semibold text-gray-900">{post.userId?.username || 'Unknown User'}</h3>
                        <p className="text-sm text-gray-500">{new Date(post.createdAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                    
                    {post.base64Image && (
                      <img
                        src={post.base64Image}
                        alt={post.description}
                        className="w-full h-48 object-cover rounded-xl mb-4"
                      />
                    )}
                    
                    <p className="text-gray-700 mb-4">{post.description}</p>
                    
                    {post.location && (
                      <p className="text-sm text-gray-500">{post.location}</p>
                    )}

                    {/* Like and Comment Counts */}
                    <div className="flex items-center gap-4 mt-4">
                      <div className="flex items-center gap-1 text-gray-600">
                        <Heart className={`h-5 w-5 cursor-pointer ${post.liked ? 'text-red-500 fill-red-500' : 'text-gray-500'}`} onClick={() => handleLike(post._id)} />
                        <span>{post.likes.length}</span>
                      </div>
                      <div className="flex items-center gap-1 text-gray-600 cursor-pointer" onClick={() => setExpandedPost(expandedPost === post._id ? null : post._id)}>
                        <MessageCircle className="h-5 w-5" />
                        <span>{post.commentCount}</span>
                      </div>
                    </div>

                    {/* Comment Section */}
                    {expandedPost === post._id && (
                      <CommentSection postId={post._id} comments={comments[post._id] || []} onCommentAdded={(comment) => handleCommentAdded(post._id, comment)} />
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Members List Dialog */}
        <Dialog open={showMembersList} onOpenChange={setShowMembersList}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Tribe Members</DialogTitle>
            </DialogHeader>
            <div className="max-h-96 overflow-y-auto">
              {/* Founder */}
              <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg mb-2">
                <div className="flex items-center gap-2">
                  {tribe.founder.profilePhoto ? (
                    <img
                      src={tribe.founder.profilePhoto}
                      alt={tribe.founder.username}
                      className="w-10 h-10 rounded-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = USER_PLACEHOLDER_IMAGE;
                      }}
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                      <UserIcon className="w-6 h-6 text-purple-500" />
                    </div>
                  )}
                  <div>
                    <p className="font-medium text-gray-900">{tribe.founder.username}</p>
                    <p className="text-sm text-purple-600">Founder</p>
                  </div>
                </div>
              </div>

              {/* Moderators */}
              {tribe.memberships
                .filter(m => m.status === 'ACTIVE' && m.role === 'MODERATOR' && m.user._id !== tribe.founder._id)
                .map(membership => (
                  <div key={membership.user._id} className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg mb-2">
                    <div className="flex items-center gap-2">
                      {membership.user.profilePhoto ? (
                        <img
                          src={membership.user.profilePhoto}
                          alt={membership.user.username}
                          className="w-10 h-10 rounded-full object-cover"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = USER_PLACEHOLDER_IMAGE;
                          }}
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                          <UserIcon className="w-6 h-6 text-blue-500" />
                        </div>
                      )}
                      <div>
                        <p className="font-medium text-gray-900">{membership.user.username}</p>
                        <p className="text-sm text-blue-600">Moderator</p>
                      </div>
                    </div>
                  </div>
                ))}

              {/* Regular Members */}
              {tribe.memberships
                .filter(m => m.status === 'ACTIVE' && m.role === 'MEMBER' && m.user._id !== tribe.founder._id)
                .map(membership => (
                  <div key={membership.user._id} className="flex items-center gap-3 p-3 bg-white rounded-lg mb-2 border border-gray-100">
                    <div className="flex items-center gap-2">
                      {membership.user.profilePhoto ? (
                        <img
                          src={membership.user.profilePhoto}
                          alt={membership.user.username}
                          className="w-10 h-10 rounded-full object-cover"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = USER_PLACEHOLDER_IMAGE;
                          }}
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                          <UserIcon className="w-6 h-6 text-gray-500" />
                        </div>
                      )}
                      <div>
                        <p className="font-medium text-gray-900">{membership.user.username}</p>
                        <p className="text-sm text-gray-500">{membership.role}</p>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
} 