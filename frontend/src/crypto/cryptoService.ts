import { getSodium } from './sodium';

export interface ProfilLocal {
  prenom: string;
  clePubChiffrement: Uint8Array;
  clePriveeChiffrement: Uint8Array;
  clePubSignature: Uint8Array;
  clePriveeSignature: Uint8Array;
  empreinte: string;
}

// 1. Génération des clés de profil
export async function genererIdentite(prenom: string): Promise<ProfilLocal> {
  const sodium = await getSodium();
  const paireBox = sodium.crypto_box_keypair();
  const paireSign = sodium.crypto_sign_keypair();

  // Empreinte : Hachage des 2 clés publiques
  const donneesEmpreinte = new Uint8Array(64);
  donneesEmpreinte.set(paireBox.publicKey);
  donneesEmpreinte.set(paireSign.publicKey, 32);
  const empreinte = sodium.to_hex(sodium.crypto_generichash(32, donneesEmpreinte));

  return {
    prenom,
    clePubChiffrement: paireBox.publicKey,
    clePriveeChiffrement: paireBox.privateKey,
    clePubSignature: paireSign.publicKey,
    clePriveeSignature: paireSign.privateKey,
    empreinte
  };
}

// 2. Chiffrer un message pour un destinataire (Format VLK1)
export async function chiffrerMessage(
  texteClair: string,
  clePubDestinataire: Uint8Array,
  clePriveeExpediteur: Uint8Array
): Promise<string> {
  const sodium = await getSodium();

  // Clé de contenu aléatoire
  const cleContenu = sodium.randombytes_buf(sodium.crypto_secretstream_xchacha20poly1305_KEYBYTES);

  // Scellement de la clé de contenu pour le destinataire
  const cleContenuScellee = sodium.crypto_box_seal(cleContenu, clePubDestinataire);

  // Chiffrement du texte
  const resStream = sodium.crypto_secretstream_xchacha20poly1305_init_push(cleContenu);
  const header = resStream.header;
  const ciphertext = sodium.crypto_secretstream_xchacha20poly1305_push(
    resStream.state,
    sodium.from_string(texteClair),
    null,
    sodium.crypto_secretstream_xchacha20poly1305_TAG_FINAL
  );

  // Signature du paquet
  const paquet = {
    header: sodium.to_base64(header),
    cleScellee: sodium.to_base64(cleContenuScellee),
    donnees: sodium.to_base64(ciphertext)
  };
  const jsonStr = JSON.stringify(paquet);
  const signature = sodium.crypto_sign_detached(sodium.from_string(jsonStr), clePriveeExpediteur);

  const payloadFinal = JSON.stringify({
    paquet,
    signature: sodium.to_base64(signature)
  });

  return `VLK1:${sodium.to_base64(sodium.from_string(payloadFinal))}`;
}

// 3. Déchiffrer un message reçu
export async function dechiffrerMessage(
  messageVLK1: string,
  clePriveeDestinataire: Uint8Array,
  clePubExpediteur: Uint8Array
): Promise<string> {
  const sodium = await getSodium();
  if (!messageVLK1.startsWith('VLK1:')) {
    throw new Error("Format de message Verrou invalide.");
  }

  const base64Content = messageVLK1.replace('VLK1:', '');
  const jsonStr = sodium.to_string(sodium.from_base64(base64Content));
  const envelope = JSON.parse(jsonStr);

  // Vérifier la signature Ed25519
  const paquetStr = JSON.stringify(envelope.paquet);
  const sigBytes = sodium.from_base64(envelope.signature);
  const signatureValide = sodium.crypto_sign_verify_detached(sigBytes, sodium.from_string(paquetStr), clePubExpediteur);
  if (!signatureValide) {
    throw new Error("ALERTE : La signature de l'expéditeur est fausse ou le message a été modifié !");
  }

  // Ouvrir la boîte scellée
  const cleScelleeBytes = sodium.from_base64(envelope.paquet.cleScellee);
  const cleContenu = sodium.crypto_box_seal_open(
    cleScelleeBytes,
    sodium.crypto_box_keypair().publicKey, // ou passer les clés publiques
    clePriveeDestinataire
  );

  // Déchiffrer le flux
  const headerBytes = sodium.from_base64(envelope.paquet.header);
  const donneesBytes = sodium.from_base64(envelope.paquet.donnees);

  const state = sodium.crypto_secretstream_xchacha20poly1305_init_pull(headerBytes, cleContenu);
  const res = sodium.crypto_secretstream_xchacha20poly1305_pull(state, donneesBytes);
  if (!res) {
    throw new Error("Échec du déchiffrement du contenu.");
  }

  return sodium.to_string(res.message);
}