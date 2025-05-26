
import { Heart, Github, Twitter, Mail } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-gray-900 text-white py-20 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="grid md:grid-cols-4 gap-12 mb-12">
          <div className="md:col-span-2">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                <Heart className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-3xl font-bold">Tribe</h3>
            </div>
            
            <p className="text-gray-400 mb-8 max-w-md text-lg leading-relaxed">
              Building the future of intentional social networking. 
              One Tribe, infinite connections, zero algorithms.
            </p>
            
            <div className="flex space-x-6">
              <a href="#" className="text-gray-400 hover:text-purple-400 transition-colors">
                <Twitter className="w-6 h-6" />
              </a>
              <a href="#" className="text-gray-400 hover:text-purple-400 transition-colors">
                <Github className="w-6 h-6" />
              </a>
              <a href="#" className="text-gray-400 hover:text-purple-400 transition-colors">
                <Mail className="w-6 h-6" />
              </a>
            </div>
          </div>
          
          <div>
            <h4 className="font-semibold mb-6 text-lg">Platform</h4>
            <ul className="space-y-4 text-gray-400">
              <li><a href="#" className="hover:text-white transition-colors">How It Works</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Find Tribes</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Create Tribe</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Pricing</a></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold mb-6 text-lg">Company</h4>
            <ul className="space-y-4 text-gray-400">
              <li><a href="#" className="hover:text-white transition-colors">About</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Careers</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
            </ul>
          </div>
        </div>
        
        {/* Newsletter signup */}
        <div className="border-t border-gray-800 pt-12 mb-12">
          <div className="max-w-md mx-auto text-center">
            <h4 className="text-xl font-semibold mb-4">Join the Waitlist</h4>
            <p className="text-gray-400 mb-6">Be the first to know when we launch new Tribes</p>
            <div className="flex gap-4">
              <input 
                type="email" 
                placeholder="your@email.com" 
                className="flex-1 px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-purple-500 text-white"
              />
              <button className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg font-medium hover:from-purple-600 hover:to-pink-600 transition-all">
                Join
              </button>
            </div>
          </div>
        </div>
        
        <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center text-gray-400 text-sm">
          <p>&copy; 2024 Tribe. Built with intention.</p>
          <div className="flex space-x-6 mt-4 md:mt-0">
            <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-white transition-colors">Cookie Policy</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
