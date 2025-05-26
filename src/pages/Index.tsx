
import Hero from "@/components/landing/Hero";
import Features from "@/components/landing/Features";
import ParallaxSection from "@/components/landing/ParallaxSection";
import CTA from "@/components/landing/CTA";
import Footer from "@/components/landing/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
      <Hero />
      <ParallaxSection />
      <Features />
      <CTA />
      <Footer />
    </div>
  );
};

export default Index;
