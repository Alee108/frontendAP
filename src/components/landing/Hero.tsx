import { Button } from "@/components/ui/button";
import { ArrowDown, Users, Heart } from "lucide-react";
import { Link } from "react-router-dom";

const Hero = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Dynamic background with moving elements */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900"></div>
        
        {/* Animated connection lines */}
        <div className="absolute inset-0 opacity-20">
          <svg className="w-full h-full" viewBox="0 0 1000 1000">
            <defs>
              <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.6"/>
                <stop offset="100%" stopColor="#ec4899" stopOpacity="0.6"/>
              </linearGradient>
            </defs>
            <path d="M 100 200 Q 300 100 500 300 T 900 400" stroke="url(#lineGradient)" strokeWidth="2" fill="none" className="animate-pulse"/>
            <path d="M 200 600 Q 400 500 600 700 T 800 600" stroke="url(#lineGradient)" strokeWidth="2" fill="none" className="animate-pulse delay-1000"/>
            <circle cx="500" cy="300" r="4" fill="#8b5cf6" className="animate-pulse"/>
            <circle cx="600" cy="700" r="4" fill="#ec4899" className="animate-pulse delay-500"/>
          </svg>
        </div>
      </div>

      {/* Navigation bar */}
      <div className="absolute top-6 right-6 z-20 flex items-center space-x-4">
        <Link to="/login">
          <Button variant="outline" className="border-white/20 text-white hover:bg-white/10 backdrop-blur-sm">
            Login
          </Button>
        </Link>
        <Link to="/signup">
          <Button className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white">
            Sign Up
          </Button>
        </Link>
      </div>

      {/* Floating community bubbles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/6 w-20 h-20 bg-purple-400/20 rounded-full flex items-center justify-center animate-pulse">
          <Users className="w-8 h-8 text-purple-200" />
        </div>
        <div className="absolute top-1/3 right-1/4 w-16 h-16 bg-pink-400/20 rounded-full flex items-center justify-center animate-pulse delay-700">
          <Heart className="w-6 h-6 text-pink-200" />
        </div>
        <div className="absolute bottom-1/3 left-1/3 w-24 h-24 bg-indigo-400/20 rounded-full flex items-center justify-center animate-pulse delay-1000">
          <Users className="w-10 h-10 text-indigo-200" />
        </div>
      </div>

      <div className="relative z-10 text-center text-white px-4 max-w-5xl mx-auto">
        <div className="mb-8">
          <span className="inline-block px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full text-sm font-medium border border-white/20 mb-6">
            🌟 Intentional Social Networking
          </span>
        </div>
        
        <h1 className="text-6xl md:text-8xl font-bold mb-8 leading-tight">
          One
          <span className="block bg-gradient-to-r from-yellow-300 via-pink-300 to-purple-300 bg-clip-text text-transparent">
            Tribe
          </span>
          <span className="block text-4xl md:text-5xl font-light text-purple-100 mt-4">
            Infinite Possibilities
          </span>
        </h1>
        
        <p className="text-xl md:text-2xl mb-12 text-purple-100 max-w-3xl mx-auto leading-relaxed">
          Stop spreading yourself thin across dozens of communities. 
          <strong className="text-white"> Join one Tribe that truly matters.</strong> 
          Share with purpose. Connect beyond boundaries.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-6 justify-center mb-16">
          <Link to="/signup">
            <Button size="lg" className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white text-lg px-10 py-6 shadow-xl">
              Find Your Tribe
            </Button>
          </Link>
          <Button size="lg" variant="outline" className="border-2 border-white text-white hover:bg-white hover:text-purple-900 text-lg px-10 py-6 backdrop-blur-sm">
            How It Works
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto mb-12">
          <div className="text-center">
            <div className="text-3xl font-bold text-yellow-300">1</div>
            <div className="text-sm text-purple-200">Tribe at a time</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-pink-300">∞</div>
            <div className="text-sm text-purple-200">Cross-tribe connections</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-purple-300">100%</div>
            <div className="text-sm text-purple-200">Human-powered discovery</div>
          </div>
        </div>

        <div className="animate-bounce">
          <ArrowDown className="mx-auto w-8 h-8 text-purple-200" />
        </div>
      </div>
    </section>
  );
};

export default Hero;