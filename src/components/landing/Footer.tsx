import { Heart, Github, Twitter, Mail } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-gray-900 text-white py-20 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="grid md:grid-cols-3 gap-12 mb-12">
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

              <a href="https://github.com/Alee108/frontendAP" className="text-gray-400 hover:text-purple-400 transition-colors">
                <Github className="w-6 h-6" />
              </a>

            </div>
          </div>

          <div className="flex flex-col items-end justify-between">
            <img 
              src="/tribe white.png" 
              alt="Tribe Logo" 
              className="w-40 h-40 object-contain filter brightness-0 invert opacity-90 hover:opacity-100 transition-opacity cursor-pointer "
            />
          </div>
        </div>
        
        <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center text-gray-400 text-sm">
          <p> Tribe. <br /> It is not in the stars to hold our destiny but in ourselves.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
