/**
 * Contenu éditorial de la page d'accueil FASOLOCK.
 * Tous les textes sont centralisés ici : la mise en page reste dans /components.
 */
import { FileCheck, Headset, ShieldCheck, Zap, type LucideIcon } from 'lucide-react';

/* ---------- Héros ---------- */
export const HERO = {
  tag: 'FasoLock',
  titleLine1: 'Sécurisez aujourd’hui,',
  titleLine2: 'construisez demain.',
  lead: 'Notre plateforme de chiffrement pour protéger vos données, vos échanges et votre souveraineté numérique.',
  cta: 'Découvrir la plateforme',
} as const;

/* ---------- Section 1 : À propos ---------- */
export const ABOUT = {
  eyebrow: 'À propos de FASOLOCK',
  title: 'Le verrou numérique de référence au Burkina Faso.',
  description:
    'Reprenez le contrôle total de vos données sensibles. FASOLOCK déploie une infrastructure cryptographique souveraine pour chiffrer, authentifier et protéger vos échanges critiques contre toute intrusion.',
  cta: 'Découvrir notre technologie',
  badges: ['Chiffrement de bout en bout', 'Souveraineté locale', 'Zéro accès tiers'],
  imageAlt: 'Cadenas posé sur un clavier : la sécurité de vos données',
} as const;

/* ---------- Section 2 : Les 4 piliers de valeur ---------- */
export interface Benefit {
  icon: LucideIcon;
  color: string;
  tone: '' | 'gold';
  title: string;
  text: string;
}

export const BENEFITS_TITLE = 'Une architecture pensée pour la sécurité absolue';

export const BENEFITS: Benefit[] = [
  { icon: ShieldCheck, color: '#0B7A35', tone: '', title: 'Chiffrement inviolable', text: 'Verrouillez vos fichiers et communications grâce aux standards cryptographiques les plus stricts du marché.' },
  { icon: Zap, color: '#E8A317', tone: 'gold', title: 'Rapidité sans latence', text: 'Chiffrez et déchiffrez vos flux instantanément, sans ralentir vos opérations ni vos équipes.' },
  { icon: FileCheck, color: '#0B7A35', tone: '', title: 'Intégrité garantie', text: 'Prouvez l’authenticité de chaque document et assurez-vous qu’aucune donnée n’a été altérée.' },
  { icon: Headset, color: '#E8A317', tone: 'gold', title: 'Accompagnement local', text: 'Une équipe d’experts basée au Burkina Faso disponible pour intégrer et superviser votre sécurité.' },
];

/* ---------- Section 3 : FAQ ---------- */
export const FAQ_HEADER = {
  eyebrow: 'Questions fréquentes',
  title: 'Tout comprendre sur votre sécurité',
} as const;

export const FAQ_ITEMS = [
  {
    q: 'Comment fonctionne votre clé publique pour protéger mes échanges ?',
    a: 'Votre clé publique permet à vos contacts de chiffrer un contenu à votre intention. Elle peut être partagée librement : seule votre clé privée, qui ne quitte jamais votre appareil, permet de le déchiffrer.',
  },
  {
    q: 'Qui a accès à mes clés privées et où sont-elles stockées ?',
    a: 'Vos clés privées sont stockées uniquement sur votre appareil, dans le navigateur, sous forme chiffrée. Elles sont protégées par une clé dérivée de votre phrase secrète et ne sont jamais envoyées à un serveur. Seule la clé publique est enregistrée dans l’annuaire.',
  },
  {
    q: 'En quoi FASOLOCK garantit-il notre souveraineté numérique ?',
    a: 'Avec FASOLOCK, le chiffrement et le déchiffrement s’effectuent sur votre appareil, et vos clés restent sous votre seul contrôle. Vous décidez qui peut vous écrire et qui peut lire vos contenus, sans dépendre d’un tiers pour garder vos clés.',
  },
  {
    q: 'Puis-je intégrer FASOLOCK à mes outils ou logiciels existants ?',
    a: 'FASOLOCK fonctionne aujourd’hui comme une application web autonome : vous chiffrez et déchiffrez vos contenus depuis votre navigateur. Aucune intégration à des outils ou logiciels tiers n’est proposée pour l’instant.',
  },
] as const;

/* ---------- Pied de page ---------- */
export const CONTRIBUTORS = ['Y Idrissa', 'D Mansour'] as const;