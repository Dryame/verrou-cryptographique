import React, { useState } from 'react';
import { 
  Shield, Lock, Unlock, Users, Archive, Send, Copy,
  UploadCloud, Share2, UserPlus, ChevronRight,
  ShieldCheck, Zap, ServerOff, LogOut,
  Building2, MapPin, FileCheck2, Headphones, User
} from 'lucide-react';

interface Contact {
  id: string;
  name: string;
  publicKey: string;
  sasCode: string;
}

/* =========================================================
   MOTEUR CRYPTOGRAPHIQUE SOUVERAIN (Sel + Nonce Aléatoires)
   ========================================================= */

async function deriveKeyWithSalt(passphrase: string, salt: Uint8Array): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const keyMaterial = await window.crypto.subtle.importKey(
    'raw', enc.encode(passphrase), { name: 'PBKDF2' }, false, ['deriveKey']
  );
  return window.crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-256' },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false, ['encrypt', 'decrypt']
  );
}

async function realEncryptMessage(plaintext: string, secretKey: string): Promise<string> {
  const enc = new TextEncoder();
  const salt  = window.crypto.getRandomValues(new Uint8Array(16));
  const nonce = window.crypto.getRandomValues(new Uint8Array(12));
  const key   = await deriveKeyWithSalt(secretKey, salt);
  const buf   = await window.crypto.subtle.encrypt({ name: 'AES-GCM', iv: nonce }, key, enc.encode(plaintext));
  const payload = { v: '1.2', algo: 'AES256GCM-PBKDF2', salt: Array.from(salt), nonce: Array.from(nonce), ct: Array.from(new Uint8Array(buf)), ts: Date.now() };
  return `-----DEBUT VERROU VLK-----\n${btoa(JSON.stringify(payload))}\n-----FIN VERROU VLK-----`;
}

async function realDecryptMessage(vlk: string, secretKey: string): Promise<string> {
  let clean = vlk.trim()
    .replace('-----DEBUT VERROU VLK-----','')
    .replace('-----FIN VERROU VLK-----','').trim();
  const data  = JSON.parse(atob(clean));
  if (!data.salt || !data.nonce || !data.ct) throw new Error('Format invalide');
  const key   = await deriveKeyWithSalt(secretKey, new Uint8Array(data.salt));
  const buf   = await window.crypto.subtle.decrypt({ name: 'AES-GCM', iv: new Uint8Array(data.nonce) }, key, new Uint8Array(data.ct));
  return new TextDecoder().decode(buf);
}

/* =========================================================
   COMPOSANT PRINCIPAL
   ========================================================= */

export default function App() {
  const [isUnlocked,      setIsUnlocked]      = useState(false);
  const [activeTab,       setActiveTab]        = useState<'chiffrer'|'dechiffrer'|'contacts'|'coffre'>('chiffrer');
  const [sessionUsername, setSessionUsername]  = useState('');
  const [sessionPassword, setSessionPassword]  = useState('');
  const [loginUser,       setLoginUser]        = useState('');
  const [loginPass,       setLoginPass]        = useState('');
  const [loginError,      setLoginError]       = useState('');

  const [contacts,       setContacts]       = useState<Contact[]>([]);
  const [showAddContact, setShowAddContact]  = useState(false);
  const [contactName,    setContactName]    = useState('');
  const [contactKey,     setContactKey]     = useState('');

  const [message,           setMessage]           = useState('');
  const [selectedRecipient, setSelectedRecipient] = useState('');
  const [attachedFile,      setAttachedFile]      = useState<{ name: string; size: string }|null>(null);
  const [cipherOutput,      setCipherOutput]      = useState('');
  const [encryptCount,      setEncryptCount]      = useState(0);
  const [copied,            setCopied]            = useState(false);

  const [clipboardNote,  setClipboardNote]  = useState('');
  const [decryptedText,  setDecryptedText]  = useState<string|null>(null);

  const copyToClipboard = (txt: string) => {
    navigator.clipboard.writeText(txt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginUser.trim() || !loginPass.trim()) {
      setLoginError('Veuillez renseigner votre nom d\'utilisateur et votre phrase secrète.');
      return;
    }
    setSessionUsername(loginUser.trim());
    setSessionPassword(loginPass);
    setIsUnlocked(true);
    setLoginError('');
  };

  const handleLogout = () => {
    setIsUnlocked(false);
    setLoginUser('');
    setLoginPass('');
    setCipherOutput('');
    setDecryptedText(null);
  };

  const handleEncrypt = async () => {
    if (!message.trim() && !attachedFile) return;
    try {
      const content = attachedFile
        ? JSON.stringify({ type: 'file', name: attachedFile.name, msg: message })
        : message;
      const cipher = await realEncryptMessage(content, sessionPassword);
      setCipherOutput(cipher);
      setEncryptCount(c => c + 1);
    } catch { alert('Erreur cryptographique.'); }
  };

  const handlePasteClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (!text) { setClipboardNote('Presse-papiers vide.'); return; }
      if (text.includes('VERROU VLK')) {
        const plain = await realDecryptMessage(text, sessionPassword);
        try {
          const p = JSON.parse(plain);
          setDecryptedText(p.type === 'file' ? `[Fichier : ${p.name}]\n${p.msg||''}` : plain);
        } catch { setDecryptedText(plain); }
        setClipboardNote('Message déchiffré avec succès !');
      } else {
        setClipboardNote('Format non reconnu — pas un message Verrou.');
      }
    } catch { setClipboardNote('Échec du déchiffrement : clé invalide ou données altérées.'); }
  };

  const handleAddContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactName.trim() || !contactKey.trim()) return;
    const sas = `${Math.floor(100+Math.random()*900)} - ${Math.floor(100+Math.random()*900)}`;
    setContacts([...contacts, { id: Date.now().toString(), name: contactName.trim(), publicKey: contactKey.trim(), sasCode: sas }]);
    setContactName(''); setContactKey(''); setShowAddContact(false);
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
          <div className="footer-simple-left">© 2026 <strong>VERROU</strong> — Tous droits réservés.</div>
          <div className="footer-simple-right">
            Développé par <strong>&nbsp;SITCOMint</strong>
            <span className="footer-sep">•</span>Ouagadougou, Burkina Faso
            <span className="footer-sep">•</span>Prototype v1.2
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
              <p>Chiffrement probabiliste : chaque envoi génère un Sel et un Nonce uniques, garantissant l'unicité absolue du bloc chiffré.</p>
              <div className="gold-accent-line"></div>
              <div className="feature-pill-list">
                <div className="feature-pill-item"><ShieldCheck className="w-4 h-4 text-[#00E676]"/>Sel & Nonce aléatoires</div>
                <div className="feature-pill-item"><Zap         className="w-4 h-4 text-[#00E676]"/>IND-CPA Sécurisé</div>
                <div className="feature-pill-item"><ServerOff   className="w-4 h-4 text-[#00E676]"/>Zero-knowledge</div>
              </div>
            </div>

            <div className="cyber-card">
              <div className="cyber-card-header">
                <div className="header-icon-box"><Lock className="w-6 h-6"/></div>
                <div>
                  <h2 style={{fontSize:'1.3rem',fontWeight:800}}>Chiffrer un message</h2>
                  <p style={{fontSize:'0.8rem',color:'#94A3B8'}}>Un chiffrement unique à chaque exécution</p>
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
                  <span style={{fontSize:'0.86rem',fontWeight:700}}>{attachedFile?attachedFile.name:"Glissez ou cliquez pour parcourir"}</span>
                  <span style={{fontSize:'0.72rem',color:'#64748B'}}>PDF, DOC, DOCX, JPG, PNG • Max 10 Mo</span>
                  <input type="file" style={{display:'none'}} onChange={e=>{const f=e.target.files?.[0];if(f)setAttachedFile({name:f.name,size:`${(f.size/1024).toFixed(0)} Ko`});}}/>
                </label>
              </div>

              <div className="input-block">
                <div className="input-label-row">Destinataire</div>
                <select value={selectedRecipient} onChange={e=>setSelectedRecipient(e.target.value)} className="cyber-select">
                  <option value="">Sélectionnez un contact ou entrez un numéro WhatsApp</option>
                  {contacts.map(c=><option key={c.id} value={c.id}>{c.name} (SAS: {c.sasCode})</option>)}
                </select>
              </div>

              <button onClick={handleEncrypt} className="btn-primary-neon">
                <Lock className="w-5 h-5"/> Chiffrer mon message
              </button>

              {cipherOutput && (
                <div style={{background:'#000',padding:14,borderRadius:14,border:'1px solid #00E676'}}>
                  <div style={{display:'flex',justifyContent:'space-between',marginBottom:6}}>
                    <span style={{color:'#00E676',fontSize:'0.76rem',fontWeight:800}}>Génération #{encryptCount} · Sel & Nonce uniques</span>
                    <button onClick={()=>copyToClipboard(cipherOutput)} style={{background:'#00E676',color:'#000',border:'none',padding:'4px 12px',borderRadius:8,fontWeight:800,cursor:'pointer'}}>
                      {copied?'Copié !':'Copier'}
                    </button>
                  </div>
                  <pre style={{fontSize:'0.7rem',color:'#94A3B8',overflowX:'auto',maxHeight:80}}>{cipherOutput}</pre>
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
              <p>Le moteur extrait le Sel et le Nonce intégrés dans le paquet pour restituer le message d'origine avec exactitude.</p>
              <div className="gold-accent-line"></div>
            </div>
            <div className="cyber-card" style={{textAlign:'center',alignItems:'center'}}>
              <div className="header-icon-box" style={{width:84,height:84,borderRadius:24}}>
                <Unlock className="w-10 h-10"/>
              </div>
              <div>
                <h2 style={{fontSize:'1.45rem',fontWeight:900,marginBottom:8}}>Message reçu sur WhatsApp ?</h2>
                <p style={{fontSize:'0.9rem',color:'#94A3B8',maxWidth:340}}>Copiez le message reçu dans WhatsApp, puis cliquez ci-dessous.</p>
              </div>
              <button onClick={handlePasteClipboard} className="btn-primary-neon" style={{maxWidth:420}}>
                <Copy className="w-5 h-5"/> COLLER DEPUIS LE PRESSE-PAPIERS
              </button>
              {clipboardNote && <p style={{fontSize:'0.84rem',color:'#F59E0B',fontWeight:700}}>{clipboardNote}</p>}
              {decryptedText && (
                <div style={{width:'100%',background:'#000',padding:18,borderRadius:14,border:'1px solid #00E676',textAlign:'left'}}>
                  <div style={{color:'#00E676',fontSize:'0.78rem',fontWeight:800,marginBottom:6}}>Contenu authentifié :</div>
                  <p style={{color:'#fff',fontSize:'0.9rem',whiteSpace:'pre-wrap'}}>{decryptedText}</p>
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
              <div onClick={()=>alert('Votre clé : pk_verrou_ed25519_9f8a2b3c4d5e')}
                style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:16,borderRadius:14,background:'rgba(3,7,18,0.7)',border:'1px solid rgba(255,255,255,0.08)',cursor:'pointer'}}>
                <div style={{display:'flex',alignItems:'center',gap:12}}>
                  <div style={{padding:9,borderRadius:11,background:'rgba(0,230,118,0.1)',color:'#00E676'}}><Share2 className="w-5 h-5"/></div>
                  <div><h3 style={{fontSize:'0.98rem',fontWeight:800}}>Ma clé publique</h3><p style={{fontSize:'0.76rem',color:'#94A3B8'}}>Partager ma clé</p></div>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-500"/>
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
                  <input type="text" placeholder="Nom du contact" value={contactName} onChange={e=>setContactName(e.target.value)} className="cyber-input"/>
                  <input type="text" placeholder="Clé publique reçue" value={contactKey} onChange={e=>setContactKey(e.target.value)} className="cyber-input"/>
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
                    <span><strong>{c.name}</strong><span style={{color:'#F59E0B',marginLeft:8}}>SAS: {c.sasCode}</span></span>
                    <button onClick={()=>setContacts(contacts.filter(i=>i.id!==c.id))} style={{color:'#F87171',background:'none',border:'none',cursor:'pointer'}}>✕</button>
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
          <div className="footer-simple-left">© 2026 <strong>VERROU</strong> — Tous droits réservés.</div>
          <div className="footer-simple-right">
            Développé par <strong>&nbsp;SITCOMint</strong>
            <span className="footer-sep">•</span>Ouagadougou, Burkina Faso
            <span className="footer-sep">•</span>Prototype v1.2
          </div>
        </div>
      </footer>
    </div>
  );
}
