import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiService, type Tribe } from '../lib/api';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Image as ImageIcon, MapPin, Loader2, ArrowLeft, X, Users } from 'lucide-react';
import { useAuth } from '../lib/auth-context';
import axios from 'axios';

export default function CreatePostPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [postData, setPostData] = useState({ description: '', location: '', tribeId: '' });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [userTribes, setUserTribes] = useState<Tribe[]>([]);
  const [loadingTribes, setLoadingTribes] = useState(true);
  const [isCreatingPost, setIsCreatingPost] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  // Fetch user's founder tribe on page load
  useEffect(() => {
    const fetchUserTribes = async () => {
      if (!user) {
        console.log('No user found, redirecting to login');
        navigate('/login', { state: { from: '/create-post' } });
        return;
      }

      setLoadingTribes(true);
      try {
        const allTribes = await apiService.getUserMemberships(user._id);
        const founderTribe = allTribes.find(tribe => 
          tribe.founder && tribe.founder._id === user._id
        );
        
        if (founderTribe) {
          setUserTribes([founderTribe]);
          setPostData(prev => ({ ...prev, tribeId: founderTribe._id }));
        } else {
          setUserTribes([]);
          setPostData(prev => ({ ...prev, tribeId: '' }));
          toast.info('You must be a founder of a tribe to create posts.');
          navigate('/discover');
        }

      } catch (error) {
        console.error('Failed to fetch user tribes:', error);
        if (axios.isAxiosError(error) && error.response?.status === 401) {
          toast.error('Your session has expired. Please login again.');
          navigate('/login', { state: { from: '/create-post' } });
        } else {
          toast.error('Failed to load your tribes.');
          navigate('/discover');
        }
      } finally {
        setLoadingTribes(false);
      }
    };

    fetchUserTribes();
  }, [user, navigate]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setPostData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
       const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
       if (!allowedTypes.includes(file.type)) {
           toast.error('Only JPG, PNG, GIF, and WebP images are allowed.');
           setImageFile(null);
           setImagePreviewUrl(null);
           if (e.target) e.target.value = '';
           return;
       }
       const maxSize = 5 * 1024 * 1024;
       if (file.size > maxSize) {
           toast.error('Image file size must be less than 5MB.');
           setImageFile(null);
           setImagePreviewUrl(null);
           if (e.target) e.target.value = '';
           return;
       }

      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setImageFile(null);
      setImagePreviewUrl(null);
    }
  };

  const handleCreatePost = async () => {
    if (!postData.description.trim() || !postData.tribeId || !imageFile) {
        // This should ideally be prevented by button disabled state, but good for safety
        toast.error('Please fill all required fields (Description and Photo).');
        return;
    }

    setIsCreatingPost(true);
    const formData = new FormData();
    formData.append('description', postData.description);
    formData.append('tribeId', postData.tribeId);
    if (postData.location.trim()) {
      formData.append('location', postData.location);
    }
    formData.append('image', imageFile); // Image is mandatory now

    try {
      await apiService.createPost(formData);
      toast.success('Post created successfully!');
      // Redirect to Home or Tribe page after successful creation
      navigate('/home'); // Or navigate(`/tribes/${postData.tribeId}`);
    } catch (error) {
      console.error('Error creating post:', error);
      toast.error('Failed to create post.');
      setIsCreatingPost(false);
    }
  };

  const handleDiscard = () => {
      // Reset form state and navigate away
      setPostData({ description: '', location: '', tribeId: '' });
      setImageFile(null);
      setImagePreviewUrl(null);
      setShowPreview(false); // Hide preview if visible
      navigate(-1); // Go back to the previous page
  };

  const handleShowPreview = () => {
      if (!postData.description.trim() || !postData.tribeId || !imageFile) {
          toast.error('Please fill all required fields (Description and Photo) before previewing.');
          return;
      }
      setShowPreview(true);
  };

  const handleBackToEdit = () => {
      setShowPreview(false);
  };

  // Determine if the Preview/Share button should be enabled
  const isFormValid = postData.description.trim() && postData.tribeId && imageFile;
  const founderTribeLoaded = !loadingTribes && userTribes.length > 0;

  if (!user || (loadingTribes && !userTribes.length)) {
      // Show a loading or redirect message while fetching user or tribes
      return (
        <div className="flex justify-center items-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-purple-500 mr-2" />
          <p className="text-gray-700">Loading...</p>
        </div>
      );
  }
  
  if (!founderTribeLoaded) {
       // This case should ideally be handled by the redirect in useEffect
       // but as a fallback, show a message
      return (
         <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
             <Users className="h-12 w-12 text-purple-500 mb-4" />
             <h2 className="text-2xl font-bold text-gray-900 mb-2">No Founder Tribe Found</h2>
             <p className="text-gray-600 mb-4">You must be a founder of a tribe to create posts.</p>
             <Button onClick={() => navigate('/discover')}>Browse Tribes</Button>
         </div>
      );
  }

  // Assuming user is logged in and founder tribe is loaded
  const founderTribe = userTribes[0];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 py-8 px-4">
      <div className="max-w-2xl mx-auto bg-white/80 backdrop-blur-xl rounded-3xl p-8 shadow-xl border border-white/20">
        <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Create New Post</h1>
            <Button variant="ghost" size="icon" onClick={handleDiscard} title="Discard Post">
                <X className="h-5 w-5 text-gray-600" />
            </Button>
        </div>

        {showPreview ? (
          // Post Preview Area
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Preview</h2>
            {imagePreviewUrl && (
              <img src={imagePreviewUrl} alt="Post preview" className="w-full object-cover rounded-lg mb-4" />
            )}
            <p className="text-gray-700 mb-2">{postData.description}</p>
            {postData.location && (
              <p className="text-sm text-gray-500 flex items-center gap-1">
                <MapPin className="h-4 w-4"/> {postData.location}
              </p>
            )}
            <p className="text-sm text-gray-500 mt-2">Posting to: {founderTribe.name}</p>

            <div className="flex justify-between gap-4 mt-6">
                <Button variant="outline" onClick={handleBackToEdit} disabled={isCreatingPost}>
                    <ArrowLeft className="h-4 w-4 mr-2" /> Back to Edit
                </Button>
                <Button onClick={handleCreatePost} disabled={isCreatingPost}>
                   {isCreatingPost ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null} Share Post
                </Button>
            </div>
          </div>
        ) : (
          // Post Creation Form
          <div className="grid gap-6">
            {/* Tribe Info (Read-only) */}
            <div className="grid grid-cols-4 items-center gap-4">
              <label className="text-right text-gray-700">Tribe</label>
              <div className="col-span-3 flex items-center gap-2">
                  {founderTribe && (
                     <div className="flex items-center gap-2 bg-purple-50 rounded-lg px-3 py-2">
                        <img
                           src={founderTribe.profilePhoto || 'TRIBE_PLACEHOLDER_IMAGE_URL'}
                           alt={founderTribe.name}
                           className="w-6 h-6 rounded-full object-cover"
                        />
                        <span className="text-sm font-medium text-gray-900">{founderTribe.name}</span>
                        <span className="text-xs text-purple-600">(Your Tribe)</span>
                     </div>
                  )}
              </div>
            </div>

            {/* Description Input */}
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="description" className="text-right text-gray-700">Description</label>
              <Textarea
                id="description"
                name="description"
                value={postData.description}
                onChange={handleInputChange}
                placeholder="What's on your mind?"
                className="col-span-3"
                rows={4}
              />
            </div>

            {/* Location Input */}
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="location" className="text-right text-gray-700 flex items-center justify-end gap-1"><MapPin className="h-4 w-4" /> Location (Optional)</label>
              <Input
                id="location"
                name="location"
                value={postData.location}
                onChange={handleInputChange}
                placeholder="Add a location"
                className="col-span-3"
              />
            </div>

            {/* Image Upload */}
            <div className="grid grid-cols-4 items-center gap-4">
               <label className="text-right text-gray-700 flex items-center justify-end gap-1"><ImageIcon className="h-4 w-4" /> Photo</label>
               <div className="col-span-3 flex flex-col gap-2">
                  <Input 
                    type="file" 
                    accept="image/jpeg,image/png,image/gif,image/webp"
                    onChange={handleFileChange} 
                    className="col-span-3 text-gray-700 file:text-purple-700 file:font-medium"
                  />
                  {imagePreviewUrl && (
                     <img src={imagePreviewUrl} alt="Image preview" className="w-full max-h-64 object-cover rounded-md"/>
                  )}
               </div>
            </div>
            
            {/* Preview Button */}
            <div className="flex justify-end mt-4">
                <Button onClick={handleShowPreview} disabled={!isFormValid || isCreatingPost}>
                   Preview Post
                </Button>
            </div>

          </div>
        )}
      </div>
    </div>
  );
} 