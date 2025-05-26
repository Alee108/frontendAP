import { useState, useEffect, useCallback } from 'react';
import { apiService, type Tribe, type User } from '../lib/api';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2, SearchIcon, Users, Lock, Globe } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useDebounce } from '../hooks/useDebounce';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// Placeholder image for tribes
const TRIBE_PLACEHOLDER_IMAGE = 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=200&h=200&q=80';

export default function DiscoverTribes() {
  const [searchTerm, setSearchTerm] = useState('');
  const [tribes, setTribes] = useState<Tribe[]>([]);
  const [loading, setLoading] = useState(false);
  const [visibilityFilter, setVisibilityFilter] = useState<'ALL' | 'PUBLIC' | 'PRIVATE'>('ALL');
  const debouncedSearchTerm = useDebounce(searchTerm, 500);

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
  }, [visibilityFilter]);

  useEffect(() => {
    if (debouncedSearchTerm.trim() || !debouncedSearchTerm) {
      fetchTribes(debouncedSearchTerm);
    }
  }, [debouncedSearchTerm, fetchTribes]);

  const renderTribeCard = (tribe: Tribe) => {
    const activeMembers = tribe.memberships?.filter(m => m.status === 'ACTIVE').length || 0;
    const founderUsername = tribe.founder?.username || 'Unknown';

    return (
      <div key={tribe._id} className="bg-white/80 backdrop-blur-xl rounded-3xl p-6 shadow-xl border border-white/20 flex flex-col items-center text-center">
        <img
          src={tribe.profilePhoto}
          alt={tribe.name}
          className="w-24 h-24 rounded-full object-cover mb-4 ring-2 ring-purple-200"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.src = TRIBE_PLACEHOLDER_IMAGE;
          }}
        />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">{tribe.name}</h2>
        <p className="text-gray-700 text-sm mb-4 flex-grow">{tribe.description}</p>

        <div className="flex items-center space-x-2 text-gray-700 text-sm mb-2">
          {tribe.visibility === 'PUBLIC' ? (
            <Globe className="h-4 w-4 text-green-500" />
          ) : (
            <Lock className="h-4 w-4 text-red-500" />
          )}
          <span>{tribe.visibility === 'PUBLIC' ? 'Public' : 'Private'}</span>
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
          <Button className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-xl">
            View Tribe
          </Button>
        </Link>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-8 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
          Discover Tribes
        </h1>

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