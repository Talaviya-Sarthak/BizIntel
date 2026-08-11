import { Architecture } from '../components/Architecture';
import { CTA } from '../components/CTA';
import { Features } from '../components/Features';
import { Footer } from '../components/Footer';
import { Hero } from '../components/Hero';
import { HowItWorks } from '../components/HowItWorks';
import { Navbar } from '../components/Navbar';
import { PlatformOverview } from '../components/PlatformOverview';
import { Security } from '../components/Security';

export function LandingPage() {
  return (
    <div className="min-h-screen bg-surface-deep text-slate-200">
      <Navbar />
      <main>
        <Hero />
        <PlatformOverview />
        <Features />
        <HowItWorks />
        <Architecture />
        <Security />
        <CTA />
      </main>
      <Footer />
    </div>
  );
}
