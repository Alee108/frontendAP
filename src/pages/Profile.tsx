import { useState, useEffect, useCallback } from 'react';
import { apiService, type User, type Tribe, type Post } from '../lib/api';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, User as UserIcon, Mail, Calendar, Users, Edit, Save, X, Heart, Image as ImageIcon, MapPin, Check, ArrowLeft } from 'lucide-react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

// Placeholder image for tribes (used in membership requests and memberships)
const TRIBE_PLACEHOLDER_IMAGE = 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=200&h=200&q=80';
// Static icon is used for missing user profile photos

interface UserListDialogProps {
  title: string;
  users: User[];
  isOpen: boolean;
  onClose: () => void;
  onUserClick: (userId: string) => void;
  isCurrentUser?: (userId: string) => boolean;
  onFollowToggle?: (userId: string, isFollowing: boolean) => void;
  currentUserFollowing?: string[];
}

function UserListDialog({ title, users, isOpen, onClose, onUserClick, isCurrentUser, onFollowToggle, currentUserFollowing }: UserListDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="max-h-96 overflow-y-auto">
          {users.length === 0 ? (
            <p className="text-center text-gray-600">No {title.toLowerCase()}.</p>
          ) : (
            users.map(user => (
              <div 
                key={user._id} 
                className="flex items-center justify-between gap-4 p-2 border-b last:border-b-0 hover:bg-gray-100 cursor-pointer"
                onClick={() => {
                  onClose();
                  onUserClick(user._id);
                }}
              >
                <div className="flex items-center gap-4">
                  <Avatar>
                    <AvatarImage src={user.profilePhoto} alt={user.username} />
                    <AvatarFallback><UserIcon className="w-5 h-5 text-gray-500" /></AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold text-gray-900">{user.username}</p>
                    {user.name && <p className="text-sm text-gray-500">{user.name}</p>}
                    {user.surname && <p className="text-sm text-gray-500">{user.surname}</p>}
                  </div>
                </div>
                {onFollowToggle && isCurrentUser && !isCurrentUser(user._id) && currentUserFollowing && (
                  <Button
                    variant={currentUserFollowing.includes(user._id) ? "outline" : "default"}
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      onFollowToggle(user._id, currentUserFollowing.includes(user._id));
                    }}
                  >
                    {currentUserFollowing.includes(user._id) ? "Following" : "Follow"}
                  </Button>
                )}
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

interface TribeListDialogProps {
  title: string;
  tribes: Tribe[];
  isOpen: boolean;
  onClose: () => void;
  onTribeClick: (tribeId: string) => void;
}

function TribeListDialog({ title, tribes, isOpen, onClose, onTribeClick }: TribeListDialogProps) {
  const navigate = useNavigate();
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="max-h-96 overflow-y-auto">
          {tribes.length === 0 ? (
            <p className="text-center text-gray-600">No {title.toLowerCase()}.</p>
          ) : (
            tribes.map(tribe => (
              <div 
                key={tribe._id} 
                className="flex items-center gap-4 p-2 border-b last:border-b-0 hover:bg-gray-100 cursor-pointer"
                onClick={() => {
                  onClose();
                  onTribeClick(tribe._id);
                }}
              >
                <img
                  src={tribe.profilePhoto || TRIBE_PLACEHOLDER_IMAGE}
                  alt={tribe.name}
                  className="w-10 h-10 rounded-full object-cover"
                />
                <div>
                  <p className="font-semibold text-gray-900">{tribe.name}</p>
                  <p className="text-sm text-gray-500">{tribe.description}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function Profile() {
  const { userId } = useParams<{ userId?: string }>();
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [userPosts, setUserPosts] = useState<Post[]>([]);
  const [membershipRequests, setMembershipRequests] = useState<Tribe[]>([]);
  const [userMemberships, setUserMemberships] = useState<Tribe[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<User>>({});
  const [saving, setSaving] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);

  // Followers/Following states and data
  const [followersCount, setFollowersCount] = useState<number>(0);
  const [followingCount, setFollowingCount] = useState<number>(0);
  const [showFollowersList, setShowFollowersList] = useState(false);
  const [showFollowingList, setShowFollowingList] = useState(false);
  const [followers, setFollowers] = useState<User[]>([]);
  const [following, setFollowing] = useState<User[]>([]);
  const [loadingLists, setLoadingLists] = useState({ followers: false, following: false });
  const [showPendingMembershipsList, setShowPendingMembershipsList] = useState(false);

  // Handle user click in dialogs for navigation
  const handleUserClick = useCallback((id: string) => {
    setShowFollowersList(false);
    setShowFollowingList(false);
    if (id) {
      navigate(`/profile/${id}`, { replace: true });
    }
  }, [navigate]);

  const handleTribeClick = useCallback((id: string) => {
    setShowPendingMembershipsList(false);
    navigate(`/tribes/${id}`);
  }, [navigate]);

  useEffect(() => {
    const fetchProfileData = async () => {
      setLoading(true);
      let fetchedUser: User | null = null;
      const currentUser = apiService.getCurrentUser();
      const idToFetch = userId || currentUser?._id; 

      if (!idToFetch) {
         navigate('/login');
         return;
      }

      // 1. Fetch user data
      try {
        fetchedUser = await apiService.getUserById(idToFetch);
        setUser(fetchedUser);

        if (currentUser && fetchedUser) {
             setIsFollowing(fetchedUser.followers?.some(followerId => followerId === currentUser._id) || false);
        }

        if (fetchedUser) {
           setFormData({
             username: fetchedUser.username || '',
             name: fetchedUser.name || '',
             surname: fetchedUser.surname || '',
             bio: fetchedUser.bio || '',
             profilePhoto: fetchedUser.profilePhoto || '',
           });
           setFollowersCount(fetchedUser.followers?.length || 0);
           setFollowingCount(fetchedUser.following?.length || 0);
        }

      } catch (error) {
        toast.error('Failed to load user data.');
        setUser(null); // Critical error, cannot display profile
        
        // Only redirect to login if trying to view own profile while not logged in
        const currentLoggedInUser = apiService.getCurrentUser();
        if (!currentLoggedInUser && !userId) {
          navigate('/login');
        } else {
          navigate('/discover');
        }
        setLoading(false);
        return; // Stop further data fetching on critical error
      }

      // If user data fetched successfully, proceed with other data
      // 2. Fetch user's posts
      try {
        const postsData = await apiService.getUserPosts(idToFetch);
        setUserPosts(postsData);
      } catch (error) {
        toast.error('Failed to load user posts.');
        setUserPosts([]);
      }

      // 3. Fetch memberships and requests only for the current logged-in user's profile
      if (currentUser && fetchedUser?._id === currentUser._id) {
         try {
            const userMembershipRequestsData = await apiService.getUserMembershipRequests(currentUser._id);
            setMembershipRequests(userMembershipRequestsData);
         } catch (error) {
            toast.error('Failed to load pending membership requests.');
            setMembershipRequests([]);
         }

         try {
            const userMembershipsData = await apiService.getUserMemberships(currentUser._id);
            setUserMemberships(userMembershipsData);
         } catch (error) {
            console.error('Failed to load user memberships:', error);
            toast.error('Unable to load your tribes. Please try again later.');
            setUserMemberships([]);
         }
      } else {
         setMembershipRequests([]);
         setUserMemberships([]);
      }

      // 4. Data fetching complete
      setLoading(false);
    };

    fetchProfileData();
  }, [userId, navigate]);

  // Fetch followers list when dialog is opened
  useEffect(() => {
    if (showFollowersList && user && followers.length === 0 && !loadingLists.followers) {
      const fetchFollowers = async () => {
        setLoadingLists(prev => ({ ...prev, followers: true }));
        try {
          const data = await apiService.getUserFollowers(user._id);
          setFollowers(data);
        } catch (error) {
          toast.error('Failed to load followers');
        } finally {
          setLoadingLists(prev => ({ ...prev, followers: false }));
        }
      };
      fetchFollowers();
    }
  }, [showFollowersList, user, followers.length, loadingLists.followers]);

  // Fetch following list when dialog is opened
  useEffect(() => {
    if (showFollowingList && user && following.length === 0 && !loadingLists.following) {
      const fetchFollowing = async () => {
        setLoadingLists(prev => ({ ...prev, following: true }));
        try {
          const data = await apiService.getUserFollowing(user._id);
          setFollowing(data);
        } catch (error) {
          toast.error('Failed to load following');
        } finally {
          setLoadingLists(prev => ({ ...prev, following: false }));
        }
      };
      fetchFollowing();
    }
  }, [showFollowingList, user, following.length, loadingLists.following]);

  // Handle follow/unfollow toggle
  const handleFollowToggle = async (targetUserId: string, isCurrentlyFollowing: boolean) => {
    const currentUser = apiService.getCurrentUser();
    if (!currentUser || !user) return;
    
    try {
      if (isCurrentlyFollowing) {
        await apiService.unfollowUser(targetUserId);
        toast.success('Unfollowed user.');
        // Optimistically update UI
        if (userId === targetUserId) { // If unfollowing the user whose profile is being viewed
            setIsFollowing(false);
            setFollowersCount(prev => Math.max(0, prev - 1));
         }
         // Update lists in dialogs - remove the user who was unfollowed
         setFollowers(prev => prev.filter(f => f._id !== targetUserId));
         setFollowing(prev => prev.filter(f => f._id !== targetUserId));

         // If the unfollowed user is the current user, update current user's following list
         if(currentUser._id === targetUserId){
             const updatedCurrentUser = await apiService.getUserById(currentUser._id);
         } else if (currentUser._id === user._id) { // If current user is viewing their own profile and unfollows someone
              const updatedCurrentUser = await apiService.getUserById(currentUser._id);
         } else if (userId === targetUserId) { // If current user is viewing another user's profile and unfollows them
             // The isFollowing state and followers count for the viewed user are already updated above.
             // Need to update the current user's following list in storage/context if needed elsewhere.
         }


      } else {
        await apiService.followUser(targetUserId);
        toast.success('Followed user.');
         if (userId === targetUserId) {
            setIsFollowing(true);
            setFollowersCount(prev => prev + 1);
         }
          if(showFollowersList) setShowFollowersList(false); // Close and force re-fetch on reopen
          if(showFollowingList) setShowFollowingList(false);

          const updatedCurrentUser = await apiService.getUserById(currentUser._id); // Re-fetch current user
      }
      // After any follow/unfollow, consider re-fetching the viewed user's data to ensure counts are accurate
      // This might cause a slight delay but ensures consistency.
       if (user) {
         const updatedViewedUser = await apiService.getUserById(user._id);
         setUser(updatedViewedUser);
         setFollowersCount(updatedViewedUser.followers?.length || 0);
         setFollowingCount(updatedViewedUser.following?.length || 0);
          if(isEditing) {
             setFormData(prev => ({
                 ...prev,
                 followers: updatedViewedUser.followers,
                 following: updatedViewedUser.following,
             }));
         }
       }

    } catch (error) {
      toast.error('Failed to update follow status');
    }
  };


  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const dataToSave: Partial<User> = {
        username: formData.username,
        name: formData.name,
        surname: formData.surname, // Include surname in data to save
        bio: formData.bio,
        profilePhoto: formData.profilePhoto, // Keep profilePhoto in dataToSave for consistency, although API uses separate endpoint
      };
      const updatedUser = await apiService.updateUser(user._id, dataToSave);
      setUser(updatedUser);
      setIsEditing(false);
      toast.success('Profile updated successfully!');
    } catch (error) {
      toast.error('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600">User not found or not logged in.</p>
        {!apiService.getCurrentUser() && (
          <Link to="/login">
            <Button className="mt-4">Login</Button>
          </Link>
        )}
      </div>
    );
  }

  const isCurrentUser = user._id === apiService.getCurrentUser()?._id;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Back Button - Only show when viewing another user's profile */}
        {userId && (
          <Button
            variant="ghost"
            className="mb-4 flex items-center gap-2 text-gray-600 hover:text-gray-900"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
        )}

        {/* Profile Header */}
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-8 shadow-xl border border-white/20">
          <div className="flex flex-col md:flex-row items-center gap-8">
            <div className="relative">
              {/* Show image if available, otherwise static icon */}
              {user.profilePhoto || (isEditing && formData.profilePhoto) ? (
                <img
                  src={isEditing ? (formData.profilePhoto || '') : (user.profilePhoto || '')}
                  alt={user.username}
                  className="w-32 h-32 rounded-full object-cover ring-4 ring-purple-200"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    const iconContainer = target.nextElementSibling;
                     if (iconContainer instanceof HTMLElement) {
                      iconContainer.style.display = 'flex';
                    }
                  }}
                />
              ) : null}
              {/* Static icon container, shown if no image, image fails to load, or in editing mode without new photo */}
              {(!user.profilePhoto && !(isEditing && formData.profilePhoto)) && (
                 <div className="w-32 h-32 rounded-full bg-purple-100 flex items-center justify-center ring-4 ring-purple-200">
                   <UserIcon className="w-16 h-16 text-purple-500" />
                 </div>
              )}

               {isCurrentUser && isEditing && (
                <div className="absolute bottom-0 right-0 bg-gray-800 rounded-full p-1 text-white cursor-pointer">
                  {/* Future: Add photo upload functionality */}
                   <Edit className="w-4 h-4" />
                </div>
              )}
            </div>
            
            <div className="flex-grow text-center md:text-left">
              {/* Top row: Username/Name/Surname and My Tribes */}
              <div className="flex flex-col md:flex-row justify-between gap-4 mb-4 items-start">
                {/* Username/Name/Surname Block */}
                <div className="flex flex-col">
                   {isEditing ? (
                      <div className="mb-2">
                        <label htmlFor="username" className="block text-sm font-medium text-gray-700">Username</label>
                        <Input
                          id="username"
                          type="text"
                          name="username"
                          value={formData.username || ''}
                          onChange={handleInputChange}
                          placeholder="Username"
                          className="mt-1 text-xl font-bold"
                        />
                      </div>
                   ) : (
                      <h1 className="text-3xl font-bold text-gray-900 mb-2">{user.username}</h1>
                   )}
                  
                   {isEditing ? (
                      <div className="mb-2">
                        <label htmlFor="name" className="block text-sm font-medium text-gray-700">Name</label>
                        <Input
                          id="name"
                          type="text"
                          name="name"
                          value={formData.name || ''}
                          onChange={handleInputChange}
                          placeholder="Your Name"
                          className="mt-1"
                        />
                      </div>
                   ) : (
                      user.name && <p className="text-gray-600 mb-2">{user.name}</p>
                   )}

                   {isEditing ? (
                      <div className="mb-2">
                        <label htmlFor="surname" className="block text-sm font-medium text-gray-700">Surname</label>
                        <Input
                          id="surname"
                          type="text"
                          name="surname"
                          value={formData.surname || ''}
                          onChange={handleInputChange}
                          placeholder="Your Surname"
                          className="mt-1"
                        />
                      </div>
                   ) : (
                      user.surname && <p className="text-gray-600 mb-2">{user.surname}</p>
                   )}

                </div>

                {/* My Tribes Section - Only for current user - Moved and Styled */}
                {isCurrentUser && userMemberships.length > 0 && (
                  <div className="md:ml-auto flex-shrink-0">
                    <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      My Tribes
                    </h3>
                    <div className="flex flex-col gap-2">
                      {userMemberships.map(tribe => {
                        const isFounderOfTribe = tribe.founder._id === user?._id;

                        return (
                          <Link 
                            key={tribe._id}
                            to={`/tribes/${tribe._id}`}
                            className="flex items-center gap-2 bg-purple-50 hover:bg-purple-100 rounded-lg px-3 py-2 transition-colors"
                          >
                            <img
                              src={tribe.profilePhoto || TRIBE_PLACEHOLDER_IMAGE}
                              alt={tribe.name}
                              className="w-8 h-8 rounded-full object-cover"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.src = TRIBE_PLACEHOLDER_IMAGE;
                              }}
                            />
                            <div className="flex flex-col">
                              <span className="text-sm font-medium text-gray-900">{tribe.name}</span>
                              <span className="text-xs text-purple-600">
                                {isFounderOfTribe ? 'Founder' : 'Member'}
                              </span>
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Bio field - editable */}
              {isEditing ? (
                 <div className="mb-4">
                   <label htmlFor="bio" className="block text-sm font-medium text-gray-700">Bio</label>
                   <Textarea
                     id="bio"
                     name="bio"
                     value={formData.bio || ''}
                     onChange={handleInputChange}
                     placeholder="Tell us about yourself..."
                     className="mt-1"
                   />
                 </div>
              ) : (
                user.bio && <p className="text-gray-700 mb-4">{user.bio}</p>
              )}
             
              <div className="flex flex-col gap-2 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  <span>{user.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span>Joined {new Date(user.createdAt).toLocaleDateString()}</span>
                </div>
              </div>

              {/* Followers and Following Counts */}
              <div className="flex items-center gap-4 mt-4 text-gray-700">
                <button onClick={() => setShowFollowersList(true)} className="flex items-center gap-1 hover:text-purple-600">
                  <Users className="h-4 w-4" />
                  <span><span className="font-semibold">{followersCount}</span> Followers</span>
                </button>
                <button onClick={() => setShowFollowingList(true)} className="flex items-center gap-1 hover:text-purple-600">
                  <Heart className="h-4 w-4" />
                  <span><span className="font-semibold">{followingCount}</span> Following</span>
                </button>
                {isCurrentUser && (
                   <div className="flex items-center gap-1 text-gray-700">
                     <Users className="h-4 w-4" />
                     <span className="font-semibold">{membershipRequests.length}</span>
                     <span 
                       className={`cursor-pointer ${membershipRequests.length > 0 ? 'hover:text-purple-600' : 'cursor-default'}`}
                       onClick={() => { if (membershipRequests.length > 0) setShowPendingMembershipsList(true); }}
                     >
                       Pending Memberships
                     </span>
                   </div>
                )}
              </div>

              {/* Follow/Unfollow Button for other users */}
              {!isCurrentUser && user && (
                <Button 
                  onClick={() => handleFollowToggle(user._id, isFollowing)} 
                  className="mt-4"
                  variant={isFollowing ? "outline" : "default"}
                >
                  {isFollowing ? (<><Check className="w-4 h-4 mr-2" /> Following</>) : "Follow"}
                </Button>
              )}

              {/* Edit/Save/Cancel Buttons for current user */}
               {isCurrentUser && ( !isEditing ? (
                 <Button onClick={() => setIsEditing(true)} className="mt-4">
                   <Edit className="w-4 h-4 mr-2" /> Edit Profile
                 </Button>
               ) : (
                 <div className="mt-4 flex gap-2">
                   <Button onClick={handleSave} disabled={saving}>
                      {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />} Save
                   </Button>
                    <Button variant="outline" onClick={() => {
                      setIsEditing(false);
                      if (user) {
                        setFormData({
                          username: user.username || '',
                          name: user.name || '',
                          surname: user.surname || '',
                          bio: user.bio || '',
                          profilePhoto: user.profilePhoto || '',
                        });
                      }
                    }} disabled={saving}>
                       <X className="w-4 h-4 mr-2" /> Cancel
                    </Button>
                 </div>
               ))
               }
            </div>
          </div>
        </div>

        {/* Pending Memberships Section - Only show for current user */}
        {isCurrentUser && membershipRequests.length > 0 && (
          <div className="mt-8 bg-white/80 backdrop-blur-xl rounded-3xl p-8 shadow-xl border border-white/20">
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Users className="h-6 w-6" />
              Pending Membership Requests
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {membershipRequests.map(tribe => (
                <div key={tribe._id} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                  <div className="flex items-center gap-4">
                    <img
                      src={tribe.profilePhoto || TRIBE_PLACEHOLDER_IMAGE}
                      alt={tribe.name}
                      className="w-12 h-12 rounded-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = TRIBE_PLACEHOLDER_IMAGE;
                      }}
                    />
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">{tribe.name}</h3>
                      <p className="text-sm text-gray-500">{tribe.description}</p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(`/tribes/${tribe._id}`)}
                    >
                      View
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* User Posts Section */}
        <div className="mt-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Posts</h2>
          {userPosts.length === 0 ? (
            <p className="text-center text-gray-600">No posts yet.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {userPosts.map((post) => (
                <div key={post._id} className="bg-white/80 backdrop-blur-xl rounded-3xl p-6 shadow-xl border border-white/20 mb-6">
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
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Modals/Components for Followers/Following Lists */}
        <UserListDialog 
          title="Followers" 
          users={followers} 
          isOpen={showFollowersList} 
          onClose={() => setShowFollowersList(false)} 
          onUserClick={handleUserClick} 
          isCurrentUser={(id) => id === apiService.getCurrentUser()?._id}
          onFollowToggle={handleFollowToggle}
          currentUserFollowing={apiService.getCurrentUser()?.following}
        />
        <UserListDialog 
          title="Following" 
          users={following} 
          isOpen={showFollowingList} 
          onClose={() => setShowFollowingList(false)} 
          onUserClick={handleUserClick}
          isCurrentUser={(id) => id === apiService.getCurrentUser()?._id}
          onFollowToggle={handleFollowToggle}
          currentUserFollowing={apiService.getCurrentUser()?.following}
        />

        <TribeListDialog
          title="Pending Membership Requests"
          tribes={membershipRequests}
          isOpen={showPendingMembershipsList}
          onClose={() => setShowPendingMembershipsList(false)}
          onTribeClick={handleTribeClick}
        />

      </div>
    </div>
  );
}