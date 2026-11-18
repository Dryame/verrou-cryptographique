import { openDB, type DBSchema, type IDBPDatabase } from 'idb';

export interface VaultEntry {
  id: string;
  ciphertext: string;
}

interface VaultDatabase extends DBSchema {
  entries: {
    key: string;
    value: VaultEntry;
  };
}

function openVault(identityFingerprint: string): Promise<IDBPDatabase<VaultDatabase>> {
  return openDB<VaultDatabase>(`verrou-vault-${identityFingerprint}`, 1, {
    upgrade(db) {
      db.createObjectStore('entries', { keyPath: 'id' });
    }
  });
}

export async function listVaultEntries(identityFingerprint: string): Promise<VaultEntry[]> {
  const db = await openVault(identityFingerprint);
  return db.getAll('entries');
}

export async function saveVaultEntry(identityFingerprint: string, ciphertext: string): Promise<VaultEntry> {
  const db = await openVault(identityFingerprint);
  const entry = { id: crypto.randomUUID(), ciphertext };
  await db.add('entries', entry);
  return entry;
}

export async function deleteVaultEntry(identityFingerprint: string, id: string): Promise<void> {
  const db = await openVault(identityFingerprint);
  await db.delete('entries', id);
}
