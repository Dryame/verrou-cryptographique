import { getSodium } from './sodium';

export interface ProfilLocal {
  prenom: string;
  clePubChiffrement: Uint8Array;
  clePriveeChiffrement: Uint8Array;
  clePubSignature: Uint8Array;
  clePriveeSignature: Uint8Array;
  clePubRevoquation: Uint8Array;
  clePriveeRevoquationSeed: Uint8Array;
  empreinte: string;
  sasCode: string;
}

export interface CarteContact {
  prenom: string;
  clePubChiffrement: Uint8Array;
  clePubSignature: Uint8Array;
  empreinte: string;
  sasCode: string;
}

export function calculerEmpreinteEtSas(
  clePubChiffrement: Uint8Array,
  clePubSignature: Uint8Array,
  sodium: Awaited<ReturnType<typeof getSodium>>
) {
  const clesPubliques = new Uint8Array(clePubChiffrement.length + clePubSignature.length);
  clesPubliques.set(clePubChiffrement);
  clesPubliques.set(clePubSignature, clePubChiffrement.length);
  const empreinteBytes = sodium.crypto_generichash(32, clesPubliques, null);
  const sasCode = `${100 + (((empreinteBytes[0] * 256) + empreinteBytes[1]) % 900)} - ${100 + (((empreinteBytes[2] * 256) + empreinteBytes[3]) % 900)}`;
  return { empreinte: sodium.to_hex(empreinteBytes), sasCode };
}

export async function genererIdentite(prenom: string): Promise<ProfilLocal> {
  const sodium = await getSodium();
  const paireBox = sodium.crypto_box_keypair();
  const paireSign = sodium.crypto_sign_keypair();
  const clePriveeRevoquationSeed = sodium.randombytes_buf(sodium.crypto_sign_SEEDBYTES);
  const paireRevoquation = sodium.crypto_sign_seed_keypair(clePriveeRevoquationSeed);
  const { empreinte, sasCode } = calculerEmpreinteEtSas(paireBox.publicKey, paireSign.publicKey, sodium);

  return {
    prenom,
    clePubChiffrement: paireBox.publicKey,
    clePriveeChiffrement: paireBox.privateKey,
    clePubSignature: paireSign.publicKey,
    clePriveeSignature: paireSign.privateKey,
    clePubRevoquation: paireRevoquation.publicKey,
    clePriveeRevoquationSeed,
    empreinte,
    sasCode
  };
}

export async function creerCodeRecuperation(profil: ProfilLocal): Promise<string> {
  const sodium = await getSodium();
  return `VLK-RECOVERY-V1:${profil.empreinte}:${sodium.to_hex(profil.clePriveeRevoquationSeed)}`;
}

export async function creerCarteContact(profil: ProfilLocal): Promise<string> {
  const sodium = await getSodium();
  return `VERROU-CARTE:${profil.prenom}:${sodium.to_base64(profil.clePubChiffrement)}:${sodium.to_base64(profil.clePubSignature)}`;
}

export async function lireCarteContact(carte: string): Promise<CarteContact> {
  const sodium = await getSodium();
  const prefixe = 'VERROU-CARTE:';
  if (!carte.startsWith(prefixe)) {
    throw new Error('Carte invalide : le format VERROU-CARTE est requis.');
  }

  const separateurSignature = carte.lastIndexOf(':');
  const separateurChiffrement = carte.lastIndexOf(':', separateurSignature - 1);
  if (separateurChiffrement <= prefixe.length || separateurSignature <= separateurChiffrement + 1) {
    throw new Error('Carte contact invalide ou incomplète.');
  }
  const prenom = carte.slice(prefixe.length, separateurChiffrement).trim();
  const cleChiffrementEncodee = carte.slice(separateurChiffrement + 1, separateurSignature);
  const cleSignatureEncodee = carte.slice(separateurSignature + 1);
  if (!prenom || !cleChiffrementEncodee || !cleSignatureEncodee) {
    throw new Error('Carte contact invalide ou incomplète.');
  }

  let clePubChiffrement: Uint8Array;
  let clePubSignature: Uint8Array;
  try {
    clePubChiffrement = sodium.from_base64(cleChiffrementEncodee);
    clePubSignature = sodium.from_base64(cleSignatureEncodee);
  } catch {
    throw new Error('Les clés publiques de la carte sont invalides.');
  }
  if (
    clePubChiffrement.length !== sodium.crypto_box_PUBLICKEYBYTES ||
    clePubSignature.length !== sodium.crypto_sign_PUBLICKEYBYTES
  ) {
    throw new Error('Les clés publiques de la carte ont une taille invalide.');
  }

  const { empreinte, sasCode } = calculerEmpreinteEtSas(clePubChiffrement, clePubSignature, sodium);
  return {
    prenom,
    clePubChiffrement,
    clePubSignature,
    empreinte,
    sasCode
  };
}

const AES_GCM_IV_BYTES = 12;
const AES_GCM_KEY_BYTES = 32;

function copierEnArrayBuffer(donnees: Uint8Array): ArrayBuffer {
  const buffer = new ArrayBuffer(donnees.byteLength);
  new Uint8Array(buffer).set(donnees);
  return buffer;
}

export async function chiffrerDonnees(
  donneesClaires: Uint8Array,
  clePubDestinataire: Uint8Array,
  clePriveeExpediteur: Uint8Array
): Promise<string> {
  const sodium = await getSodium();
  const cleContenu = sodium.randombytes_buf(AES_GCM_KEY_BYTES);
  const cleContenuScellee = sodium.crypto_box_seal(cleContenu, clePubDestinataire);
  const iv = sodium.randombytes_buf(AES_GCM_IV_BYTES);
  const cleAes = await crypto.subtle.importKey(
    'raw',
    copierEnArrayBuffer(cleContenu),
    { name: 'AES-GCM' },
    false,
    ['encrypt']
  );
  const donneesChiffrees = new Uint8Array(await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: copierEnArrayBuffer(iv), tagLength: 128 },
    cleAes,
    copierEnArrayBuffer(donneesClaires)
  ));
  const paquet = {
    version: 2,
    algorithme: 'AES-256-GCM',
    iv: sodium.to_base64(iv),
    cleScellee: sodium.to_base64(cleContenuScellee),
    donnees: sodium.to_base64(donneesChiffrees)
  };
  const octetsPaquet = sodium.from_string(JSON.stringify(paquet));
  const signature = sodium.crypto_sign_detached(octetsPaquet, clePriveeExpediteur);
  const enveloppe = JSON.stringify({
    paquet: sodium.to_base64(octetsPaquet),
    signature: sodium.to_base64(signature)
  });

  return `VLK2:${sodium.to_base64(sodium.from_string(enveloppe))}`;
}

export async function chiffrerMessage(
  texteClair: string,
  clePubDestinataire: Uint8Array,
  clePriveeExpediteur: Uint8Array
): Promise<string> {
  const sodium = await getSodium();
  return chiffrerDonnees(
    sodium.from_string(texteClair),
    clePubDestinataire,
    clePriveeExpediteur
  );
}

export async function dechiffrerDonnees(
  messageVLK2: string,
  clePubDestinataire: Uint8Array,
  clePriveeDestinataire: Uint8Array,
  clePubExpediteur: Uint8Array
): Promise<Uint8Array> {
  const sodium = await getSodium();
  if (!messageVLK2.startsWith('VLK2:')) {
    throw new Error('Format de message Verrou invalide.');
  }

  let enveloppe: unknown;
  try {
    enveloppe = JSON.parse(sodium.to_string(sodium.from_base64(messageVLK2.slice(5))));
  } catch {
    throw new Error('Le message chiffré est invalide ou incomplet.');
  }
  if (
    !enveloppe ||
    typeof enveloppe !== 'object' ||
    !('paquet' in enveloppe) ||
    !('signature' in enveloppe) ||
    typeof enveloppe.paquet !== 'string' ||
    typeof enveloppe.signature !== 'string'
  ) {
    throw new Error('Le message chiffré ne contient pas les données attendues.');
  }

  let octetsPaquet: Uint8Array;
  let signature: Uint8Array;
  let paquet: unknown;
  try {
    octetsPaquet = sodium.from_base64(enveloppe.paquet);
    signature = sodium.from_base64(enveloppe.signature);
    paquet = JSON.parse(sodium.to_string(octetsPaquet));
  } catch {
    throw new Error('Les données du message chiffré sont invalides.');
  }

  if (!sodium.crypto_sign_verify_detached(signature, octetsPaquet, clePubExpediteur)) {
    throw new Error("ALERTE : la signature de l'expéditeur est fausse ou le message a été modifié.");
  }
  if (!paquet || typeof paquet !== 'object' || !('iv' in paquet) || !('cleScellee' in paquet) ||
      !('donnees' in paquet) || !('version' in paquet) || !('algorithme' in paquet) ||
      typeof paquet.iv !== 'string' || typeof paquet.cleScellee !== 'string' ||
      typeof paquet.donnees !== 'string' || paquet.version !== 2 ||
      paquet.algorithme !== 'AES-256-GCM') {
    throw new Error('Le paquet chiffré ne contient pas les données attendues.');
  }

  let cleContenu: Uint8Array;
  try {
    cleContenu = sodium.crypto_box_seal_open(
      sodium.from_base64(paquet.cleScellee),
      clePubDestinataire,
      clePriveeDestinataire
    );
  } catch {
    throw new Error('Ce message ne peut pas être ouvert avec votre clé privée.');
  }

  if (cleContenu.length !== AES_GCM_KEY_BYTES) {
    throw new Error('La clé de contenu du message est invalide.');
  }
  try {
    const cleAes = await crypto.subtle.importKey(
      'raw',
      copierEnArrayBuffer(cleContenu),
      { name: 'AES-GCM' },
      false,
      ['decrypt']
    );
    return new Uint8Array(await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: copierEnArrayBuffer(sodium.from_base64(paquet.iv)), tagLength: 128 },
      cleAes,
      copierEnArrayBuffer(sodium.from_base64(paquet.donnees))
    ));
  } catch {
    throw new Error('Échec du déchiffrement AES-GCM : données altérées ou message incomplet.');
  }
}

export async function dechiffrerMessage(
  messageVLK2: string,
  clePubDestinataire: Uint8Array,
  clePriveeDestinataire: Uint8Array,
  clePubExpediteur: Uint8Array
): Promise<string> {
  const sodium = await getSodium();
  const donnees = await dechiffrerDonnees(
    messageVLK2,
    clePubDestinataire,
    clePriveeDestinataire,
    clePubExpediteur
  );
  return sodium.to_string(donnees);
}
