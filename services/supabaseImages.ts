// Client-side helpers for encrypted image storage in Supabase
// This assumes images are encrypted client-side. We only upload ciphertext.

import { supabase } from '@/lib/supabaseClient';

export type EncryptedUpload = {
  ciphertext: ArrayBuffer; // encrypted bytes
  mimeType: string; // original type (for client use)
  fkWrapped: Uint8Array; // file key wrapped with user master key
  metaEnc: Uint8Array; // encrypted JSON metadata
};

export async function ensureSignedIn() {
  if (!supabase) throw new Error('Supabase not configured');
  const { data } = await supabase.auth.getUser();
  if (!data?.user) throw new Error('Not signed in');
  return data.user;
}

export async function uploadEncryptedImage(payload: EncryptedUpload) {
  if (!supabase) throw new Error('Supabase not configured');
  const user = await ensureSignedIn();

  const path = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.bin`;
  const bucket = 'images';

  // Upload ciphertext to Storage (private bucket)
  const { error: upErr } = await supabase.storage
    .from(bucket)
    .upload(path, new Blob([payload.ciphertext]), {
      cacheControl: '31536000',
      upsert: false,
      contentType: 'application/octet-stream',
    });
  if (upErr) throw upErr;

  // Store DB row with wrapped key + encrypted metadata
  const { error: dbErr } = await supabase.from('image_objects').insert({
    user_id: user.id,
    storage_path: path,
    size: (payload.ciphertext as any).byteLength ?? 0,
    fk_wrapped: Array.from(payload.fkWrapped),
    meta_enc: Array.from(payload.metaEnc),
  });
  if (dbErr) {
    // Best-effort cleanup
    await supabase.storage.from(bucket).remove([path]).catch(() => {});
    throw dbErr;
  }

  return { path };
}

export async function listMyImages() {
  if (!supabase) throw new Error('Supabase not configured');
  await ensureSignedIn();
  const { data, error } = await supabase
    .from('image_objects')
    .select('id, storage_path, size, created_at, fk_wrapped, meta_enc')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}

export async function getSignedUrl(storagePath: string) {
  if (!supabase) throw new Error('Supabase not configured');
  const { data, error } = await supabase.storage.from('images').createSignedUrl(storagePath, 60 * 5);
  if (error) throw error;
  return data.signedUrl;
}

