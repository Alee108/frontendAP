import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, User, ArrowRight, Upload, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { toast } from 'sonner';
import { useAuth } from '../lib/auth-context';

const Signup = () => {
  const navigate = useNavigate();
  const { signup } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    surname: '',
    email: '',
    username: '',
    password: '',
    confirmPassword: '',
    gender: '',
    bio: '',
    profilePhoto: null as File | null
  });
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    if (file && !file.type.match(/^image\/(jpg|jpeg|png|gif|webp)$/)) {
      toast.error('Please upload a valid image file (jpg, jpeg, png, gif, or webp)');
      return;
    }
    setFormData(prev => ({ ...prev, profilePhoto: file }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!acceptTerms) {
      toast.error('Please accept the terms and conditions');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      toast.error('Password must be at least 6 characters long');
      return;
    }

    setIsLoading(true);
    
    try {
      const formDataToSend = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        if (value !== null && value !== '') {
          formDataToSend.append(key, value);
        } else if (key === 'profilePhoto' && value === null) {
          // Optionally append a placeholder or handle null explicitly if backend expects the key
          // formDataToSend.append(key, ''); // Or handle on backend
        }
      });

      await signup(formDataToSend);
      toast.success('Account created successfully!');
      navigate('/login');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to create account');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-2xl"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center space-x-3 group">
            <motion.div 
              className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center"
              whileHover={{ scale: 1.05 }}
              transition={{ type: "spring", stiffness: 400, damping: 17 }}
            >
              <img src="/tribe white.png" alt="App Logo" className="h-10 w-10" />
            </motion.div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Tribe
            </h1>
          </Link>
          <p className="text-gray-600 mt-2">Find your intentional community</p>
        </div>

        {/* Signup Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="bg-white/80 backdrop-blur-xl rounded-3xl p-8 shadow-xl border border-white/20"
        >
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Name and Surname */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-gray-700 font-medium">
                  Name
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <Input
                    id="name"
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="Your name"
                    className="pl-12 h-12 bg-gray-50/50 border-gray-200 focus:border-purple-300 focus:ring-purple-200"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="surname" className="text-gray-700 font-medium">
                  Surname
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <Input
                    id="surname"
                    type="text"
                    value={formData.surname}
                    onChange={(e) => handleInputChange('surname', e.target.value)}
                    placeholder="Your surname"
                    className="pl-12 h-12 bg-gray-50/50 border-gray-200 focus:border-purple-300 focus:ring-purple-200"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-gray-700 font-medium">
                Email
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="your@email.com"
                  className="pl-12 h-12 bg-gray-50/50 border-gray-200 focus:border-purple-300 focus:ring-purple-200"
                  required
                />
              </div>
            </div>

            {/* Username */}
            <div className="space-y-2">
              <Label htmlFor="username" className="text-gray-700 font-medium">
                Username
              </Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  id="username"
                  type="text"
                  value={formData.username}
                  onChange={(e) => handleInputChange('username', e.target.value)}
                  placeholder="@username"
                  className="pl-12 h-12 bg-gray-50/50 border-gray-200 focus:border-purple-300 focus:ring-purple-200"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-2">
              <Label htmlFor="password" className="text-gray-700 font-medium">
                Password
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  placeholder="••••••••"
                  className="pl-12 h-12 bg-gray-50/50 border-gray-200 focus:border-purple-300 focus:ring-purple-200"
                  required
                  minLength={6}
                />
              </div>
            </div>

            {/* Confirm Password */}
            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-gray-700 font-medium">
                Confirm Password
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  id="confirmPassword"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                  placeholder="••••••••"
                  className="pl-12 h-12 bg-gray-50/50 border-gray-200 focus:border-purple-300 focus:ring-purple-200"
                  required
                  minLength={6}
                />
              </div>
            </div>

            {/* Gender */}
            <div className="space-y-3">
              <Label className="text-gray-700 font-medium">Gender</Label>
              <RadioGroup 
                value={formData.gender} 
                onValueChange={(value) => handleInputChange('gender', value)}
                className="flex space-x-6"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="male" id="male" />
                  <Label htmlFor="male" className="text-gray-600">Male</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="female" id="female" />
                  <Label htmlFor="female" className="text-gray-600">Female</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="other" id="other" />
                  <Label htmlFor="other" className="text-gray-600">Other</Label>
                </div>
              </RadioGroup>
            </div>

            {/* Bio */}
            <div className="space-y-2">
              <Label htmlFor="bio" className="text-gray-700 font-medium">
                Bio
              </Label>
              <Textarea
                id="bio"
                value={formData.bio}
                onChange={(e) => handleInputChange('bio', e.target.value)}
                placeholder="Tell us about yourself..."
                className="min-h-[100px] bg-gray-50/50 border-gray-200 focus:border-purple-300 focus:ring-purple-200"
              />
            </div>

            {/* Profile Photo */}
            <div className="space-y-2">
              <Label htmlFor="profilePhoto" className="text-gray-700 font-medium">
                Profile Photo
              </Label>
              <div className="relative">
                <Upload className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  id="profilePhoto"
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="pl-12 h-12 bg-gray-50/50 border-gray-200 focus:border-purple-300 focus:ring-purple-200"
                />
              </div>
              {formData.profilePhoto && (
                <p className="text-sm text-gray-600">Selected: {formData.profilePhoto.name}</p>
              )}
            </div>

            {/* Terms and Conditions */}
            <div className="flex items-start space-x-3">
              <Checkbox
                id="terms"
                checked={acceptTerms}
                onCheckedChange={(checked) => setAcceptTerms(checked as boolean)}
                className="mt-1"
              />
              <Label htmlFor="terms" className="text-sm text-gray-600 leading-relaxed">
                I agree to the{' '}
                <Link to="/terms" className="text-purple-600 hover:text-purple-700 font-medium">
                  Terms of Service
                </Link>{' '}
                and{' '}
                <Link to="/privacy" className="text-purple-600 hover:text-purple-700 font-medium">
                  Privacy Policy
                </Link>
              </Label>
            </div>

            <Button
              type="submit"
              disabled={isLoading || !acceptTerms}
              className="w-full h-12 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-xl font-semibold transition-all duration-300 group disabled:opacity-50"
            >
              {isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin mx-auto" />
              ) : (
                'Create Account'
              )}
            </Button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-gray-600">
              Already have an account?{' '}
              <Link to="/login" className="text-purple-600 hover:text-purple-700 font-semibold">
                Sign In
              </Link>
            </p>
          </div>
        </motion.div>

        {/* Back to Home */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="text-center mt-6"
        >
          <Link to="/" className="text-gray-500 hover:text-gray-700 transition-colors">
            ← Back to Home
          </Link>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default Signup;
