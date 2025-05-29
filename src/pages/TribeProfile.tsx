import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiService, type Tribe, type User, type Comment, Membership } from '../lib/api';
import { type Post } from '../types/post';
import { toast } from 'sonner';
import { Loader2, Heart, MessageCircle, Users, Lock, Globe, User as UserIcon, UserPlus, Edit2, Save, X } from 'lucide-react';
import { CommentSection } from '../components/CommentSection';
import { Button } from '@/components/ui/button';
import { useAuth } from '../lib/auth-context';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { PendingRequestsModal } from '../components/PendingRequestsModal';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { t } from 'node_modules/framer-motion/dist/types.d-CtuPurYT';

// Placeholder images
const TRIBE_PLACEHOLDER_IMAGE = 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=200&h=200&q=80';
const USER_PLACEHOLDER_IMAGE = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=200&h=200&q=80';

interface PopulatedMembership extends Omit<Membership, 'user'> {
  user: User;
  role: 'founder' | 'moderator' | 'member';
  status: 'ACTIVE' | 'PENDING' ;
}

export default function TribeProfile() {
  const { tribeId } = useParams<{ tribeId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [tribe, setTribe] = useState<Tribe | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedPost, setExpandedPost] = useState<string | null>(null);
  const [comments, setComments] = useState<Record<string, Comment[]>>({});
  const [loadingComments, setLoadingComments] = useState<Record<string, boolean>>({});
  const [joining, setJoining] = useState(false);
  const [showMembersList, setShowMembersList] = useState(false);
  const [showExitDialog, setShowExitDialog] = useState(false);
  const [exiting, setExiting] = useState(false);
  const [showPendingRequests, setShowPendingRequests] = useState(false);
  const [pendingRequestsCount, setPendingRequestsCount] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const [editedTribe, setEditedTribe] = useState<Partial<Tribe>>({});
  const [uploadingImage, setUploadingImage] = useState(false);
  const [kickingMember, setKickingMember] = useState<string | null>(null);
  const [tribeMembers, setTribeMembers] = useState<PopulatedMembership[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [promotingMemberId, setPromotingMemberId] = useState<string | null>(null);
  const [demotingMemberId, setDemotingMemberId] = useState<string | null>(null);

  // Calculate total active members including founder, moderators, and members
  const totalActiveMembers = tribeMembers.filter(m => m.status === 'ACTIVE').length;

  // Get all active memberships with populated user data
  const activeMemberships = tribeMembers.filter(m => m.status === 'ACTIVE') || [];

  // Define state-dependent variables here, after tribe state is potentially set
  const isMember = tribe?.memberships?.some(m => m.status === 'ACTIVE') || false;
  const hasPendingRequest = tribe?.memberships?.some(m => m.status === 'PENDING') || false;
  const isPrivate = tribe?.visibility === 'PRIVATE';
  const isClosed = tribe?.visibility === 'CLOSED';
  //console.log('tribe',tribe, 'user', user);
  const isFounderOfTribe = tribe && tribe.founder && tribe.founder._id && user && tribe.founder._id === user._id;
  console.log('Tribe founder check:', {
    tribeFounderId: tribe?.founder?._id,
    userId: user?._id,
    isFounderOfTribe
  });
  const isModerator = tribe?.memberships?.some(m => {
    const populatedMembership = m as unknown as PopulatedMembership;
    return populatedMembership.user?._id === user?._id && 
           populatedMembership.role === 'moderator' && 
           populatedMembership.status === 'ACTIVE';
  }) || false;
  const isAlreadyInTribe = isFounderOfTribe || isMember;

  const canManageRequests = isFounderOfTribe || isModerator;
  
    const loadTribeMembers = async () => {
      if (!tribeId) return;
      setLoadingMembers(true);
      try {
        const members = await apiService.getTribeMembers(tribeId);
        console.log(members)
        setTribeMembers(members);
      } catch (error) {
        toast.error('Failed to load tribe members');
      } finally {
        setLoadingMembers(false);
      }
    };


  // Load members when the modal is opened
  useEffect(() => {
    if (showMembersList) {
      loadTribeMembers();
    }
  }, [showMembersList, tribeId]);

  // Load tribe members on mount or when tribeId changes
  useEffect(() => {
    if (tribeId) {
      loadTribeMembers();
    }
  }, [tribeId]);

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

        // Se la tribe è chiusa e l'utente non è il founder, reindirizza al discover
        /*if (tribeData.visibility === 'CLOSED' && tribeData.founder._id !== user?._id) {
          toast.info('This tribe is closed.');
          navigate('/discover');
        }*/

        console.log('Tribe data loaded:', { tribeId, isFounderOfTribe: tribeData.founder._id === user?._id, isClosed: tribeData.visibility === 'CLOSED', tribeVisibility: tribeData.visibility });
      } catch (error) {
        toast.error('Failed to load tribe data');
        navigate('/discover');
      } finally {
        setLoading(false);
      }
    };

    fetchTribeData();
  }, [tribeId, navigate, user]);

  useEffect(() => {
    if (expandedPost && !comments[expandedPost]) {
      loadComments(expandedPost);
    }
  }, [expandedPost, comments]); // Added comments to dependency array

  useEffect(() => {
    if (tribe && canManageRequests) {
      const pendingCount = tribe.memberships.filter(m => m.status === 'PENDING').length;
      setPendingRequestsCount(pendingCount);
    }
  }, [tribe, canManageRequests, tribe?.memberships]); // Added tribe.memberships to dependency array

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

  const handleCommentAdded = (postId: string, comment: Comment) => {
    // The comment object received here should match the updated Comment interface
    const backendComment = comment; // Alias for clarity

    // Create comment object for the 'posts' state (matches Post interface comments array structure)
    const commentToPostState = {
      _id: backendComment._id,
      content: backendComment.text, // Map text to content for Post interface
      userId: { // Structure matching Post.comments array
        _id: backendComment.userId._id,
        username: backendComment.userId.username,
        profilePhoto: backendComment.userId.profilePhoto || null // Ensure profilePhoto is nullable
      },
    };

    // Create comment object for the 'comments' state (matches updated Comment interface structure)
    // This object can largely use the fields directly from backendComment as the interface now matches
    const commentToCommentsState: Comment = backendComment;

    // Update the post's comment count and comments array
    setPosts((prevPosts) => 
      prevPosts.map((post) => {
        if (post._id === postId) {
          const currentCommentCount = typeof post.commentCount === 'number' ? post.commentCount : 0;
          return {
            ...post,
            commentCount: currentCommentCount + 1,
            comments: [
              commentToPostState,
              ...(post.comments || [])
            ]
          };
        }
        return post;
      })
    );

    // Update the comments state (used by CommentSection directly)
    setComments((prevComments) => ({
      ...prevComments,
      [postId]: [commentToCommentsState, ...(prevComments[postId] || [])]
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
    if (!tribeId || isClosed) return;
    
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

  const handleExitTribe = async () => {
    if (!user || !tribeId || !tribe) return; // Add tribe check

    setExiting(true);
    try {
      if (isFounderOfTribe) {
        // Se è il founder, chiudiamo l'operazione di chiusura tribe
        await apiService.closeTribe(tribeId);
        toast.success('Tribe has been closed. Members can still view posts but no new join requests will be accepted.');
        // Aggiornare lo stato locale per mostrare la vista chiusa immediatamente
        setTribe(prevTribe => prevTribe ? { ...prevTribe, status: 'CLOSED' } : null);
        // NON reindirizzare immediatamente per i founder, così vedono la pagina aggiornata
      } else {
        // Se è un membro normale, usciamo dalla tribe
        if (!user?._id) {
          toast.error('User ID is missing.');
          setExiting(false);
          setShowExitDialog(false);
          return;
        }
        await apiService.exitTribe(user._id, tribeId);
        toast.success('Successfully left the tribe');
        // Azzerare lo stato della tribe e dei post per riflettere l'uscita
        setTribe(null);
        setPosts([]);
        // Reindirizza alla pagina Discover solo DOPO il successo dell'operazione e l'aggiornamento dello stato locale per i membri
      }
      navigate('/discover');
    } catch (error) {
      toast.error('Failed to exit tribe');
    } finally {
      setExiting(false);
      setShowExitDialog(false);
    }
  };

  const handleEditClick = () => {
    setEditedTribe({
      description: tribe?.description || '',
      visibility: tribe?.visibility || 'PUBLIC',
      profilePhoto: tribe?.profilePhoto || ''
    });
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditedTribe({});
  };

  const handleSaveEdit = async () => {
    if (!tribeId) return;

    try {
      const updatedTribe = await apiService.updateTribeProfile(tribeId, editedTribe);
      if (updatedTribe) {
        setTribe(updatedTribe);
        setIsEditing(false);
        toast.success('Tribe profile updated successfully');
      } else {
        throw new Error('Failed to update tribe profile');
      }
    } catch (error) {
      toast.error('Failed to update tribe profile');
      // Reload the tribe data to ensure we're in sync
      if (tribeId) {
        loadTribeProfile(tribeId);
      }
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append('image', file);
      const uploadedImage = await apiService.uploadTribeImage(tribeId!, formData);
      setEditedTribe(prev => ({ ...prev, profilePhoto: uploadedImage.url }));
      toast.success('Image uploaded successfully');
    } catch (error) {
      toast.error('Failed to upload image');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleKickMember = async (userId: string) => {
    if (!tribeId) return;
    
    setKickingMember(userId);
    try {
      await apiService.kickMember(tribeId, userId);
      toast.success('Member kicked successfully');
      // Refresh tribe data
      loadTribeMembers(); // Refresh members list
    } catch (error) {
      toast.error('Failed to kick member');
    } finally {
      setKickingMember(null);
    }
  };

  const handlePromoteMember = async (userId: string) => {
    if (!tribeId) return;

    setPromotingMemberId(userId);
    try {
      await apiService.promoteMember(tribeId, userId);
      toast.success('Member promoted successfully');
      loadTribeMembers(); // Refresh members list
    } catch (error) {
      toast.error('Failed to promote member');
    } finally {
      setPromotingMemberId(null);
    }
  };

  const handleDemoteMember = async (userId: string) => {
    if (!tribeId) return;

    setDemotingMemberId(userId);
    try {
      await apiService.demoteMember(tribeId, userId);
      toast.success('Moderator demoted successfully');
      loadTribeMembers(); // Refresh members list
    } catch (error) {
      toast.error('Failed to demote moderator');
    } finally {
      setDemotingMemberId(null);
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

  // Se la tribe è chiusa, mostriamo una vista speciale
  if (isClosed) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-8 shadow-xl border border-white/20">
            <div className="flex flex-col md:flex-row items-center gap-8">
              <div className="relative">
                <img
                  src={tribe.profilePhoto || TRIBE_PLACEHOLDER_IMAGE}
                  alt={tribe.name}
                  className="w-32 h-32 rounded-full object-cover ring-4 ring-gray-200"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = TRIBE_PLACEHOLDER_IMAGE;
                  }}
                />
              </div>
              
              <div className="flex-grow text-center md:text-left">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">{tribe.name}</h1>
                <p className="text-gray-500 mb-4">This tribe is closed. You can view posts but cannot join.</p>
                
                <div className="flex items-center gap-4 mb-4">
                  <div className="flex items-center gap-2 text-gray-700">
                    <Lock className="h-5 w-5 text-gray-500" />
                    <span>Closed Tribe</span>
                  </div>
                </div>

                {/* Mostra i post se la tribe è pubblica o se l'utente è un membro */}
                {(isMember || !isPrivate) && (
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
                                <span>{post.comments.length}</span>
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
              {isEditing ? (
                <div className="relative group">
                  <img
                    src={editedTribe.profilePhoto || tribe?.profilePhoto || TRIBE_PLACEHOLDER_IMAGE}
                    alt={tribe?.name}
                    className="w-32 h-32 rounded-full object-cover ring-4 ring-purple-200"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = TRIBE_PLACEHOLDER_IMAGE;
                    }}
                  />
                  <label className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity">
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleImageUpload}
                      disabled={uploadingImage}
                    />
                    {uploadingImage ? (
                      <Loader2 className="w-8 h-8 text-white animate-spin" />
                    ) : (
                      <Edit2 className="w-8 h-8 text-white" />
                    )}
                  </label>
                </div>
              ) : (
                <img
                  src={tribe?.profilePhoto || TRIBE_PLACEHOLDER_IMAGE}
                  alt={tribe?.name}
                  className="w-32 h-32 rounded-full object-cover ring-4 ring-purple-200"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = TRIBE_PLACEHOLDER_IMAGE;
                  }}
                />
              )}
            </div>
            
            <div className="flex-grow text-center md:text-left">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{tribe?.name}</h1>
              
              {isEditing ? (
                <div className="space-y-4">
                  <Textarea
                    value={editedTribe.description}
                    onChange={(e) => setEditedTribe(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Tribe description"
                    className="w-full"
                  />
                  <Select
                    value={editedTribe.visibility}
                    onValueChange={(value: 'PUBLIC' | 'PRIVATE') => setEditedTribe(prev => ({ ...prev, visibility: value }))}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select visibility" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PUBLIC">Public</SelectItem>
                      <SelectItem value="PRIVATE">Private</SelectItem>
                    </SelectContent>
                  </Select>
                  <div className="flex gap-2">
                    <Button onClick={handleSaveEdit} className="bg-purple-600 hover:bg-purple-700">
                      <Save className="w-4 h-4 mr-2" />
                      Save Changes
                    </Button>
                    <Button onClick={handleCancelEdit} variant="outline">
                      <X className="w-4 h-4 mr-2" />
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <p className="text-gray-700 mb-4">{tribe?.description}</p>
                  
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

                    {canManageRequests && pendingRequestsCount > 0 && (
                      <button
                        onClick={() => setShowPendingRequests(true)}
                        className="flex items-center gap-2 text-purple-600 hover:text-purple-700 transition-colors"
                      >
                        <UserPlus className="h-5 w-5" />
                        <span>{pendingRequestsCount} pending request{pendingRequestsCount !== 1 ? 's' : ''}</span>
                      </button>
                    )}
                  </div>

                  {/* Edit button for founder/moderator */}
                  {(isFounderOfTribe || isModerator) && (
                    <Button
                      onClick={handleEditClick}
                      variant="outline"
                      className="mt-2"
                    >
                      <Edit2 className="w-4 h-4 mr-2" />
                      Edit Profile
                    </Button>
                  )}
                </>
              )}
            </div>

            {/* Exit/Close Tribe Button (Founder: Close, Member/Moderator: Leave) */}
            {(isAlreadyInTribe && !isClosed) && (
              <div className="flex justify-center mt-6">
                <Button
                  onClick={() => setShowExitDialog(true)}
                  variant={isFounderOfTribe ? "destructive" : "outline"}
                  className={`rounded-lg border ${isFounderOfTribe ? 'border-red-300 bg-red-50/80 hover:bg-red-100/80 text-red-600 hover:text-red-700' : 'border-gray-300 bg-white hover:bg-gray-50 text-gray-700 hover:text-red-600'} text-sm px-3 py-1.5 h-8 transition-colors duration-200 w-full md:w-auto`}
                  disabled={exiting || isClosed}
                >
                  {exiting ? (
                    <>
                      <Loader2 className="w-3 h-3 mr-1.5 animate-spin" />
                      {isFounderOfTribe ? 'Closing...' : 'Leaving...'}
                    </>
                  ) : (
                    isFounderOfTribe ? 'Close Tribe' : 'Leave Tribe'
                  )}
                </Button>
              </div>
            )}

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
                                        <span>{post.comments.length}</span>
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
              <DialogTitle>Tribe Members ({totalActiveMembers})</DialogTitle>
            </DialogHeader>
            <div className="max-h-96 overflow-y-auto">
              {loadingMembers ? (
                <div className="flex justify-center items-center p-4">
                  <Loader2 className="w-6 h-6 animate-spin text-purple-500" />
                </div>
              ) : (
                <>
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
                  {tribeMembers
                    .filter(membership => membership.role === 'moderator' && membership.status === 'ACTIVE')
                    .map(membership => (
                      <div key={membership._id} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg mb-2">
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
                        {(isFounderOfTribe || isModerator) && (
                          <div className="flex gap-2">
                           
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => handleDemoteMember(membership.user._id)}
                              disabled={demotingMemberId === membership.user._id}
                              className="h-8 px-3"
                            >
                              {demotingMemberId === membership.user._id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                'Demote'
                              )}
                            </Button>
                          </div>
                        )}
                      </div>
                    ))}

                  {/* Regular Members */}
                  {tribeMembers
                    .filter(membership => membership.role === 'member' && membership.status === 'ACTIVE')
                    .map(membership => (
                      <div key={membership._id} className="flex items-center justify-between p-3 bg-white rounded-lg mb-2 border border-gray-100">
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
                            <p className="text-sm text-gray-500">Member</p>
                          </div>
                        </div>
                        {(isFounderOfTribe || isModerator) && (
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handlePromoteMember(membership.user._id)}
                              disabled={promotingMemberId === membership.user._id}
                              className="h-8 px-3"
                            >
                              {promotingMemberId === membership.user._id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                'Promote'
                              )}
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleKickMember(membership.user._id)}
                              disabled={kickingMember === membership.user._id}
                              className="h-8 px-3"
                            >
                              {kickingMember === membership.user._id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                'Kick'
                              )}
                            </Button>
                            
                          </div>
                        )}
                      </div>
                    ))}
                </>
              )}
            </div>
          </DialogContent>
        </Dialog>

        {/* Dialog di conferma per l'uscita */}
        <Dialog open={showExitDialog} onOpenChange={setShowExitDialog}>
          <DialogContent className="sm:max-w-[425px] bg-white/95 backdrop-blur-xl border border-white/20">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-gray-900">
                {isFounderOfTribe ? 'Close Tribe' : 'Leave Tribe'}
              </DialogTitle>
              <DialogDescription className="text-gray-600 mt-2">
                {isFounderOfTribe 
                  ? 'Are you sure you want to close this tribe? Members will still be able to view posts, but no new join requests will be accepted.'
                  : 'Are you sure you want to leave this tribe? You will no longer have access to tribe posts and discussions.'}
              </DialogDescription>
            </DialogHeader>
            <div className="flex justify-end gap-3 mt-6">
              <Button
                variant="outline"
                onClick={() => setShowExitDialog(false)}
                disabled={exiting}
                className="rounded-lg border border-gray-200 hover:border-gray-300 bg-white hover:bg-gray-50 text-sm px-3 py-1.5 h-8"
              >
                Cancel
              </Button>
              <Button
                onClick={handleExitTribe}
                disabled={exiting}
                className={`rounded-lg border border-red-300 bg-red-50/80 hover:bg-red-100/80 text-red-600 hover:text-red-700 text-sm px-3 py-1.5 h-8 transition-colors duration-200 
                `}
              >
                {exiting ? (
                  <>
                    <Loader2 className="w-3 h-3 mr-1.5 animate-spin" />
                    {isFounderOfTribe ? 'Closing...' : 'Leaving...'}
                  </>
                ) : (
                  console.log('isFounderOfTribe', isFounderOfTribe,user?._id, tribe?.founder._id),
                  isFounderOfTribe ? 'Close Tribe' : 'Leave Tribe'
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Pending Requests Modal */}
        {canManageRequests && (
          <PendingRequestsModal
            isOpen={showPendingRequests}
            onClose={() => setShowPendingRequests(false)}
            tribeId={tribeId || ''}
            onRequestHandled={() => {
              loadTribeProfile(tribeId || '');
              // Do not close the modal automatically, let the user close it manually after seeing the updated list
            }}
          />
        )}
      </div>
    </div>
  );
}