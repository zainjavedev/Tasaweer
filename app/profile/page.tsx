import { buildPageMetadata } from '@/lib/seoMetadata';
import Link from 'next/link';

export const metadata = buildPageMetadata('/profile');

export default function Page() {
  return (
    <div className="mx-auto max-w-2xl rounded-2xl border-2 border-white/30 bg-white/60 p-8 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.25)] backdrop-blur">
      <h1 className="text-3xl font-semibold text-black">Create Without Limits</h1>
      <p className="mt-4 text-black/70">
        User accounts, passwords, and quotas are gone. The profile page now simply confirms that the entire Tasaweers toolset is open to everyone from the moment you arrive.
      </p>
      <p className="mt-3 text-black/70">
        Your edits and generations stay in your browser. Download anything you love, or just keep exploring.
      </p>
      <div className="mt-6">
        <Link
          href="/text2image"
          className="inline-flex items-center justify-center rounded-xl bg-black px-6 py-3 text-lg font-semibold text-white shadow hover:bg-gray-800 transition"
        >
          Continue Creating
        </Link>
      </div>
    </div>
  );
}
