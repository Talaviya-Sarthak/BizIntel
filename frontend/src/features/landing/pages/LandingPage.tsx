import { Architecture } from '../components/Architecture';
import { CTA } from '../components/CTA';
import { FAQ } from '../components/FAQ';
import { Footer } from '../components/Footer';
import { Hero } from '../components/Hero';
import { HowItWorks } from '../components/HowItWorks';
import { Navbar } from '../components/Navbar';
import { PlatformBackground } from '../components/PlatformBackground';
import { PlatformOverview } from '../components/PlatformOverview';
import LogoCloud from '../../../components/ui/logo-cloud-14';

export function LandingPage() {
  return (
    <PlatformBackground>
      <Navbar />
      <main>
        <Hero />
        <PlatformOverview />
        <HowItWorks />
        <Architecture />
        <LogoCloud />
        <FAQ />
        <CTA />
      </main>
      <Footer />
    </PlatformBackground>
  );
}

