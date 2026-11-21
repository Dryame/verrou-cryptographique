import { ArrowRight, Fingerprint, Lock, ShieldCheck } from 'lucide-react';
import { HERO } from '../content';

function HeroWave() {
  return (
    <svg className="fl-wave" viewBox="0 0 1440 110" preserveAspectRatio="none" aria-hidden="true">
      <path d="M0 62 C180 4 380 20 560 58 C760 100 980 96 1180 52 C1290 28 1380 30 1440 42 V110 H0 Z" fill="#fff" />
      <path d="M0 52 C150 -4 360 8 540 46" fill="none" stroke="#F2B01E" strokeWidth="4" />
      <path d="M0 82 C60 56 130 40 220 36" fill="none" stroke="#0D8A3F" strokeWidth="14" opacity=".9" />
    </svg>
  );
}

export function Hero() {
  return (
    <section className="fl-hero">
      <div className="fl-hero-photo" aria-hidden="true" />
      <div className="fl-hero-tint" aria-hidden="true" />
      <div className="fl-float f1" aria-hidden="true"><ShieldCheck size={40} /></div>
      <div className="fl-float f2" aria-hidden="true"><Fingerprint size={40} /></div>
      <div className="fl-float f3" aria-hidden="true"><Lock size={38} /></div>

      <div className="fl-hero-inner">
        <div className="fl-hero-copy">
          <p className="fl-hero-tag">{HERO.tag}</p>
          <h1>{HERO.titleLine1}<span>{HERO.titleLine2}</span></h1>
          <p className="fl-hero-lead">{HERO.lead}</p>
          <div className="fl-hero-actions">
            <a className="fl-btn fl-btn-gold" href="#apropos">
              <ShieldCheck size={18} aria-hidden="true" /> {HERO.cta} <ArrowRight size={18} aria-hidden="true" />
            </a>
          </div>
        </div>
      </div>
      <HeroWave />
    </section>
  );
}