import { ArrowRight, Users, Heart, MessageCircle, Sparkles } from "lucide-react";

const HowItWorks = () => {
  const steps = [
    {
      icon: <Users className="w-10 h-10" />,
      title: "Join Your Tribe",
      description: "Find and join a tribe that aligns with your interests and values. Each tribe is a focused community where meaningful connections happen.",
      color: "from-violet-500 to-fuchsia-500"
    },
    {
      icon: <MessageCircle className="w-10 h-10" />,
      title: "Engage & Connect",
      description: "Share your thoughts, experiences, and ideas with your tribe members. Build genuine connections through meaningful interactions.",
      color: "from-fuchsia-500 to-rose-500"
    },
    {
      icon: <Heart className="w-10 h-10" />,
      title: "Grow Together",
      description: "Collaborate, learn, and grow with your tribe. Support each other's journey and celebrate achievements together.",
      color: "from-rose-500 to-orange-500"
    },
    {
      icon: <Sparkles className="w-10 h-10" />,
      title: "Discover More",
      description: "Connect with other tribes and expand your network while maintaining the focus and quality of your primary tribe.",
      color: "from-orange-500 to-violet-500"
    }
  ];

  return (
    <section className="relative py-10 overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-purple-50/5 to-background">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-purple-500/10 via-transparent to-transparent opacity-50" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-pink-500/10 via-transparent to-transparent opacity-50" />
      </div>

      <div className="container relative mx-auto px-4">
        <div className="text-center mb-20">
          <h2 className="text-5xl md:text-6xl font-bold mb-6">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-violet-500 via-fuchsia-500 to-rose-500">
              How It Works
            </span>
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Your journey to meaningful connections starts here
          </p>
        </div>

        <div className="relative">
          {/* Connection Line */}
          <div className="absolute left-1/2 top-0 bottom-0 w-1 bg-gradient-to-b from-violet-500 via-fuchsia-500 to-rose-500 hidden lg:block" />

          <div className="space-y-12 lg:space-y-0">
            {steps.map((step, index) => (
              <div
                key={index}
                className={`relative flex flex-col lg:flex-row items-center gap-8 ${
                  index % 2 === 0 ? 'lg:flex-row-reverse' : ''
                }`}
              >
                {/* Step Number */}
                <div className="absolute left-1/2 -translate-x-1/2 w-12 h-12 rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500 flex items-center justify-center text-white font-bold text-xl z-10 hidden lg:flex">
                  {index + 1}
                </div>

                {/* Content Card */}
                <div className="w-full lg:w-1/2">
                  <div className="relative group">
                    <div className="absolute -inset-1 bg-gradient-to-r from-violet-500 to-fuchsia-500 rounded-2xl blur opacity-25 group-hover:opacity-40 transition duration-1000 group-hover:duration-200" />
                    <div className="relative p-8 bg-white/90 backdrop-blur-sm rounded-2xl border border-purple-100 shadow-xl hover:shadow-2xl transition-all duration-300">
                      <div className={`w-16 h-16 rounded-2xl bg-gradient-to-r ${step.color} flex items-center justify-center mb-6 text-white transform group-hover:scale-110 transition-transform duration-300`}>
                        {step.icon}
                      </div>
                      <h3 className="text-2xl font-bold mb-4 bg-gradient-to-r from-violet-600 to-fuchsia-600 bg-clip-text text-transparent">
                        {step.title}
                      </h3>
                      <p className="text-gray-600 text-lg leading-relaxed">
                        {step.description}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Spacer for alternating layout */}
                <div className="w-full lg:w-1/2" />
              </div>
            ))}
          </div>
        </div>

        <div className="mt-20 text-center">
          <div className="inline-block p-1 rounded-full bg-gradient-to-r from-violet-500 via-fuchsia-500 to-rose-500">
            <a
              href="/signup"
              className="inline-flex items-center px-8 py-4 bg-white rounded-full font-semibold text-gray-900 hover:bg-gray-50 transition-all duration-300"
            >
              Start Your Journey
              <ArrowRight className="ml-2 w-5 h-5" />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks; 