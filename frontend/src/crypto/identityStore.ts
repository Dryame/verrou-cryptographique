import { openDB, type DBSchema, type IDBPDatabase } from 'idb';
import { calculerEmpreinteEtSas, genererIdentite, type ProfilLocal } from './cryptoService';
import { getSodium } from './sodium';

interface StoredIdentity {
  username: string;
  clePubChiffrement: Uint8Array;
  clePubSignature: Uint8Array;
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
): Promise<ProfilLocal> {
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
    if (clesPrivees.length !== tailleCleBox + tailleCleSignature) {
      throw new Error('Les clés privées enregistrées sont endommagées.');
    }
    const { empreinte, sasCode } = calculerEmpreinteEtSas(
      record.clePubChiffrement,
      record.clePubSignature,
      sodium
    );
    return {
      prenom: username,
      clePubChiffrement: record.clePubChiffrement,
      clePriveeChiffrement: clesPrivees.slice(0, tailleCleBox),
      clePubSignature: record.clePubSignature,
      clePriveeSignature: clesPrivees.slice(tailleCleBox),
      empreinte,
      sasCode
    };
  }

  const profil = await genererIdentite(username);
  const salt = sodium.randombytes_buf(sodium.crypto_pwhash_SALTBYTES);
  const nonce = sodium.randombytes_buf(sodium.crypto_secretbox_NONCEBYTES);
  const key = await deriveKey(password, salt);
  const clesPrivees = new Uint8Array(
    profil.clePriveeChiffrement.length + profil.clePriveeSignature.length
  );
  clesPrivees.set(profil.clePriveeChiffrement);
  clesPrivees.set(profil.clePriveeSignature, profil.clePriveeChiffrement.length);

  await db.put('identities', {
    username,
    clePubChiffrement: profil.clePubChiffrement,
    clePubSignature: profil.clePubSignature,
    salt,
    nonce,
    clesPriveesChiffrees: sodium.crypto_secretbox_easy(clesPrivees, nonce, key)
  }, username);

  return profil;
}
