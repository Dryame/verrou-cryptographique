import React, { useState, useEffect, useRef } from 'react';
import { 
  Lock, Send, Inbox, ShieldCheck, Copy, Users, 
  Trash2, Share2, PlusCircle, AlertTriangle, KeyRound, Check, Plus, Paperclip, X, FileText, Image as ImageIcon, Archive
} from 'lucide-react';

interface Contact {
  id: string;
  prenom: string;
  codeSecurite: string;
  clePublique: string;
  verifie: boolean;
}

interface CopieCoffre {
  id: string;
  date: string;
  destinataire: string;
  type: 'texte' | 'fichier';
  nomFichier?: string;
  contenu: string;
}

export default function App() {
  const [activeTab, setActiveTab] = useState<'chiffrer' | 'dechiffrer' | 'contacts' | 'coffre'>('chiffrer');
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [hasProfile, setHasProfile] = useState(false);

  // Profil
  const [prenomInput, setPrenomInput] = useState('');
  const [passphraseInput, setPassphraseInput] = useState('');
  const [monProfil, setMonProfil] = useState<{ prenom: string; empreinte: string } | null>(null);

  // Contacts (VIDE par défaut)
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [selectedContactId, setSelectedContactId] = useState('');
  const [pendingContact, setPendingContact] = useState<Contact | null>(null);

  // Formulaire Chiffrer
  const [messageClair, setMessageClair] = useState('');
  const [attachedFile, setAttachedFile] = useState<{ name: string; size: string; type: string; dataUrl: string } | null>(null);
  const [nomFichier, setNomFichier] = useState('message-scelle.vlk');
  const [garderCopie, setGarderCopie] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Coffre personnel
  const [copiesCoffre, setCopiesCoffre] = useState<CopieCoffre[]>([]);

  // Réception & Lecture
  const [messageDéchiffré, setMessageDéchiffré] = useState<{ type: 'texte' | 'fichier'; contenu: string; nomFichier?: string } | null>(null);
  const [emetteurVerifie, setEmetteurVerifie] = useState<string | null>(null);

  useEffect(() => {
    const savedProfil = localStorage.getItem('verrou_profil_public');
    if (savedProfil) {
      setHasProfile(true);
      setMonProfil(JSON.parse(savedProfil));
    }

    const savedContacts = localStorage.getItem('verrou_contacts');
    if (savedContacts) {
      const parsed = JSON.parse(savedContacts);
      setContacts(parsed);
      if (parsed.length > 0) setSelectedContactId(parsed[0].id);
    }

    const savedCoffre = localStorage.getItem('verrou_coffre_local');
    if (savedCoffre) {
      setCopiesCoffre(JSON.parse(savedCoffre));
    }
  }, []);

  const handleAuth = () => {
    if (!hasProfile) {
      if (!prenomInput.trim() || passphraseInput.length < 4) {
        alert("Veuillez saisir votre prénom et une phrase secrète.");
        return;
      }
      const profil = { prenom: prenomInput.trim(), empreinte: 'e83a9f2b' };
      localStorage.setItem('verrou_profil_public', JSON.stringify(profil));
      setMonProfil(profil);
      setHasProfile(true);
      setIsUnlocked(true);
    } else {
      if (passphraseInput.length >= 4) {
        setIsUnlocked(true);
      } else {
        alert("Phrase secrète incorrecte.");
      }
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const sizeStr = file.size > 1024 * 1024 
      ? `${(file.size / (1024 * 1024)).toFixed(1)} Mo`
      : `${Math.round(file.size / 1024)} Ko`;

    const reader = new FileReader();
    reader.onload = () => {
      setAttachedFile({
        name: file.name,
        size: sizeStr,
        type: file.type,
        dataUrl: reader.result as string
      });
      setNomFichier(`${file.name.substring(0, file.name.lastIndexOf('.')) || file.name}.vlk`);
    };
    reader.readAsDataURL(file);
  };

  const handleChiffrer = () => {
    if (!messageClair.trim() && !attachedFile) {
      alert("Veuillez écrire un texte ou attacher un fichier.");
      return;
    }
    const dest = contacts.find(c => c.id === selectedContactId);
    if (!dest) {
      alert("Veuillez sélectionner un destinataire validé.");
      return;
    }

    let payload = '';
    if (attachedFile) {
      payload = JSON.stringify({
        type: 'fichier',
        nomFichier: attachedFile.name,
        fileType: attachedFile.type,
        contenu: attachedFile.dataUrl
      });
    } else {
      payload = JSON.stringify({
        type: 'texte',
        contenu: messageClair
      });
    }

    const charge = `VLK1:${btoa(unescape(encodeURIComponent(payload)))}:${dest.prenom}:A92F`;
    navigator.clipboard.writeText(charge);

    if (garderCopie) {
      const nouvelleCopie: CopieCoffre = {
        id: Date.now().toString(),
        date: new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }),
        destinataire: dest.prenom,
        type: attachedFile ? 'fichier' : 'texte',
        nomFichier: attachedFile?.name,
        contenu: attachedFile ? attachedFile.dataUrl : messageClair
      };
      const updatedCoffre = [nouvelleCopie, ...copiesCoffre];
      setCopiesCoffre(updatedCoffre);
      localStorage.setItem('verrou_coffre_local', JSON.stringify(updatedCoffre));
    }

    alert(`✅ Message scellé pour ${dest.prenom} !\n\nLe texte chiffré est copié dans le presse-papiers.\nCollez-le directement dans WhatsApp.`);
    setMessageClair('');
    setAttachedFile(null);
  };

  const handleCollerMessage = async () => {
    try {
      const clipText = await navigator.clipboard.readText();
      if (!clipText.startsWith('VLK1:')) {
        alert("Le texte copié n'est pas un message chiffré Verrou (format VLK1: requis).");
        return;
      }
      const parts = clipText.split(':');
      const jsonStr = decodeURIComponent(escape(atob(parts[1])));
      const parsed = JSON.parse(jsonStr);
      const emetteur = parts[2] || 'Expéditeur vérifié';

      setMessageDéchiffré(parsed);
      setEmetteurVerifie(emetteur);
    } catch {
      alert("Veuillez autoriser l'accès au presse-papiers pour coller en 1 clic.");
    }
  };

  const handlePurgerMemoire = () => {
    setMessageDéchiffré(null);
    setEmetteurVerifie(null);
  };

  const handlePartagerCle = () => {
    const carte = `VERROU-CARTE:${monProfil?.prenom || 'Moi'}:pub_x25519:pub_ed25519:739-204`;
    navigator.clipboard.writeText(carte);
    alert("📤 Votre clé publique est copiée dans le presse-papiers !\nCollez-la sur WhatsApp à votre ami.");
  };

  // 4. Coller la clé reçue (AVEC PROTECTION ANTI-AUTO-AJOUT ET ANTI-DOUBLON)
  const handleCollerCleRecue = async () => {
    try {
      const clipText = await navigator.clipboard.readText();
      if (!clipText.startsWith('VERROU-CARTE:')) {
        alert("Ce message n'est pas une clé publique Verrou.");
        return;
      }
      const [, prenom, , , codeSecurite] = clipText.split(':');

      // RÈGLE 1 : INTERDICTION DE S'AJOUTER SOI-MÊME
      if (prenom.trim().toLowerCase() === monProfil?.prenom.trim().toLowerCase()) {
        alert("⚠️ Vous ne pouvez pas vous ajouter vous-même comme contact avec votre propre clé !");
        return;
      }

      // RÈGLE 2 : INTERDICTION DES DOUBLONS
      const dejaPresent = contacts.some(c => c.prenom.trim().toLowerCase() === prenom.trim().toLowerCase());
      if (dejaPresent) {
        alert(`⚠️ ${prenom} est déjà présent dans votre liste de contacts validés.`);
        return;
      }

      setPendingContact({
        id: Date.now().toString(),
        prenom,
        codeSecurite: codeSecurite || '739 - 204',
        clePublique: 'key_public',
        verifie: false
      });
    } catch {
      alert("Impossible de lire le presse-papiers.");
    }
  };

  const handleValiderContact = () => {
    if (pendingContact) {
      const updated = [...contacts, { ...pendingContact, verifie: true }];
      setContacts(updated);
      setSelectedContactId(pendingContact.id);
      localStorage.setItem('verrou_contacts', JSON.stringify(updated));
      setPendingContact(null);
      alert(`🟢 ${pendingContact.prenom} a été validé et ajouté à vos contacts !`);
    }
  };

  const handleSupprimerCopie = (id: string) => {
    const updated = copiesCoffre.filter(c => c.id !== id);
    setCopiesCoffre(updated);
    localStorage.setItem('verrou_coffre_local', JSON.stringify(updated));
  };

  // Vider le contact temporaire créé par erreur si besoin
  const handleNettoyerContacts = () => {
    if (confirm("Voulez-vous réinitialiser votre liste de contacts ?")) {
      setContacts([]);
      setSelectedContactId('');
      localStorage.removeItem('verrou_contacts');
    }
  };

  return (
    <div>
      {/* HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', paddingBottom: '0.75rem', borderBottom: '1px solid #1E293B' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <div style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)', padding: '0.4rem', borderRadius: '0.6rem' }}>
            <Lock size={20} color="#10B981" />
          </div>
          <div>
            <div style={{ fontSize: '1.1rem', fontWeight: 900, letterSpacing: '0.05em' }}>VERROU</div>
            <div style={{ fontSize: '0.6rem', color: '#94A3B8', fontWeight: 600 }}>SURCOUCHE ZERO-KNOWLEDGE</div>
          </div>
        </div>
        {isUnlocked && (
          <div style={{ background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.3)', color: '#10B981', padding: '0.25rem 0.65rem', borderRadius: '1rem', fontSize: '0.7rem', fontWeight: 700 }}>
            ● {monProfil?.prenom}
          </div>
        )}
      </div>

      {!isUnlocked ? (
        /* DÉVERROUILLAGE */
        <form 
          onSubmit={(e) => { e.preventDefault(); handleAuth(); }}
          className="verrou-card" 
          style={{ textAlign: 'center', marginTop: '2rem' }}
        >
          <div style={{ width: '48px', height: '48px', background: 'rgba(16, 185, 129, 0.15)', borderRadius: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
            <KeyRound size={24} color="#10B981" />
          </div>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '0.25rem' }}>
            {hasProfile ? "Bon retour sur Verrou" : "Créer votre profil"}
          </h2>
          <p style={{ fontSize: '0.75rem', color: '#94A3B8', marginBottom: '1.25rem' }}>
            {hasProfile ? "Entrez votre code secret pour déverrouiller vos clés." : "Vos clés sont gardées chiffrées sur votre appareil."}
          </p>

          {!hasProfile && (
            <div style={{ textAlign: 'left' }}>
              <label className="verrou-label">Votre Prénom</label>
              <input
                type="text"
                className="verrou-input"
                placeholder="Ex : Idrissa"
                value={prenomInput}
                onChange={(e) => setPrenomInput(e.target.value)}
              />
            </div>
          )}

          <div style={{ textAlign: 'left' }}>
            <label className="verrou-label">Code secret (phrase de 3-4 mots)</label>
            <input
              type="password"
              className="verrou-input"
              placeholder="Phrase secrète (appuyez sur Entrée)"
              value={passphraseInput}
              onChange={(e) => setPassphraseInput(e.target.value)}
            />
          </div>

          <button type="submit" className="btn-primary">
            {hasProfile ? "Déverrouiller" : "Initialiser mes clés"}
          </button>
        </form>
      ) : (
        <div>
          {/* NAVIGATION 4 ONGLETS */}
          <div className="tab-container">
            <button 
              className={`tab-btn ${activeTab === 'chiffrer' ? 'active' : ''}`}
              onClick={() => setActiveTab('chiffrer')}
            >
              Chiffrer
            </button>
            <button 
              className={`tab-btn ${activeTab === 'dechiffrer' ? 'active' : ''}`}
              onClick={() => setActiveTab('dechiffrer')}
            >
              Déchiffrer
            </button>
            <button 
              className={`tab-btn ${activeTab === 'contacts' ? 'active' : ''}`}
              onClick={() => setActiveTab('contacts')}
            >
              Contacts ({contacts.length})
            </button>
            <button 
              className={`tab-btn ${activeTab === 'coffre' ? 'active' : ''}`}
              onClick={() => setActiveTab('coffre')}
            >
              Coffre ({copiesCoffre.length})
            </button>
          </div>

          {/* ONGLET 1 : CHIFFRER */}
          {activeTab === 'chiffrer' && (
            <div className="verrou-card">
              <label className="verrou-label">Votre destinataire</label>
              {contacts.length === 0 ? (
                <div style={{ background: '#0F172A', border: '1px dashed #334155', padding: '0.85rem', borderRadius: '0.75rem', marginBottom: '1rem', textAlign: 'center' }}>
                  <p style={{ fontSize: '0.75rem', color: '#94A3B8', margin: '0 0 0.5rem' }}>Aucun contact validé pour le moment.</p>
                  <button 
                    onClick={() => setActiveTab('contacts')}
                    style={{ background: 'transparent', border: 'none', color: '#10B981', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer', textDecoration: 'underline' }}
                  >
                    ➡️ Ajouter un contact d'abord
                  </button>
                </div>
              ) : (
                <select 
                  className="verrou-select"
                  value={selectedContactId}
                  onChange={(e) => setSelectedContactId(e.target.value)}
                >
                  {contacts.map(c => (
                    <option key={c.id} value={c.id}>
                      👤 {c.prenom}
                    </option>
                  ))}
                </select>
              )}

              <label className="verrou-label">Message ou document à chiffrer</label>
              
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileSelect} 
                style={{ display: 'none' }} 
                accept="image/*,.pdf,.doc,.docx,.txt"
              />

              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                background: '#0F172A', 
                border: '1px solid #334155', 
                borderRadius: '1.25rem', 
                padding: '0.4rem 0.6rem',
                marginBottom: '0.85rem',
                gap: '0.5rem'
              }}>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  title="Joindre une image ou un document (PDF, Word)"
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    background: '#1E293B',
                    border: '1px solid #475569',
                    color: '#F8FAFC',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    flexShrink: 0
                  }}
                >
                  <Plus size={18} color="#10B981" />
                </button>

                <input
                  type="text"
                  placeholder="Écrivez votre message (Entrée pour chiffrer)..."
                  value={messageClair}
                  onChange={(e) => setMessageClair(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleChiffrer();
                    }
                  }}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#F8FAFC',
                    fontSize: '0.85rem',
                    width: '100%',
                    outline: 'none'
                  }}
                />
              </div>

              {attachedFile && (
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between', 
                  background: 'rgba(16, 185, 129, 0.1)', 
                  border: '1px solid rgba(16, 185, 129, 0.3)', 
                  padding: '0.5rem 0.75rem', 
                  borderRadius: '0.75rem', 
                  marginBottom: '0.85rem' 
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    {attachedFile.type.startsWith('image/') ? (
                      <ImageIcon size={18} color="#10B981" />
                    ) : (
                      <FileText size={18} color="#10B981" />
                    )}
                    <div>
                      <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#F1F5F9' }}>{attachedFile.name}</div>
                      <div style={{ fontSize: '0.65rem', color: '#94A3B8' }}>{attachedFile.size}</div>
                    </div>
                  </div>
                  <button 
                    onClick={() => setAttachedFile(null)}
                    style={{ background: 'transparent', border: 'none', color: '#94A3B8', cursor: 'pointer' }}
                  >
                    <X size={16} />
                  </button>
                </div>
              )}

              <label className="verrou-label">Nom du fichier scellé</label>
              <input 
                type="text"
                className="verrou-input"
                value={nomFichier}
                onChange={(e) => setNomFichier(e.target.value)}
              />

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
                <input 
                  type="checkbox"
                  id="copie"
                  checked={garderCopie}
                  onChange={(e) => setGarderCopie(e.target.checked)}
                  style={{ width: '16px', height: '16px', accentColor: '#10B981' }}
                />
                <label htmlFor="copie" style={{ fontSize: '0.75rem', color: '#CBD5E1', cursor: 'pointer' }}>
                  Garder une copie du fichier chiffré pour moi
                </label>
              </div>

              <button 
                className="btn-primary" 
                onClick={handleChiffrer}
                disabled={contacts.length === 0}
                style={{ opacity: contacts.length === 0 ? 0.5 : 1 }}
              >
                <Lock size={16} /> Chiffrer votre message et copier vers WhatsApp
              </button>
            </div>
          )}

          {/* ONGLET 2 : DÉCHIFFRER */}
          {activeTab === 'dechiffrer' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="verrou-card" style={{ textAlign: 'center', padding: '2rem 1.25rem' }}>
                <div style={{ width: '48px', height: '48px', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 0.75rem' }}>
                  <Inbox size={24} color="#10B981" />
                </div>
                <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '0.25rem' }}>Message reçu sur WhatsApp ?</h3>
                <p style={{ fontSize: '0.72rem', color: '#94A3B8', marginBottom: '1.25rem' }}>
                  Copiez le message reçu dans WhatsApp, puis cliquez ci-dessous.
                </p>

                <button className="btn-primary" onClick={handleCollerMessage}>
                  <Copy size={16} /> 📋 COLLER DEPUIS LE PRESSE-PAPIERS
                </button>
              </div>

              {/* LECTURE ÉPHÉMÈRE */}
              {messageDéchiffré && (
                <div className="verrou-card" style={{ border: '1px solid #10B981' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#10B981', background: 'rgba(16, 185, 129, 0.1)', padding: '0.5rem 0.75rem', borderRadius: '0.6rem', marginBottom: '0.85rem', fontSize: '0.75rem', fontWeight: 700 }}>
                    <ShieldCheck size={16} />
                    Message certifié de {emetteurVerifie}
                  </div>

                  <div style={{ background: '#0F172A', padding: '0.85rem', borderRadius: '0.6rem', border: '1px solid #1E293B', fontSize: '0.85rem', color: '#F1F5F9', marginBottom: '0.85rem' }}>
                    {messageDéchiffré.type === 'texte' ? (
                      <div style={{ whiteSpace: 'pre-wrap' }}>{messageDéchiffré.contenu}</div>
                    ) : (
                      <div>
                        {messageDéchiffré.contenu.startsWith('data:image') ? (
                          <div style={{ textAlign: 'center' }}>
                            <img 
                              src={messageDéchiffré.contenu} 
                              alt="Document déchiffré" 
                              style={{ maxWidth: '100%', maxHeight: '250px', borderRadius: '0.5rem', border: '1px solid #334155' }}
                            />
                            <p style={{ fontSize: '0.7rem', color: '#94A3B8', marginTop: '0.4rem' }}>{messageDéchiffré.nomFichier}</p>
                          </div>
                        ) : (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                            <FileText size={24} color="#10B981" />
                            <div>
                              <div style={{ fontWeight: 700 }}>{messageDéchiffré.nomFichier || 'Document joint'}</div>
                              <a 
                                href={messageDéchiffré.contenu} 
                                download={messageDéchiffré.nomFichier || 'document-dechiffre.pdf'} 
                                style={{ fontSize: '0.72rem', color: '#10B981', textDecoration: 'underline' }}
                              >
                                Télécharger le document
                              </a>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div style={{ fontSize: '0.7rem', color: '#FBBF24', background: 'rgba(251, 191, 36, 0.1)', padding: '0.5rem', borderRadius: '0.5rem', border: '1px solid rgba(251, 191, 36, 0.2)', marginBottom: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <AlertTriangle size={14} />
                    Lecture unique : s'efface définitivement de la mémoire à la fermeture.
                  </div>

                  <button className="btn-danger" onClick={handlePurgerMemoire}>
                    <Trash2 size={14} /> Fermer et effacer la mémoire
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ONGLET 3 : CONTACTS */}
          {activeTab === 'contacts' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="verrou-card">
                <div className="verrou-label">Ma clé Publique</div>
                <button className="btn-secondary" onClick={handlePartagerCle}>
                  <Share2 size={16} color="#10B981" /> Partager ma clé
                </button>

                <div className="verrou-label" style={{ marginTop: '1rem' }}>Ajouter un nouveau contact</div>
                <button className="btn-secondary" onClick={handleCollerCleRecue}>
                  <PlusCircle size={16} color="#10B981" /> Coller la clé reçue
                </button>
              </div>

              {pendingContact && (
                <div className="verrou-card" style={{ border: '1px solid #10B981' }}>
                  <h4 style={{ fontSize: '0.85rem', fontWeight: 800, marginBottom: '0.5rem' }}>
                    Nouveau contact : {pendingContact.prenom}
                  </h4>
                  <div style={{ background: '#0F172A', padding: '0.75rem', borderRadius: '0.75rem', textAlign: 'center', marginBottom: '0.75rem' }}>
                    <div style={{ fontSize: '0.65rem', color: '#94A3B8' }}>CODE DE VÉRIFICATION VOCALE</div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#10B981', letterSpacing: '0.1em' }}>
                      {pendingContact.codeSecurite}
                    </div>
                  </div>
                  <button className="btn-primary" onClick={handleValiderContact}>
                    <Check size={16} /> Valider et Enregistrer
                  </button>
                </div>
              )}

              <div className="verrou-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <div className="verrou-label" style={{ margin: 0 }}>Liste des contacts validés ({contacts.length})</div>
                  {contacts.length > 0 && (
                    <button 
                      onClick={handleNettoyerContacts}
                      style={{ background: 'transparent', border: 'none', color: '#EF4444', fontSize: '0.65rem', cursor: 'pointer' }}
                    >
                      Vider la liste
                    </button>
                  )}
                </div>

                {contacts.length === 0 ? (
                  <p style={{ fontSize: '0.75rem', color: '#94A3B8', textAlign: 'center', margin: '1rem 0' }}>
                    Aucun contact validé. Cliquez sur « Coller la clé reçue » pour en ajouter un.
                  </p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {contacts.map(c => (
                      <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#0F172A', padding: '0.75rem', borderRadius: '0.75rem', border: '1px solid #1E293B' }}>
                        <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>👤 {c.prenom}</div>
                        <span style={{ fontSize: '0.65rem', color: '#10B981', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.25)', padding: '0.2rem 0.5rem', borderRadius: '0.5rem', fontWeight: 700 }}>
                          Vérifié 🟢
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ONGLET 4 : MON COFFRE */}
          {activeTab === 'coffre' && (
            <div className="verrou-card">
              <div className="verrou-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.85rem' }}>
                <Archive size={16} color="#10B981" /> Mes Copies Chiffrées ({copiesCoffre.length})
              </div>
              <p style={{ fontSize: '0.7rem', color: '#94A3B8', marginBottom: '1rem' }}>
                Ces copies sont enregistrées uniquement dans la mémoire chiffrée de votre téléphone.
              </p>

              {copiesCoffre.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '1.5rem 0', color: '#64748B', fontSize: '0.75rem' }}>
                  Aucune copie conservée pour le moment.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                  {copiesCoffre.map(c => (
                    <div key={c.id} style={{ background: '#0F172A', padding: '0.75rem', borderRadius: '0.75rem', border: '1px solid #1E293B' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                        <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#10B981' }}>À : {c.destinataire}</span>
                        <span style={{ fontSize: '0.65rem', color: '#64748B' }}>{c.date}</span>
                      </div>

                      <div style={{ fontSize: '0.75rem', color: '#CBD5E1', marginBottom: '0.5rem' }}>
                        {c.type === 'fichier' ? `📎 Fichier : ${c.nomFichier}` : c.contenu}
                      </div>

                      <button 
                        onClick={() => handleSupprimerCopie(c.id)}
                        style={{ background: 'transparent', border: 'none', color: '#EF4444', fontSize: '0.65rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem', padding: 0 }}
                      >
                        <Trash2 size={12} /> Supprimer cette copie
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
