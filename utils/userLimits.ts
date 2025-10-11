const USER_LIMITS_KEY = 'tasaweers.userLimits';

export interface UserLimits {
  imageCount: number;
  imageLimit: number | null;
  role: string;
}

export function getUserLimits(): UserLimits | null {
  try {
    const raw = localStorage.getItem(USER_LIMITS_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    return data as UserLimits;
  } catch {
    return null;
  }
}

export function setUserLimits(limits: UserLimits): void {
  try {
    localStorage.setItem(USER_LIMITS_KEY, JSON.stringify(limits));
  } catch {}
}

export function clearUserLimits(): void {
  try {
    localStorage.removeItem(USER_LIMITS_KEY);
  } catch {}
}

export function canUserGenerate(): boolean {
  const limits = getUserLimits();
  if (!limits) return false;

  if (limits.role === 'ADMIN') return true;

  // Legacy unlimited plans also use null limit
  if (limits.imageLimit === null) return true;

  // Users with limits can generate if they haven't reached their limit
  return limits.imageCount < limits.imageLimit;
}

export function getRemainingImages(): number {
  const limits = getUserLimits();
  if (!limits || limits.role === 'ADMIN' || limits.imageLimit === null) return -1; // Unlimited usage

  return Math.max(0, limits.imageLimit - limits.imageCount);
}

export function getDefaultImageLimit(): number {
  // This is a client-side function to get the default, but it might not work reliably
  // The actual default is set server-side in the registration endpoint
  return Number(process.env.NEXT_PUBLIC_DEFAULT_USER_IMAGE_LIMIT) || 20;
}
