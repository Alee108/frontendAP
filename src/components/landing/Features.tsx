
import { Card, CardContent } from "@/components/ui/card";
import { Target, Network, Archive, Shield, Sparkles, Users } from "lucide-react";

const Features = () => {
  const features = [
    {
      title: "One Tribe, Full Focus",
      description: "Choose your community intentionally. Pour your energy into connections that matter. Leave the FOMO behind.",
      icon: Target,
      gradient: "from-purple-500 to-indigo-500"
    },
    {
      title: "Cross-Tribe Discovery",
      description: "Follow fascinating people everywhere. See their thoughts across all Tribes. Boundaries inspire, they don't isolate.",
      icon: Network,
      gradient: "from-blue-500 to-cyan-500"
    },
    {
      title: "Content That Lives Forever",
      description: "Change Tribes? Your history stays intact. Archived, searchable, yours. Growth shouldn't mean losing your past.",
      icon: Archive,
      gradient: "from-green-500 to-emerald-500"
    },
    {
      title: "Human-Curated Communities",
      description: "No algorithms deciding who belongs. Tribe founders personally approve each member. Quality over quantity, always.",
      icon: Shield,
      gradient: "from-orange-500 to-red-500"
    },
    {
      title: "Contextual Sharing",
      description: "Every post has a home, a purpose, a community. Your thoughts find their perfect audience naturally.",
      icon: Sparkles,
      gradient: "from-pink-500 to-rose-500"
    },
    {
      title: "Genuine Discovery",
      description: "Find content through real human connections. Recommendations from people you trust, not engagement metrics.",
      icon: Users,
      gradient: "from-violet-500 to-purple-500"
    }
  ];

  return (
    <section className="py-24 px-4 bg-gradient-to-br from-gray-50 to-white">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-20">
          <span className="inline-block px-6 py-2 bg-purple-100 text-purple-700 rounded-full text-sm font-medium mb-6">
            ✨ How Tribe Works
          </span>
          
          <h2 className="text-5xl md:text-6xl font-bold text-gray-900 mb-8">
            Social Networking,
            <span className="block bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Reimagined
            </span>
          </h2>
          
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            We've taken everything broken about social media and fixed it. 
            One membership. Infinite connections. Zero algorithms.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 md:grid-cols-2 gap-8 mb-16">
          {features.map((feature, index) => {
            const IconComponent = feature.icon;
            return (
              <Card key={index} className="group border-0 shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 bg-white overflow-hidden">
                <CardContent className="p-8">
                  <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                    <IconComponent className="w-8 h-8 text-white" />
                  </div>
                  
                  <h3 className="text-2xl font-bold text-gray-900 mb-4 group-hover:text-purple-700 transition-colors">
                    {feature.title}
                  </h3>
                  
                  <p className="text-gray-600 leading-relaxed text-lg">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Visual comparison */}
        <div className="bg-gradient-to-r from-purple-900 to-indigo-900 rounded-3xl p-12 text-white">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h3 className="text-3xl font-bold mb-6 text-red-300">❌ Traditional Social Media</h3>
              <ul className="space-y-4 text-lg">
                <li className="flex items-center"><span className="text-red-400 mr-3">•</span> Endless scrolling, no purpose</li>
                <li className="flex items-center"><span className="text-red-400 mr-3">•</span> Algorithm-driven content</li>
                <li className="flex items-center"><span className="text-red-400 mr-3">•</span> Superficial connections</li>
                <li className="flex items-center"><span className="text-red-400 mr-3">•</span> Content lost in noise</li>
                <li className="flex items-center"><span className="text-red-400 mr-3">•</span> Attention scattered everywhere</li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-3xl font-bold mb-6 text-green-300">✅ Tribe</h3>
              <ul className="space-y-4 text-lg">
                <li className="flex items-center"><span className="text-green-400 mr-3">•</span> Intentional community focus</li>
                <li className="flex items-center"><span className="text-green-400 mr-3">•</span> Human-powered discovery</li>
                <li className="flex items-center"><span className="text-green-400 mr-3">•</span> Deep, meaningful connections</li>
                <li className="flex items-center"><span className="text-green-400 mr-3">•</span> Contextual, purposeful sharing</li>
                <li className="flex items-center"><span className="text-green-400 mr-3">•</span> Energy focused where it matters</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Features;
