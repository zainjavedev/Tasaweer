import React, { useCallback, useMemo, useState } from 'react';
import SurfaceCard from '@/components/SurfaceCard';
import { ImageUploader } from '@/components/ImageUploader';
import { AspectRatioSelector } from '@/components/AspectRatioSelector';
import { editImageWithNanoBanana } from '@/services/geminiService';
import { compressImageFile } from '@/utils/image';
import { addUserImage } from '@/utils/userImages';
import { useRouter } from 'next/navigation';
import { useAuthStatus } from '@/utils/useAuthStatus';
import { useUser } from '@/utils/useUser';
import EtaTimer from '@/components/EtaTimer';
import Lightbox from '@/components/Lightbox';
import {
  CheckIcon,
  MagicWandIcon,
  SparklesIcon,
  YoutubeIcon,
} from '@/components/Icon';

const PRESET_PROMPTS = [
  {
    id: 'reaction',
    label: 'Viral reaction',
    prompt:
      'Transform this photo into a YouTube thumbnail featuring a close-up reaction pose, sharpen facial expression, add a bold headline space, and keep colors cinematic.',
  },
  {
    id: 'before-after',
    label: 'Before vs after',
    prompt:
      'Create a YouTube thumbnail that splits the scene into a before and after story with a diagonal divider, vibrant contrast, and clear space for text on the right.',
  },
  {
    id: 'tutorial',
    label: 'Step-by-step tutorial',
    prompt:
      'Design a YouTube tutorial thumbnail with clean layout, room for three short labels, a centered subject, and bright guiding arrows.',
  },
  {
    id: 'tech-review',
    label: 'Tech review',
    prompt:
      'Make a YouTube tech review thumbnail with a floating product, glossy reflections, modern gradients, and high contrast edges.',
  },
  {
    id: 'gaming',
    label: 'Gaming energy',
    prompt:
      'Style this image as a gaming thumbnail with neon rim lights, explosive background energy, and bold space for a two word headline.',
  },
  {
    id: 'lifestyle',
    label: 'Lifestyle vlog',
    prompt:
      'Turn this photo into a lifestyle vlog thumbnail with warm tones, subtle lens flare, and a friendly handwritten style for the headline area.',
  },
] as const;

const STYLE_ENHANCERS = [
  {
    id: 'contrast-pop',
    label: 'Punchy contrast',
    prompt: 'Boost contrast, clarity, and saturation for a vivid, scroll-stopping thumbnail look.',
  },
  {
    id: 'subject-outline',
    label: 'Outline subject',
    prompt: 'Add a clean neon outline around the main subject so they pop off the background.',
  },
  {
    id: 'face-brighten',
    label: 'Brighten faces',
    prompt: 'Brighten and smooth faces while keeping skin tones natural and eyes sharp.',
  },
  {
    id: 'cinematic-glow',
    label: 'Cinematic glow',
    prompt: 'Apply a cinematic rim light and soft glow to draw attention to the focal point.',
  },
  {
    id: 'depth-shadows',
    label: 'Depth shadows',
    prompt: 'Add subtle drop shadows and depth layering behind the subject for dimension.',
  },
] as const;

const CTA_STICKERS = [
  {
    id: 'subscribe-badge',
    label: 'Subscribe badge',
    prompt: 'Add a small red SUBSCRIBE badge in a corner without covering key faces.',
  },
  {
    id: 'arrow-accent',
    label: 'Directional arrow',
    prompt: 'Include a bold arrow that guides attention toward the main action or text.',
  },
  {
    id: 'timer-urgency',
    label: 'Urgency timer',
    prompt: 'Overlay a minimal countdown timer icon to suggest urgency.',
  },
  {
    id: 'before-after-divider',
    label: 'Diagonal swipe',
    prompt: 'Use a diagonal swipe graphic that separates before and after areas cleanly.',
  },
  {
    id: 'shorts-tag',
    label: 'Shorts tag',
    prompt: 'Place a subtle Shorts style badge while keeping the canvas in 16:9.',
  },
] as const;

const PLAYBOOK_COLUMNS = [
  {
    title: 'Grab attention fast',
    bullets: [
      'Lead with the strongest emotion or moment from your footage.',
      'Keep background simple; let contrast, lighting, and color do the work.',
      'Reserve clear space for 3–5 words of headline text.',
    ],
  },
  {
    title: 'Tell a story at a glance',
    bullets: [
      'Use arrows, circles, or outlined shapes to point at the transformation.',
      'Stack layers: subject, supporting object, background glow.',
      'Balance warm and cool tones so the subject stays readable.',
    ],
  },
  {
    title: 'Convert the click',
    bullets: [
      'Highlight value: before/after, giveaway, timer, or insider tip.',
      'Brand subtly with consistent colors and recurring badges.',
      'Keep text readable at 200px wide by using bold, blocky fonts.',
    ],
  },
] as const;

const FAQ_ITEMS = [
  {
    q: 'What image size is best for YouTube thumbnails?',
    a: 'YouTube recommends 1280×720 (16:9). Use the aspect ratio selector to keep the right proportions; exports arrive ready to upload.',
  },
  {
    q: 'Can I reuse branding elements?',
    a: 'Yes. Upload your logos or previous thumbnails as reference images so Gemini keeps the same fonts, colors, or badges.',
  },
  {
    q: 'How do I keep text readable?',
    a: 'Pick a preset, then add the headline bar or outline boosters so the model leaves contrast-rich space for titles.',
  },
] as const;

const maxRefImages = 3;

const toDataUrl = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

const toCompressedBase64 = async (file: File) => {
  const { blob, dataUrl } = await compressImageFile(file, { maxDim: 2000, type: 'image/webp', quality: 0.88 });
  return {
    base64: dataUrl.split(',')[1] || '',
    mimeType: blob.type || file.type || 'image/webp',
  };
};

const YouTubeThumbnailEditorPage: React.FC = () => {
  const [sourceImage, setSourceImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [prompt, setPrompt] = useState<string>(
    'Turn this into a high-impact YouTube thumbnail with bold contrast, headline space, and the subject centered with dramatic lighting.'
  );
  const [selectedRatio, setSelectedRatio] = useState<string>('16:9');
  const [selectedEnhancers, setSelectedEnhancers] = useState<string[]>([]);
  const [selectedBadges, setSelectedBadges] = useState<string[]>([]);
  const [refImages, setRefImages] = useState<File[]>([]);
  const [refPreviews, setRefPreviews] = useState<string[]>([]);
  const [results, setResults] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lightbox, setLightbox] = useState<string | null>(null);
  const router = useRouter();
  const isAuthenticated = useAuthStatus();
  const { refreshUserData } = useUser();

  const additionMap = useMemo(() => {
    const map: Record<string, string> = {};
    STYLE_ENHANCERS.forEach((item) => {
      map[item.id] = item.prompt;
    });
    CTA_STICKERS.forEach((item) => {
      map[item.id] = item.prompt;
    });
    return map;
  }, []);

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

  const addRefFiles = useCallback((files: FileList | File[] | null) => {
    if (!files?.length) return;
    const incoming = Array.from(files).filter((file) => file.type.startsWith('image/'));
    if (!incoming.length) return;
    const remainingSlots = Math.max(0, maxRefImages - refImages.length);
    if (!remainingSlots) return;
    const next = incoming.slice(0, remainingSlots);
    next.forEach(async (file) => {
      try {
        const dataUrl = await toDataUrl(file);
        setRefPreviews((prev) => [...prev, dataUrl]);
      } catch {
        // ignore preview errors
      }
    });
    setRefImages((prev) => [...prev, ...next]);
  }, [refImages.length]);

  const removeRefAt = useCallback((index: number) => {
    setRefImages((prev) => prev.filter((_, i) => i !== index));
    setRefPreviews((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const toggleEnhancer = (id: string) => {
    setSelectedEnhancers((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const toggleBadge = (id: string) => {
    setSelectedBadges((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const clearSelections = () => {
    setSelectedEnhancers([]);
    setSelectedBadges([]);
  };

  const handleGenerate = useCallback(async () => {
    if (!sourceImage) {
      setError('Upload a base image to start crafting your thumbnail.');
      return;
    }
    if (!prompt.trim()) {
      setError('Describe how you want the thumbnail to look.');
      return;
    }
    if (!isAuthenticated) {
      setError('Create a free account or log in to generate thumbnails.');
      router.push('/register');
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const { base64, mimeType } = await toCompressedBase64(sourceImage);
      const additions = [...selectedEnhancers, ...selectedBadges]
        .map((id) => additionMap[id])
        .filter(Boolean);
      const finalPrompt = [prompt.trim(), ...additions].join(' ');
      let additionalImages: { data: string; mimeType: string }[] | undefined;
      if (refImages.length) {
        additionalImages = await Promise.all(
          refImages.map(async (file) => {
            const { blob, dataUrl } = await compressImageFile(file, { maxDim: 1600, type: 'image/webp', quality: 0.88 });
            return {
              data: dataUrl.split(',')[1] || '',
              mimeType: blob.type || file.type || 'image/webp',
            };
          })
        );
      }
      const result = await editImageWithNanoBanana(base64, mimeType, finalPrompt, additionalImages, selectedRatio);
      setResults((prev) => [result.imageUrl, ...prev]);
      try {
        addUserImage({
          kind: 'edit',
          prompt: finalPrompt,
          original: preview || undefined,
          generated: result.imageUrl,
          meta: {
            tool: 'youtube-thumbnail-editor',
            ratio: selectedRatio,
            boosters: [...selectedEnhancers, ...selectedBadges],
          },
        });
        await refreshUserData();
      } catch {
        // ignore analytics errors
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate a thumbnail. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [
    additionMap,
    isAuthenticated,
    preview,
    refImages,
    router,
    selectedBadges,
    selectedEnhancers,
    selectedRatio,
    sourceImage,
    prompt,
    refreshUserData,
  ]);

  const download = useCallback((url: string, filename = 'tasaweers-thumbnail.png') => {
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    requestAnimationFrame(() => {
      document.body.removeChild(anchor);
    });
  }, []);

  const selectionSummary = useMemo(() => {
    if (!selectedEnhancers.length && !selectedBadges.length) return 'No boosters selected yet.';
    const labels: string[] = [];
    STYLE_ENHANCERS.forEach((item) => {
      if (selectedEnhancers.includes(item.id)) labels.push(item.label);
    });
    CTA_STICKERS.forEach((item) => {
      if (selectedBadges.includes(item.id)) labels.push(item.label);
    });
    return `Boosters: ${labels.join(', ')}.`;
  }, [selectedBadges, selectedEnhancers]);

  return (
    <div className="space-y-10">
      <SurfaceCard className="max-w-5xl mx-auto p-6 sm:p-8 space-y-8">
        <div className="space-y-4 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white/50 px-3 py-1 text-xs font-semibold text-black/70">
            <YoutubeIcon className="h-4 w-4 text-red-600" />
            YouTube Thumbnail Editor
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-black">Make scroll-stopping YouTube thumbnails in minutes</h1>
          <p className="text-base text-black/70 sm:text-lg">
            Upload your still, choose a storytelling preset, then stack boosters like neon outlines, badges, or divider swipes.
            Tasaweers keeps everything on-brand and export-ready for YouTube.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.1fr,0.9fr]">
          <div className="space-y-6">
            <ImageUploader onImageUpload={handleImageUpload} preview={preview} />

            <div className="space-y-3">
              <label className="text-sm font-semibold text-black">Prompt</label>
              <textarea
                className="min-h-[112px] w-full rounded-2xl border border-black/15 bg-white/70 px-4 py-3 text-sm text-black focus:border-black/30 focus:outline-none focus:ring-2 focus:ring-black/10"
                placeholder="Describe the story, mood, or outcome you want..."
                value={prompt}
                onChange={(event) => setPrompt(event.target.value)}
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <span className="text-sm font-semibold text-black">Popular presets</span>
                <button
                  type="button"
                  onClick={clearSelections}
                  className="text-xs font-semibold uppercase tracking-wide text-black/50 hover:text-black"
                >
                  Clear boosters
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {PRESET_PROMPTS.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setPrompt(item.prompt);
                      clearSelections();
                    }}
                    className="inline-flex items-center gap-2 rounded-full border border-black/15 bg-white px-3 py-1.5 text-xs font-semibold text-black/80 hover:border-black/40 hover:text-black transition"
                  >
                    <SparklesIcon className="h-3.5 w-3.5" />
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <span className="text-sm font-semibold text-black">Style boosters</span>
                <p className="text-xs text-black/60">Toggle a few to keep your channel&apos;s look consistent.</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {STYLE_ENHANCERS.map((item) => {
                  const active = selectedEnhancers.includes(item.id);
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => toggleEnhancer(item.id)}
                      className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                        active ? 'border-black bg-black text-white shadow' : 'border-black/15 bg-white text-black/75 hover:border-black/40 hover:text-black'
                      }`}
                    >
                      {item.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <span className="text-sm font-semibold text-black">Call-to-action add-ons</span>
                <p className="text-xs text-black/60">Badges, dividers, or overlays to lift clicks.</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {CTA_STICKERS.map((item) => {
                  const active = selectedBadges.includes(item.id);
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => toggleBadge(item.id)}
                      className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                        active ? 'border-black bg-black text-white shadow' : 'border-black/15 bg-white text-black/75 hover:border-black/40 hover:text-black'
                      }`}
                    >
                      {item.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-2 rounded-2xl border border-black/10 bg-black/5 px-4 py-3 text-sm text-black/70">
              <div className="flex items-center gap-2 font-semibold text-black">
                <CheckIcon className="h-4 w-4" />
                {selectionSummary}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <AspectRatioSelector selectedRatio={selectedRatio} onSelect={setSelectedRatio} />
            <div className="space-y-2">
              <span className="text-sm font-semibold text-black">Reference images (optional)</span>
              <p className="text-xs text-black/60">
                Drop up to {maxRefImages} images to show fonts, logos, or past thumbnails you want to mimic.
              </p>
              <div className="flex flex-wrap gap-3">
                {refPreviews.map((src, index) => (
                  <div key={src} className="relative h-20 w-28 overflow-hidden rounded-xl border border-black/15">
                    <img src={src} alt="Reference" className="h-full w-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removeRefAt(index)}
                      className="absolute top-1 right-1 rounded-full bg-black/70 px-2 py-0.5 text-[10px] font-semibold text-white"
                    >
                      Remove
                    </button>
                  </div>
                ))}
                {refImages.length < maxRefImages && (
                  <label className="flex h-20 w-28 cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-black/20 text-xs text-black/60 hover:border-black/40">
                    + Add ref
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={(event) => {
                        addRefFiles(event.target.files);
                        event.target.value = '';
                      }}
                    />
                  </label>
                )}
              </div>
            </div>

            <div className="rounded-2xl border border-black/10 bg-white/70 p-4 text-xs text-black/70">
              <div className="font-semibold text-black">Recommended workflow</div>
              <ol className="mt-2 list-decimal pl-5 space-y-1">
                <li>Upload your frame or raw still.</li>
                <li>Select one preset, then layer 2–3 boosters.</li>
                <li>Run generate, review, and save your favorite.</li>
                <li>Try alternate presets to batch test click-through ideas.</li>
              </ol>
            </div>
          </div>
        </div>

        {error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <button
            type="button"
            onClick={handleGenerate}
            disabled={isLoading}
            className={`inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold text-white shadow transition focus:outline-none focus-visible:ring-2 focus-visible:ring-black/30 ${
              isLoading ? 'bg-black/40' : 'bg-black hover:bg-black/80'
            }`}
          >
            <MagicWandIcon className="h-4 w-4" />
            {isLoading ? 'Designing…' : 'Generate thumbnail'}
          </button>
          {isLoading ? (
            <EtaTimer seconds={50} label="Rendering with Gemini — hang tight" />
          ) : (
            <div className="text-xs uppercase tracking-wide text-black/50">Average turnaround 30–45 seconds</div>
          )}
        </div>
        <p className="text-xs text-center text-black/50 sm:text-left">
          Sign in required. Each export counts toward your generation allowance. Reference uploads stay private to your account.
        </p>
      </SurfaceCard>

      <SurfaceCard className="max-w-6xl mx-auto p-6 sm:p-8 space-y-8">
        <div className="space-y-2">
          <h2 className="text-2xl font-semibold text-black">Your thumbnail playbook</h2>
          <p className="text-sm text-black/70">
            Build a consistent visual story so viewers recognize you instantly and understand the payoff before the video even starts.
          </p>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {PLAYBOOK_COLUMNS.map((column) => (
            <div key={column.title} className="rounded-2xl border border-black/10 bg-white/70 p-5 space-y-3">
              <div className="flex items-center gap-2 text-black font-semibold">
                <CheckIcon className="h-4 w-4" />
                {column.title}
              </div>
              <ul className="space-y-2 text-sm text-black/70">
                {column.bullets.map((bullet) => (
                  <li key={bullet} className="flex items-start gap-2">
                    <span className="mt-1 h-1.5 w-1.5 rounded-full bg-black/60"></span>
                    <span>{bullet}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </SurfaceCard>

      <SurfaceCard className="max-w-5xl mx-auto p-6 sm:p-8 space-y-6">
        <div className="space-y-2">
          <h2 className="text-2xl font-semibold text-black">FAQ</h2>
          <p className="text-sm text-black/70">Quick answers on sizing, consistency, and keeping text readable.</p>
        </div>
        <div className="space-y-4">
          {FAQ_ITEMS.map((item) => (
            <div key={item.q} className="rounded-2xl border border-black/10 bg-white/60 p-4">
              <div className="text-sm font-semibold text-black">{item.q}</div>
              <p className="mt-2 text-sm text-black/70">{item.a}</p>
            </div>
          ))}
        </div>
      </SurfaceCard>

      <SurfaceCard className="max-w-6xl mx-auto p-6 sm:p-8 space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h2 className="text-2xl font-semibold text-black">Latest thumbnails</h2>
          <p className="text-xs text-black/60">Click a result to open it larger; download favorites instantly.</p>
        </div>
        {results.length ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {results.map((url, idx) => (
              <div key={url} className="group relative overflow-hidden rounded-2xl border border-black/10 bg-white/70">
                <img
                  src={url}
                  alt={`Generated thumbnail ${idx + 1}`}
                  className="h-full w-full cursor-pointer object-cover transition group-hover:scale-[1.02]"
                  onClick={() => setLightbox(url)}
                />
                <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-2 bg-black/60 p-2 text-xs text-white opacity-0 transition group-hover:opacity-100">
                  <span className="truncate">Version {results.length - idx}</span>
                  <button
                    type="button"
                    onClick={() => download(url, `tasaweers-thumbnail-${results.length - idx}.png`)}
                    className="rounded border border-white/50 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide"
                  >
                    Download
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-black/10 bg-white/60 px-6 py-10 text-center text-sm text-black/60">
            Results will appear here after you generate your first thumbnail.
          </div>
        )}
      </SurfaceCard>

      {lightbox && (
        <Lightbox imageUrl={lightbox} onClose={() => setLightbox(null)} onDownload={() => download(lightbox)} />
      )}
    </div>
  );
};

export default YouTubeThumbnailEditorPage;
