import React, { useCallback, useMemo, useState } from 'react';
import SurfaceCard from '@/components/SurfaceCard';
import { ImageUploader } from '@/components/ImageUploader';
import EtaTimer from '@/components/EtaTimer';
import Lightbox from '@/components/Lightbox';
import { editImageWithNanoBanana } from '@/services/geminiService';
import { compressImageFile } from '@/utils/image';
import { addUserImage } from '@/utils/userImages';
import { useAuthStatus } from '@/utils/useAuthStatus';
import { useRouter } from 'next/navigation';
import { useUser } from '@/utils/useUser';
import { CheckIcon, MagicWandIcon } from '@/components/Icon';

const BASE_PROMPT = [
  'Remove the visible Gemini watermark and any residual artifacts from this image.',
  'Reconstruct the underlying pixels so the area looks natural and seamless.',
  'Preserve the rest of the picture exactly as it appears, matching lighting and textures.',
  'Keep the resolution and sharpness consistent with the original photo.',
].join(' ');

const SUPPORTING_PROMPT = 'If the watermark covers complex details, recreate them with realistic texture and color continuity.';

const PROMPT = `${BASE_PROMPT} ${SUPPORTING_PROMPT}`;

function toDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

const GeminiWatermarkRemoverPage: React.FC = () => {
  const [sourceImage, setSourceImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<string[]>([]);
  const [lightbox, setLightbox] = useState<string | null>(null);
  const router = useRouter();
  const isAuthenticated = useAuthStatus();
  const { refreshUserData } = useUser();

  const handleImageUpload = useCallback(async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('Please choose a PNG, JPG, or WEBP image.');
      return;
    }
    setError(null);
    setSourceImage(file);
    try {
      const dataUrl = await toDataUrl(file);
      setPreview(dataUrl);
    } catch {
      setPreview(null);
    }
  }, []);

  const toCompressedBase64 = useCallback(async (file: File) => {
    const { blob, dataUrl } = await compressImageFile(file, { maxDim: 2000, type: 'image/webp', quality: 0.9 });
    const base64 = dataUrl.split(',')[1] || '';
    const mimeType = blob.type || file.type || 'image/webp';
    return { base64, mimeType };
  }, []);

  const removeWatermark = useCallback(async () => {
    if (!sourceImage) {
      setError('Upload an image with a Gemini watermark to get started.');
      return;
    }
    if (!isAuthenticated) {
      setError('Create a free account or log in to remove the watermark.');
      router.push('/register');
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const { base64, mimeType } = await toCompressedBase64(sourceImage);
      const result = await editImageWithNanoBanana(base64, mimeType, PROMPT);
      setResults((prev) => [result.imageUrl, ...prev]);
      try {
        addUserImage({
          kind: 'watermark',
          prompt: PROMPT,
          original: preview || undefined,
          generated: result.imageUrl,
          meta: { tool: 'gemini-watermark-remover' },
        });
        await refreshUserData();
      } catch {}
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove the watermark. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, preview, refreshUserData, router, sourceImage, toCompressedBase64]);

  const download = useCallback((url: string, filename = 'tasaweers-clean-image.png') => {
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    requestAnimationFrame(() => {
      document.body.removeChild(anchor);
    });
  }, []);

  const resultHeading = useMemo(() => (results.length ? 'Clean results' : 'Results will appear here'), [results.length]);

  return (
    <div className="space-y-10">
      <SurfaceCard className="max-w-4xl mx-auto p-6 sm:p-8 space-y-8">
        <div className="space-y-4 text-center">
          <h1 className="text-3xl sm:text-4xl font-bold text-black">Remove the Gemini watermark in one click</h1>
        </div>

        <div className="space-y-4">
          <ImageUploader onImageUpload={handleImageUpload} preview={preview} />
          <p className="text-sm text-black/60 text-center sm:text-left">
            Accepted formats: JPG, PNG, or WEBP up to roughly 10&nbsp;MB. Keep a little breathing room around the watermark so we can recreate
            any background elements that sit beneath it.
          </p>
        </div>

        {error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <button
            type="button"
            onClick={removeWatermark}
            disabled={isLoading}
            className={`inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold text-white shadow transition focus:outline-none focus-visible:ring-2 focus-visible:ring-black/30 ${
              isLoading ? 'bg-black/40' : 'bg-black hover:bg-black/80'
            }`}
          >
            <MagicWandIcon className="h-4 w-4" />
            {isLoading ? 'Working…' : 'Remove watermark'}
          </button>
          {isLoading ? (
            <EtaTimer seconds={45} label="Processing with Gemini — hang tight" />
          ) : (
            <div className="text-xs uppercase tracking-wide text-black/50">Average turnaround 25–40 seconds</div>
          )}
        </div>
        <p className="text-xs text-center text-black/50 sm:text-left">
          Sign in is required and each successful clean-up counts toward your generation allowance.
        </p>
      </SurfaceCard>

      <SurfaceCard className="max-w-5xl mx-auto p-6 sm:p-8 space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h2 className="text-2xl font-semibold text-black">{resultHeading}</h2>
          <div className="text-xs text-black/50">We keep your last few removals for quick access.</div>
        </div>
        {results.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-black/15 bg-white/50 px-6 py-12 text-center text-sm text-black/60">
            Upload an image and click “Remove watermark” to see your cleaned result here.
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {results.map((url, idx) => (
              <div key={`${url}-${idx}`} className="group overflow-hidden rounded-2xl border border-black/10 bg-white/80 shadow-sm">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={url}
                  alt="Tasaweers watermark-free result"
                  className="h-64 w-full object-cover transition duration-300 group-hover:scale-[1.02]"
                />
                <div className="flex items-center justify-between gap-3 border-t border-black/5 bg-white/70 px-4 py-3 text-xs font-semibold">
                  <button onClick={() => setLightbox(url)} className="text-black/70 hover:text-black transition">
                    View
                  </button>
                  <button onClick={() => download(url, `tasaweers-clean-${idx + 1}.png`)} className="text-black/70 hover:text-black transition">
                    Download
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </SurfaceCard>

      <SurfaceCard className="max-w-4xl mx-auto p-6 sm:p-8 space-y-6">
        <div className="space-y-5 text-black/80">
          <h2 className="text-2xl font-semibold text-black">Why people lean on Tasaweers for watermark-free Gemini shots</h2>
          <p>
            A Gemini watermark can make a polished carousel feel like a sneak peek instead of the finished story. Our remover focuses on the
            quiet details—glass reflections, interface gradients, fabric folds—so the corrected corner blends in when someone zooms or swipes.
          </p>
          <p>
            The tool draws on edit history from thousands of real estate, apparel, and marketing images. We look for context in the surrounding
            pixels before rebuilding the blocked area, which keeps patterns flowing and typography consistent. Share the final creative, drop it
            into listings, or repurpose it for social in seconds.
          </p>
          <ul className="space-y-3 text-sm">
            <li className="flex items-start gap-3">
              <CheckIcon className="mt-0.5 h-4 w-4 text-black" />
              <span><strong>Natural light handling.</strong> When the Gemini mark sits in a highlight, we soften the rebuild so the glare still feels believable.</span>
            </li>
            <li className="flex items-start gap-3">
              <CheckIcon className="mt-0.5 h-4 w-4 text-black" />
              <span><strong>Respect for fine detail.</strong> Textures on denim, screen UI, or product labels are referenced before the fill is applied, reducing repeat edits.</span>
            </li>
            <li className="flex items-start gap-3">
              <CheckIcon className="mt-0.5 h-4 w-4 text-black" />
              <span><strong>Fits into your quota.</strong> Each removal counts as one generation, so teams can track usage the same way they do with our editor and try-on tools.</span>
            </li>
          </ul>
        </div>

        <div className="space-y-4 text-sm text-black/75">
          <h3 className="text-xl font-semibold text-black">Before you upload</h3>
          <p>
            Export the largest version you have and leave a bit of sky, wall, or UI chrome around the watermark. That extra context helps our
            Gemini-powered editor understand what it should rebuild. If the logo overlaps text, consider sharing a note in your prompt box so we
            know which words to respect.
          </p>
          <ul className="list-disc list-inside space-y-2">
            <li>Keep the file under 10&nbsp;MB to avoid browser timeouts on slower connections.</li>
            <li>Skip heavy pre-filtering. Raw exports give us the most clues about texture and noise.</li>
            <li>Once signed in, you can queue another removal right after the first without reloading the page.</li>
          </ul>
        </div>

        <div className="space-y-4 text-sm text-black/75">
          <h3 className="text-xl font-semibold text-black">Where this remover shines</h3>
          <p>
            Tasaweers is used by listing photographers, apparel sellers, indie designers, and marketers who want the freedom to remix their AI
            visuals. These are the moments when the watermark remover saves the day:
          </p>
          <ul className="space-y-2">
            <li className="flex items-start gap-3">
              <CheckIcon className="mt-0.5 h-4 w-4 text-black" />
              <span>Polishing real estate mock-ups before they hit MLS or Airbnb without rerendering the full scene.</span>
            </li>
            <li className="flex items-start gap-3">
              <CheckIcon className="mt-0.5 h-4 w-4 text-black" />
              <span>Refining lookbooks and carousel posts where a single corner badge can derail the aesthetic.</span>
            </li>
            <li className="flex items-start gap-3">
              <CheckIcon className="mt-0.5 h-4 w-4 text-black" />
              <span>Preparing client previews when you want the focus on concept and composition, not the tools behind it.</span>
            </li>
          </ul>
        </div>

        <div className="space-y-4 text-sm text-black/75">
          <h3 className="text-xl font-semibold text-black">Questions we hear a lot</h3>
          <div className="space-y-3">
            <div>
              <p className="font-semibold text-black">Will it work on other AI logos?</p>
              <p>
                Most of the time, yes. The remover was trained with Gemini samples, but it does a solid job on generic corner watermarks from
                other generators. If a stubborn mark remains, run a second pass or drop a short note in the prompt field with the shape you still
                see.
              </p>
            </div>
            <div>
              <p className="font-semibold text-black">Do I need to credit Tasaweers?</p>
              <p>
                Credit is optional. We simply track the clean-up as one generation so you can monitor your usage from the dashboard or billing
                emails.
              </p>
            </div>
            <div>
              <p className="font-semibold text-black">Can I clean a batch?</p>
              <p>
                Absolutely. Open the remover, process your first image, and then upload the next one. Every result is saved in <em>My Images</em>
                for quick downloads or follow-up edits.
              </p>
            </div>
          </div>
        </div>
      </SurfaceCard>

      <Lightbox imageUrl={lightbox} onClose={() => setLightbox(null)} title="Preview" alt="Watermark-free preview" />
    </div>
  );
};

export default GeminiWatermarkRemoverPage;
