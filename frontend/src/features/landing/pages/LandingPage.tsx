import { Architecture } from '../components/Architecture';
import { CTA } from '../components/CTA';
import { FAQ } from '../components/FAQ';
import { Footer } from '../components/Footer';
import { Hero } from '../components/Hero';
import { HowItWorks } from '../components/HowItWorks';
import { Navbar } from '../components/Navbar';
import { PlatformBackground } from '../components/PlatformBackground';
import { PlatformOverview } from '../components/PlatformOverview';

export function LandingPage() {
  return (
    <PlatformBackground>
      <Navbar />
      <main>
        <Hero />
        <PlatformOverview />
        <HowItWorks />
        <Architecture />
        <FAQ />
        <CTA />
      </main>
      <Footer />
    </PlatformBackground>
  );
}
