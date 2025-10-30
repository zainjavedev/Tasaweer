export interface UserLimits {
  imageCount: number;
  imageLimit: number | null;
  role: string;
}

const ANONYMOUS_LIMITS: UserLimits = {
  imageCount: 0,
  imageLimit: null,
  role: 'ANONYMOUS'
};

export function getUserLimits(): UserLimits {
  return ANONYMOUS_LIMITS;
}

export function setUserLimits(): void {
  // No-op – limits are fixed for anonymous usage.
}

export function clearUserLimits(): void {
  // No-op – limits are fixed for anonymous usage.
}

export function canUserGenerate(): boolean {
  return true;
}

export function getRemainingImages(): number {
  // -1 still signals "unlimited" to existing call sites.
  return -1;
}

export function getDefaultImageLimit(): number {
  return Number.POSITIVE_INFINITY;
}
