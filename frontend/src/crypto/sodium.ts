import _sodium from 'libsodium-wrappers';

let sodiumReady: typeof _sodium | null = null;

export async function getSodium() {
  if (!sodiumReady) {
    await _sodium.ready;
    sodiumReady = _sodium;
  }
  return sodiumReady;
}