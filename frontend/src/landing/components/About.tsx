import { ArrowRight, Check } from 'lucide-react';
import { ABOUT } from '../content';

/** Section 1 — Vision & souveraineté. */
export function About() {
  return (
    <section id="apropos" className="fl-about">
      <div className="fl-about-in">
        <div className="fl-eyebrow">{ABOUT.eyebrow}</div>
        <div className="fl-about-grid">
          <div className="fl-about-copy">
            <h2>{ABOUT.title}</h2>
            <p>{ABOUT.description}</p>
            <a className="fl-btn fl-btn-dark" href="#atouts">
              {ABOUT.cta} <ArrowRight size={18} aria-hidden="true" />
            </a>
            <ul className="fl-badges" aria-label="Garanties">
              {ABOUT.badges.map((badge) => (
                <li key={badge}><Check size={16} strokeWidth={2.6} aria-hidden="true" />{badge}</li>
              ))}
            </ul>
          </div>
          <div className="fl-about-art">
            <img
              src={`${import.meta.env.BASE_URL}images/accueil.png`}
              alt={ABOUT.imageAlt}
              loading="lazy"
            />
          </div>
        </div>
      </div>
    </section>
  );
}