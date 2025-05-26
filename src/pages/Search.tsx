import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiService, type User } from '../lib/api';
import { toast } from 'sonner';
import { Search as SearchIcon, Users, User as UserIcon } from 'lucide-react';
import { useDebounce } from '../hooks/useDebounce';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

export default function Search() {
  const [query, setQuery] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const debouncedQuery = useDebounce(query, 300);

  useEffect(() => {
    if (query.trim()) {
      searchUsers(debouncedQuery);
    } else {
      loadTopUsers();
    }
  }, [debouncedQuery]);

  const loadTopUsers = async () => {
    setLoading(true);
    try {
      const data = await apiService.getTopUsers();
      setUsers(data);
    } catch (error) {
      toast.error('Failed to load top users');
    } finally {
      setLoading(false);
    }
  };

  const searchUsers = async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      loadTopUsers();
      return;
    }

    setLoading(true);
    try {
      const data = await apiService.searchUsers(searchQuery);
      setUsers(data);
    } catch (error) {
      toast.error('Failed to search users');
    } finally {
      setLoading(false);
    }
  };

  const renderUserCard = (user: User) => (
    <div 
      key={user._id} 
      className="bg-white/80 backdrop-blur-xl rounded-3xl p-6 shadow-xl border border-white/20 hover:shadow-2xl transition-all duration-300 cursor-pointer"
      onClick={() => navigate(`/profile/${user._id}`)}
    >
      <div className="flex flex-col items-center text-center">
        <Avatar className="w-24 h-24 mb-4">
          <AvatarImage src={user.profilePhoto} alt={user.username} />
          <AvatarFallback><UserIcon className="w-12 h-12 text-gray-500" /></AvatarFallback>
        </Avatar>
        <h3 className="text-xl font-bold text-gray-900 mb-1">{user.username}</h3>
        {user.name && user.surname && (
          <p className="text-gray-600 mb-2">{user.name} {user.surname}</p>
        )}
        <div className="flex items-center gap-2 text-gray-500 mb-4">
          <Users className="w-4 h-4" />
          <span>{user.followers?.length || 0} followers</span>
        </div>
        <Button 
          onClick={(e) => {
            e.stopPropagation(); // Prevent card click when clicking button
            navigate(`/profile/${user._id}`);
          }}
          className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-xl"
        >
          View Profile
        </Button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-8 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
          Discover Users
        </h1>

        <div className="relative mb-8">
          <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <Input
            type="text"
            placeholder="Search users by username..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-10 pr-4 py-2 w-full rounded-xl bg-white/80 backdrop-blur-xl border border-white/20 shadow-lg focus:outline-none focus:ring-2 focus:ring-purple-300"
          />
        </div>

        {loading ? (
          <div className="flex justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
          </div>
        ) : users.length === 0 ? (
          <p className="text-center text-gray-600">No users found matching your criteria.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {users.map(renderUserCard)}
          </div>
        )}
      </div>
    </div>
  );
} 