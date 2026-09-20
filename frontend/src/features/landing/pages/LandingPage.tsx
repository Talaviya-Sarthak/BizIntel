import { Architecture } from '../components/Architecture';
import { CTA } from '../components/CTA';
import { FAQ } from '../components/FAQ';
import { Footer } from '../components/Footer';
import { Hero } from '../components/Hero';
import { HowItWorks } from '../components/HowItWorks';
import { Navbar } from '../components/Navbar';
import { PlatformBackground } from '../components/PlatformBackground';
import { PlatformOverview } from '../components/PlatformOverview';
import { CinematicLoader } from '../../../components/motion/CinematicLoader';
import { FloatingCopilotBadge } from '../../../components/ui/FloatingCopilotBadge';
import LogoCloud from '../../../components/ui/logo-cloud-14';

export function LandingPage() {
  return (
    <>
      <CinematicLoader brandName="B I Z I N T E L" />
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
        <FloatingCopilotBadge />
      </PlatformBackground>
    </>
  );
}

export default LandingPage;
