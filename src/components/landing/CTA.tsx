
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles, Users, Heart } from "lucide-react";

const CTA = () => {
  return (
    <section className="relative py-32 px-4 overflow-hidden">
      {/* Dynamic gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-600 via-indigo-700 to-pink-600">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.1),transparent)] opacity-50"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(255,255,255,0.1),transparent)] opacity-50"></div>
      </div>
      
      {/* Floating elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/6 animate-float">
          <div className="w-20 h-20 bg-white/10 rounded-full flex items-center justify-center backdrop-blur-sm">
            <Sparkles className="w-8 h-8 text-yellow-300" />
          </div>
        </div>
        
        <div className="absolute top-1/3 right-1/6 animate-float" style={{ animationDelay: '1s' }}>
          <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center backdrop-blur-sm">
            <Heart className="w-6 h-6 text-pink-300" />
          </div>
        </div>
        
        <div className="absolute bottom-1/3 left-1/4 animate-float" style={{ animationDelay: '2s' }}>
          <div className="w-24 h-24 bg-white/10 rounded-full flex items-center justify-center backdrop-blur-sm">
            <Users className="w-10 h-10 text-purple-300" />
          </div>
        </div>
      </div>

      <div className="relative z-10 max-w-5xl mx-auto text-center text-white">
        <div className="mb-8">
          <span className="inline-block px-6 py-3 bg-white/20 backdrop-blur-sm rounded-full text-lg font-medium border border-white/30">
            🚀 Ready to Join the Revolution?
          </span>
        </div>
        
        <h2 className="text-5xl md:text-7xl font-bold mb-8 leading-tight">
          Your Tribe is
          <span className="block bg-gradient-to-r from-yellow-300 via-pink-300 to-cyan-300 bg-clip-text text-transparent">
            Waiting
          </span>
        </h2>
        
        <p className="text-xl md:text-2xl mb-12 opacity-90 max-w-3xl mx-auto leading-relaxed">
          Stop spreading yourself thin. Stop chasing followers. 
          <br className="hidden md:block" />
          <strong>Start building something meaningful.</strong>
        </p>
        
        <div className="flex flex-col sm:flex-row gap-6 justify-center mb-16">
          <Button size="lg" className="group bg-white text-purple-700 hover:bg-purple-50 text-xl px-12 py-8 shadow-2xl hover:shadow-white/20 transition-all duration-300">
            Find Your Tribe Now
            <ArrowRight className="ml-2 w-6 h-6 group-hover:translate-x-1 transition-transform" />
          </Button>
          
          <Button size="lg" variant="outline" className="border-2 border-white text-white hover:bg-white/10 text-xl px-12 py-8 backdrop-blur-sm transition-all duration-300">
            Watch Demo
          </Button>
        </div>

        {/* Social proof */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          <div className="text-center">
            <div className="text-4xl font-bold text-yellow-300 mb-2">1,247</div>
            <div className="text-purple-200">Active Tribes</div>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold text-pink-300 mb-2">12k+</div>
            <div className="text-purple-200">Intentional Members</div>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold text-cyan-300 mb-2">0</div>
            <div className="text-purple-200">Ads or Algorithms</div>
          </div>
        </div>
        
        <p className="text-sm mt-12 opacity-75 max-w-2xl mx-auto">
          Join for free • No credit card required • Leave anytime
          <br />
          <span className="text-yellow-300">✨ Early access — invite only for now</span>
        </p>
      </div>
    </section>
  );
};

export default CTA;
