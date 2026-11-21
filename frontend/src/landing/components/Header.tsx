import { Lock } from 'lucide-react';
import { BrandName, Logo } from './Brand';

interface HeaderProps {
  onOpenLogin: () => void;
  onOpenRecovery: () => void;
}

/** Barre de navigation fixe : marque à gauche, actions à droite (« Clé perdue ? » à l'extrémité). */
export function Header({ onOpenLogin, onOpenRecovery }: HeaderProps) {
  return (
    <div className="fl-header-wrap">
      <header className="fl-header">
        <a className="fl-brand" href="#accueil" aria-label="FASOLOCK — accueil">
          <Logo /><BrandName />
        </a>
        <div className="fl-header-actions">
          <button type="button" className="fl-cta" onClick={onOpenLogin}>
            <Lock size={18} aria-hidden="true" /> Accéder à mon espace
          </button>
          <button type="button" className="fl-lost" onClick={onOpenRecovery}>Clé perdue ?</button>
        </div>
      </header>
    </div>
  );
}
