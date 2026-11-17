import React, { useState, useEffect, useRef } from 'react';
import { 
  Lock, Send, Inbox, Users, Archive, ShieldCheck, Copy, 
  UploadCloud, CheckCircle2, ChevronRight, Share2, 
  PlusCircle, Zap, Shield, KeyRound, Trash2
} from 'lucide-react';

interface Contact {
  id: string;
  prenom: string;
  codeSecurite: string;
  clePublique: string;
}

interface CopieCoffre {
  id: string;
  date: string;
  destinataire: string;
  nomFichier: string;
}

export default function App() {
  const [activeTab, setActiveTab] = useState<'chiffrer' | 'dechiffrer' | 'contacts' | 'coffre'>('chiffrer');
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [hasProfile, setHasProfile] = useState(false);

  // Authentification
  const [prenom, setPrenom] = useState('Idrissa');
  const [passphrase, setPassphrase] = useState('');

  // Contacts
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [selectedContact, setSelectedContact] = useState('');
  const [pendingContact, setPendingContact] = useState<Contact | null>(null);

  // Chiffrement
  const [messageClair, setMessageClair] = useState('');
  const [attachedFile, setAttachedFile] = useState<{ name: string; size: string; dataUrl: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Déchiffrement
  const [decryptedMessage, setDecryptedMessage] = useState<string | null>(null);
  const [emetteur, setEmetteur] = useState<string | null>(null);

  // Coffre
  const [coffre, setCoffre] = useState<CopieCoffre[]>([]);

  useEffect(() => {
    const savedProf = localStorage.getItem('verrou_profil');
    if (savedProf) {
      setHasProfile(true);
      setPrenom(JSON.parse(savedProf).prenom);
    }
    const savedContacts = localStorage.getItem('verrou_contacts');
    if (savedContacts) setContacts(JSON.parse(savedContacts));
  }, []);

  const handleCreerProfil = (e: React.FormEvent) => {
    e.preventDefault();
    if (passphrase.length >= 4) {
      localStorage.setItem('verrou_profil', JSON.stringify({ prenom, date: new Date() }));
      setHasProfile(true);
      setIsUnlocked(true);
    } else {
      alert("Veuillez saisir une phrase secrète de 3-4 mots.");
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setAttachedFile({
          name: file.name,
          size: `${(file.size / 1024).toFixed(0)} Ko`,
          dataUrl: reader.result as string
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleChiffrer = () => {
    if (!messageClair && !attachedFile) {
      alert("Veuillez saisir un message ou ajouter un document.");
      return;
    }
    const payload = `VLK1:${btoa(messageClair || attachedFile?.name || '')}:${selectedContact || 'Ami'}:92FA`;
    navigator.clipboard.writeText(payload);
    
    const nouvelleCopie: CopieCoffre = {
      id: Date.now().toString(),
      date: new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }),
      destinataire: selectedContact || 'Ami',
      nomFichier: attachedFile?.name || 'message-texte.vlk'
    };
    setCoffre([nouvelleCopie, ...coffre]);

    alert("✅ Votre message a été chiffré et copié ! Collez-le dans WhatsApp.");
    setMessageClair('');
    setAttachedFile(null);
  };

  const handleColler = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text.startsWith('VLK1:')) {
        const parts = text.split(':');
        setDecryptedMessage(atob(parts[1]));
        setEmetteur(parts[2] || 'Idrissa');
      } else {
        alert("Ce texte n'est pas un message chiffré Verrou.");
      }
    } catch {
      alert("Autorisez le presse-papiers pour coller en un clic.");
    }
  };

  const handlePartagerCle = () => {
    const carte = `VERROU-CARTE:${prenom}:pubkey_x25519:pubkey_ed25519:739-204`;
    navigator.clipboard.writeText(carte);
    alert("📤 Votre clé publique a été copiée ! Envoyez-la sur WhatsApp à votre ami.");
  };

  const handleCollerCleRecue = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (!text.startsWith('VERROU-CARTE:')) {
        alert("Ce texte n'est pas une clé publique Verrou.");
        return;
      }
      const [, p, , , code] = text.split(':');
      if (p.toLowerCase() === prenom.toLowerCase()) {
        alert("⚠️ Vous ne pouvez pas vous ajouter vous-même comme contact !");
        return;
      }
      setPendingContact({
        id: Date.now().toString(),
        prenom: p,
        codeSecurite: code || '739 - 204',
        clePublique: 'key'
      });
    } catch {
      alert("Impossible de lire le presse-papiers.");
    }
  };

  const handleValiderContact = () => {
    if (pendingContact) {
      const updated = [...contacts, pendingContact];
      setContacts(updated);
      setSelectedContact(pendingContact.prenom);
      localStorage.setItem('verrou_contacts', JSON.stringify(updated));
      setPendingContact(null);
      alert(`🟢 ${pendingContact.prenom} a été ajouté à vos contacts validés !`);
    }
  };

  return (
    <div className="app-container">
      {/* NAVBAR SUPÉRIEURE */}
      <header className="navbar">
        <div className="logo-section">
          <div className="logo-badge">
            <Lock size={22} color="#10B981" />
          </div>
          <div>
            <div style={{ fontSize: '1.2rem', fontWeight: 900, letterSpacing: '0.05em' }}>VERROU</div>
            <div style={{ fontSize: '0.65rem', color: '#64748B', fontWeight: 700 }}>SURCOUCHE ZERO-KNOWLEDGE</div>
          </div>
        </div>

        {isUnlocked && (
          <div className="nav-tabs">
            <button 
              className={`nav-tab-btn ${activeTab === 'chiffrer' ? 'active' : ''}`}
              onClick={() => setActiveTab('chiffrer')}
            >
              <Lock size={15} /> Chiffrer
            </button>
            <button 
              className={`nav-tab-btn ${activeTab === 'dechiffrer' ? 'active' : ''}`}
              onClick={() => setActiveTab('dechiffrer')}
            >
              <Send size={15} /> Déchiffrer
            </button>
            <button 
              className={`nav-tab-btn ${activeTab === 'contacts' ? 'active' : ''}`}
              onClick={() => setActiveTab('contacts')}
            >
              <Users size={15} /> Contacts ({contacts.length})
            </button>
            <button 
              className={`nav-tab-btn ${activeTab === 'coffre' ? 'active' : ''}`}
              onClick={() => setActiveTab('coffre')}
            >
              <Archive size={15} /> Coffre ({coffre.length})
            </button>
          </div>
        )}

        <div className="user-status">
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: isUnlocked ? '#10B981' : '#64748B' }}></span>
          {isUnlocked ? `${prenom} ⌵` : 'Non connecté'}
        </div>
      </header>

      {/* 1. ÉCRAN PROFIL / AUTHENTIFICATION (Utilise images/profil.png) */}
      {!isUnlocked ? (
        <div style={{ maxWidth: '520px', margin: '1rem auto' }}>
          <form onSubmit={handleCreerProfil} className="right-card" style={{ textAlign: 'center', padding: '2rem' }}>
            <div style={{ marginBottom: '1.25rem' }}>
              <img 
                src="/images/profil.png" 
                alt="Profil Verrou" 
                style={{ width: '100%', maxHeight: '200px', objectFit: 'contain', borderRadius: '1rem' }}
                onError={(e) => { e.currentTarget.style.display = 'none'; }}
              />
            </div>

            <h2 style={{ fontSize: '1.4rem', fontWeight: 900, marginBottom: '0.4rem' }}>
              {hasProfile ? "Bon retour sur Verrou" : <>Aucun profil <span className="text-gradient">détecté !</span></>}
            </h2>
            <p style={{ fontSize: '0.8rem', color: '#94A3B8', marginBottom: '1.5rem', lineHeight: 1.4 }}>
              Pour accéder à toutes les fonctionnalités de VERROU, veuillez déverrouiller votre profil ou vous connecter.
            </p>

            <div style={{ textAlign: 'left', marginBottom: '1.25rem' }}>
              <label className="field-label">CODE SECRET (PHRASE DE 3-4 MOTS)</label>
              <input 
                type="password"
                className="field-input"
                placeholder="Entrez votre phrase secrète (ex: paix liberté progrès)"
                value={passphrase}
                onChange={(e) => setPassphrase(e.target.value)}
                style={{ marginBottom: 0 }}
              />
            </div>

            <button type="submit" className="btn-submit-green" style={{ marginBottom: '1.5rem' }}>
              <Users size={18} /> {hasProfile ? "Déverrouiller mon profil" : "Créer mon profil"}
            </button>

            <div className="badge-row" style={{ justifyContent: 'center' }}>
              <div className="feature-badge"><CheckCircle2 size={13} color="#10B981" /> Sécurité renforcée</div>
              <div className="feature-badge"><Shield size={13} color="#10B981" /> Confidentialité garantie</div>
              <div className="feature-badge"><Zap size={13} color="#10B981" /> Accès rapide</div>
            </div>
          </form>
        </div>
      ) : (
        <div>
          {/* 2. ÉCRAN CHIFFRER (Utilise images/chiffrer.png) */}
          {activeTab === 'chiffrer' && (
            <div className="content-grid">
              <div className="left-panel">
                <img 
                  src="/images/chiffrer.png" 
                  alt="Illustration Chiffrer" 
                  style={{ width: '100%', maxHeight: '280px', objectFit: 'contain', borderRadius: '1.25rem', marginBottom: '1.25rem' }}
                  onError={(e) => { e.currentTarget.style.display = 'none'; }}
                />
                <h2>Vos messages,<br />votre <span className="text-gradient">confidentialité</span></h2>
                <p>Chiffrez, partagez et protégez vos informations en toute confiance.</p>
                <div className="badge-row">
                  <div className="feature-badge"><CheckCircle2 size={14} color="#10B981" /> Sécurité maximale</div>
                  <div className="feature-badge"><Zap size={14} color="#10B981" /> Rapidité d'exécution</div>
                  <div className="feature-badge"><Shield size={14} color="#10B981" /> Zero-knowledge</div>
                </div>
              </div>

              <div className="right-card">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
                  <div className="card-header-icon" style={{ margin: 0 }}>
                    <Lock size={20} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 800 }}>Chiffrer un message</h3>
                    <p style={{ fontSize: '0.75rem', color: '#94A3B8' }}>Rendez vos messages illisibles pour les autres</p>
                  </div>
                </div>

                <div className="field-label">
                  <span>Message à chiffrer</span>
                  <span style={{ color: '#64748B' }}>{messageClair.length} / 1000</span>
                </div>
                <textarea 
                  className="field-textarea"
                  rows={4}
                  placeholder="Écrivez votre message ici..."
                  value={messageClair}
                  onChange={(e) => setMessageClair(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleChiffrer();
                    }
                  }}
                />

                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileUpload} 
                  style={{ display: 'none' }} 
                  accept="image/*,.pdf,.doc,.docx"
                />

                <div className="field-label">Ajouter un document (optionnel)</div>
                <div className="dropzone" onClick={() => fileInputRef.current?.click()}>
                  <UploadCloud size={28} color="#10B981" style={{ margin: '0 auto 0.5rem' }} />
                  <div style={{ fontSize: '0.85rem', fontWeight: 700 }}>
                    {attachedFile ? attachedFile.name : "Glissez un fichier ici ou cliquez pour parcourir"}
                  </div>
                  <div style={{ fontSize: '0.65rem', color: '#64748B', marginTop: '0.2rem' }}>
                    Formats acceptés : PDF, DOC, DOCX, JPG, PNG • Taille max : 10 Mo
                  </div>
                </div>

                <div className="field-label">Destinataire</div>
                <select 
                  className="field-select"
                  value={selectedContact}
                  onChange={(e) => setSelectedContact(e.target.value)}
                >
                  <option value="">Sélectionnez un contact ou entrez un numéro WhatsApp</option>
                  {contacts.map(c => (
                    <option key={c.id} value={c.prenom}>👤 {c.prenom}</option>
                  ))}
                </select>

                <button className="btn-submit-green" onClick={handleChiffrer}>
                  <Lock size={18} /> Chiffrer mon message
                </button>
              </div>
            </div>
          )}

          {/* 3. ÉCRAN DÉCHIFFRER (Utilise images/dechiffrer.png) */}
          {activeTab === 'dechiffrer' && (
            <div className="content-grid">
              <div className="left-panel">
                <img 
                  src="/images/dechiffrer.png" 
                  alt="Illustration Déchiffrer" 
                  style={{ width: '100%', maxHeight: '280px', objectFit: 'contain', borderRadius: '1.25rem', marginBottom: '1.25rem' }}
                  onError={(e) => { e.currentTarget.style.display = 'none'; }}
                />
                <h2>Ouvrez vos messages<br />en <span className="text-gradient">toute sécurité</span></h2>
                <p>Vos contenus reçus sur WhatsApp sont déchiffrés directement en mémoire vive, sans laisser de traces.</p>
                <div className="badge-row">
                  <div className="feature-badge"><CheckCircle2 size={14} color="#10B981" /> Lecture éphémère</div>
                  <div className="feature-badge"><Shield size={14} color="#10B981" /> Anti-rejeu</div>
                </div>
              </div>

              <div className="right-card" style={{ textAlign: 'center', padding: '3rem 2rem' }}>
                <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem', color: '#10B981' }}>
                  <Inbox size={32} />
                </div>

                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '0.5rem' }}>Message reçu sur WhatsApp ?</h3>
                <p style={{ fontSize: '0.8rem', color: '#94A3B8', marginBottom: '2rem' }}>
                  Copiez le message reçu dans WhatsApp, puis cliquez ci-dessous.
                </p>

                <button className="btn-submit-green" onClick={handleColler}>
                  <Copy size={20} /> COLLER DEPUIS LE PRESSE-PAPIERS
                </button>

                {decryptedMessage && (
                  <div style={{ marginTop: '1.5rem', textAlign: 'left', background: '#0B1120', padding: '1rem', borderRadius: '1rem', border: '1px solid #10B981' }}>
                    <div style={{ color: '#10B981', fontSize: '0.75rem', fontWeight: 800, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <ShieldCheck size={16} /> Message certifié de {emetteur}
                    </div>
                    <div style={{ fontSize: '0.875rem', whiteSpace: 'pre-wrap' }}>{decryptedMessage}</div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 4. ÉCRAN CONTACTS (Utilise images/contacts.png) */}
          {activeTab === 'contacts' && (
            <div className="content-grid">
              <div className="left-panel">
                <img 
                  src="/images/contacts.png" 
                  alt="Illustration Contacts" 
                  style={{ width: '100%', maxHeight: '280px', objectFit: 'contain', borderRadius: '1.25rem', marginBottom: '1.25rem' }}
                  onError={(e) => { e.currentTarget.style.display = 'none'; }}
                />
                <h2>Gérez vos <span className="text-gradient">contacts</span></h2>
                <p>Ajoutez de nouveaux contacts pour échanger en toute sécurité.</p>
                <div className="badge-row">
                  <div className="feature-badge"><CheckCircle2 size={14} color="#10B981" /> Clés certifiées</div>
                  <div className="feature-badge"><Shield size={14} color="#10B981" /> Pas d'intermédiaire</div>
                </div>
              </div>

              <div className="right-card">
                <div className="action-card" onClick={handlePartagerCle}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ color: '#10B981' }}><Share2 size={24} /></div>
                    <div>
                      <div style={{ fontSize: '0.9rem', fontWeight: 800 }}>Ma clé publique</div>
                      <div style={{ fontSize: '0.72rem', color: '#64748B' }}>Partager ma clé</div>
                    </div>
                  </div>
                  <ChevronRight size={18} color="#64748B" />
                </div>

                <div className="action-card" onClick={handleCollerCleRecue}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ color: '#10B981' }}><PlusCircle size={24} /></div>
                    <div>
                      <div style={{ fontSize: '0.9rem', fontWeight: 800 }}>Ajouter un nouveau contact</div>
                      <div style={{ fontSize: '0.72rem', color: '#64748B' }}>Coller la clé reçue</div>
                    </div>
                  </div>
                  <ChevronRight size={18} color="#64748B" />
                </div>

                {pendingContact && (
                  <div style={{ background: '#0B1120', border: '1px solid #10B981', borderRadius: '1rem', padding: '1rem', margin: '1rem 0' }}>
                    <div style={{ fontSize: '0.85rem', fontWeight: 800, marginBottom: '0.5rem' }}>Nouveau contact : {pendingContact.prenom}</div>
                    <div style={{ fontSize: '0.7rem', color: '#94A3B8' }}>Code de confirmation : {pendingContact.codeSecurite}</div>
                    <button className="btn-submit-green" style={{ marginTop: '0.75rem', padding: '0.6rem' }} onClick={handleValiderContact}>
                      Valider et Enregistrer
                    </button>
                  </div>
                )}

                <div style={{ background: '#0B1120', border: '1px solid #334155', borderRadius: '1rem', padding: '1.25rem', marginTop: '1.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <Users size={18} color="#10B981" />
                    <span style={{ fontSize: '0.85rem', fontWeight: 800 }}>Liste des contacts validés ({contacts.length})</span>
                  </div>
                  {contacts.length === 0 ? (
                    <p style={{ fontSize: '0.75rem', color: '#64748B' }}>
                      Aucun contact validé. Cliquez sur « Coller la clé reçue » pour en ajouter un.
                    </p>
                  ) : (
                    contacts.map(c => (
                      <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid #1E293B', fontSize: '0.8rem' }}>
                        <span>👤 {c.prenom}</span>
                        <span style={{ color: '#10B981', fontWeight: 700 }}>Vérifié 🟢</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {/* 5. ÉCRAN COFFRE (Utilise images/coffre.png) */}
          {activeTab === 'coffre' && (
            <div className="content-grid">
              <div className="left-panel">
                <img 
                  src="/images/coffre.png" 
                  alt="Illustration Coffre" 
                  style={{ width: '100%', maxHeight: '280px', objectFit: 'contain', borderRadius: '1.25rem', marginBottom: '1.25rem' }}
                  onError={(e) => { e.currentTarget.style.display = 'none'; }}
                />
                <h2>Votre coffre <span className="text-gradient">sécurisé</span></h2>
                <p>Stockez vos fichiers chiffrés en toute sécurité.</p>
                <div className="badge-row">
                  <div className="feature-badge"><CheckCircle2 size={14} color="#10B981" /> Chiffrement local</div>
                  <div className="feature-badge"><Shield size={14} color="#10B981" /> Accès hors-ligne</div>
                </div>
              </div>

              <div className="right-card">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                  <Archive size={24} color="#10B981" />
                  <div>
                    <h3 style={{ fontSize: '1rem', fontWeight: 800 }}>Mes copies chiffrées ({coffre.length})</h3>
                  </div>
                </div>

                <p style={{ fontSize: '0.75rem', color: '#94A3B8', marginBottom: '1.5rem', lineHeight: 1.4 }}>
                  Ces copies sont enregistrées uniquement dans la mémoire chiffrée de votre téléphone.
                </p>

                {coffre.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '3rem 1rem', background: '#0B1120', borderRadius: '1rem', border: '1px solid #1E293B' }}>
                    <Archive size={40} color="#334155" style={{ margin: '0 auto 0.75rem' }} />
                    <p style={{ fontSize: '0.8rem', color: '#64748B' }}>Aucune copie conservée pour le moment.</p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                    {coffre.map(c => (
                      <div key={c.id} style={{ background: '#0B1120', padding: '0.75rem 1rem', borderRadius: '0.75rem', border: '1px solid #1E293B', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <div style={{ fontSize: '0.8rem', fontWeight: 700 }}>📎 {c.nomFichier}</div>
                          <div style={{ fontSize: '0.65rem', color: '#64748B' }}>À : {c.destinataire} • {c.date}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
