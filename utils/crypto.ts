// Browser-only crypto helpers using Web Crypto API

export async function dataUrlToBytes(dataUrl: string): Promise<Uint8Array> {
  const [, b64] = dataUrl.split(',');
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

export function bytesToDataUrl(bytes: Uint8Array, mimeType = 'application/octet-stream') {
  let bin = '';
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  const b64 = btoa(bin);
  return `data:${mimeType};base64,${b64}`;
}

export async function generateAesKey(): Promise<CryptoKey> {
  return crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, true, ['encrypt', 'decrypt']);
}

export async function importAesKey(raw: Uint8Array): Promise<CryptoKey> {
  return crypto.subtle.importKey('raw', raw, { name: 'AES-GCM' }, false, ['encrypt', 'decrypt']);
}

export async function exportAesKey(key: CryptoKey): Promise<Uint8Array> {
  const raw = await crypto.subtle.exportKey('raw', key);
  return new Uint8Array(raw);
}

export function randomIv(len = 12): Uint8Array {
  const iv = new Uint8Array(len);
  crypto.getRandomValues(iv);
  return iv;
}

export async function aesEncrypt(plaintext: Uint8Array, key: CryptoKey, iv = randomIv()) {
  const ct = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, plaintext);
  return { ciphertext: new Uint8Array(ct), iv };
}

export async function aesDecrypt(ciphertext: Uint8Array, key: CryptoKey, iv: Uint8Array) {
  const pt = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, ciphertext);
  return new Uint8Array(pt);
}

export async function deriveKeyFromPassphrase(passphrase: string, salt: Uint8Array, iterations = 210000) {
  const enc = new TextEncoder();
  const baseKey = await crypto.subtle.importKey('raw', enc.encode(passphrase), { name: 'PBKDF2' }, false, ['deriveKey']);
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations, hash: 'SHA-256' },
    baseKey,
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt']
  );
}

export function randomSalt(len = 16) {
  const s = new Uint8Array(len);
  crypto.getRandomValues(s);
  return s;
}

