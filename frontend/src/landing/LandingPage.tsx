import { About } from './components/About';
import { Benefits } from './components/Benefits';
import { Faq } from './components/Faq';
import { Footer } from './components/Footer';
import { Header } from './components/Header';
import { Hero } from './components/Hero';
import './landing.css';

interface LandingPageProps {
  onOpenLogin: () => void;
  onOpenRecovery: () => void;
}

/**
 * Page d'accueil FASOLOCK.
 * Ordre : Héros → À propos → Bénéfices → FAQ → Pied de page.
 * Textes : ./content.ts · Styles : ./landing.css · Sections : ./components
 */
export default function LandingPage({ onOpenLogin, onOpenRecovery }: LandingPageProps) {
  return (
    <>
      <div className="fl-landing" id="accueil">
        <Header onOpenLogin={onOpenLogin} onOpenRecovery={onOpenRecovery} />
        <main>
          <Hero />
          <About />
          <Benefits />
          <Faq />
        </main>
      </div>
      <Footer />
    </>
  );
}
