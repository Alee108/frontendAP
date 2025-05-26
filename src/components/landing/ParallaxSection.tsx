
import { useEffect, useState } from "react";
import { Users, MessageCircle, Heart, Zap } from "lucide-react";

const ParallaxSection = () => {
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <section className="relative py-32 overflow-hidden bg-black">
      {/* Parallax background layers */}
      <div 
        className="absolute inset-0 bg-gradient-to-r from-purple-900/50 to-indigo-900/50"
        style={{
          transform: `translateY(${scrollY * 0.3}px)`
        }}
      />
      
      {/* Moving geometric shapes */}
      <div 
        className="absolute top-1/4 left-1/6 w-32 h-32 border-2 border-purple-400/30 rotate-45"
        style={{
          transform: `translateY(${scrollY * 0.2}px) rotate(${45 + scrollY * 0.1}deg)`
        }}
      />
      <div 
        className="absolute bottom-1/4 right-1/6 w-24 h-24 border-2 border-pink-400/30 rounded-full"
        style={{
          transform: `translateY(${scrollY * 0.4}px)`
        }}
      />
      
      {/* Connection network visualization */}
      <div 
        className="absolute inset-0 opacity-30"
        style={{
          transform: `translateY(${scrollY * 0.1}px)`
        }}
      >
        <svg className="w-full h-full" viewBox="0 0 1200 800">
          <defs>
            <radialGradient id="nodeGradient" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.8"/>
              <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.2"/>
            </radialGradient>
          </defs>
          
          {/* Network nodes representing users */}
          <circle cx="300" cy="200" r="8" fill="url(#nodeGradient)" className="animate-pulse"/>
          <circle cx="500" cy="150" r="6" fill="url(#nodeGradient)" className="animate-pulse delay-300"/>
          <circle cx="700" cy="250" r="10" fill="url(#nodeGradient)" className="animate-pulse delay-600"/>
          <circle cx="400" cy="350" r="7" fill="url(#nodeGradient)" className="animate-pulse delay-900"/>
          <circle cx="800" cy="400" r="9" fill="url(#nodeGradient)" className="animate-pulse delay-1200"/>
          
          {/* Connection lines */}
          <line x1="300" y1="200" x2="500" y2="150" stroke="#8b5cf6" strokeWidth="1" opacity="0.4"/>
          <line x1="500" y1="150" x2="700" y2="250" stroke="#8b5cf6" strokeWidth="1" opacity="0.4"/>
          <line x1="400" y1="350" x2="700" y2="250" stroke="#8b5cf6" strokeWidth="1" opacity="0.4"/>
          <line x1="700" y1="250" x2="800" y2="400" stroke="#8b5cf6" strokeWidth="1" opacity="0.4"/>
        </svg>
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-5xl md:text-7xl font-bold text-white mb-8">
            The Problem with
            <span className="block text-red-400">Everything, Everywhere</span>
          </h2>
          
          <p className="text-xl md:text-2xl text-gray-300 max-w-4xl mx-auto leading-relaxed">
            You're in 47 Discord servers, 12 Slack workspaces, following 2,847 people on Twitter. 
            <br className="hidden md:block" />
            <strong className="text-white">When did connecting become so... disconnected?</strong>
          </p>
        </div>

        {/* Problem showcase */}
        <div className="grid md:grid-cols-2 gap-12 items-center mb-20">
          <div className="space-y-6">
            <div className="flex items-center space-x-4 p-4 bg-red-900/20 rounded-lg border border-red-500/30">
              <MessageCircle className="w-8 h-8 text-red-400" />
              <div>
                <h3 className="text-white font-semibold">Scattered Attention</h3>
                <p className="text-gray-400 text-sm">Your energy spread across countless platforms</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4 p-4 bg-red-900/20 rounded-lg border border-red-500/30">
              <Users className="w-8 h-8 text-red-400" />
              <div>
                <h3 className="text-white font-semibold">Shallow Connections</h3>
                <p className="text-gray-400 text-sm">Knowing everyone means knowing no one</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4 p-4 bg-red-900/20 rounded-lg border border-red-500/30">
              <Zap className="w-8 h-8 text-red-400" />
              <div>
                <h3 className="text-white font-semibold">Context Lost</h3>
                <p className="text-gray-400 text-sm">Your thoughts scattered without meaning</p>
              </div>
            </div>
          </div>
          
          <div className="text-center">
            <div className="relative">
              <div className="w-64 h-64 mx-auto border-4 border-dashed border-gray-600 rounded-full flex items-center justify-center">
                <div className="text-6xl text-gray-600">?</div>
              </div>
              <div className="absolute -top-4 -right-4 w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center">
                <span className="text-2xl">📱</span>
              </div>
              <div className="absolute -bottom-4 -left-4 w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center">
                <span className="text-2xl">💻</span>
              </div>
              <div className="absolute top-1/2 -left-8 w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center">
                <span className="text-2xl">🎮</span>
              </div>
            </div>
            <p className="text-gray-400 mt-6 italic">You, lost in the noise</p>
          </div>
        </div>

        {/* Solution preview */}
        <div className="text-center">
          <h3 className="text-4xl md:text-5xl font-bold text-white mb-6">
            What if there was a
            <span className="block bg-gradient-to-r from-green-400 to-blue-400 bg-clip-text text-transparent">
              Better Way?
            </span>
          </h3>
          
          <div className="flex justify-center">
            <div className="w-32 h-32 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center shadow-2xl">
              <Heart className="w-16 h-16 text-white" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ParallaxSection;
