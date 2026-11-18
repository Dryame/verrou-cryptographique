import { openDB, type DBSchema, type IDBPDatabase } from 'idb';
import {
  calculerEmpreinteEtSas,
  creerCodeRecuperation,
  genererIdentite,
  type ProfilLocal
} from './cryptoService';
import { getSodium } from './sodium';

interface StoredIdentity {
  username: string;
  clePubChiffrement: Uint8Array;
  clePubSignature: Uint8Array;
  clePubRevoquation?: Uint8Array;
  recoveryAcknowledged?: boolean;
  salt: Uint8Array;
  nonce: Uint8Array;
  clesPriveesChiffrees: Uint8Array;
}

interface VerrouDatabase extends DBSchema {
  identities: {
    key: string;
    value: StoredIdentity;
  };
}

const DATABASE_NAME = 'verrou-identities';
const DATABASE_VERSION = 1;

function ouvrirBase(): Promise<IDBPDatabase<VerrouDatabase>> {
  return openDB<VerrouDatabase>(DATABASE_NAME, DATABASE_VERSION, {
    upgrade(db) {
      db.createObjectStore('identities');
    }
  });
}

async function deriveKey(password: string, salt: Uint8Array): Promise<Uint8Array> {
  const sodium = await getSodium();
  return sodium.crypto_pwhash(
    sodium.crypto_secretbox_KEYBYTES,
    password,
    salt,
    sodium.crypto_pwhash_OPSLIMIT_INTERACTIVE,
    sodium.crypto_pwhash_MEMLIMIT_INTERACTIVE,
    sodium.crypto_pwhash_ALG_ARGON2ID13
  );
}

export async function chargerOuCreerIdentite(
  username: string,
  password: string
): Promise<{ profil: ProfilLocal; codeRecuperation?: string }> {
  const sodium = await getSodium();
  const db = await ouvrirBase();
  const record = await db.get('identities', username);

  if (record) {
    let clesPrivees: Uint8Array;
    try {
      const key = await deriveKey(password, record.salt);
      clesPrivees = sodium.crypto_secretbox_open_easy(record.clesPriveesChiffrees, record.nonce, key);
    } catch {
      throw new Error('Phrase secrète incorrecte : impossible de déverrouiller cette identité.');
    }
    const tailleCleBox = sodium.crypto_box_SECRETKEYBYTES;
    const tailleCleSignature = sodium.crypto_sign_SECRETKEYBYTES;
    const tailleSeedRevoquation = sodium.crypto_sign_SEEDBYTES;
    const tailleAnciennesCles = tailleCleBox + tailleCleSignature;
    if (clesPrivees.length !== tailleAnciennesCles &&
        clesPrivees.length !== tailleAnciennesCles + tailleSeedRevoquation) {
      throw new Error('Les clés privées enregistrées sont endommagées.');
    }
    const seedRevoquation = clesPrivees.length === tailleAnciennesCles
      ? sodium.randombytes_buf(tailleSeedRevoquation)
      : clesPrivees.slice(tailleAnciennesCles);
    const paireRevoquation = sodium.crypto_sign_seed_keypair(seedRevoquation);
    const anciennesDonnees = clesPrivees.length === tailleAnciennesCles;
    if (anciennesDonnees) {
      const nouvellesClesPrivees = new Uint8Array(clesPrivees.length + tailleSeedRevoquation);
      nouvellesClesPrivees.set(clesPrivees);
      nouvellesClesPrivees.set(seedRevoquation, clesPrivees.length);
      const nouveauNonce = sodium.randombytes_buf(sodium.crypto_secretbox_NONCEBYTES);
      await db.put('identities', {
        ...record,
        clePubRevoquation: paireRevoquation.publicKey,
        recoveryAcknowledged: false,
        nonce: nouveauNonce,
        clesPriveesChiffrees: sodium.crypto_secretbox_easy(nouvellesClesPrivees, nouveauNonce, await deriveKey(password, record.salt))
      }, username);
      clesPrivees = nouvellesClesPrivees;
    } else if (!record.clePubRevoquation ||
        !sodium.memcmp(record.clePubRevoquation, paireRevoquation.publicKey)) {
      throw new Error('La clé de récupération enregistrée ne correspond pas à cette identité.');
    }
    const { empreinte, sasCode } = calculerEmpreinteEtSas(
      record.clePubChiffrement,
      record.clePubSignature,
      sodium
    );
    const profil: ProfilLocal = {
      prenom: username,
      clePubChiffrement: record.clePubChiffrement,
      clePriveeChiffrement: clesPrivees.slice(0, tailleCleBox),
      clePubSignature: record.clePubSignature,
      clePriveeSignature: clesPrivees.slice(tailleCleBox, tailleCleBox + tailleCleSignature),
      clePubRevoquation: paireRevoquation.publicKey,
      clePriveeRevoquationSeed: seedRevoquation,
      empreinte,
      sasCode
    };
    return {
      profil,
      ...(!record.recoveryAcknowledged || anciennesDonnees
        ? { codeRecuperation: await creerCodeRecuperation(profil) }
        : {})
    };
  }

  const profil = await genererIdentite(username);
  const salt = sodium.randombytes_buf(sodium.crypto_pwhash_SALTBYTES);
  const nonce = sodium.randombytes_buf(sodium.crypto_secretbox_NONCEBYTES);
  const key = await deriveKey(password, salt);
  const clesPrivees = new Uint8Array(
    profil.clePriveeChiffrement.length +
      profil.clePriveeSignature.length +
      profil.clePriveeRevoquationSeed.length
  );
  clesPrivees.set(profil.clePriveeChiffrement);
  clesPrivees.set(profil.clePriveeSignature, profil.clePriveeChiffrement.length);
  clesPrivees.set(
    profil.clePriveeRevoquationSeed,
    profil.clePriveeChiffrement.length + profil.clePriveeSignature.length
  );

  await db.put('identities', {
    username,
    clePubChiffrement: profil.clePubChiffrement,
    clePubSignature: profil.clePubSignature,
    clePubRevoquation: profil.clePubRevoquation,
    recoveryAcknowledged: false,
    salt,
    nonce,
    clesPriveesChiffrees: sodium.crypto_secretbox_easy(clesPrivees, nonce, key)
  }, username);

  return {
    profil,
    codeRecuperation: await creerCodeRecuperation(profil)
  };
}

export async function confirmerSauvegardeCodeRecuperation(username: string): Promise<void> {
  const db = await ouvrirBase();
  const record = await db.get('identities', username);
  if (!record) throw new Error('Identité locale introuvable.');
  await db.put('identities', { ...record, recoveryAcknowledged: true }, username);
}

export async function supprimerIdentiteLocaleParEmpreinte(empreinte: string): Promise<void> {
  const sodium = await getSodium();
  const db = await ouvrirBase();
  const transaction = db.transaction('identities', 'readwrite');
  for (const record of await transaction.store.getAll()) {
    const identity = calculerEmpreinteEtSas(
      record.clePubChiffrement,
      record.clePubSignature,
      sodium
    );
    if (identity.empreinte === empreinte) await transaction.store.delete(record.username);
  }
  await transaction.done;
}
