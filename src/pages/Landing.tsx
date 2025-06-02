import Hero from '../components/landing/Hero';
import Features from '../components/landing/Features';
import ParallaxSection from '../components/landing/ParallaxSection';
import CTA from '../components/landing/CTA';
import Footer from '../components/landing/Footer';
import HowItWorks from '../components/landing/HowItWorks';

export default function Landing() {
  return (
    <div className="min-h-screen bg-background">
      <Hero />
      <Features />
      <ParallaxSection />
      <CTA />
      <div id="how-it-works">
        <HowItWorks />
      </div>
      <Footer />
    </div>
  );
} 