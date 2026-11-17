import React, { useEffect, useState } from 'react';
import { 
  Shield, Lock, Unlock, Users, Archive, Send, Copy,
  UploadCloud, Share2, UserPlus, ChevronRight, Download,
  ShieldCheck, Zap, ServerOff, LogOut,
  User
} from 'lucide-react';
import {
  chiffrerMessage,
  chiffrerDonnees,
  creerCarteContact,
  dechiffrerDonnees,
  lireCarteContact,
  type ProfilLocal
} from './crypto/cryptoService';
import { chargerOuCreerIdentite } from './crypto/identityStore';

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

/* =========================================================
   COMPOSANT PRINCIPAL
   ========================================================= */

export default function App() {
  const [isUnlocked,      setIsUnlocked]      = useState(false);
  const [activeTab,       setActiveTab]        = useState<'chiffrer'|'dechiffrer'|'contacts'|'coffre'>('chiffrer');
  const [sessionUsername, setSessionUsername]  = useState('');
  const [profil, setProfil] = useState<ProfilLocal | null>(null);
  const [publicCard, setPublicCard] = useState('');
  const [loginUser,       setLoginUser]        = useState('');
  const [loginPass,       setLoginPass]        = useState('');
  const [loginError,      setLoginError]       = useState('');

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
  const [encryptCount,      setEncryptCount]      = useState(0);
  const [copied,            setCopied]            = useState(false);

  const [clipboardNote,  setClipboardNote]  = useState('');
  const [decryptInput, setDecryptInput] = useState('');
  const [decryptedText,  setDecryptedText]  = useState<string|null>(null);
  const [decryptedFile, setDecryptedFile] = useState<{ name: string; url: string } | null>(null);
  const [showCardShare, setShowCardShare] = useState(false);
  const [contactError, setContactError] = useState('');

  useEffect(() => {
    return () => {
      if (decryptedFile) URL.revokeObjectURL(decryptedFile.url);
    };
  }, [decryptedFile]);

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
      const identity = await chargerOuCreerIdentite(username, loginPass);
      setProfil(identity);
      setPublicCard(await creerCarteContact(identity));
      setSessionUsername(username);
      setIsUnlocked(true);
      setLoginError('');
    } catch (error) {
      setLoginError(error instanceof Error ? error.message : 'Impossible de déverrouiller votre identité.');
    }
  };

  const handleLogout = () => {
    setIsUnlocked(false);
    setLoginUser('');
    setLoginPass('');
    setCipherOutput('');
    setEncryptedAttachment(null);
    setDecryptedText(null);
    setDecryptedFile(null);
    setProfil(null);
  };

  const handleEncrypt = async () => {
    if (!message.trim() && !attachedFile) return;
    const recipient = contacts.find(contact => contact.id === selectedRecipient);
    if (!recipient || !profil) {
      alert('Sélectionnez un contact disposant d’une carte VERROU valide.');
      return;
    }
    try {
      const cipher = attachedFile
        ? await chiffrerDonnees(
          await emballerFichier(attachedFile, message),
          recipient.clePubChiffrement,
          profil.clePriveeSignature
        )
        : await chiffrerMessage(message, recipient.clePubChiffrement, profil.clePriveeSignature);
      setCipherOutput(cipher);
      setEncryptedAttachment(attachedFile ? {
        name: attachedFile.name,
        url: URL.createObjectURL(new Blob([cipher], { type: 'text/plain' }))
      } : null);
      setEncryptCount(c => c + 1);
      setShowCipherShare(false);
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Erreur cryptographique.');
    }
  };

  const handlePasteClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (!text) { setClipboardNote('Presse-papiers vide.'); return; }
      setDecryptInput(text);
      setClipboardNote('Message collé. Cliquez sur « Déchiffrer le message ».');
    } catch {
      setClipboardNote('Impossible de lire le presse-papiers. Collez le message dans le champ ci-dessous.');
    }
  };

  const handleDecrypt = async () => {
    const sender = contacts.find(contact => contact.id === selectedSender);
    if (!sender || !profil) {
      setClipboardNote('Sélectionnez le contact qui vous a envoyé ce message.');
      return;
    }
    if (!decryptInput.trim()) {
      setClipboardNote('Collez le message chiffré dans le champ ci-dessus.');
      return;
    }
    try {
      const plain = await dechiffrerDonnees(
        decryptInput.trim(),
        profil.clePubChiffrement,
        profil.clePriveeChiffrement,
        sender.clePubSignature
      );
      const fichier = extraireFichier(plain);
      if (fichier) {
        const fileBuffer = new ArrayBuffer(fichier.donnees.byteLength);
        new Uint8Array(fileBuffer).set(fichier.donnees);
        const url = URL.createObjectURL(new Blob([fileBuffer], { type: fichier.mimeType }));
        setDecryptedFile({ name: fichier.name, url });
        setDecryptedText(fichier.message || `Fichier déchiffré : ${fichier.name}`);
      } else {
        setDecryptedFile(null);
        setDecryptedText(new TextDecoder().decode(plain));
      }
      setClipboardNote('Message authentifié et déchiffré avec succès.');
    } catch (error) {
      setDecryptedFile(null);
      setDecryptedText(null);
      setClipboardNote(error instanceof Error ? error.message : 'Échec du déchiffrement.');
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
  if (!isUnlocked) return (
    <div className="verrou-app">
      <header className="pro-navbar">
        <div className="brand-section">
          <div className="brand-icon"><Shield className="w-6 h-6 text-[#00E676]" /></div>
          <div className="brand-label">
            <span className="brand-text">VERROU</span>
            <span className="brand-tagline">Zero · Knowledge</span>
          </div>
        </div>
        <div className="company-badge-nav">
          <span style={{width:8,height:8,borderRadius:'50%',background:'#64748B',display:'inline-block'}}></span>
          <span>Non connecté</span>
        </div>
      </header>

      <main className="main-viewport" style={{justifyContent:'center'}}>
        <div className="cyber-card" style={{maxWidth:480,margin:'0 auto',textAlign:'center',alignItems:'center',padding:'40px 32px'}}>
          <div className="header-icon-box" style={{width:72,height:72,borderRadius:20}}>
            <Lock className="w-8 h-8" />
          </div>
          <div>
            <h1 style={{fontSize:'1.85rem',fontWeight:900,marginBottom:6}}>
              Accès <span style={{color:'#00E676'}}>Sécurisé</span>
            </h1>
            <p style={{color:'#94A3B8',fontSize:'0.9rem'}}>
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
              placeholder="Phrase secrète (ex : paix liberté progrès)"
              value={loginPass}
              onChange={e => setLoginPass(e.target.value)}
              className="cyber-input"
            />
            {loginError && <p style={{color:'#F87171',fontSize:'0.82rem'}}>{loginError}</p>}
            <button type="submit" className="btn-primary-neon">
              <Unlock className="w-5 h-5" /> Déverrouiller le Coffre
            </button>
          </form>
          <div style={{display:'flex',gap:20,fontSize:'0.78rem',color:'#64748B',flexWrap:'wrap',justifyContent:'center'}}>
            <span><ShieldCheck className="w-3.5 h-3.5 inline text-[#00E676] mr-1"/>Sécurité maximale</span>
            <span><ServerOff  className="w-3.5 h-3.5 inline text-[#00E676] mr-1"/>Zero-knowledge</span>
            <span><Zap        className="w-3.5 h-3.5 inline text-[#00E676] mr-1"/>Accès rapide</span>
          </div>
        </div>
      </main>

      <footer className="pro-footer">
        <div className="footer-simple-content">
          <div className="footer-simple-left">© 2026 <strong>VERROU</strong> — Souveraineté numérique, sécurité locale et clés sous votre contrôle.</div>
          <div className="footer-simple-right">
            Développé par <strong>&nbsp;Idrissa YAMEOGO</strong>
            <span className="footer-sep">•</span>Entreprise <strong>SITCOMint</strong>
          </div>
        </div>
      </footer>
    </div>
  );

  /* ---- ÉCRAN PRINCIPAL (CONNECTÉ) ---- */
  return (
    <div className="verrou-app">

      {/* ======= NAVBAR ÉQUILIBRÉE ======= */}
      <header className="pro-navbar">

        {/* GAUCHE : Logo */}
        <div className="brand-section">
          <div className="brand-icon"><Shield className="w-6 h-6 text-[#00E676]" /></div>
          <div className="brand-label">
            <span className="brand-text">VERROU</span>
            <span className="brand-tagline">Zero · Knowledge</span>
          </div>
        </div>

        {/* CENTRE : Onglets */}
        <nav className="nav-pill-group">
          {(['chiffrer','dechiffrer','contacts','coffre'] as const).map(tab => {
            const icons = { chiffrer: <Lock className="w-4 h-4"/>, dechiffrer: <Send className="w-4 h-4"/>, contacts: <Users className="w-4 h-4"/>, coffre: <Archive className="w-4 h-4"/> };
            const labels = { chiffrer:'Chiffrer', dechiffrer:'Déchiffrer', contacts:`Contacts (${contacts.length})`, coffre:'Coffre (0)' };
            return (
              <button key={tab} onClick={() => setActiveTab(tab)} className={`nav-tab-btn ${activeTab===tab?'active':''}`}>
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
          </div>
          <button onClick={handleLogout} className="btn-logout">
            <LogOut className="w-4 h-4" /> Se déconnecter
          </button>
        </div>
      </header>

      {/* ======= CONTENU PRINCIPAL ======= */}
      <main className="main-viewport">

        {/* PAGE CHIFFRER */}
        {activeTab === 'chiffrer' && (
          <div className="split-layout-grid">
            <div className="hero-info-col">
              <h1>Vos messages,<br/>votre <span>confidentialité</span></h1>
              <p>Chiffrement AES-256-GCM, clé de contenu protégée pour votre contact, et signature de votre identité locale.</p>
              <div className="gold-accent-line"></div>
              <div className="feature-pill-list">
                <div className="feature-pill-item"><ShieldCheck className="w-4 h-4 text-[#00E676]"/>Clé publique du contact</div>
                <div className="feature-pill-item"><Zap         className="w-4 h-4 text-[#00E676]"/>Signature vérifiable</div>
                <div className="feature-pill-item"><ServerOff   className="w-4 h-4 text-[#00E676]"/>Clés privées locales</div>
              </div>
            </div>

            <div className="cyber-card">
              <div className="cyber-card-header">
                <div className="header-icon-box"><Lock className="w-6 h-6"/></div>
                <div>
                  <h2 style={{fontSize:'1.3rem',fontWeight:800}}>Chiffrer un message</h2>
                  <p style={{fontSize:'0.8rem',color:'#94A3B8'}}>AES-256-GCM · clé protégée pour le contact</p>
                </div>
              </div>

              <div className="input-block">
                <div className="input-label-row">
                  <span>Message à chiffrer</span>
                  <span style={{color:'#64748B',fontSize:'0.76rem'}}>{message.length}/1000</span>
                </div>
                <textarea rows={4} value={message} onChange={e=>setMessage(e.target.value)} placeholder="Rédigez votre message confidentiel ici..." className="cyber-textarea"/>
              </div>

              <div className="input-block">
                <div className="input-label-row">Ajouter un document (optionnel)</div>
                <label className="file-drop-zone">
                  <UploadCloud className="w-7 h-7 text-[#00E676]"/>
                  <span style={{fontSize:'0.86rem',fontWeight:700}}>{attachedFile?`${attachedFile.name} (${(attachedFile.size/1024).toFixed(0)} Ko)`:"Glissez ou cliquez pour parcourir"}</span>
                  <span style={{fontSize:'0.72rem',color:'#64748B'}}>PDF, DOC, DOCX, JPG, PNG • Max 10 Mo</span>
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                    style={{display:'none'}}
                    onChange={e=>{
                      const file=e.target.files?.[0];
                      if (!file) return;
                      if (file.size > 10 * 1024 * 1024) {
                        setAttachedFile(null);
                        e.currentTarget.value='';
                        alert('Le fichier dépasse la limite de 10 Mo.');
                        return;
                      }
                      setAttachedFile(file);
                    }}
                  />
                </label>
              </div>

              <div className="input-block">
                <div className="input-label-row">Destinataire</div>
                <select value={selectedRecipient} onChange={e=>setSelectedRecipient(e.target.value)} className="cyber-select">
                  <option value="">Sélectionnez un contact</option>
                  {contacts.map(c=><option key={c.id} value={c.id}>{c.name} (SAS: {c.sasCode})</option>)}
                </select>
              </div>

              <button onClick={handleEncrypt} className="btn-primary-neon">
                <Lock className="w-5 h-5"/> Chiffrer mon message
              </button>

              {cipherOutput && (
                <div style={{background:'#000',padding:14,borderRadius:14,border:'1px solid #00E676'}}>
                  <div style={{display:'flex',justifyContent:'space-between',marginBottom:6}}>
                    <span style={{color:'#00E676',fontSize:'0.76rem',fontWeight:800}}>Génération #{encryptCount} · Signature vérifiable</span>
                    <div className="share-actions">
                      <button onClick={()=>copyToClipboard(cipherOutput)} className="share-action-button">
                        <Copy className="w-4 h-4"/>{copied?'Copié !':'Copier'}
                      </button>
                      <button onClick={()=>setShowCipherShare(value=>!value)} className="share-action-button">
                        <Share2 className="w-4 h-4"/>Partager
                      </button>
                    </div>
                  </div>
                  <pre style={{fontSize:'0.7rem',color:'#94A3B8',overflowX:'auto',maxHeight:80}}>{cipherOutput}</pre>
                  {showCipherShare && (
                    <>
                      {encryptedAttachment && <p className="share-file-note">Téléchargez le fichier chiffré et joignez-le dans WhatsApp ou Gmail.</p>}
                      <div className="share-options">
                        <button
                          onClick={()=>partagerWhatsApp(encryptedAttachment ? `Fichier VERROU chiffré : ${encryptedAttachment.name}.vlk` : cipherOutput)}
                          className="share-option-button"
                        >WhatsApp</button>
                        <button
                          onClick={()=>partagerGmail(encryptedAttachment ? `Fichier VERROU chiffré : ${encryptedAttachment.name}.vlk` : cipherOutput, 'Message chiffré VERROU')}
                          className="share-option-button"
                        >Gmail</button>
                      </div>
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
              <h1>Déchiffrement<br/><span>Instantané</span></h1>
              <p>La signature de l’expéditeur est vérifiée avant le déchiffrement AES-256-GCM avec votre clé privée locale.</p>
              <div className="gold-accent-line"></div>
            </div>
            <div className="cyber-card" style={{textAlign:'center',alignItems:'center'}}>
              <div className="header-icon-box" style={{width:84,height:84,borderRadius:24}}>
                <Unlock className="w-10 h-10"/>
              </div>
              <div>
                <h2 style={{fontSize:'1.45rem',fontWeight:900,marginBottom:8}}>Message reçu sur WhatsApp ?</h2>
                <p style={{fontSize:'0.9rem',color:'#94A3B8',maxWidth:380}}>Collez le message chiffré ci-dessous, puis choisissez son expéditeur pour vérifier sa signature.</p>
              </div>
              <div className="input-block" style={{width:'100%',textAlign:'left'}}>
                <label htmlFor="encrypted-message" className="input-label-row">Message chiffré à déchiffrer</label>
                <textarea
                  id="encrypted-message"
                  rows={6}
                  value={decryptInput}
                  onChange={e=>setDecryptInput(e.target.value)}
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
                <Unlock className="w-5 h-5"/> CLIQUER POUR DÉCHIFFRER
              </button>
              <button onClick={handlePasteClipboard} className="secondary-action-button">
                <Copy className="w-4 h-4"/> Coller depuis le presse-papiers
              </button>
              {clipboardNote && <p style={{fontSize:'0.84rem',color:'#F59E0B',fontWeight:700}}>{clipboardNote}</p>}
              {decryptedText && (
                <div style={{width:'100%',background:'#000',padding:18,borderRadius:14,border:'1px solid #00E676',textAlign:'left'}}>
                  <div style={{color:'#00E676',fontSize:'0.78rem',fontWeight:800,marginBottom:6}}>Contenu authentifié :</div>
                  <p style={{color:'#fff',fontSize:'0.9rem',whiteSpace:'pre-wrap'}}>{decryptedText}</p>
                  {decryptedFile && <a className="secondary-action-button" href={decryptedFile.url} download={decryptedFile.name}>Télécharger le fichier déchiffré</a>}
                </div>
              )}
            </div>
          </div>
        )}

        {/* PAGE CONTACTS */}
        {activeTab === 'contacts' && (
          <div className="split-layout-grid">
            <div className="hero-info-col">
              <h1>Gérez vos <span>contacts</span></h1>
              <p>Échangez vos clés publiques avec confirmation vocale SAS pour garantir l'authenticité.</p>
              <div className="gold-accent-line"></div>
            </div>
            <div className="cyber-card" style={{gap:14}}>
              {/* Ma clé publique */}
              <div style={{padding:16,borderRadius:14,background:'rgba(3,7,18,0.7)',border:'1px solid rgba(255,255,255,0.08)'}}>
                <div style={{display:'flex',alignItems:'center',gap:12}}>
                  <div style={{padding:9,borderRadius:11,background:'rgba(0,230,118,0.1)',color:'#00E676'}}><Share2 className="w-5 h-5"/></div>
                  <div><h3 style={{fontSize:'0.98rem',fontWeight:800}}>Ma clé publique</h3><p style={{fontSize:'0.76rem',color:'#94A3B8'}}>Carte VERROU · SAS {profil?.sasCode}</p></div>
                </div>
                <textarea readOnly value={publicCard} aria-label="Ma carte contact VERROU" className="cyber-textarea mono contact-card-output" rows={3}/>
                {profil && <p className="fingerprint-line">Empreinte : {profil.empreinte}</p>}
                <div className="share-actions">
                  <button onClick={()=>copyToClipboard(publicCard)} className="share-action-button"><Copy className="w-4 h-4"/>Copier</button>
                  <button onClick={()=>setShowCardShare(value=>!value)} className="share-action-button"><Share2 className="w-4 h-4"/>Partager</button>
                </div>
                {showCardShare && (
                  <div className="share-options">
                    <button onClick={()=>partagerWhatsApp(publicCard)} className="share-option-button">WhatsApp</button>
                    <button onClick={()=>partagerGmail(publicCard, 'Ma carte contact VERROU')} className="share-option-button">Gmail</button>
                  </div>
                )}
              </div>

              {/* Ajouter contact */}
              <div onClick={()=>setShowAddContact(!showAddContact)}
                style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:16,borderRadius:14,background:'rgba(3,7,18,0.7)',border:'1px solid rgba(255,255,255,0.08)',cursor:'pointer'}}>
                <div style={{display:'flex',alignItems:'center',gap:12}}>
                  <div style={{padding:9,borderRadius:11,background:'rgba(0,230,118,0.1)',color:'#00E676'}}><UserPlus className="w-5 h-5"/></div>
                  <div><h3 style={{fontSize:'0.98rem',fontWeight:800}}>Ajouter un contact</h3><p style={{fontSize:'0.76rem',color:'#94A3B8'}}>Coller la clé reçue</p></div>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-500"/>
              </div>

              {showAddContact && (
                <form onSubmit={handleAddContactSubmit} style={{display:'flex',flexDirection:'column',gap:9,background:'#000',padding:14,borderRadius:12}}>
                  <input type="text" placeholder="Nom du contact (facultatif)" value={contactName} onChange={e=>setContactName(e.target.value)} className="cyber-input"/>
                  <textarea rows={4} placeholder="Collez la carte VERROU-CARTE reçue" value={contactKey} onChange={e=>setContactKey(e.target.value)} className="cyber-textarea mono"/>
                  {contactError && <p role="alert" style={{color:'#F87171',fontSize:'0.82rem'}}>{contactError}</p>}
                  <button type="submit" className="btn-primary-neon" style={{padding:'10px 20px',fontSize:'0.85rem'}}>Enregistrer</button>
                </form>
              )}

              {/* Liste contacts */}
              <div style={{padding:16,borderRadius:14,background:'rgba(3,7,18,0.7)',border:'1px solid rgba(255,255,255,0.08)'}}>
                <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:8}}>
                  <div style={{padding:9,borderRadius:11,background:'rgba(0,230,118,0.1)',color:'#00E676'}}><Users className="w-5 h-5"/></div>
                  <div>
                    <h3 style={{fontSize:'0.98rem',fontWeight:800}}>Contacts validés</h3>
                    <p style={{fontSize:'0.76rem',color:'#94A3B8'}}>{contacts.length===0?'Aucun contact. Ajoutez-en un ci-dessus.':`${contacts.length} contact(s) sécurisé(s)`}</p>
                  </div>
                </div>
                {contacts.map(c=>(
                  <div key={c.id} style={{display:'flex',justifyContent:'space-between',padding:9,background:'rgba(255,255,255,0.04)',borderRadius:9,marginTop:6,fontSize:'0.84rem'}}>
                    <span><strong>{c.name}</strong><span style={{color:'#F59E0B',marginLeft:8}}>SAS: {c.sasCode}</span><br/><small style={{color:'#64748B'}}>Empreinte : {c.empreinte}</small></span>
                    <button onClick={()=>setContacts(current=>current.filter(i=>i.id!==c.id))} aria-label={`Supprimer ${c.name}`} style={{color:'#F87171',background:'none',border:'none',cursor:'pointer'}}>✕</button>
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
              <p>Stockez et archivez vos messages et documents chiffrés en toute sécurité sur votre terminal.</p>
              <div className="gold-accent-line"></div>
            </div>
            <div className="cyber-card" style={{minHeight:300,justifyContent:'center'}}>
              <div style={{display:'flex',alignItems:'center',gap:12}}>
                <div style={{padding:9,borderRadius:11,background:'rgba(0,230,118,0.1)',color:'#00E676'}}><Archive className="w-5 h-5"/></div>
                <div>
                  <h2 style={{fontSize:'1.2rem',fontWeight:800}}>Mes copies chiffrées (0)</h2>
                  <p style={{fontSize:'0.78rem',color:'#94A3B8'}}>Stockées uniquement dans la mémoire chiffrée de votre appareil.</p>
                </div>
              </div>
              <div style={{textAlign:'center',padding:'36px 0',display:'flex',flexDirection:'column',alignItems:'center',gap:10}}>
                <Archive className="w-14 h-14 text-gray-700"/>
                <p style={{fontSize:'0.82rem',color:'#64748B'}}>Aucune copie conservée pour le moment.</p>
              </div>
            </div>
          </div>
        )}

      </main>

      {/* ======= PIED DE PAGE SIMPLE ======= */}
      <footer className="pro-footer">
        <div className="footer-simple-content">
          <div className="footer-simple-left">© 2026 <strong>VERROU</strong> — Souveraineté numérique, sécurité locale et clés sous votre contrôle.</div>
          <div className="footer-simple-right">
            Développé par <strong>&nbsp;Idrissa YAMEOGO</strong>
            <span className="footer-sep">•</span>Entreprise <strong>SITCOMint</strong>
          </div>
        </div>
      </footer>
    </div>
  );
}
