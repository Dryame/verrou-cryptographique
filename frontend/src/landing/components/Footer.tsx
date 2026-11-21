import { Lock, Mail, Shield } from 'lucide-react';
import { CONTRIBUTORS } from '../content';

/**
 * Pied de page : balisage identique à celui de la page de connexion (classes globales de index.css).
 * Rendu hors du conteneur .fl-landing pour ne pas hériter de ses surcharges typographiques.
 */
export function Footer() {
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
          Contributeurs{' '}
          {CONTRIBUTORS.map((name, i) => (
            <span key={name}>{i > 0 && ' & '}<strong>{name}</strong></span>
          ))}
          <a href="mailto:yamidrissa@epo.gov.bf"><Mail aria-hidden="true" /> yamidrissa@epo.gov.bf</a>
        </p>
      </div>
    </footer>
  );
}