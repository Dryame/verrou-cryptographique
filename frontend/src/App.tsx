import React, { useEffect, useRef, useState } from 'react';
import { 
  Shield, Lock, Unlock, Users, Archive, Send, Copy,
  UploadCloud, Share2, UserPlus, ChevronRight, Download,
  ShieldCheck, Zap, LogOut, User, ArrowRight,
  Eye, EyeOff, Trash2, X, ChevronDown, Mail, Menu
} from 'lucide-react';
import {
  chiffrerMessage,
  chiffrerDonnees,
  creerCarteContact,
  creerCodeRecuperation,
  dechiffrerDonnees,
  lireCarteContact,
  type ProfilLocal
} from './crypto/cryptoService';
import {
  chargerOuCreerIdentite,
  confirmerSauvegardeCodeRecuperation,
  supprimerIdentiteLocaleParEmpreinte
} from './crypto/identityStore';
import {
  enregistrerIdentite,
  revoquerIdentite,
  verifierIdentiteActive
} from './crypto/recoveryRegistry';
import {
  deleteVaultEntry,
  listVaultEntries,
  saveVaultEntry,
  type VaultEntry
} from './crypto/vaultStore';
import LandingPage from './landing/LandingPage';

interface Contact {
  id: string;
  name: string;
  clePubChiffrement: Uint8Array;
  clePubSignature: Uint8Array;
  empreinte: string;
  sasCode: string;
}

interface FichierDechiffre {
  name: string;
  mimeType: string;
  message: string;
  donnees: Uint8Array;
}

const FILE_MAGIC = new TextEncoder().encode('VERROU-FILE-1\0');

interface FichierPrevisualisable {
  name: string;
  mimeType: string;
  url: string;
}

function getPreviewKind(file: Pick<FichierPrevisualisable, 'name' | 'mimeType'>): 'pdf' | 'image' | null {
  if (file.mimeType === 'application/pdf' || /\.pdf$/i.test(file.name)) return 'pdf';
  if (file.mimeType.startsWith('image/') || /\.(png|jpe?g|gif|webp|bmp)$/i.test(file.name)) return 'image';
  return null;
}

function AppFooter() {
  return (
    <footer className="pro-footer">
      <div className="footer-reference-grid">
        <a className="footer-reference-brand" href="#accueil">
          <span className="footer-reference-mark">
            <Shield className="footer-reference-shield" />
            <Lock className="footer-reference-lock" />
          </span>
          <span className="footer-reference-brand-copy">
            <strong>Fasolock</strong>
            <small>Innover · Protéger · Bâtir</small>
          </span>
        </a>

        <nav className="footer-reference-links" aria-label="Liens rapides">
          <h2>Liens rapides</h2>
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
        <p>© 2026 Fasolock. Tous droits réservés. <span>Burkina Faso</span></p>
        <p className="footer-reference-organization">AWZOULAB <span>: INCUBATEUR ET LEARNING CENTER</span></p>
        <p className="footer-reference-credit">
          Concepteurs <strong>Y Idrissa & D Mansour</strong>
          <a href="mailto:yamidrissa@epo.gov.bf"><Mail aria-hidden="true" /> yamidrissa@epo.gov.bf</a>
        </p>
      </div>
    </footer>
  );
}

function WhatsAppLogo() {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true">
      <path fill="currentColor" d="M16 3.2A12.6 12.6 0 0 0 5.2 22.3L3.5 28l5.9-1.6A12.7 12.7 0 1 0 16 3.2Zm0 22.9c-2 0-3.9-.5-5.6-1.5l-.4-.2-3.5.9 1-3.4-.3-.5a10.2 10.2 0 1 1 8.8 4.7Zm5.6-7.6c-.3-.2-1.8-.9-2.1-1-.3-.1-.5-.2-.7.2-.2.3-.8 1-1 1.2-.2.2-.4.2-.7.1-.3-.2-1.3-.5-2.5-1.5-.9-.8-1.5-1.8-1.7-2.1-.2-.3 0-.5.1-.7l.5-.6.3-.6c.1-.2 0-.4 0-.6-.1-.2-.7-1.7-.9-2.3-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.6.1-.9.4-.3.3-1.1 1.1-1.1 2.6s1.1 3 1.3 3.2c.2.2 2.2 3.4 5.3 4.7.7.3 1.3.5 1.7.6.7.2 1.4.2 1.9.1.6-.1 1.8-.7 2-1.4.3-.7.3-1.3.2-1.4-.1-.2-.3-.3-.6-.4Z" />
    </svg>
  );
}

function GmailLogo() {
  return (
    <svg viewBox="0 0 32 24" aria-hidden="true">
      <path fill="#4285F4" d="M3 4.4 6.5 7v14H3a2 2 0 0 1-2-2V6.4a2 2 0 0 1 2-2Z" />
      <path fill="#34A853" d="M25.5 7 29 4.4a2 2 0 0 1 2 2V19a2 2 0 0 1-2 2h-3.5Z" />
      <path fill="#EA4335" d="M3 4.4A2 2 0 0 1 6.2 2.8L16 10l9.8-7.2A2 2 0 0 1 29 4.4L16 14Z" />
      <path fill="#C5221F" d="M25.5 7 29 4.4v4.4l-3.5 2.7Z" />
      <path fill="#FBBC04" d="M25.5 7 29 4.4v4.4l-3.5 2.7Z" />
    </svg>
  );
}

function ShareOptions({
  onWhatsApp,
  onGmail
}: {
  onWhatsApp: () => void;
  onGmail: () => void;
}) {
  return (
    <div className="share-options" aria-label="Partager avec">
      <button type="button" onClick={onWhatsApp} className="share-option-button whatsapp-share" aria-label="Partager avec WhatsApp" title="WhatsApp">
        <WhatsAppLogo />
      </button>
      <button type="button" onClick={onGmail} className="share-option-button gmail-share" aria-label="Partager avec Gmail" title="Gmail">
        <GmailLogo />
      </button>
    </div>
  );
}

async function emballerFichier(file: File, message: string): Promise<Uint8Array> {
  const metadata = new TextEncoder().encode(JSON.stringify({
    name: file.name,
    mimeType: file.type || 'application/octet-stream',
    message
  }));
  const fileBytes = new Uint8Array(await file.arrayBuffer());
  const payload = new Uint8Array(FILE_MAGIC.length + 4 + metadata.length + fileBytes.length);
  payload.set(FILE_MAGIC);
  new DataView(payload.buffer).setUint32(FILE_MAGIC.length, metadata.length, false);
  payload.set(metadata, FILE_MAGIC.length + 4);
  payload.set(fileBytes, FILE_MAGIC.length + 4 + metadata.length);
  return payload;
}

function extraireFichier(bytes: Uint8Array): FichierDechiffre | null {
  if (bytes.length < FILE_MAGIC.length || !FILE_MAGIC.every((byte, index) => bytes[index] === byte)) {
    return null;
  }
  if (bytes.length < FILE_MAGIC.length + 4) {
    throw new Error('Le contenu du fichier chiffré est incomplet.');
  }

  const metadataLength = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)
    .getUint32(FILE_MAGIC.length, false);
  const fileOffset = FILE_MAGIC.length + 4 + metadataLength;
  if (fileOffset > bytes.length) {
    throw new Error('Les métadonnées du fichier chiffré sont invalides.');
  }

  let metadata: unknown;
  try {
    metadata = JSON.parse(new TextDecoder().decode(bytes.subarray(FILE_MAGIC.length + 4, fileOffset)));
  } catch {
    throw new Error('Les métadonnées du fichier déchiffré sont invalides.');
  }
  if (
    !metadata ||
    typeof metadata !== 'object' ||
    !('name' in metadata) ||
    !('mimeType' in metadata) ||
    !('message' in metadata) ||
    typeof metadata.name !== 'string' ||
    typeof metadata.mimeType !== 'string' ||
    typeof metadata.message !== 'string'
  ) {
    throw new Error('Les métadonnées du fichier déchiffré sont incomplètes.');
  }

  return {
    name: metadata.name,
    mimeType: metadata.mimeType,
    message: metadata.message,
    donnees: bytes.slice(fileOffset)
  };
}

export function HomePage({
  onOpenLogin,
  onOpenRecovery
}: {
  onOpenLogin: () => void;
  onOpenRecovery: () => void;
}) {
  return (
    <div className="verrou-app landing-page">
      <header className="pro-navbar landing-navbar">
        <div className="brand-section">
            <div className="brand-icon">
                <Shield className="w-6 h-6 text-[#25A86A]" />
            </div>
            <div className="brand-label">
                <span className="brand-text">Fasolock</span>
            </div>
        </div>

        <div className="company-badge-nav">
            <span style={{width:8,height:8,borderRadius:'50%',background:'#1a07c0',display:'inline-block'}}></span>
            <span>Non connecté</span>
        </div>

        {/* Le bouton ici doit être adapté pour la page d'accueil */}
        <button 
            type="button" 
            onClick={onOpenLogin} // Cette prop vient de votre composant HomePage
            className="login-home-link"
      >
          Se connecter
        </button>
      </header>

      <main className="landing-main">
        <section id="accueil" className="landing-hero">
          <div className="landing-hero-copy">
            <h1>Nos données. Nos clés.<br /><span>Notre souveraineté numérique.</span></h1>
            <div className="landing-hero-actions">
              <button type="button" onClick={onOpenLogin} className="btn-primary-neon">
                <Lock className="w-5 h-5" /> Accéder à mon espace sécurisé
              </button>
              {/* <a href="#souverainete" className="landing-secondary-link">
                Découvrir la solution <ChevronRight className="w-4 h-4" />
              </a> */}
            </div>
            {/* <div className="landing-trust-list">
              <span><ShieldCheck className="w-4 h-4" /> AES-256-GCM</span>
              <span><ServerOff className="w-4 h-4" /> Clés privées locales</span>
              <span><Zap className="w-4 h-4" /> Signature vérifiable</span>
            </div> */}
          </div>

          <div className="landing-visual-card" role="img" aria-label="Illustration du chiffrement VERROU">
          </div>
        </section>

        <section id="fonctionnalites" className="landing-section">
          <div id="souverainete" className="landing-section-heading">
            <span className="landing-eyebrow">Une approche concrète</span>
            <h2>Le verrou numérique des Burkinabè<br /><span>Envoyez en toute confidentialité, simplement.</span></h2>
            <p>
              Ajoutez un contact, chiffrez votre contenu, envoyez-le. Seul votre destinataire pourra l’ouvrir.
            </p>
          </div>
          <div className="landing-feature-grid">
            <article className="landing-feature-card">
              <div className="landing-feature-icon"><Lock className="w-5 h-5" /></div>
              <h3>Protéger avant d’envoyer</h3>
              <p>Les messages et fichiers sont chiffrés dans le navigateur avant d’être partagés.</p>
            </article>
            <article className="landing-feature-card">
              <div className="landing-feature-icon"><ShieldCheck className="w-5 h-5" /></div>
              <h3>Garder la maîtrise des clés</h3>
              <p>Votre identité cryptographique reste sur votre appareil, protégée par votre phrase secrète.</p>
            </article>
            <article className="landing-feature-card">
              <div className="landing-feature-icon"><Users className="w-5 h-5" /></div>
              <h3>Choisir ses interlocuteurs</h3>
              <p>Partagez les clés publiques et vérifiez l’identité de vos contacts avant l’échange.</p>
            </article>
          </div>
        </section>

        <section id="apropos" className="landing-how">
          <div>
            <span className="landing-eyebrow">Simple et direct</span>
            <h2>Reprenez le contrôle<br />de vos échanges.</h2>
          </div>
          <ol id="guide" className="landing-steps">
            <li><span>01</span><div><strong>Créer votre profil pour déverrouillez votre espace d'échange sécurisé</strong><p>Votre identité est protégée sur votre appareil.</p></div></li>
            <li><span>02</span><div><strong>Ajoutez un contact vérifié</strong><p>Échangez vos cartes publiques et confirmez les empreintes.</p></div></li>
            <li><span>03</span><div><strong>Chiffrez vos messages et fichiers confidentiels, puis partagez avec vos proches</strong><p>Envoyez le contenu chiffré par le canal de votre choix.</p></div></li>
          </ol>
        </section>

        <section id="faq" className="landing-faq">
          <span className="landing-eyebrow"> A savoir</span>
          <h2>À propos de VERROU</h2>
          <details>
            <summary>À quoi sert votre clé publique ?</summary>
            <p>Votre clé publique permet à vos contacts de chiffrer un contenu à votre intention. Elle peut être partagée librement : seule votre clé privée, qui ne quitte jamais votre appareil, permet de le déchiffrer.</p>
          </details>
          <details>
            <summary>Où sont conservées mes clés privées ?</summary>
            <p>Vos clés privées sont stockées uniquement sur votre appareil, dans le navigateur, sous forme chiffrée. Elles sont protégées par une clé dérivée de votre phrase secrète et ne sont jamais envoyées à un serveur. Seule la clé publique est enregistrée dans l’annuaire.</p>
          </details>
          <details>
            <summary>Pourquoi parler de souveraineté numérique ?</summary>
            <p>Avec VERROU, le chiffrement et le déchiffrement s’effectuent sur votre appareil, et vos clés restent sous votre seul contrôle. Vous décidez qui peut vous écrire et qui peut lire vos contenus, sans dépendre d’un tiers pour garder vos clés.</p>
          </details>
        </section>
      </main>

      <AppFooter />
    </div>
  );
}

/* =========================================================
   COMPOSANT PRINCIPAL
   ========================================================= */

export default function App() {
  const [isUnlocked,      setIsUnlocked]      = useState(false);
  const [showHome, setShowHome] = useState(true);
  const [showRecovery, setShowRecovery] = useState(false);
  const [activeTab,       setActiveTab]        = useState<'chiffrer'|'dechiffrer'|'contacts'|'coffre'>('chiffrer');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [sessionUsername, setSessionUsername]  = useState('');
  const [profil, setProfil] = useState<ProfilLocal | null>(null);
  const [publicCard, setPublicCard] = useState('');
  const [loginUser,       setLoginUser]        = useState('');
  const [loginPass,       setLoginPass]        = useState('');
  const [loginError,      setLoginError]       = useState('');
  const [recoveryCode, setRecoveryCode] = useState('');
  const [hasConfirmedRecoveryCode, setHasConfirmedRecoveryCode] = useState(false);
  const [recoveryCodeInput, setRecoveryCodeInput] = useState('');
  const [recoveryError, setRecoveryError] = useState('');
  const [recoveryNotice, setRecoveryNotice] = useState('');
  const [isRevokingIdentity, setIsRevokingIdentity] = useState(false);

  const [contacts,       setContacts]       = useState<Contact[]>([]);
  const [showAddContact, setShowAddContact]  = useState(false);
  const [contactName,    setContactName]    = useState('');
  const [contactKey,     setContactKey]     = useState('');

  const [message,           setMessage]           = useState('');
  const [selectedRecipient, setSelectedRecipient] = useState('');
  const [selectedSender, setSelectedSender] = useState('');
  const [attachedFile,      setAttachedFile]      = useState<File|null>(null);
  const [cipherOutput,      setCipherOutput]      = useState('');
  const [encryptedAttachment, setEncryptedAttachment] = useState<{ name: string; url: string } | null>(null);
  const [showCipherShare, setShowCipherShare] = useState(false);
  const [showCiphertext, setShowCiphertext] = useState(false);
  const encryptedFileInput = useRef<HTMLInputElement>(null);
  const [encryptCount,      setEncryptCount]      = useState(0);
  const [copied,            setCopied]            = useState(false);

  const [clipboardNote,  setClipboardNote]  = useState('');
  const [decryptInput, setDecryptInput] = useState('');
  const [decryptedText,  setDecryptedText]  = useState<string|null>(null);
  const [decryptedCiphertext, setDecryptedCiphertext] = useState('');
  const [decryptedFile, setDecryptedFile] = useState<FichierPrevisualisable | null>(null);
  const [isSavingVaultEntry, setIsSavingVaultEntry] = useState(false);
  const [vaultEntries, setVaultEntries] = useState<VaultEntry[]>([]);
  const [vaultNotice, setVaultNotice] = useState('');
  const [isEncryptedFileDragging, setIsEncryptedFileDragging] = useState(false);
  const [showDecryptedPreview, setShowDecryptedPreview] = useState(false);
  const [showCardShare, setShowCardShare] = useState(false);
  const [contactError, setContactError] = useState('');
  const previewKind = decryptedFile ? getPreviewKind(decryptedFile) : null;

  useEffect(() => {
    const identityFingerprint = profil?.empreinte;
    if (!isUnlocked || !identityFingerprint) return;
    let cancelled = false;
    listVaultEntries(identityFingerprint).then(entries => {
      if (!cancelled) setVaultEntries(entries);
    }).catch(error => {
      if (!cancelled) {
        setVaultNotice(error instanceof Error
          ? `Impossible de charger le coffre : ${error.message}`
          : 'Impossible de charger les archives chiffrées de ce coffre.');
      }
    });
    return () => { cancelled = true; };
  }, [isUnlocked, profil?.empreinte]);

  useEffect(() => {
    return () => {
      if (decryptedFile) URL.revokeObjectURL(decryptedFile.url);
    };
  }, [decryptedFile]);

  useEffect(() => {
    if (!showDecryptedPreview) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setShowDecryptedPreview(false);
    };
    document.addEventListener('keydown', closeOnEscape);
    return () => document.removeEventListener('keydown', closeOnEscape);
  }, [showDecryptedPreview]);

  useEffect(() => {
    return () => {
      if (encryptedAttachment) URL.revokeObjectURL(encryptedAttachment.url);
    };
  }, [encryptedAttachment]);

  const copyToClipboard = async (txt: string) => {
    try {
      await navigator.clipboard.writeText(txt);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      alert('Impossible de copier dans le presse-papiers.');
    }
  };

  const clearCipherResult = () => {
    setCipherOutput('');
    setEncryptedAttachment(null);
    setShowCipherShare(false);
    setShowCiphertext(false);
  };

  const partagerWhatsApp = (texte: string) => {
    window.open(`https://wa.me/?text=${encodeURIComponent(texte)}`, '_blank', 'noopener,noreferrer');
  };

  const partagerGmail = (texte: string, sujet: string) => {
    const url = `https://mail.google.com/mail/?view=cm&fs=1&su=${encodeURIComponent(sujet)}&body=${encodeURIComponent(texte)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginUser.trim() || !loginPass.trim()) {
      setLoginError('Veuillez renseigner votre nom d\'utilisateur et votre phrase secrète.');
      return;
    }
    try {
      const username = loginUser.trim();
      const loaded = await chargerOuCreerIdentite(username, loginPass);
      const identity = loaded.profil;
      await enregistrerIdentite(identity);
      setProfil(identity);
      setPublicCard(await creerCarteContact(identity));
      setSessionUsername(username);
      setLoginPass('');
      setRecoveryCode(loaded.codeRecuperation ?? '');
      setHasConfirmedRecoveryCode(!loaded.codeRecuperation);
      setRecoveryError('');
      setVaultNotice('');
      setRecoveryNotice('');
      setIsUnlocked(true);
      setShowHome(false);
      setLoginError('');
    } catch (error) {
      setLoginError(error instanceof Error ? error.message : 'Impossible de déverrouiller votre identité.');
    }
  };

  const handleLogout = () => {
    setIsUnlocked(false);
    setLoginUser('');
    setLoginPass('');
    setMessage('');
    setAttachedFile(null);
    setCipherOutput('');
    setEncryptedAttachment(null);
    setShowCipherShare(false);
    setShowCiphertext(false);
    setDecryptedText(null);
    setDecryptedCiphertext('');
    setDecryptInput('');
    setDecryptedFile(null);
    setShowDecryptedPreview(false);
    setVaultEntries([]);
    setVaultNotice('');
    setRecoveryCode('');
    setRecoveryCodeInput('');
    setHasConfirmedRecoveryCode(false);
    setProfil(null);
    setShowHome(true);
  };

  const handleConfirmRecoveryCode = async () => {
    if (!sessionUsername || !hasConfirmedRecoveryCode) return;
    try {
      await confirmerSauvegardeCodeRecuperation(sessionUsername);
      setRecoveryCode('');
    } catch (error) {
      setRecoveryError(error instanceof Error ? error.message : 'Impossible de confirmer la sauvegarde du code.');
    }
  };

  const handleShowRecoveryCode = async () => {
    if (!profil) return;
    try {
      setRecoveryCode(await creerCodeRecuperation(profil));
      setHasConfirmedRecoveryCode(false);
      setRecoveryError('');
    } catch (error) {
      setRecoveryError(error instanceof Error ? error.message : 'Impossible d’afficher le code de récupération.');
    }
  };

  const handleRevokeIdentity = async () => {
    setIsRevokingIdentity(true);
    setRecoveryError('');
    try {
      const empreinte = await revoquerIdentite(recoveryCodeInput);
      await supprimerIdentiteLocaleParEmpreinte(empreinte);
      setRecoveryCodeInput('');
      setRecoveryNotice('Clé révoquée et copie locale supprimée. Créez une nouvelle identité pour reprendre les échanges. Les anciens messages chiffrés pour cette clé ne pourront pas être récupérés.');
      setShowRecovery(false);
      setLoginUser('');
      setLoginPass('');
      setLoginError('');
    } catch (error) {
      setRecoveryError(error instanceof Error ? error.message : 'Impossible de révoquer cette identité.');
    } finally {
      setIsRevokingIdentity(false);
    }
  };

  const openSecureSpace = () => {
    setShowRecovery(false);
    setShowHome(false);
  };

  const openRecoverySpace = () => {
    setRecoveryError('');
    setRecoveryCodeInput('');
    setShowRecovery(true);
    setShowHome(false);
  };

  const handleEncrypt = async () => {
    if (!message.trim() && !attachedFile) return;
    const recipient = contacts.find(contact => contact.id === selectedRecipient);
    if (!recipient || !profil) {
      alert('Sélectionnez un contact disposant d’une carte VERROU valide.');
      return;
    }
    try {
      await verifierIdentiteActive(recipient);
      const cipher = attachedFile
        ? await chiffrerDonnees(
          await emballerFichier(attachedFile, message),
          recipient.clePubChiffrement,
          profil.clePriveeSignature
        )
        : await chiffrerMessage(message, recipient.clePubChiffrement, profil.clePriveeSignature);
      setCipherOutput(cipher);
      setMessage('');
      setAttachedFile(null);
      if (encryptedFileInput.current) encryptedFileInput.current.value = '';
      setEncryptedAttachment(attachedFile ? {
        name: attachedFile.name,
        url: URL.createObjectURL(new Blob([cipher], { type: 'text/plain' }))
      } : null);
      setEncryptCount(c => c + 1);
      setShowCipherShare(false);
      setShowCiphertext(false);
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Erreur cryptographique.');
    }
  };

  const handlePasteClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (!text) { setClipboardNote('Presse-papiers vide.'); return; }
      setDecryptionSource(text, 'Message collé. Cliquez sur « Déchiffrer le message ».');
    } catch {
      setClipboardNote('Impossible de lire le presse-papiers. Collez le message dans le champ ci-dessous.');
    }
  };

  const setDecryptionSource = (text: string, note: string) => {
    setDecryptInput(text);
    setDecryptedText(null);
    setDecryptedCiphertext('');
    setDecryptedFile(null);
    setClipboardNote(note);
  };

  const handleEncryptedFile = async (file?: File) => {
    if (!file) return;
    setDecryptionSource('', '');
    try {
      const text = (await file.text()).trim();
      if (!text.startsWith('VLK2:')) {
        setClipboardNote('Ce fichier ne contient pas le chiffrement VERROU attendu. Sélectionnez le fichier .vlk reçu, pas le message d’annonce.');
        return;
      }
      setDecryptionSource(text, 'Fichier .vlk chargé. Choisissez l’expéditeur puis cliquez sur « Déchiffrer ».');
    } catch {
      setClipboardNote('Impossible de lire le fichier chiffré.');
    }
  };

  const handleEncryptedFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.currentTarget;
    await handleEncryptedFile(input.files?.[0]);
    input.value = '';
  };

  const handleDecrypt = async () => {
    const message = decryptInput.trim();
    if (!message) {
      setClipboardNote('Importez le fichier .vlk reçu ou collez le contenu chiffré.');
      return;
    }
    if (!message.startsWith('VLK2:')) {
      setClipboardNote('Le contenu collé est probablement le message d’annonce, pas le chiffrement. Importez le fichier .vlk reçu ou collez son contenu complet commençant par « VLK2: ».');
      return;
    }
    const sender = contacts.find(contact => contact.id === selectedSender);
    if (!sender || !profil) {
      setClipboardNote('Sélectionnez le contact qui vous a envoyé ce message.');
      return;
    }
    setShowDecryptedPreview(false);
    try {
      await verifierIdentiteActive(sender);
      const plain = await dechiffrerDonnees(
        message,
        profil.clePubChiffrement,
        profil.clePriveeChiffrement,
        sender.clePubSignature
      );
      const fichier = extraireFichier(plain);
      setDecryptedCiphertext(message);
      setDecryptInput('');
      if (fichier) {
        const fileBuffer = new ArrayBuffer(fichier.donnees.byteLength);
        new Uint8Array(fileBuffer).set(fichier.donnees);
        const url = URL.createObjectURL(new Blob([fileBuffer], { type: fichier.mimeType }));
        setDecryptedFile({ name: fichier.name, mimeType: fichier.mimeType, url });
        setDecryptedText(fichier.message || `Fichier déchiffré : ${fichier.name}`);
      } else {
        setDecryptedFile(null);
        setDecryptedText(new TextDecoder().decode(plain));
      }
      setClipboardNote('Message authentifié et déchiffré avec succès.');
    } catch (error) {
      setDecryptedFile(null);
      setDecryptedText(null);
      setDecryptedCiphertext('');
      setClipboardNote(error instanceof Error ? error.message : 'Échec du déchiffrement.');
    }
  };

  const handleSaveToVault = async () => {
    if (!decryptedCiphertext || !profil) return;
    setIsSavingVaultEntry(true);
    try {
      const entry = await saveVaultEntry(profil.empreinte, decryptedCiphertext);
      setVaultEntries(current => [...current, entry]);
      setVaultNotice('Archive chiffrée enregistrée dans votre coffre.');
      setClipboardNote('Archive chiffrée enregistrée dans votre coffre.');
    } catch (error) {
      setVaultNotice(error instanceof Error ? error.message : 'Impossible d’enregistrer cette archive chiffrée.');
    } finally {
      setIsSavingVaultEntry(false);
    }
  };

  const handleOpenVaultEntry = (entry: VaultEntry) => {
    setDecryptionSource(entry.ciphertext, 'Archive chargée. Sélectionnez le contact expéditeur puis déchiffrez-la.');
    setActiveTab('dechiffrer');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteVaultEntry = async (id: string) => {
    if (!profil) return;
    try {
      await deleteVaultEntry(profil.empreinte, id);
      setVaultEntries(current => current.filter(entry => entry.id !== id));
      setVaultNotice('Archive supprimée du coffre.');
    } catch (error) {
      setVaultNotice(error instanceof Error ? error.message : 'Impossible de supprimer cette archive du coffre.');
    }
  };

  const handleAddContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactKey.trim()) return;
    try {
      const carte = await lireCarteContact(contactKey.trim());
      const contact = {
        id: `${Date.now()}-${carte.empreinte.slice(0, 8)}`,
        name: contactName.trim() || carte.prenom,
        clePubChiffrement: carte.clePubChiffrement,
        clePubSignature: carte.clePubSignature,
        empreinte: carte.empreinte,
        sasCode: carte.sasCode
      };
      setContacts(current => [...current.filter(existing => existing.empreinte !== contact.empreinte), contact]);
      setSelectedRecipient(contact.id);
      clearCipherResult();
      setSelectedSender(contact.id);
      setContactName('');
      setContactKey('');
      setShowAddContact(false);
      setContactError('');
    } catch (error) {
      setContactError(error instanceof Error ? error.message : 'Carte contact invalide.');
    }
  };

  /* ---- ÉCRAN DE CONNEXION ---- */
  if (showHome) {
    return <LandingPage onOpenLogin={openSecureSpace} onOpenRecovery={openRecoverySpace} />;
  }

  if (!isUnlocked) return (
    <div className="verrou-app login-page">
      <header className="pro-navbar login-navbar">
        <div className="brand-section">
          <div className="brand-icon"><Shield className="w-6 h-6 text-[#25A86A]" /></div>
          <div className="brand-label">
            <span className="brand-text">Fasolock</span>
            {/* <span className="brand-tagline">Zero · Knowledge</span> */}
          </div>
        </div>
        <div className="company-badge-nav">
          <span style={{width:8,height:8,borderRadius:'50%',background:'#1a07c0',display:'inline-block'}}></span>
          <span>Non connecté</span>
        </div>
        <button type="button" onClick={() => {
          setShowRecovery(false);
          setRecoveryCodeInput('');
          setRecoveryError('');
          setShowHome(true);
        }} className="login-home-link">
          Retour à l’accueil
        </button>
      </header>

      <main className="main-viewport login-viewport" style={{justifyContent:'center'}}>
        {showRecovery ? (
          <div className="cyber-card recovery-card" style={{maxWidth:500,margin:'0 auto'}}>
            <div className="header-icon-box"><ShieldCheck className="w-7 h-7"/></div>
            <div>
              <h1 className="recovery-title">Révoquer une identité</h1>
              <p className="recovery-description">
                Saisissez votre code de récupération hors ligne. Aucun nom d’utilisateur ni phrase secrète n’est requis.
              </p>
            </div>
            <label htmlFor="recovery-code" className="input-label-row">Code de récupération</label>
            <textarea
              id="recovery-code"
              rows={4}
              value={recoveryCodeInput}
              onChange={event => setRecoveryCodeInput(event.target.value)}
              className="cyber-textarea mono"
              autoComplete="off"
              spellCheck={false}
              placeholder="VLK-RECOVERY-V1:…"
            />
            {recoveryError && <p className="recovery-error" role="alert">{recoveryError}</p>}
            <p className="recovery-warning">
              La révocation bloque cette clé pour les utilisateurs qui vérifient le registre. Elle ne restaure pas les anciens messages.
            </p>
            <button type="button" className="btn-primary-neon" onClick={handleRevokeIdentity} disabled={isRevokingIdentity || !recoveryCodeInput.trim()}>
              <ShieldCheck className="w-5 h-5"/>
              {isRevokingIdentity ? 'Révocation en cours…' : 'Révoquer cette clé'}
            </button>
            <button type="button" className="secondary-action-button" onClick={() => {
              setShowRecovery(false);
              setRecoveryCodeInput('');
              setRecoveryError('');
            }}>
              Retour à la connexion
            </button>
          </div>
        ) : (
        <div className="cyber-card" style={{maxWidth:480,margin:'0 auto',textAlign:'center', backgroundColor: '#7c7777', alignItems:'center',padding:'40px 32px'}}>
          <div className="header-icon-box" style={{width:72,height:72,borderRadius:20}}>
            <Lock className="w-8 h-8" />
          </div>
          <div>
            <h1 style={{fontSize:'1.85rem',fontWeight:900,marginBottom:6}}>
              Accès <span style={{color:'#25A86A'}}>Sécurisé</span>
            </h1>
            <p style={{color:'#132036',fontSize:'0.9rem'}}>
              Identifiez-vous pour déverrouiller votre espace cryptographique personnel.
            </p>
          </div>
          <form onSubmit={handleLogin} style={{width:'100%',display:'flex',flexDirection:'column',gap:12}}>
            <input
              type="text"
              placeholder="Nom d'utilisateur"
              value={loginUser}
              onChange={e => setLoginUser(e.target.value)}
              className="cyber-input"
              autoFocus
            />
            <input
              type="password"
              placeholder="Phrase secrète"
              value={loginPass}
              onChange={e => setLoginPass(e.target.value)}
              className="cyber-input"
            />
            {loginError && <p style={{color:'#F87171',fontSize:'0.82rem'}}>{loginError}</p>}
            <button type="submit" className="btn-primary-neon">
              <Unlock className="w-5 h-5" /> Déverrouiller votre espace
            </button>
            <button type="button" className="login-recovery-button" onClick={openRecoverySpace}>
              J’ai perdu mon nom ou ma phrase secrète
            </button>
          </form>
          {recoveryNotice && <p className="recovery-notice" role="status">{recoveryNotice}</p>}
          <div style={{display:'flex',gap:20,fontSize:'0.78rem',color:'#020913',flexWrap:'wrap',justifyContent:'center'}}>
            <span><ShieldCheck className="w-3.5 h-3.5 inline text-[#25A86A] mr-1"/>Sécurité maximale</span>
            {/* <span><ServerOff  className="w-3.5 h-3.5 inline text-[#F2C94C] mr-1"/>Zero-knowledge</span> */}
            <span><Zap        className="w-3.5 h-3.5 inline text-[#25A86A] mr-1"/>Accès rapide</span>
          </div>
        </div>
        )}
      </main>

      <AppFooter />
    </div>
  );

  /* ---- ÉCRAN PRINCIPAL (CONNECTÉ) ---- */
  return (
    <div className="verrou-app">

      {/* ======= NAVBAR ÉQUILIBRÉE ======= */}
      <header className={`pro-navbar workspace-navbar${isMobileMenuOpen ? ' mobile-menu-open' : ''}`}>

        {/* GAUCHE : Logo */}
        <div className="brand-section">
          <div className="brand-icon"><Shield className="w-6 h-6 text-[#25A86A]" /></div>
          <div className="brand-label">
            <span className="brand-text">Fasolock</span>
            {/* <span className="brand-tagline">ZERO CONNAISSANCE</span> */}
          </div>
        </div>

        <button
          type="button"
          className="mobile-nav-toggle"
          aria-label={isMobileMenuOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
          aria-expanded={isMobileMenuOpen}
          aria-controls="workspace-tab-navigation"
          onClick={() => setIsMobileMenuOpen(open => !open)}
        >
          {isMobileMenuOpen ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
          <span>{isMobileMenuOpen ? 'Fermer' : 'Menu'}</span>
        </button>

        {/* CENTRE : Onglets */}
        <nav
          id="workspace-tab-navigation"
          className="nav-pill-group"
          aria-label="Navigation principale"
        >
          {(['chiffrer','dechiffrer','contacts','coffre'] as const).map(tab => {
            const icons = { chiffrer: <Lock className="w-4 h-4"/>, dechiffrer: <Send className="w-4 h-4"/>, contacts: <Users className="w-4 h-4"/>, coffre: <Archive className="w-4 h-4"/> };
            const labels = { chiffrer:'Chiffrer', dechiffrer:'Déchiffrer', contacts:'Contacts', coffre:'Coffre' };
            return (
              <button
                key={tab}
                type="button"
                onClick={() => {
                  setActiveTab(tab);
                  setIsMobileMenuOpen(false);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className={`nav-tab-btn ${activeTab===tab?'active':''}`}
                aria-current={activeTab === tab ? 'page' : undefined}
              >
                {icons[tab]} <span>{labels[tab]}</span>
              </button>
            );
          })}
        </nav>

        {/* DROITE : Utilisateur + Déconnexion */}
        <div className="nav-right-actions">
          <div className="company-badge-nav">
            <span className="online-pulse"></span>
            {/* Nom de l'utilisateur connecté */}
            <User className="w-3.5 h-3.5" />
            <span>{sessionUsername}</span>
            <ChevronDown className="account-chevron" aria-hidden="true" />
          </div>
          <button onClick={handleLogout} className="btn-logout">
            <LogOut className="w-4 h-4" /> Se déconnecter
          </button>
        </div>
      </header>

      {/* ======= CONTENU PRINCIPAL ======= */}
      <main className={`main-viewport workspace-viewport workspace-tab-${activeTab}`}>

        {recoveryCode && (
          <div className="recovery-overlay">
            <section className="recovery-dialog" role="dialog" aria-modal="true" aria-labelledby="recovery-dialog-title">
              <div className="header-icon-box"><ShieldCheck className="w-7 h-7"/></div>
              <h2 id="recovery-dialog-title">Conservez votre code de récupération</h2>
              <p>
                Ce code permet de révoquer cette identité si vous perdez votre nom ou votre phrase secrète.
                Il ne permet pas de retrouver vos anciens messages.
              </p>
              <code className="recovery-code-value">{recoveryCode}</code>
              <p className="recovery-offline-note">
                Notez ce code hors ligne ou conservez-le dans un gestionnaire chiffré. Il n’est ni envoyé au serveur ni exporté en fichier non chiffré.
              </p>
              <label className="recovery-confirm-label">
                <input
                  type="checkbox"
                  checked={hasConfirmedRecoveryCode}
                  onChange={event => setHasConfirmedRecoveryCode(event.target.checked)}
                />
                J’ai enregistré ce code hors ligne et je comprends qu’il ne restaure pas mes messages.
              </label>
              {recoveryError && <p className="recovery-error" role="alert">{recoveryError}</p>}
              <button
                type="button"
                className="btn-primary-neon"
                disabled={!hasConfirmedRecoveryCode}
                onClick={handleConfirmRecoveryCode}
              >
                Continuer vers mon espace
              </button>
            </section>
          </div>
        )}

        {/* PAGE CHIFFRER */}
        {activeTab === 'chiffrer' && (
          <div className="split-layout-grid">
            <div className="hero-info-col">
              <h1>Vos messages,<br/>votre <span>confidentialité</span></h1>
              {/* <div className="feature-pill-list">
                <div className="feature-pill-item"><ShieldCheck className="w-4 h-4 text-[#25A86A]"/>Clé publique du contact</div>
                <div className="feature-pill-item"><Zap         className="w-4 h-4 text-[#F2C94C]"/>Signature vérifiable</div>
                <div className="feature-pill-item"><ServerOff   className="w-4 h-4 text-[#25A86A]"/>Clés privées locales</div>
              </div> */}
            </div>

            <div className="cyber-card">
              <div className="cyber-card-header">
                <div className="header-icon-box"><Lock className="w-6 h-6"/></div>
                <div>
                  <h2 style={{fontSize:'1.3rem',fontWeight:800}}>Chiffrer un message</h2>
                  <p style={{fontSize:'0.8rem',color:'#94A3B8'}}></p>
                </div>
              </div>

              <div className="input-block">
                <div className="input-label-row">
                  <span>Message à chiffrer</span>
                  <span style={{color:'#526459',fontSize:'0.76rem'}}>{message.length}/1000</span>
                </div>
                <textarea rows={4} value={message} onChange={e=>{setMessage(e.target.value);clearCipherResult();}} placeholder="Rédigez votre message confidentiel ici..." className="cyber-textarea"/>
              </div>

              <div className="input-block">
                <div className="input-label-row">Document joint (fichier texte ou image)</div>
                <label className="file-drop-zone">
                  <UploadCloud className="w-7 h-7 text-[#25A86A]"/>
                  <span style={{fontSize:'0.86rem',fontWeight:700}}>{attachedFile?`${attachedFile.name} (${(attachedFile.size/1024).toFixed(0)} Ko)`:"Glissez ou cliquez pour parcourir"}</span>
                  <span style={{fontSize:'0.72rem',color:'#64748B'}}>PDF, DOC, DOCX, JPG, PNG • Max 10 Mo</span>
                  <input
                    ref={encryptedFileInput}
                    type="file"
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                    style={{display:'none'}}
                    onChange={e=>{
                      const file=e.target.files?.[0];
                      if (!file) return;
                      if (file.size > 10 * 1024 * 1024) {
                        setAttachedFile(null);
                        clearCipherResult();
                        e.currentTarget.value='';
                        alert('Le fichier dépasse la limite de 10 Mo.');
                        return;
                      }
                      setAttachedFile(file);
                      clearCipherResult();
                    }}
                  />
                </label>
              </div>

              <div className="input-block">
                <div className="input-label-row">Choisissez votre destinataire</div>
                <select value={selectedRecipient} onChange={e=>{setSelectedRecipient(e.target.value);clearCipherResult();}} className="cyber-select">
                  <option value="">Sélectionnez un contact</option>
                  {contacts.map(c=><option key={c.id} value={c.id}>{c.name} (SAS: {c.sasCode})</option>)}
                </select>
              </div>

              <button onClick={handleEncrypt} className="btn-primary-neon">
                <Lock className="w-5 h-5"/> Cliquez ici pour chiffrer
              </button>

              {cipherOutput && (
                <div className="cipher-result-surface">
                  <div style={{display:'flex',justifyContent:'space-between',marginBottom:6}}>
                    <span style={{color:'#25A86A',fontSize:'0.76rem',fontWeight:800}}>Génération #{encryptCount} · Signature vérifiable</span>
                    <div className="share-actions">
                      <button onClick={()=>copyToClipboard(cipherOutput)} className="share-action-button">
                        <Copy className="w-4 h-4"/>{copied?'Copié !':'Copier'}
                      </button>
                      <button onClick={()=>setShowCipherShare(value=>!value)} className="share-action-button">
                        <Share2 className="w-4 h-4"/>Partager
                      </button>
                    </div>
                  </div>
                  <div className={`sealed-cipher-panel ${showCiphertext ? 'is-revealed' : ''}`}>
                    <div className="sealed-cipher-heading">
                      <span><Lock className="w-4 h-4" /> Cryptogramme scellé</span>
                      <button type="button" className="reveal-cipher-button" onClick={() => setShowCiphertext(visible => !visible)}>
                        {showCiphertext ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        {showCiphertext ? 'Masquer' : 'Révéler'}
                      </button>
                    </div>
                    <pre aria-label={showCiphertext ? 'Contenu chiffré' : 'Contenu chiffré masqué'}>
                      {showCiphertext ? cipherOutput : '••••••••••••••••••••••••••••••••'}
                    </pre>
                    {!showCiphertext && <p>Le contenu reste masqué à l’écran jusqu’à votre demande.</p>}
                  </div>
                  {showCipherShare && (
                    <>
                      {encryptedAttachment && <p className="share-file-note">Téléchargez le fichier chiffré et joignez-le dans WhatsApp ou Gmail.</p>}
                      <ShareOptions
                        onWhatsApp={() => partagerWhatsApp(encryptedAttachment ? `Pièce jointe requise : ${encryptedAttachment.name}.vlk. Dans VERROU, importez ce fichier dans l’onglet Déchiffrer.` : cipherOutput)}
                        onGmail={() => partagerGmail(encryptedAttachment ? `Pièce jointe requise : ${encryptedAttachment.name}.vlk. Dans VERROU, importez ce fichier dans l’onglet Déchiffrer.` : cipherOutput, 'Message chiffré VERROU')}
                      />
                    </>
                  )}
                  {encryptedAttachment && (
                    <a href={encryptedAttachment.url} download={`${encryptedAttachment.name}.vlk`} className="secondary-action-button">
                      <Download className="w-4 h-4"/> Télécharger le fichier chiffré
                    </a>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* PAGE DÉCHIFFRER */}
        {activeTab === 'dechiffrer' && (
          <div className="split-layout-grid">
            <div className="hero-info-col">
              <h1>Déchiffrement<br/><span>Instantanement en toute sécurité</span></h1>
            </div>
            <div className="cyber-card" style={{textAlign:'center',alignItems:'center'}}>
              <div className="header-icon-box decrypt-header-icon">
                <Unlock className="w-10 h-10"/>
              </div>
              <div>
                <h2 className="decrypt-card-title">Processus de déchiffrement du chiffré reçu</h2>
                <p className="workspace-card-description" style={{fontSize:'0.9rem',maxWidth:380}}>Importez le fichier .vlk reçu ou collez le contenu chiffré complet, puis choisissez son expéditeur.</p>
              </div>
              <label
                className={`file-drop-zone decrypt-file-drop-zone ${isEncryptedFileDragging ? 'is-dragging' : ''}`}
                style={{width:'100%',padding:12}}
                onDragOver={event => {
                  event.preventDefault();
                  setIsEncryptedFileDragging(true);
                }}
                onDragLeave={event => {
                  if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
                    setIsEncryptedFileDragging(false);
                  }
                }}
                onDrop={event => {
                  event.preventDefault();
                  setIsEncryptedFileDragging(false);
                  void handleEncryptedFile(event.dataTransfer.files[0]);
                }}
              >
                <UploadCloud className="w-5 h-5 text-[#25A86A]"/>
                <span style={{fontSize:'0.84rem',fontWeight:700}}>Glissez-déposez ou importez un fichier chiffré (.vlk)</span>
                <input type="file" accept=".vlk,.txt,text/plain" style={{display:'none'}} onChange={handleEncryptedFileChange}/>
              </label>
              <div className="input-block" style={{width:'100%',textAlign:'left'}}>
                <label htmlFor="encrypted-message" className="input-label-row">Message chiffré à déchiffrer</label>
                <textarea
                  id="encrypted-message"
                  rows={4}
                  value={decryptInput}
                  onChange={e=>setDecryptionSource(e.target.value, '')}
                  placeholder="Collez ici le message VERROU reçu…"
                  className="cyber-textarea mono decrypt-message-input"
                  aria-label="Message chiffré à déchiffrer"
                />
              </div>
              <div className="input-block" style={{width:'100%',textAlign:'left'}}>
                <label htmlFor="message-sender" className="input-label-row">Expéditeur</label>
                <select id="message-sender" value={selectedSender} onChange={e=>setSelectedSender(e.target.value)} className="cyber-select">
                  <option value="">Sélectionnez le contact expéditeur</option>
                  {contacts.map(c=><option key={c.id} value={c.id}>{c.name} (SAS: {c.sasCode})</option>)}
                </select>
              </div>
              <button onClick={handleDecrypt} className="btn-primary-neon" style={{maxWidth:420}}>
                <Unlock className="w-5 h-5"/> Cliquez ici pour dechiffrer
              </button>
              <button onClick={handlePasteClipboard} className="secondary-action-button">
                <Copy className="w-4 h-4"/> Coller depuis le presse-papiers
              </button>
              {clipboardNote && <p style={{fontSize:'0.84rem',color:'#805600',fontWeight:700}}>{clipboardNote}</p>}
              {decryptedText && (
                <div className="decrypted-result-surface">
                  <div className="authenticated-result-label">Contenu authentifié :</div>
                  <p className="authenticated-result-text">{decryptedText}</p>
                  {decryptedFile && (
                    <div className="decrypted-file-actions">
                      {previewKind && (
                        <button type="button" className="secondary-action-button" onClick={() => setShowDecryptedPreview(true)}>
                          <Eye className="w-4 h-4" /> Cliquez pour voir le contenu
                        </button>
                      )}
                      <a className="secondary-action-button" href={decryptedFile.url} download={decryptedFile.name}>
                        <Download className="w-4 h-4" /> Télécharger le fichier
                      </a>
                    </div>
                  )}
                  {decryptedCiphertext && (
                    <button
                      type="button"
                      className="secondary-action-button vault-save-button"
                      onClick={handleSaveToVault}
                      disabled={isSavingVaultEntry}
                    >
                      <Archive className="w-4 h-4" />
                      {isSavingVaultEntry ? 'Enregistrement…' : 'Enregistrer chiffré dans le coffre'}
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* PAGE CONTACTS */}
        {activeTab === 'contacts' && (
          <div className="split-layout-grid">
            <div className="hero-info-col">
              <h1>Gérez en toute serenité vos <span>contacts</span></h1>
            </div>
            <div className="cyber-card contact-workspace-card" style={{gap:14}}>
              {/* Ma clé publique */}
              <div className="contact-content-surface">
                <div style={{display:'flex',alignItems:'center',gap:12}}>
                  <div className="contact-section-icon"><Share2 className="w-5 h-5"/></div>
                  <div><h3 style={{fontSize:'0.98rem',fontWeight:800}}>Ma clé publique</h3><p className="contact-section-description">Carte VERROU · SAS {profil?.sasCode}</p></div>
                </div>
                <textarea readOnly value={publicCard} aria-label="Ma carte contact VERROU" className="cyber-textarea mono contact-card-output" rows={3}/>
                {profil && <p className="fingerprint-line">Empreinte : {profil.empreinte}</p>}
                <button type="button" className="recovery-show-button" onClick={handleShowRecoveryCode}>
                  <ShieldCheck className="w-4 h-4" /> Mon code de récupération
                </button>
                <div className="share-actions">
                  <button onClick={()=>copyToClipboard(publicCard)} className="share-action-button"><Copy className="w-4 h-4"/>Copier</button>
                  <button onClick={()=>setShowCardShare(value=>!value)} className="share-action-button"><Share2 className="w-4 h-4"/>Partager</button>
                </div>
                {showCardShare && (
                  <ShareOptions
                    onWhatsApp={() => partagerWhatsApp(publicCard)}
                    onGmail={() => partagerGmail(publicCard, 'Ma carte contact VERROU')}
                  />
                )}
              </div>

              {/* Ajouter contact */}
              <div className="contact-content-surface contact-add-trigger" onClick={()=>setShowAddContact(!showAddContact)}>
                <div style={{display:'flex',alignItems:'center',gap:12}}>
                  <div className="contact-section-icon"><UserPlus className="w-5 h-5"/></div>
                  <div><h3 style={{fontSize:'0.98rem',fontWeight:800}}>Ajouter un contact</h3><p className="contact-section-description">Coller la clé public reçue pour enregistrer votre contact</p></div>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-500"/>
              </div>

              {showAddContact && (
                <form onSubmit={handleAddContactSubmit} className="contact-add-form">
                  <input type="text" placeholder="Nom du contact (facultatif)" value={contactName} onChange={e=>setContactName(e.target.value)} className="cyber-input"/>
                  <textarea rows={4} placeholder="Collez la carte VERROU-CARTE reçue" value={contactKey} onChange={e=>setContactKey(e.target.value)} className="cyber-textarea mono"/>
                  {contactError && <p role="alert" style={{color:'#B42318',fontSize:'0.82rem'}}>{contactError}</p>}
                  <button type="submit" className="btn-primary-neon" style={{padding:'10px 20px',fontSize:'0.85rem'}}>Enregistrer</button>
                </form>
              )}

              {/* Liste contacts */}
              <div className="contact-content-surface">
                <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:8}}>
                  <div className="contact-section-icon"><Users className="w-5 h-5"/></div>
                  <div>
                    <h3 style={{fontSize:'0.98rem',fontWeight:800}}>Contacts validés</h3>
                    <p className="contact-section-description">{contacts.length===0?'Aucun contact. Ajoutez-en un ci-dessus.':`${contacts.length} contact(s) sécurisé(s)`}</p>
                  </div>
                </div>
                {contacts.map(c=>(
                  <div key={c.id} className="contact-list-entry">
                    <span><strong>{c.name}</strong><span style={{color:'#805600',marginLeft:8}}>SAS: {c.sasCode}</span><br/><small style={{color:'#526459'}}>Empreinte : {c.empreinte}</small></span>
                    <button onClick={()=>setContacts(current=>current.filter(i=>i.id!==c.id))} className="contact-delete-button" aria-label={`Supprimer ${c.name}`}>✕</button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* PAGE COFFRE */}
        {activeTab === 'coffre' && (
          <div className="split-layout-grid">
            <div className="hero-info-col">
              <h1>Votre coffre <span>sécurisé</span></h1>
            </div>
            <div className="cyber-card" style={{minHeight:240,justifyContent:'center'}}>
              <div style={{display:'flex',alignItems:'center',gap:12}}>
                <div style={{padding:9,borderRadius:11,background:'rgba(37,168,106,0.1)',color:'#25A86A'}}><Archive className="w-5 h-5"/></div>
                <div>
                  <h2 style={{fontSize:'1.2rem',fontWeight:800}}>Mes copies chiffrées</h2>
                  <p className="workspace-card-description" style={{fontSize:'0.78rem'}}>Seuls les cryptogrammes sont conservés localement.</p>
                </div>
              </div>
              {vaultNotice && <p className="vault-notice" role="status">{vaultNotice}</p>}
              {vaultEntries.length === 0 ? (
                <div className="vault-empty-state">
                  <Archive className="w-12 h-12"/>
                  <p>Aucune archive chiffrée pour le moment.</p>
                  <span>Après un déchiffrement, enregistrez le cryptogramme pour le retrouver ici.</span>
                </div>
              ) : (
                <ul className="vault-entry-list">
                  {vaultEntries.map((entry, index) => (
                    <li key={entry.id} className="vault-entry">
                      <div className="vault-entry-icon"><Lock className="w-4 h-4" /></div>
                      <span>Archive chiffrée {index + 1}</span>
                      <button type="button" onClick={() => handleOpenVaultEntry(entry)} aria-label={`Ouvrir l’archive chiffrée ${index + 1}`}>
                        <Eye className="w-4 h-4" />
                      </button>
                      <button type="button" onClick={() => void handleDeleteVaultEntry(entry.id)} aria-label={`Supprimer l’archive chiffrée ${index + 1}`}>
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}

      </main>

      {/* ======= PIED DE PAGE SIMPLE ======= */}
      <AppFooter />
      {showDecryptedPreview && decryptedFile && previewKind && (
        <div className="file-preview-backdrop" onClick={() => setShowDecryptedPreview(false)}>
          <section
            className="file-preview-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="file-preview-title"
            onClick={event => event.stopPropagation()}
          >
            <header className="file-preview-header">
              <div>
                <h2 id="file-preview-title">Aperçu du fichier</h2>
                <p>{decryptedFile.name}</p>
              </div>
              <button type="button" className="file-preview-close" aria-label="Fermer l’aperçu" onClick={() => setShowDecryptedPreview(false)}>
                <X className="w-5 h-5" />
              </button>
            </header>
            <div className={`file-preview-content ${previewKind === 'image' ? 'image-preview' : 'pdf-preview'}`}>
              {previewKind === 'image'
                ? <img src={decryptedFile.url} alt={decryptedFile.name} />
                : <iframe src={decryptedFile.url} title={`Aperçu de ${decryptedFile.name}`} />}
            </div>
            <div className="file-preview-actions">
              <a className="secondary-action-button" href={decryptedFile.url} download={decryptedFile.name}>
                <Download className="w-4 h-4" /> Télécharger le fichier
              </a>
              <button type="button" className="secondary-action-button" onClick={() => setShowDecryptedPreview(false)}>Fermer</button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
