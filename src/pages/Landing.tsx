import Hero from '../components/landing/Hero';
import Features from '../components/landing/Features';
import ParallaxSection from '../components/landing/ParallaxSection';
import CTA from '../components/landing/CTA';
import Footer from '../components/landing/Footer';

export default function Landing() {
  return (
    <div className="min-h-screen bg-background">
      <Hero />
      <Features />
      <ParallaxSection />
      <CTA />
      <Footer />
    </div>
  );
} 