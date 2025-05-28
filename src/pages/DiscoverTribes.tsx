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
  const [isFounder, setIsFounder] = useState(false);
  
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

      // Check if user is a founder of any tribe
      if (user) {
        const isUserFounder = data.some(tribe => 
          tribe.founder._id === user._id || 
          tribe.memberships?.some(m => m.user._id === user._id && m.role === 'FOUNDER')
        );
        setIsFounder(isUserFounder);
      }

      // Ensure all tribes have required fields
      data = data.map(tribe => ({
        ...tribe,
        _id: tribe._id || tribe.id || `temp-${Math.random()}`,
        name: tribe.name || 'Unnamed Tribe',
        description: tribe.description || 'No description available',
        visibility: tribe.visibility || 'PUBLIC',
        memberships: tribe.memberships || [],
        profilePhoto: tribe.profilePhoto || TRIBE_PLACEHOLDER_IMAGE
      }));

      setTribes(data);
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

  const renderTribeCard = (tribe: Tribe) => {
    const activeMembers = tribe.memberships?.filter(m => m.status === 'ACTIVE').length || 0;
    const founderUsername = tribe.founder?.username || 'Unknown';
    const isPrivate = tribe.visibility === 'PRIVATE';
    const isClosed = tribe.status === 'CLOSED';
    const isFounderOfTribe = tribe.founder._id === user?._id;
    const isMemberOfTribe = tribe.memberships?.some(m => m.user._id === user?._id && m.status === 'ACTIVE');
    const isAlreadyInTribe = isFounderOfTribe || isMemberOfTribe;

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
            <Link to={`/tribes/${tribe._id}`} className="w-full mt-auto">
              <Button 
                className="w-full bg-gray-100 text-gray-500 hover:bg-gray-200 rounded-xl"
              >
                View Posts
              </Button>
            </Link>
          </>
        ) : isPrivate ? (
          <>
            <div className="flex items-center space-x-2 text-gray-700 text-sm mb-4">
              <Lock className="h-4 w-4 text-red-500" />
              <span>Private Tribe</span>
            </div>
            <p className="text-gray-500 text-sm mb-4">This is a private tribe. Request to join to see more details.</p>
            <Link to={`/tribes/${tribe._id}`} className="w-full mt-auto">
              <Button 
                className={`w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-xl ${
                  isAlreadyInTribe ? 'opacity-50 cursor-not-allowed' : ''
                }`}
                disabled={isAlreadyInTribe}
              >
                {isFounderOfTribe ? 'Your Tribe' : isMemberOfTribe ? 'Already a Member' : 'Request to Join'}
              </Button>
            </Link>
          </>
        ) : (
          <>
            <p className="text-gray-700 text-sm mb-4 flex-grow">{tribe.description}</p>

            <div className="flex items-center space-x-2 text-gray-700 text-sm mb-2">
              <Globe className="h-4 w-4 text-green-500" />
              <span>Public Tribe</span>
            </div>

            <div className="flex items-center space-x-2 text-gray-700 text-sm mb-2">
              <Users className="h-4 w-4" />
              <span>Founder: {founderUsername}</span>
            </div>

            <div className="flex items-center space-x-2 text-gray-700 text-sm mb-4">
              <Users className="h-4 w-4" />
              <span>Members: {activeMembers}</span>
            </div>

            <Link to={`/tribes/${tribe._id}`} className="w-full mt-auto">
              <Button 
                className={`w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-xl ${
                  isAlreadyInTribe ? 'opacity-50 cursor-not-allowed' : ''
                }`}
                disabled={isAlreadyInTribe}
              >
                {isFounderOfTribe ? 'Your Tribe' : isMemberOfTribe ? 'Already a Member' : 'View Tribe'}
              </Button>
            </Link>
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
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div>
                  <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                    <DialogTrigger asChild>
                      <Button 
                        className={`bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-xl ${
                          isFounder ? 'opacity-50 cursor-not-allowed' : ''
                        }`}
                        disabled={isFounder}
                      >
                        {isFounder ? (
                          <>
                            <Crown className="w-4 h-4 mr-2" />
                            Already a Founder
                          </>
                        ) : (
                          <>
                            <Plus className="w-4 h-4 mr-2" />
                            Create Tribe
                          </>
                        )}
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px]">
                      <DialogHeader>
                        <DialogTitle>Create a New Tribe</DialogTitle>
                      </DialogHeader>
                      <div className="grid gap-4 py-4">
                        <div className="flex flex-col items-center gap-4">
                          <div className="relative w-32 h-32">
                            {previewUrl ? (
                              <img
                                src={previewUrl}
                                alt="Tribe preview"
                                className="w-full h-full rounded-full object-cover ring-2 ring-purple-200"
                              />
                            ) : (
                              <div className="w-full h-full rounded-full bg-gray-100 flex items-center justify-center">
                                <ImageIcon className="w-8 h-8 text-gray-400" />
                              </div>
                            )}
                            <label
                              htmlFor="tribe-photo"
                              className="absolute bottom-0 right-0 bg-purple-500 text-white p-2 rounded-full cursor-pointer hover:bg-purple-600 transition-colors"
                            >
                              <Plus className="w-4 h-4" />
                              <input
                                id="tribe-photo"
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={handlePhotoChange}
                              />
                            </label>
                          </div>
                          <p className="text-sm text-gray-500">Upload a photo for your tribe (optional)</p>
                        </div>

                        <div className="grid gap-2">
                          <label htmlFor="name" className="text-sm font-medium">
                            Tribe Name
                          </label>
                          <Input
                            id="name"
                            value={newTribeData.name}
                            onChange={(e) => setNewTribeData(prev => ({ ...prev, name: e.target.value }))}
                            placeholder="Enter tribe name"
                            className="rounded-xl"
                          />
                        </div>
                        <div className="grid gap-2">
                          <label htmlFor="description" className="text-sm font-medium">
                            Description
                          </label>
                          <Textarea
                            id="description"
                            value={newTribeData.description}
                            onChange={(e) => setNewTribeData(prev => ({ ...prev, description: e.target.value }))}
                            placeholder="Describe your tribe's purpose and values"
                            className="rounded-xl min-h-[100px]"
                          />
                        </div>
                        <div className="grid gap-2">
                          <label htmlFor="visibility" className="text-sm font-medium">
                            Visibility
                          </label>
                          <Select
                            value={newTribeData.visibility}
                            onValueChange={(value: 'PUBLIC' | 'PRIVATE') => 
                              setNewTribeData(prev => ({ ...prev, visibility: value }))
                            }
                          >
                            <SelectTrigger className="rounded-xl">
                              <SelectValue placeholder="Select visibility" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="PUBLIC">Public - Anyone can find and request to join</SelectItem>
                              <SelectItem value="PRIVATE">Private - Only invited members can join</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="flex justify-end gap-3">
                        <Button
                          variant="outline"
                          onClick={() => setIsCreateDialogOpen(false)}
                          className="rounded-xl"
                        >
                          Cancel
                        </Button>
                        <Button
                          onClick={handleCreateTribe}
                          disabled={isCreating || !newTribeData.name.trim()}
                          className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-xl"
                        >
                          {isCreating ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Creating...
                            </>
                          ) : (
                            'Create Tribe'
                          )}
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </TooltipTrigger>
              {isFounder && (
                <TooltipContent>
                  <p>You can only be the founder of one tribe at a time</p>
                </TooltipContent>
              )}
            </Tooltip>
          </TooltipProvider>
        </div>

        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="relative flex-grow">
            <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <Input
              type="text"
              placeholder="Search tribes by name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 w-full rounded-xl bg-white/80 backdrop-blur-xl border border-white/20 shadow-lg focus:outline-none focus:ring-2 focus:ring-purple-300"
            />
          </div>
          <Select value={visibilityFilter} onValueChange={(value: 'ALL' | 'PUBLIC' | 'PRIVATE') => setVisibilityFilter(value)}>
            <SelectTrigger className="w-[180px] rounded-xl bg-white/80 backdrop-blur-xl border border-white/20 shadow-lg">
              <SelectValue placeholder="Filter by visibility" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Tribes</SelectItem>
              <SelectItem value="PUBLIC">Public Only</SelectItem>
              <SelectItem value="PRIVATE">Private Only</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {loading ? (
          <div className="flex justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
          </div>
        ) : tribes.length === 0 ? (
          <p className="text-center text-gray-600">No tribes found matching your criteria.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tribes.map(renderTribeCard)}
          </div>
        )}
      </div>
    </div>
  );
} 