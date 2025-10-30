import { buildPageMetadata } from '@/lib/seoMetadata';
import Link from 'next/link';

export const metadata = buildPageMetadata('/verify');

export default function Page() {
  return (
    <div className="mx-auto max-w-xl text-center rounded-2xl border-2 border-white/30 bg-white/60 p-8 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.25)] backdrop-blur">
      <h1 className="text-3xl font-semibold text-black">Verification Not Required</h1>
      <p className="mt-4 text-black/70">
        We&apos;ve removed email verification—everything is unlocked the moment you land here.
      </p>
      <div className="mt-6">
        <Link
          href="/text2image"
          className="inline-flex items-center justify-center rounded-xl bg-black px-6 py-3 text-lg font-semibold text-white shadow hover:bg-gray-800 transition"
        >
          Jump Back In
        </Link>
      </div>
    </div>
  );
}
