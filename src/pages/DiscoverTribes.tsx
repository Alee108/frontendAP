import { useState, useEffect, useCallback } from 'react';
import { apiService, type Tribe, type User } from '../lib/api';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2, SearchIcon, Users, Lock, Globe, Plus, Crown, Image as ImageIcon } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useDebounce } from '../hooks/useDebounce';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '../lib/auth-context';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useUserInTribe } from '@/hooks/useUserInTribe';

// Placeholder image for tribes
const TRIBE_PLACEHOLDER_IMAGE = 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=200&h=200&q=80';

export default function DiscoverTribes() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [tribes, setTribes] = useState<Tribe[]>([]);
  const [loading, setLoading] = useState(false);
  const [visibilityFilter, setVisibilityFilter] = useState<'ALL' | 'PUBLIC' | 'PRIVATE'>('ALL');
  const debouncedSearchTerm = useDebounce(searchTerm, 500);
  const { isInTribe: userHasTribe, isLoading: checkingMembership } = useUserInTribe();

  async function isUserInTribe(): Promise<boolean> {
    try {
      const memberships = await apiService.getUserMemberships(user?._id || '');
      console.log(memberships.length)
      return memberships.length > 0;
    } catch (error) {
      console.error('Error checking user memberships:', error);
      toast.error('Failed to check your tribe memberships. Please try again.');
      return false;
    }
  }
  // State for managing join requests
  const [joiningTribeId, setJoiningTribeId] = useState<string | null>(null);

  // Create tribe dialog state
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [newTribeData, setNewTribeData] = useState({
    name: '',
    description: '',
    visibility: 'PUBLIC' as 'PUBLIC' | 'PRIVATE',
    profilePhoto: null as File | null
  });
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const fetchTribes = useCallback(async (query = '') => {
    const result = await apiService.getUserMemberships(user?._id || '');

    setLoading(true);
    try {
      let data: Tribe[];
      if (query) {
        data = await apiService.searchTribes(query);
      } else {
        data = await apiService.getAllTribes();
      }

      // Apply visibility filter
      if (visibilityFilter !== 'ALL') {
        data = data.filter(tribe => tribe.visibility === visibilityFilter);
      }

      // Check if user is a founder, member, or has pending request for each tribe
      const updatedData = data.map(tribe => {
        const isUserFounder = tribe.founder?._id === user?._id; // Check if current user is the founder
        const isMemberOfTribe = tribe.memberships?.some(m => m.user === user?._id && m.status === 'ACTIVE' && m.role !== 'FOUNDER'); // Check if current user is a regular member
        const isModeratorOfTribe = tribe.memberships?.some(m => m.user === user?._id && m.status === 'ACTIVE' && m.role === 'MODERATOR'); // Check if current user is a moderator
        const hasPendingRequest = tribe.memberships?.some(m => m.user === user?._id && m.status === 'PENDING'); // Check if current user has a pending request
        const isAlreadyInTribe = isUserFounder || isMemberOfTribe || isModeratorOfTribe; // User is already in the tribe if founder, member, or moderator

        return {
          ...tribe,
          _id: tribe._id || tribe.id || `temp-${Math.random()}`,
          name: tribe.name || 'Unnamed Tribe',
          description: tribe.description || 'No description available',
          visibility: tribe.visibility || 'PUBLIC',
          memberships: tribe.memberships || [],
          profilePhoto: tribe.profilePhoto || TRIBE_PLACEHOLDER_IMAGE,
          isUserFounder,
          isMemberOfTribe,
          isModeratorOfTribe,
          hasPendingRequest,
          isAlreadyInTribe,
        };
      });

      setTribes(updatedData);

    } catch (error) {
      console.error('Error fetching tribes:', error);
      toast.error('Failed to load tribes');
      setTribes([]);
    } finally {
      setLoading(false);
    }
  }, [visibilityFilter, user]);

  useEffect(() => {
    if (debouncedSearchTerm.trim() || !debouncedSearchTerm) {
      fetchTribes(debouncedSearchTerm);
    }
  }, [debouncedSearchTerm, fetchTribes]);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Verifica l'estensione del file
      const validExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
      const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();

      if (!validExtensions.includes(fileExtension)) {
        toast.error('Please select a valid image file (jpg, jpeg, png, gif, or webp)');
        e.target.value = ''; // Reset the input
        return;
      }

      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast.error('Image size should be less than 5MB');
        e.target.value = ''; // Reset the input
        return;
      }

      setNewTribeData(prev => ({ ...prev, profilePhoto: file }));
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const handleCreateTribe = async () => {
    if (!newTribeData.name.trim()) {
      toast.error('Please enter a tribe name');
      return;
    }

    setIsCreating(true);
    try {
      const formData = new FormData();
      formData.append('name', newTribeData.name);
      formData.append('description', newTribeData.description);
      formData.append('visibility', newTribeData.visibility);
      if (newTribeData.profilePhoto) {
        // Il backend si aspetta il campo 'profilePhoto' invece di 'photo'
        formData.append('profilePhoto', newTribeData.profilePhoto);
      }

      const createdTribe = await apiService.createTribe(formData);
      toast.success('Tribe created successfully!');
      setIsCreateDialogOpen(false);
      setNewTribeData({ name: '', description: '', visibility: 'PUBLIC', profilePhoto: null });
      setPreviewUrl(null);
      // Refresh the tribes list
      fetchTribes();
      // Navigate to the new tribe
      navigate(`/tribes/${createdTribe._id}`);
    } catch (error) {
      console.error('Error creating tribe:', error);
      if (error instanceof Error && error.message.includes('Only image files are allowed')) {
        toast.error('Please upload a valid image file (jpg, jpeg, png, gif, or webp)');
      } else {
        toast.error('Failed to create tribe');
      }
    } finally {
      setIsCreating(false);
    }
  };

  const handleJoinRequest = async (tribeId: string, isPrivate: boolean) => {
    console.log('handleJoinRequest called with tribeId:', tribeId, 'isPrivate:', isPrivate);
    if (!user) {
        toast.info('Please login to join tribes.');
        navigate('/login');
        return;
    }

    try {
      // Check if user has any active memberships using the API
      const userMemberships = await apiService.getUserMemberships(user._id);
      console.log('User memberships:', userMemberships);
      
      const hasActiveMembership = userMemberships.some(tribe => {
        const hasActive = tribe.memberships?.some(membership => 
          membership.status === 'ACTIVE' || 
          membership.role === 'FOUNDER' || 
          membership.role === 'MODERATOR'
        );
        console.log('Tribe:', tribe._id, 'Has active membership:', hasActive);
        return hasActive;
      });

      console.log('Has active membership:', hasActiveMembership);

      if (hasActiveMembership) {
        toast.error('You are already a member, founder, or moderator of another tribe. You cannot join multiple tribes.');
        return;
      }

      // Only proceed if user has no active memberships
      setJoiningTribeId(tribeId);
      console.log(isPrivate)
      if (!isPrivate) {
        navigate(`/tribes/${tribeId}`); 
      } else {
        console.log('Sending join request for tribe:', tribeId);
        try {
          await apiService.requestMembership(tribeId);
          toast.success('Join request sent!');
          // Refresh the tribes list to update the button state for the joined/requested tribe
          fetchTribes(debouncedSearchTerm);
        } catch (error) {
          console.error('Error sending join request:', error);
          toast.error('Failed to send join request.');
        } finally {
          setJoiningTribeId(null);
        }
      }
    } catch (error) {
      console.error('Error checking user memberships:', error);
      toast.error('Failed to check your tribe memberships. Please try again.');
      setJoiningTribeId(null);
    }
  };

   const  renderTribeCard = (tribe: Tribe & { isUserFounder?: boolean; isMemberOfTribe?: boolean; isModeratorOfTribe?: boolean; hasPendingRequest?: boolean; isAlreadyInTribe?: boolean }) => {
    const activeMembers = tribe.memberships?.filter(m => m.status === 'ACTIVE').length || 0;
    const founderUsername = tribe.founder?.username || 'Unknown';
    const isPrivate = tribe.visibility == 'PRIVATE';
    //console.log('Rendering tribe:', tribe._id, 'visibility:', tribe.visibility, 'isPrivate:', isPrivate);
    const isClosed = tribe.visibility === 'CLOSED';
    const isUserFounder = tribe.isUserFounder;
    const isMemberOfTribe = tribe.isMemberOfTribe;
    const isModeratorOfTribe = tribe.isModeratorOfTribe;
    const hasPendingRequest = tribe.hasPendingRequest;
    const isAlreadyInTribe = tribe.isAlreadyInTribe;

    const buttonText = isClosed
      ? 'View Closed Tribe'
      : isUserFounder
      ? 'Your Tribe'
      : isMemberOfTribe
      ? 'Already a Member'
      : isModeratorOfTribe
      ? 'Tribe Moderator'
      : hasPendingRequest
      ? 'Request Pending'
      : isPrivate
      ? 'Request to Join'
      : 'View Tribe'; // For public tribes

    //const isButtonDisabled = isClosed || isAlreadyInTribe;

    //console.log(isButtonDisabled, 'isButtonDisabled for tribe:', tribe._id);

    const handleButtonClick = () => {
      console.log('Button clicked for tribe:', tribe._id, 'isClosed:', isClosed, 'isAlreadyInTribe:', isAlreadyInTribe);

      console.log("BUTTON TEXT: ", buttonText)
      if( buttonText === 'Request to Join') {
        if(userHasTribe){
          toast.error('You are already a member of a tribe or it is closed.');
         }else  {
         handleJoinRequest(tribe._id, isPrivate); // Handle joining public tribe
      }
      }else if (isClosed || isAlreadyInTribe || userHasTribe) {
        //some 
        toast.error('You are already a member of a tribe or it is closed.');

      } else
      if(buttonText === 'Your Tribe' || 'Tribe Moderator' || 'Already a Member') {
        navigate(`/tribes/${tribe._id}`); // Navigate to the tribe page if it's the user's own tribe
        return;
      }else 
      if(buttonText === 'View Tribe') {
        navigate(`/tribes/${tribe._id}`); // Navigate to public tribe
        return;
      }
    };

    return (
      <div key={tribe._id} className="bg-white/80 backdrop-blur-xl rounded-3xl p-6 shadow-xl border border-white/20 flex flex-col items-center text-center">
        <img
          src={tribe.profilePhoto}
          alt={tribe.name}
          className={`w-24 h-24 rounded-full object-cover mb-4 ring-2 ${isClosed ? 'ring-gray-200' : 'ring-purple-200'}`}
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.src = TRIBE_PLACEHOLDER_IMAGE;
          }}
        />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">{tribe.name}</h2>

        {isClosed ? (
          <>
            <div className="flex items-center space-x-2 text-gray-700 text-sm mb-4">
              <Lock className="h-4 w-4 text-gray-500" />
              <span>Closed Tribe</span>
            </div>
            <p className="text-gray-500 text-sm mb-4">This tribe is closed. You can view posts but cannot join.</p>
             {/* Button for closed tribes - visible to all, navigates to profile for viewing */}
            <Button
              onClick={handleButtonClick} // Use handleButtonClick for navigation
              className={`w-full mt-auto rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white`}
            >
              {buttonText}
            </Button>
          </>
        ) : (
          <>
            <div className="flex items-center space-x-2 text-gray-700 text-sm mb-4">
              {isPrivate ? (
                <Lock className="h-4 w-4 text-red-500" />
              ) : (
                <Globe className="h-4 w-4 text-green-500" />
              )}
              {!isClosed && (
                <div className="flex items-center gap-1">
                  <span>{isPrivate ? 'Private' : 'Public'} Tribe</span>
                </div>
              )}
            </div>
            <p className="text-gray-700 text-sm mb-4 flex-grow">{tribe.description}</p>

            <div className="flex items-center space-x-2 text-gray-700 text-sm mb-2">
              <Users className="h-4 w-4" />
              <span>Founder: {founderUsername}</span>
            </div>

            {!isPrivate && (
              <div className="flex items-center space-x-2 text-gray-700 text-sm mb-4">
                <Users className="h-4 w-4" />
                {!isClosed && (
                  <div className="flex items-center gap-1">
                    <span>Members: {activeMembers}</span>
                  </div>
                )}
              </div>
            )}

            <Button
              onClick={handleButtonClick}
              //disabled={isButtonDisabled}
              className={`w-full mt-auto rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white`}
            >
              {joiningTribeId === tribe._id ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : null}
              {buttonText}
            </Button>
          </>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            Discover Tribes
          </h1>

          { 
          !userHasTribe && (
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              
              <Button className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white">
                <Plus className="mr-2 h-5 w-5" /> Create New Tribe
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Create New Tribe</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <Input
                  placeholder="Tribe Name"
                  value={newTribeData.name}
                  onChange={(e) => setNewTribeData({ ...newTribeData, name: e.target.value })}
                />
                <Textarea
                  placeholder="Tribe Description"
                  value={newTribeData.description}
                  onChange={(e) => setNewTribeData({ ...newTribeData, description: e.target.value })}
                />
                <Select
                  value={newTribeData.visibility}
                  onValueChange={(value: 'PUBLIC' | 'PRIVATE') => setNewTribeData({ ...newTribeData, visibility: value })}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select visibility" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PUBLIC">Public</SelectItem>
                    <SelectItem value="PRIVATE">Private</SelectItem>
                  </SelectContent>
                </Select>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Profile Photo</label>
                  <div className="flex items-center gap-4">
                    <input
                      id="profilePhoto" // Add an id for the label
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoChange}
                      className="block w-full text-sm text-gray-500
                        file:mr-4 file:py-2 file:px-4
                        file:rounded-full file:border-0
                        file:text-sm file:font-semibold
                        file:bg-purple-50 file:text-purple-700
                        hover:file:bg-purple-100
                      "
                    />
                    {previewUrl && (
                      <img src={previewUrl} alt="Profile Preview" className="w-16 h-16 rounded-full object-cover" />
                    )}
                     {!previewUrl && newTribeData.profilePhoto === null && (
                       <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center">
                          <ImageIcon className="w-8 h-8 text-gray-500" />
                       </div>
                     )}
                  </div>
                </div>
              </div>
              <div className="flex justify-end">
                <Button onClick={handleCreateTribe} disabled={isCreating} className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white">
                  {isCreating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Create Tribe
                </Button>
              </div>
            </DialogContent>
          </Dialog>
          )}

        </div>

        <div className="flex items-center space-x-4 mb-8">
          <div className="relative flex-grow">
            <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <Input
              placeholder="Search tribes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 rounded-lg border-gray-300 focus:border-purple-500 focus:ring-purple-500"
            />
          </div>
          <Select onValueChange={(value: 'ALL' | 'PUBLIC' | 'PRIVATE') => setVisibilityFilter(value)} value={visibilityFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by visibility" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Tribes</SelectItem>
              <SelectItem value="PUBLIC">Public Tribes</SelectItem>
              <SelectItem value="PRIVATE">Private Tribes</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {loading ? (
          <div className="flex justify-center items-center min-h-[300px]">
            <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
          </div>
        ) : tribes.length === 0 ? (
          <p className="text-center text-gray-600 text-lg">No tribes found.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tribes.map(renderTribeCard)}
          </div>
        )}
      </div>
    </div>
  );
}