import { UserImage } from '../types';

const KEY = 'tasaweers.images';

export function getUserImages(): UserImage[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    if (!Array.isArray(arr)) return [];
    return arr as UserImage[];
  } catch {
    return [];
  }
}

export function addUserImage(img: Omit<UserImage, 'id' | 'createdAt'>): UserImage {
  const entry: UserImage = {
    ...img,
    id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now() + Math.random()),
    createdAt: Date.now(),
  };
  try {
    const arr = getUserImages();
    arr.unshift(entry);
    localStorage.setItem(KEY, JSON.stringify(arr));
  } catch {}
  return entry;
}

export function removeUserImage(id: string) {
  try {
    const arr = getUserImages().filter((x) => x.id !== id);
    localStorage.setItem(KEY, JSON.stringify(arr));
  } catch {}
}

export function clearUserImages() {
  try { localStorage.removeItem(KEY); } catch {}
}
