import { getSodium } from './sodium';
import type { ProfilLocal } from './cryptoService';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/';

interface ContactKeys {
  empreinte: string;
  clePubChiffrement: Uint8Array;
  clePubSignature: Uint8Array;
}

function apiUrl(path: string): string {
  if (!API_BASE_URL) {
    throw new Error('Le registre de sécurité n’est pas configuré pour cette application.');
  }
  const baseUrl = new URL(API_BASE_URL, window.location.origin);
  if (
    baseUrl.protocol !== 'https:' &&
    baseUrl.hostname !== 'localhost' &&
    baseUrl.hostname !== '127.0.0.1'
  ) {
    throw new Error('Le registre doit être servi en HTTPS en dehors du développement local.');
  }
  return `${baseUrl.toString().replace(/\/+$/, '')}${path}`;
}

async function messageErreur(response: Response, fallback: string): Promise<string> {
  try {
    const text = await response.text();
    const body = JSON.parse(text);
    if (body && typeof body === 'object' && 'detail' in body && typeof body.detail === 'string') {
      return body.detail;
    }
  } catch (e) {
    // Si le serveur renvoie du HTML ou du texte brut, on ignore
  }
  return fallback;
}

export async function enregistrerIdentite(profil: ProfilLocal): Promise<void> {
  const sodium = await getSodium();
  const clePubRevoquationHex = sodium.to_hex(profil.clePubRevoquation);
  const message = sodium.from_string(
    `VERROU-REGISTER-V1\n${profil.empreinte}\n${clePubRevoquationHex}`
  );
  const signature = sodium.crypto_sign_detached(message, profil.clePriveeSignature);
  const payload = {
    prenom: profil.prenom,
    sel_derivation_hex: sodium.to_hex(sodium.randombytes_buf(sodium.crypto_pwhash_SALTBYTES)),
    cle_pub_chiffrement_hex: sodium.to_hex(profil.clePubChiffrement),
    cle_pub_signature_hex: sodium.to_hex(profil.clePubSignature),
    cle_pub_revoquation_hex: clePubRevoquationHex,
    empreinte: profil.empreinte,
    signature_enregistrement_hex: sodium.to_hex(signature)
  };
  const response = await fetch(apiUrl('/api/v1/profils'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    credentials: 'omit'
  });
  if (!response.ok) {
    throw new Error(await messageErreur(response, 'Impossible d’enregistrer l’identité dans le registre.'));
  }
}

export async function verifierIdentiteActive(contact: ContactKeys): Promise<void> {
  const response = await fetch(apiUrl(`/api/v1/annuaire/${encodeURIComponent(contact.empreinte)}`), {
    credentials: 'omit'
  });
  if (!response.ok) {
    if (response.status === 404) {
      throw new Error('Cette identité est absente ou révoquée dans le registre.');
    }
    throw new Error(await messageErreur(response, 'Impossible de vérifier le statut de cette identité.'));
  }
  let registryContact: any;
try {
  const text = await response.text();
  registryContact = JSON.parse(text);
} catch (e) {
  throw new Error("La réponse du serveur est invalide (format non JSON).");
}
  const sodium = await getSodium();
  if (
    !registryContact ||
    typeof registryContact !== 'object' ||
    !('empreinte' in registryContact) ||
    !('cle_pub_chiffrement_hex' in registryContact) ||
    !('cle_pub_signature_hex' in registryContact) ||
    !('statut' in registryContact) ||
    typeof registryContact.empreinte !== 'string' ||
    typeof registryContact.cle_pub_chiffrement_hex !== 'string' ||
    typeof registryContact.cle_pub_signature_hex !== 'string' ||
    registryContact.statut !== 'active' ||
    registryContact.empreinte !== contact.empreinte ||
    registryContact.cle_pub_chiffrement_hex !== sodium.to_hex(contact.clePubChiffrement) ||
    registryContact.cle_pub_signature_hex !== sodium.to_hex(contact.clePubSignature)
  ) {
    throw new Error('Les clés du contact ne correspondent pas au registre de confiance.');
  }
}

export async function revoquerIdentite(codeRecuperation: string): Promise<string> {
  const [prefix, empreinte, seedHex, extra] = codeRecuperation.trim().split(':');
  if (
    prefix !== 'VLK-RECOVERY-V1' ||
    typeof empreinte !== 'string' ||
    typeof seedHex !== 'string' ||
    !/^[0-9a-f]{64}$/i.test(empreinte) ||
    !/^[0-9a-f]{64}$/i.test(seedHex) ||
    extra !== undefined
  ) {
    throw new Error('Le code de récupération est incomplet ou invalide.');
  }

  const sodium = await getSodium();
  const cleRevoquation = sodium.crypto_sign_seed_keypair(sodium.from_hex(seedHex));
  const message = sodium.from_string(`VERROU-REVOKE-V1\n${empreinte.toLowerCase()}`);
  const signature = sodium.crypto_sign_detached(message, cleRevoquation.privateKey);
  const response = await fetch(
    apiUrl(`/api/v1/annuaire/${encodeURIComponent(empreinte.toLowerCase())}/revoquer`),
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ signature_hex: sodium.to_hex(signature) }),
      credentials: 'omit'
    }
  );
  if (!response.ok) {
    throw new Error(await messageErreur(response, 'La révocation de cette identité a échoué.'));
  }
  return empreinte.toLowerCase();
}
