import type { Metadata } from 'next';
import { getSeoConfig } from './seoConfig';

const FALLBACK_BASE_URL = 'https://tasaweers.com';

function normalizePath(pathname: string): string {
  if (!pathname) {
    return '/';
  }
  if (pathname === '/') {
    return '/';
  }
  return pathname.endsWith('/') ? pathname.slice(0, -1) : pathname;
}

export function resolveBaseUrl(): string {
  const envBase = (process.env.NEXT_PUBLIC_BASE_URL || '').trim();
  if (!envBase) {
    return FALLBACK_BASE_URL;
  }
  return envBase.replace(/\/$/, '');
}

export function buildPageMetadata(pathname: string): Metadata {
  const baseUrl = resolveBaseUrl();
  const normalizedPath = normalizePath(pathname);
  const canonicalPath = normalizedPath === '/' ? '/' : normalizedPath.startsWith('/') ? normalizedPath : `/${normalizedPath}`;
  const canonicalUrl = new URL(canonicalPath, `${baseUrl}/`).toString();
  const { title, description, keywords, robots } = getSeoConfig(normalizedPath);

  return {
    title,
    description,
    ...(keywords?.length ? { keywords } : {}),
    robots,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
  };
}

export { FALLBACK_BASE_URL };
