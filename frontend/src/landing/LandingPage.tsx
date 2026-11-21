import {
  ArrowRight, Fingerprint, Handshake, Headset, Lock, Mail, Plus, Shield, ShieldCheck, Zap
} from 'lucide-react';
import './landing.css';

interface LandingPageProps {
  onOpenLogin: () => void;
  onOpenRecovery: () => void;
}

/* ---------- Éléments graphiques (SVG) ---------- */

function Logo({ size = 46 }: { size?: number }) {
  return (
    <svg width={size} height={size * 1.1} viewBox="0 0 60 66" aria-hidden="true">
      <defs>
        <linearGradient id="fl-lg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#F8C446" /><stop offset="1" stopColor="#C98A0B" />
        </linearGradient>
      </defs>
      <path d="M30 2 L56 11 V32 C56 48 44 60 30 64 C16 60 4 48 4 32 V11 Z" fill="url(#fl-lg)" />
      <path d="M30 7 L51 14 V32 C51 45 41 55 30 59 C19 55 9 45 9 32 V14 Z" fill="#0B5D2A" />
      <path d="M22 29 V24 a8 8 0 0 1 16 0 V29" fill="none" stroke="#F8C446" strokeWidth="3" strokeLinecap="round" />
      <rect x="19" y="29" width="22" height="16" rx="3" fill="#F8C446" />
      <circle cx="30" cy="36" r="2.6" fill="#0B5D2A" /><rect x="29" y="37" width="2" height="5" rx="1" fill="#0B5D2A" />
    </svg>
  );
}

function BrandName() {
  return <span className="fl-brand-name">FASO<b>LOCK</b></span>;
}

function HeroWave() {
  return (
    <svg className="fl-wave" viewBox="0 0 1440 110" preserveAspectRatio="none" aria-hidden="true">
      <path d="M0 62 C180 4 380 20 560 58 C760 100 980 96 1180 52 C1290 28 1380 30 1440 42 V110 H0 Z" fill="#fff" />
      <path d="M0 52 C150 -4 360 8 540 46" fill="none" stroke="#F2B01E" strokeWidth="4" />
      <path d="M0 82 C60 56 130 40 220 36" fill="none" stroke="#0D8A3F" strokeWidth="14" opacity=".9" />
    </svg>
  );
}

/* ---------- Contenu ---------- */

const ATOUTS = [
  { icon: ShieldCheck, color: '#0B7A35', tone: '', title: 'Chiffrement de haut niveau', text: 'Protégez vos données avec une technologie de pointe.' },
  { icon: Zap, color: '#E8A317', tone: 'gold', title: 'Performance optimale', text: 'Une sécurité sans compromis, même sous forte charge.' },
  { icon: Handshake, color: '#0B7A35', tone: '', title: 'Confiance numérique', text: 'Renforcez la confiance dans vos échanges digitaux.' },
  { icon: Headset, color: '#E8A317', tone: 'gold', title: 'Support dédié', text: 'Une assistance experte, à tout moment.' },
];

const FAQ = [
  { q: 'À quoi sert votre clé publique ?', a: 'Votre clé publique permet à vos contacts de chiffrer un contenu à votre intention. Elle peut être partagée librement : seule votre clé privée, qui ne quitte jamais votre appareil, permet de le déchiffrer.' },
  { q: 'Où sont conservées mes clés privées ?', a: 'Vos clés privées sont stockées uniquement sur votre appareil, dans le navigateur, sous forme chiffrée. Elles sont protégées par une clé dérivée de votre phrase secrète et ne sont jamais envoyées à un serveur. Seule la clé publique est enregistrée dans l’annuaire.' },
  { q: 'Pourquoi parler de souveraineté numérique ?', a: 'Avec FASOLOCK, le chiffrement et le déchiffrement s’effectuent sur votre appareil, et vos clés restent sous votre seul contrôle. Vous décidez qui peut vous écrire et qui peut lire vos contenus, sans dépendre d’un tiers pour garder vos clés.' },
];

function LandingFooter() {
  return (
    <footer className="pro-footer">
      <div className="footer-reference-grid">
        <a className="footer-reference-brand" href="#accueil">
          <span className="footer-reference-mark">
            <Shield className="footer-reference-shield" />
            <Lock className="footer-reference-lock" />
          </span>
          <span className="footer-reference-brand-copy">
            <strong>VERROU</strong>
            <small>Innover · Protéger · Bâtir</small>
          </span>
        </a>

        <nav className="footer-reference-links" aria-label="Liens rapides">
          <h2>Liens rapides</h2>
          <a href="#accueil">Accueil</a>
          <a href="#hackathons">Hackathons</a>
          <a href="#apropos">À propos</a>
          <a href="#faq">FAQ</a>
        </nav>

        <nav className="footer-reference-links" aria-label="Ressources">
          <h2>Ressources</h2>
          <a href="#fonctionnalites">Documentation</a>
          <a href="#guide">Guide utilisateur</a>
          <a href="mailto:yamidrissa@epo.gov.bf">Contact</a>
        </nav>

        <div className="footer-reference-social">
          <h2>Suivez-nous</h2>
          <div className="footer-social-icons" aria-label="Réseaux sociaux">
            <span title="Facebook" aria-label="Facebook">
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M13.5 21v-8h2.7l.4-3.1h-3.1v-2c0-.9.3-1.5 1.6-1.5h1.7V3.6c-.3 0-1.3-.1-2.4-.1-2.4 0-4 1.5-4 4.2v2.3H7.7v3.1h2.7v8h3.1Z" /></svg>
            </span>
            <span title="X" aria-label="X">
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m5 4 14 16M19 4 5 20" /></svg>
            </span>
            <span title="YouTube" aria-label="YouTube">
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M23 7.1a3 3 0 0 0-2.1-2.2C19 4.4 12 4.4 12 4.4s-7 0-8.9.5A3 3 0 0 0 1 7.1a31 31 0 0 0-.5 4.9 31 31 0 0 0 .5 4.9 3 3 0 0 0 2.1 2.2c1.9.5 8.9.5 8.9.5s7 0 8.9-.5a3 3 0 0 0 2.1-2.2 31 31 0 0 0 .5-4.9 31 31 0 0 0-.5-4.9ZM9.7 15.4V8.6l5.9 3.4-5.9 3.4Z" /></svg>
            </span>
            <span title="LinkedIn" aria-label="LinkedIn">
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5.2 3.5a1.8 1.8 0 1 1 0 3.6 1.8 1.8 0 0 1 0-3.6ZM3.7 8.5h3v11h-3v-11Zm4.9 0h2.9V10h.1a3.2 3.2 0 0 1 2.9-1.7c3.1 0 3.7 2 3.7 4.6v6.6h-3v-5.9c0-1.4 0-3.1-1.9-3.1s-2.1 1.5-2.1 3v6h-3v-11Z" /></svg>
            </span>
          </div>
        </div>

        <div className="footer-reference-mission">
          <svg className="footer-burkina-flag" viewBox="0 0 3 2" role="img" aria-label="Drapeau du Burkina Faso">
            <rect width="3" height="1" fill="#EF2B2D" />
            <rect y="1" width="3" height="1" fill="#009E49" />
            <polygon points="1.5,0.55 1.63,0.91 2.01,0.92 1.71,1.14 1.82,1.5 1.5,1.28 1.18,1.5 1.29,1.14 0.99,0.92 1.37,0.91" fill="#FCD116" />
          </svg>
          <p>Ensemble pour une<br /><strong>souveraineté numérique forte</strong></p>
        </div>
      </div>

      <div className="footer-reference-bottom">
        <p>© 2026 VERROU. Tous droits réservés. <span>Burkina Faso</span></p>
        <p className="footer-reference-organization">AWZOULAB <span>: INCUBATEUR ET LEARNING CENTER</span></p>
        <p className="footer-reference-credit">
          Concepteur <strong>YAMEOGO Idrissa</strong>
          <a href="mailto:yamidrissa@epo.gov.bf"><Mail aria-hidden="true" /> yamidrissa@epo.gov.bf</a>
        </p>
      </div>
    </footer>
  );
}

export default function LandingPage({ onOpenLogin, onOpenRecovery }: LandingPageProps) {
  return (
    <>
    <div className="fl-landing" id="accueil">
      {/* En-tête */}
      <div className="fl-header-wrap">
        <header className="fl-header">
          <a className="fl-brand" href="#accueil" aria-label="FASOLOCK — accueil">
            <Logo /><BrandName />
          </a>
          <nav className="fl-nav" aria-label="Navigation principale">
            {/* <a className="fl-active" href="#accueil">Accueil</a>
            <a href="#atouts">Découvrir <ChevronDown size={14} aria-hidden="true" /></a>
            <a href="#apropos">Services <ChevronDown size={14} aria-hidden="true" /></a>
            <a href="#faq">Ressources <ChevronDown size={14} aria-hidden="true" /></a>
            <a href="#contact">Contact</a> */}
            <button type="button" className="fl-lost" onClick={onOpenRecovery}>Clé perdue ?</button>
          </nav>
          <button type="button" className="fl-cta" onClick={onOpenLogin}>
            <Lock size={18} aria-hidden="true" /> Accéder à mon espace
          </button>
        </header>
      </div>

      <main>
        {/* Héros */}
        <section className="fl-hero">
          <div className="fl-hero-photo" aria-hidden="true" />
          <div className="fl-hero-tint" aria-hidden="true" />
          <div className="fl-float f1" aria-hidden="true"><ShieldCheck size={40} /></div>
          <div className="fl-float f2" aria-hidden="true"><Fingerprint size={40} /></div>
          <div className="fl-float f3" aria-hidden="true"><Lock size={38} /></div>
          <div className="fl-hero-inner">
            <div className="fl-hero-copy">
              <p className="fl-hero-tag">FasoLock</p>
              <h1>Sécurisez aujourd’hui,<span>construisez demain.</span></h1>
              <p className="fl-hero-lead">
                Notre plateforme de chiffrement pour protéger vos données, vos échanges et votre souveraineté numérique.
              </p>
              <div className="fl-hero-actions">
                <a className="fl-btn fl-btn-gold" href="#atouts">
                  <ShieldCheck size={18} aria-hidden="true" /> Découvrir la plateforme <ArrowRight size={18} aria-hidden="true" />
                </a>
                {/* a className="fl-btn fl-btn-ghost" href="#apropos">
                  <Play size={18} aria-hidden="true" /> Voir la démo
                </a>< */}
              </div>
            </div>
          </div>
          <HeroWave />
        </section>

        {/* Atouts */}
        <section id="atouts" className="fl-atouts">
          {/* <div className="fl-eyebrow"></div> */}
          <h2 className="fl-h2">Une solution complète pour votre sécurité numérique</h2>
          <div className="fl-cards">
            {ATOUTS.map(({ icon: Icon, color, tone, title, text }) => (
              <article key={title} className={`fl-card ${tone}`}>
                <Icon size={46} color={color} strokeWidth={1.8} aria-hidden="true" />
                <h3>{title}</h3>
                <p>{text}</p>
              </article>
            ))}
          </div>
        </section>

        {/* À propos */}
        <section id="apropos" className="fl-about">
          <div className="fl-about-in">
            <div className="fl-eyebrow">À propos de FasoLock</div>
            <div className="fl-about-grid">
              <div className="fl-about-copy">
                <h2>Le verrou numérique<br />du <span>Burkina Faso</span></h2>
                <p>
                  FASOLOCK est une plateforme innovante de cryptographie, conçue pour garantir la confidentialité,
                  l’intégrité et la disponibilité de vos informations dans un monde de plus en plus connecté.
                </p>
                <div>
                  <a className="fl-btn fl-btn-dark" href="#faq">En savoir plus <ArrowRight size={18} aria-hidden="true" /></a>
                </div>
              </div>
              <div className="fl-about-art">
                <img
                  src={`${import.meta.env.BASE_URL}images/accueil.png`}
                  alt="Cadenas posé sur un clavier : la sécurité de vos données"
                  loading="lazy"
                />
              </div>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" className="fl-faq">
          <div className="fl-eyebrow">Foire aux questions</div>
          <h2 className="fl-h2">À propos de FASOLOCK</h2>
          <div className="fl-faq-list">
            {FAQ.map((f) => (
              <details key={f.q}>
                <summary>{f.q}<Plus className="fl-plus" size={20} aria-hidden="true" /></summary>
                <p>{f.a}</p>
              </details>
            ))}
          </div>
        </section>
      </main>

    </div>

      <LandingFooter />
    </>
  );
}