import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { UploadIcon, MagicWandIcon, YoutubeIcon, CheckIcon } from '../components/Icon';
import { editImageWithNanoBanana } from '../services/geminiService';
import EtaTimer from '../components/EtaTimer';
import { addUserImage } from '../utils/userImages';
import { AspectRatioSelector } from '@/components/AspectRatioSelector';
import { compressImageFile } from '@/utils/image';
import { useUser } from '@/utils/useUser';
import Lightbox from '@/components/Lightbox';
import SurfaceCard from '@/components/SurfaceCard';
import { useAuthStatus } from '@/utils/useAuthStatus';
import { useRouter, useSearchParams } from 'next/navigation';

interface ReferenceThumbnail {
  title: string;
  description: string;
  image: string;
}

type CategoryKey = 'tech' | 'gaming' | 'education' | 'finance' | 'travel' | 'fitness';

interface CategoryConfig {
  label: string;
  description: string;
  defaultHeadline: string;
  defaultCTA: string;
  defaultVibe: string;
  colorCombos: string[];
  keyElements: string[];
  promptNotes: string[];
  sampleHooks: string[];
  references: ReferenceThumbnail[];
  background: string;
}

const CATEGORY_CONFIG: Record<CategoryKey, CategoryConfig> = {
  tech: {
    label: 'Tech & Gadgets',
    description: 'Perfect for device reviews, software deep dives, or futuristic tech breakdowns.',
    defaultHeadline: 'Unlock Hidden iPhone Hacks',
    defaultCTA: 'Watch Now',
    defaultVibe: 'Bold & Energetic',
    colorCombos: [
      'Electric blue (#2563EB) with jet black (#0F172A) and neon magenta (#F472B6) accents',
      'Lime green (#22D3EE) with deep purple (#4C1D95) glow and metallic highlights',
      'Hot pink (#EC4899) text over charcoal (#1E293B) with cyan edge lighting',
    ],
    keyElements: [
      'close-up hero device with glowing rim light',
      'floating UI icons and holographic HUD elements',
      'diagonal split background with gradient glow',
      'binary code or circuit texture subtly in the background',
    ],
    promptNotes: [
      'Emphasise reflections and shiny highlights on hardware',
      'Add subtle tech glyph overlays around the subject',
      'Keep composition off-centre with room for large headline text',
    ],
    sampleHooks: [
      'Apple vs Android: Brutal Switch',
      'The $99 Gadget Everyone Needs',
      'This Laptop Upgrade Changes Everything',
    ],
    references: [
      {
        title: 'Split Comparison',
        description: 'Diagonal split, "vs" badge, floating UI icons, bold neon type.',
        image: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=900&q=80',
      },
      {
        title: 'Tech Glow',
        description: 'Close device shot with neon rim lighting and code texture overlay.',
        image: 'https://images.unsplash.com/photo-1517430816045-df4b7de11d1d?auto=format&fit=crop&w=900&q=80',
      },
    ],
    background: 'sleek gradient background with digital glyph overlays and soft glow',
  },
  gaming: {
    label: 'Gaming & Streaming',
    description: 'Great for livestream highlights, e-sports recaps, and game reaction videos.',
    defaultHeadline: 'Streamers Hate This New Meta',
    defaultCTA: 'New Strat',
    defaultVibe: 'Dramatic & Cinematic',
    colorCombos: [
      'Vibrant purple (#7C3AED) and electric green (#22D3EE) with deep navy (#111827)',
      'Hot pink (#EC4899) and royal blue (#1D4ED8) with glitch accents',
      'Neon orange (#FB923C) with matte black (#030712) and cyan sparks',
    ],
    keyElements: [
      'dynamic character pose with motion blur and energy streaks',
      'bold outline around player face reacting dramatically',
      'comic-style speed lines and particle sparks',
      'controller or keyboard prop with light trails',
    ],
    promptNotes: [
      'Add glowing particles and motion streaks for energy',
      'Use dramatic lighting with strong rim lights on the subject',
      'Integrate subtle glitch textures or pixel fragments in the background',
    ],
    sampleHooks: [
      'We Broke The Game Live',
      'My Rank Went From Silver to Diamond',
      'Pro Gamer Reacts to Insane Clips',
    ],
    references: [
      {
        title: 'Highlight Moment',
        description: 'Hero gamer reaction with bold outline and action background.',
        image: 'https://images.unsplash.com/photo-1580128635106-5208b7af8ec1?auto=format&fit=crop&w=900&q=80',
      },
      {
        title: 'Esports Energy',
        description: 'Wide shot, neon rim lights, explosive particle effects.',
        image: 'https://images.unsplash.com/photo-1545239351-1141bd82e8a6?auto=format&fit=crop&w=900&q=80',
      },
    ],
    background: 'high-contrast gradient with glitch texture and streaking lights',
  },
  education: {
    label: 'Education & Tutorials',
    description: 'Explainers, how-to videos, and course content that need clarity.',
    defaultHeadline: 'Master Notion in 10 Minutes',
    defaultCTA: 'Step-by-Step',
    defaultVibe: 'Clean & Minimal',
    colorCombos: [
      'Bright yellow (#FACC15) accents on navy (#1E3A8A) with clean white (#F8FAFC)',
      'Sky blue (#38BDF8) with crisp white and charcoal (#1F2937)',
      'Soft green (#34D399) with warm beige (#FDE68A) and charcoal text',
    ],
    keyElements: [
      'presenter cutout with soft drop shadow',
      'large clear headline bar with high contrast text',
      'simple icons or infographics floating around subject',
      'chalkboard or notebook texture subtly in the background',
    ],
    promptNotes: [
      'Use clean layout with plenty of breathing room',
      'Highlight key steps or icons near the subject',
      'Keep text extremely readable even on small screens',
    ],
    sampleHooks: [
      'Stop Making This Excel Mistake',
      'Beginner Coding Roadmap 2024',
      'The Only Study System You Need',
    ],
    references: [
      {
        title: 'Friendly Teacher',
        description: 'Presenter on white background with bold colored headline bar.',
        image: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&w=900&q=80',
      },
      {
        title: 'Notebook Breakdown',
        description: 'Overhead elements, sticky notes, and checklist style callouts.',
        image: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=900&q=80',
      },
    ],
    background: 'bright, minimal background with subtle paper or whiteboard texture',
  },
  finance: {
    label: 'Business & Finance',
    description: 'For investing tips, money explainers, and business strategy videos.',
    defaultHeadline: '3 Passive Income Plays',
    defaultCTA: 'Start Today',
    defaultVibe: 'Urgent & Newsworthy',
    colorCombos: [
      'Rich emerald (#10B981) with midnight navy (#0F172A) and gold (#F59E0B)',
      'Emergency red (#DC2626) ticker on charcoal (#111827) with white text',
      'Cool teal (#0EA5E9) with crisp white and dark slate (#1E293B)',
    ],
    keyElements: [
      'bold percentage or dollar figures with metallic outline',
      'stock market chart or candlestick graph in background',
      'dramatic lighting on presenter pointing at graphic',
      'ticker tape strip with contrasting color at the bottom',
    ],
    promptNotes: [
      'Add subtle grid or financial chart texture behind subject',
      'Highlight numbers in oversized typography with glow',
      'Balance trustworthiness with urgency through lighting and color',
    ],
    sampleHooks: [
      'Why The Market Will Rally',
      'Retire 10 Years Earlier',
      'Don’t Buy This ETF Until You Watch',
    ],
    references: [
      {
        title: 'Market Alert',
        description: 'Newsroom energy, ticker strip, presenter with pointing gesture.',
        image: 'https://images.unsplash.com/photo-1520607162513-77705c0f0d4a?auto=format&fit=crop&w=900&q=80',
      },
      {
        title: 'Wealth Breakdown',
        description: 'Charts, graphs, and headline stack with gold accents.',
        image: 'https://images.unsplash.com/photo-1454165205744-3b78555e5572?auto=format&fit=crop&w=900&q=80',
      },
    ],
    background: 'dark gradient with subtle financial chart overlays and spot lighting',
  },
  travel: {
    label: 'Travel & Adventure',
    description: 'Vlogs, travel guides, and cinematic location reveals.',
    defaultHeadline: 'This Island Feels Unreal',
    defaultCTA: 'Plan Your Trip',
    defaultVibe: 'Playful & Colorful',
    colorCombos: [
      'Turquoise (#14B8A6) water with sunset orange (#FB923C) and white highlights',
      'Golden hour yellow (#FBBF24) with teal (#0EA5E9) gradients',
      'Coral pink (#F97316) with aqua (#22D3EE) and sandy beige (#FDAEAE)',
    ],
    keyElements: [
      'sweeping landscape background with depth-of-field blur',
      'traveler cutout with joyful expression and motion blur',
      'hand-lettered script accent next to main headline',
      'travel icons like plane outline or location pin',
    ],
    promptNotes: [
      'Add sun flares or light leaks for warmth',
      'Use dynamic angles that showcase the scenery',
      'Make the subject pop with a subtle outline or glow',
    ],
    sampleHooks: [
      'Hidden Gems You Must Visit',
      'How I Travelled Bali for $40/Day',
      'Ultimate 5 Day Tokyo Guide',
    ],
    references: [
      {
        title: 'Paradise Reveal',
        description: 'Wide scenic shot with subject on one side and bold headline.',
        image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=900&q=80',
      },
      {
        title: 'Story Map',
        description: 'Map texture overlay, pins, and itinerary callouts.',
        image: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=900&q=80',
      },
    ],
    background: 'vibrant gradient reminiscent of sunset with light leak textures',
  },
  fitness: {
    label: 'Health & Fitness',
    description: 'Workout plans, healthy habits, and transformation stories.',
    defaultHeadline: 'Lose Belly Fat in 14 Days',
    defaultCTA: 'Join The Challenge',
    defaultVibe: 'Bold & Energetic',
    colorCombos: [
      'Fire orange (#F97316) with deep charcoal (#111827) and white text',
      'Electric lime (#A3E635) with black and steel blue (#1E293B)',
      'Crimson red (#EF4444) and slate gray (#334155) with bright yellow highlights',
    ],
    keyElements: [
      'athlete mid-action with muscle definition and sweat highlights',
      'bold angled headline banner across the frame',
      'timer or progress badge tucked in a corner',
      'speed lines or dust particles around the movement',
    ],
    promptNotes: [
      'Use dramatic lighting with high contrast shadows',
      'Add sweat particles or motion blur to convey intensity',
      'Keep headline text thick, slanted, and energetic',
    ],
    sampleHooks: [
      '20 Minute HIIT That Works',
      'My 4 AM Morning Routine',
      'From Dad Bod to Shredded: How',
    ],
    references: [
      {
        title: 'Gym Intensity',
        description: 'Athlete mid-movement, gritty texture, bold slanted headline.',
        image: 'https://images.unsplash.com/photo-1546484959-f9a9ae0f3fc8?auto=format&fit=crop&w=900&q=80',
      },
      {
        title: 'Transformation',
        description: 'Before/after split, neon outline, big percentage text.',
        image: 'https://images.unsplash.com/photo-1507537297725-24a1c029d3ca?auto=format&fit=crop&w=900&q=80',
      },
    ],
    background: 'dark gym texture with angled spotlight beams and grit overlay',
  },
};

const VIBE_OPTIONS = [
  'Bold & Energetic',
  'Clean & Minimal',
  'Dramatic & Cinematic',
  'Playful & Colorful',
  'Urgent & Newsworthy',
];

const TEXT_TREATMENTS = [
  'thick sans-serif with 3D extrusion, white fill, and black outline',
  'ultra-bold condensed font with gradient fill and long drop shadow',
  'handwritten marker-style font with white stroke and neon glow',
  'bold uppercase font with metallic sheen and rim light highlight',
];

const CTA_PRESETS = [
  'Watch Now',
  'Must See',
  'Free Guide',
  'Start Today',
  'Learn How',
  'New Episode',
];

const HOOK_FORMULAS = [
  { label: 'Number + Promise', example: '7 Tricks That Actually Work' },
  { label: 'Big Claim', example: 'This Camera Changed Everything' },
  { label: 'Question', example: 'Are You Still Doing This Wrong?' },
  { label: 'Versus Showdown', example: 'Sony A7C II vs Canon R8' },
  { label: 'Shock & Awe', example: 'I Tried a $20,000 Laptop' },
];

interface PromptBuilderState {
  category: CategoryKey;
  headline: string;
  cta: string;
  vibe: string;
  textTreatment: string;
  palette: string;
  elements: string[];
}

const buildPrompt = ({ category, headline, cta, vibe, textTreatment, palette, elements }: PromptBuilderState) => {
  const config = CATEGORY_CONFIG[category];
  const trimmedHeadline = headline.trim();
  const trimmedCTA = cta.trim();

  const lines = [
    `Design a high-impact YouTube thumbnail for a ${config.label.toLowerCase()} video.`,
    config.description,
    `Overall vibe: ${vibe}.`,
    trimmedHeadline ? `Primary hook text: "${trimmedHeadline}" styled in ${textTreatment}.` : null,
    trimmedCTA ? `Add a compact action badge that says "${trimmedCTA}" with contrasting colors.` : null,
    `Color palette focus: ${palette}.`,
    elements.length ? `Key visual elements to include: ${elements.join(', ')}.` : null,
    `Background treatment: ${config.background}.`,
    'Ensure the subject is large, text is ultra-readable, and safe areas are respected for YouTube UI overlays.',
    `Extra art direction: ${config.promptNotes.join('; ')}.`,
    'Deliver a crisp, 16:9 composition with plenty of contrast and clickable energy.',
  ];

  return lines.filter(Boolean).join(' ');
};

const HelperChip: React.FC<{ label: string; active?: boolean; onClick: () => void }>
  = ({ label, active, onClick }) => (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-2.5 py-1 text-xs font-semibold transition-colors ${
        active
          ? 'border-black bg-black text-white'
          : 'border-black/25 bg-white text-black hover:bg-black hover:text-white'
      }`}
    >
      {label}
    </button>
  );

const MAX_REF_IMAGES = 4;

const YouTubeThumbnailPage: React.FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { refreshUserData } = useUser();
  const isAuthenticated = useAuthStatus();

  const [category, setCategory] = useState<CategoryKey>('tech');
  const [headline, setHeadline] = useState(CATEGORY_CONFIG.tech.defaultHeadline);
  const [cta, setCta] = useState(CATEGORY_CONFIG.tech.defaultCTA);
  const [vibe, setVibe] = useState<string>(CATEGORY_CONFIG.tech.defaultVibe);
  const [textTreatment, setTextTreatment] = useState<string>(TEXT_TREATMENTS[0]);
  const [selectedPalette, setSelectedPalette] = useState<string>(CATEGORY_CONFIG.tech.colorCombos[0]);
  const [selectedElements, setSelectedElements] = useState<string[]>(CATEGORY_CONFIG.tech.keyElements.slice(0, 2));
  const [autoPrompt, setAutoPrompt] = useState(true);

  const [prompt, setPrompt] = useState(
    buildPrompt({
      category: 'tech',
      headline: CATEGORY_CONFIG.tech.defaultHeadline,
      cta: CATEGORY_CONFIG.tech.defaultCTA,
      vibe: CATEGORY_CONFIG.tech.defaultVibe,
      textTreatment: TEXT_TREATMENTS[0],
      palette: CATEGORY_CONFIG.tech.colorCombos[0],
      elements: CATEGORY_CONFIG.tech.keyElements.slice(0, 2),
    })
  );

  const [originalImage, setOriginalImage] = useState<File | null>(null);
  const [originalPreview, setOriginalPreview] = useState<string | null>(null);
  const [aspectRatio, setAspectRatio] = useState<string>('16:9');
  const [refImages, setRefImages] = useState<File[]>([]);
  const [refPreviews, setRefPreviews] = useState<string[]>([]);
  const [results, setResults] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lightbox, setLightbox] = useState<string | null>(null);
  const [showEditButtons, setShowEditButtons] = useState(true);
  const loadedFromQueryRef = useRef(false);

  const latestResult = results[0] ?? null;
  const previousResults = results.slice(1);

  const applyPromptSync = useCallback((overrides: Partial<PromptBuilderState> = {}) => {
    if (!autoPrompt) return;
    const next = buildPrompt({
      category: overrides.category ?? category,
      headline: overrides.headline ?? headline,
      cta: overrides.cta ?? cta,
      vibe: overrides.vibe ?? vibe,
      textTreatment: overrides.textTreatment ?? textTreatment,
      palette: overrides.palette ?? selectedPalette,
      elements: overrides.elements ?? selectedElements,
    });
    setPrompt(next);
  }, [autoPrompt, category, headline, cta, vibe, textTreatment, selectedPalette, selectedElements]);

  const handleCategoryChange = (key: CategoryKey) => {
    const config = CATEGORY_CONFIG[key];
    setCategory(key);
    setHeadline(config.defaultHeadline);
    setCta(config.defaultCTA);
    setVibe(config.defaultVibe);
    setSelectedPalette(config.colorCombos[0]);
    setSelectedElements(config.keyElements.slice(0, 2));
    applyPromptSync({
      category: key,
      headline: config.defaultHeadline,
      cta: config.defaultCTA,
      vibe: config.defaultVibe,
      palette: config.colorCombos[0],
      elements: config.keyElements.slice(0, 2),
    });
  };

  const handleHeadlineChange = (value: string) => {
    setHeadline(value);
    applyPromptSync({ headline: value });
  };

  const handleCTAChange = (value: string) => {
    setCta(value);
    applyPromptSync({ cta: value });
  };

  const handleVibeChange = (value: string) => {
    setVibe(value);
    applyPromptSync({ vibe: value });
  };

  const handleTextTreatmentChange = (value: string) => {
    setTextTreatment(value);
    applyPromptSync({ textTreatment: value });
  };

  const handlePaletteSelect = (value: string) => {
    setSelectedPalette(value);
    applyPromptSync({ palette: value });
  };

  const toggleElement = (value: string) => {
    setSelectedElements((prev) => {
      const exists = prev.includes(value);
      let next = exists ? prev.filter((el) => el !== value) : [...prev, value];
      if (next.length === 0) {
        next = [value];
      }
      applyPromptSync({ elements: next });
      return next;
    });
  };

  const applyHook = (value: string) => {
    setHeadline(value);
    applyPromptSync({ headline: value });
  };

  const setPromptManually = (value: string) => {
    setPrompt(value);
    setAutoPrompt(false);
  };

  const restoreRecommendedPrompt = () => {
    setAutoPrompt(true);
    applyPromptSync({});
  };

  const handleImageUpload = useCallback((file: File) => {
    setOriginalImage(file);
    setError(null);
    const reader = new FileReader();
    reader.onloadend = () => setOriginalPreview(reader.result as string);
    reader.readAsDataURL(file);
  }, []);

  const addRefFiles = useCallback((files: FileList | File[]) => {
    const incoming = Array.from(files).filter((f) => f.type.startsWith('image/'));
    if (!incoming.length) return;
    const space = Math.max(0, MAX_REF_IMAGES - refImages.length);
    const take = incoming.slice(0, space);
    if (!take.length) return;
    setRefImages((prev) => [...prev, ...take]);
    take.forEach((f) => {
      const reader = new FileReader();
      reader.onloadend = () => setRefPreviews((prev) => [...prev, reader.result as string]);
      reader.readAsDataURL(f);
    });
  }, [refImages.length]);

  const removeRefAt = useCallback((idx: number) => {
    setRefImages((prev) => prev.filter((_, i) => i !== idx));
    setRefPreviews((prev) => prev.filter((_, i) => i !== idx));
  }, []);

  const toCompressedBase64 = async (file: File) => {
    const { blob } = await compressImageFile(file, { maxDim: 1600, type: 'image/webp', quality: 0.9 });
    const base64 = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve((reader.result as string).split(',')[1]);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
    return { base64, mimeType: blob.type };
  };

  const setOriginalFromUrl = async (url: string) => {
    const res = await fetch(url);
    const blob = await res.blob();
    const file = new File([blob], 'thumbnail-base.webp', { type: blob.type || 'image/webp' });
    setOriginalImage(file);
    setOriginalPreview(url);
  };

  const addRefFromUrl = async (url: string) => {
    if (refImages.length >= MAX_REF_IMAGES) return;
    const res = await fetch(url);
    const blob = await res.blob();
    const file = new File([blob], `ref-${Date.now()}.webp`, { type: blob.type || 'image/webp' });
    setRefImages((prev) => [...prev, file]);
    setRefPreviews((prev) => [...prev, url]);
  };

  const handleSubmit = useCallback(async () => {
    if (!originalImage) {
      setError('Upload a base image or pick a reference to start.');
      return;
    }
    if (!prompt.trim()) {
      setError('Add directions for the thumbnail.');
      return;
    }
    if (!isAuthenticated) {
      setError("You'll need to sign in to generate thumbnails.");
      router.push('/register');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const { base64, mimeType } = await toCompressedBase64(originalImage);
      let additionalImages: { data: string; mimeType: string }[] | undefined;

      if (refImages.length) {
        additionalImages = await Promise.all(
          refImages.map(async (f) => {
            const { blob, dataUrl } = await compressImageFile(f, { maxDim: 1400, type: 'image/webp', quality: 0.9 });
            const data = (dataUrl.split(',')[1] || '');
            return { data, mimeType: blob.type || f.type || 'image/webp' };
          })
        );
      }

      const result = await editImageWithNanoBanana(base64, mimeType, prompt.trim(), additionalImages, aspectRatio);
      setResults((prev) => [result.imageUrl, ...prev]);

      try {
        await addUserImage({
          kind: 'edit',
          prompt: prompt.trim(),
          original: originalPreview || undefined,
          generated: result.imageUrl,
          meta: { category, headline, cta, vibe, palette: selectedPalette },
        });
        await refreshUserData();
      } catch {}
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate thumbnail.');
    } finally {
      setIsLoading(false);
    }
  }, [originalImage, prompt, isAuthenticated, router, refImages, aspectRatio, refreshUserData, originalPreview, category, headline, cta, vibe, selectedPalette]);

  const download = (url: string, name = 'youtube-thumbnail.png') => {
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    a.click();
  };

  useEffect(() => {
    const src = searchParams?.get('src');
    if (src && !loadedFromQueryRef.current) {
      loadedFromQueryRef.current = true;
      setOriginalFromUrl(src).catch(() => {});
    }
  }, [searchParams]);

  const activeCategory = useMemo(() => CATEGORY_CONFIG[category], [category]);

  return (
    <SurfaceCard className="max-w-6xl mx-auto overflow-hidden p-6 sm:p-8 space-y-6 sm:space-y-8">
      <div className="flex flex-col items-center gap-2 text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white/70 px-3 py-1 text-xs font-semibold text-black">
          <YoutubeIcon className="h-4 w-4" />
          Thumbnail lab for creators
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-black">YouTube Thumbnail Maker</h1>
        <p className="max-w-2xl text-sm text-black/70">
          Craft catchy, clickable thumbnails with AI-backed guidance. Pick a category, dial in the hook, and generate a 16:9 masterpiece ready for YouTube.
        </p>
      </div>

      <div className="grid gap-8 xl:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
        <div className="space-y-6">
          <section className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-sm font-semibold text-black">Base image</span>
              {originalPreview && (
                <button
                  onClick={() => {
                    setOriginalImage(null);
                    setOriginalPreview(null);
                  }}
                  className="text-xs font-semibold text-black/70 hover:text-black"
                >
                  Remove
                </button>
              )}
            </div>
            <div className="relative aspect-video w-full overflow-hidden rounded-2xl border border-black/12 bg-white/85 flex items-center justify-center">
              {originalPreview ? (
                <img src={originalPreview} alt="Base thumbnail" className="h-full w-full object-cover" />
              ) : (
                <div className="px-4 text-center text-sm text-black/60">
                  <UploadIcon className="mx-auto mb-2 h-7 w-7 opacity-70" />
                  <p>Upload a frame, brand asset, or still to start shaping your thumbnail.</p>
                </div>
              )}
              {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/35 backdrop-blur-sm">
                  <div className="space-y-1 text-center text-xs text-white">
                    <div className="mx-auto h-6 w-6 animate-spin rounded-full border-2 border-white/60 border-b-transparent" />
                    <p>Processing…</p>
                  </div>
                </div>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <label className="flex h-10 items-center justify-center rounded-lg border border-black/20 bg-white px-3 text-xs font-semibold text-black transition-colors duration-200 hover:bg-gray-50 cursor-pointer">
                <UploadIcon className="mr-2 h-4 w-4" /> Upload
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => e.target.files && handleImageUpload(e.target.files[0])}
                />
              </label>
              <span className="text-xs text-black/60">Tip: 1280×720px or larger works best.</span>
            </div>
          </section>

          <section className="space-y-3">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <span className="text-sm font-semibold text-black">Category</span>
                <p className="text-xs text-black/60 max-w-sm">We’ll tailor prompts, hooks, and palettes for the story you’re telling.</p>
              </div>
              <span className="text-xs text-black/60 font-semibold">{activeCategory.label}</span>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              {(Object.keys(CATEGORY_CONFIG) as CategoryKey[]).map((key) => {
                const conf = CATEGORY_CONFIG[key];
                const isActive = key === category;
                return (
                  <button
                    key={key}
                    onClick={() => handleCategoryChange(key)}
                    className={`rounded-xl border px-4 py-3 text-left transition-all duration-200 ${
                      isActive
                        ? 'border-black bg-black text-white shadow-lg shadow-black/10'
                        : 'border-black/12 bg-white hover:border-black/30 hover:shadow'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-semibold">{conf.label}</span>
                      {isActive && <CheckIcon className="h-4 w-4" />}
                    </div>
                    <p className={`mt-1 text-xs ${isActive ? 'text-white/80' : 'text-black/65'}`}>{conf.description}</p>
                  </button>
                );
              })}
            </div>
          </section>

          <section className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-sm font-semibold text-black">Hook & message</span>
              <span className="text-xs text-black/60">Make it scannable in under 2 seconds.</span>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="space-y-1">
                <span className="text-xs font-semibold text-black/70">Headline</span>
                <input
                  value={headline}
                  onChange={(e) => handleHeadlineChange(e.target.value)}
                  placeholder="Main text for thumbnail"
                  className="w-full rounded-lg border border-black/20 bg-white px-3 py-2 text-sm text-black focus:border-black/40 focus:outline-none focus:ring-2 focus:ring-black/15"
                />
              </label>
              <label className="space-y-1">
                <span className="text-xs font-semibold text-black/70">Call-to-action badge</span>
                <div className="flex gap-2">
                  <input
                    value={cta}
                    onChange={(e) => handleCTAChange(e.target.value)}
                    placeholder="CTA text"
                    className="w-full rounded-lg border border-black/20 bg-white px-3 py-2 text-sm text-black focus:border-black/40 focus:outline-none focus:ring-2 focus:ring-black/15"
                  />
                  <select
                    value={cta}
                    onChange={(e) => handleCTAChange(e.target.value)}
                    className="rounded-lg border border-black/20 bg-white px-2 text-xs text-black"
                  >
                    {CTA_PRESETS.map((preset) => (
                      <option key={preset} value={preset}>{preset}</option>
                    ))}
                  </select>
                </div>
              </label>
            </div>

            <div className="space-y-2">
              <div className="text-xs font-semibold text-black/70">Quick hook ideas</div>
              <div className="flex flex-wrap gap-2">
                {HOOK_FORMULAS.map((hook) => (
                  <HelperChip key={hook.example} label={`${hook.label}: ${hook.example}`} onClick={() => applyHook(hook.example)} />
                ))}
                {activeCategory.sampleHooks.map((hook) => (
                  <HelperChip key={hook} label={hook} onClick={() => applyHook(hook)} />
                ))}
              </div>
            </div>
          </section>

          <section className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-sm font-semibold text-black">Visual direction</span>
              <span className="text-xs text-black/60">Select palettes, vibes, and focal elements.</span>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="space-y-1">
                <span className="text-xs font-semibold text-black/70">Mood</span>
                <select
                  value={vibe}
                  onChange={(e) => handleVibeChange(e.target.value)}
                  className="w-full rounded-lg border border-black/20 bg-white px-3 py-2 text-sm text-black focus:border-black/40 focus:outline-none focus:ring-2 focus:ring-black/15"
                >
                  {VIBE_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </label>
              <label className="space-y-1">
                <span className="text-xs font-semibold text-black/70">Headline treatment</span>
                <select
                  value={textTreatment}
                  onChange={(e) => handleTextTreatmentChange(e.target.value)}
                  className="w-full rounded-lg border border-black/20 bg-white px-3 py-2 text-sm text-black focus:border-black/40 focus:outline-none focus:ring-2 focus:ring-black/15"
                >
                  {TEXT_TREATMENTS.map((opt) => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </label>
            </div>

            <div className="space-y-1">
              <div className="text-xs font-semibold text-black/70">Color combos</div>
              <div className="flex flex-wrap gap-2">
                {activeCategory.colorCombos.map((combo) => (
                  <HelperChip
                    key={combo}
                    label={combo}
                    active={combo === selectedPalette}
                    onClick={() => handlePaletteSelect(combo)}
                  />
                ))}
              </div>
            </div>

            <div className="space-y-1">
              <div className="text-xs font-semibold text-black/70">Key elements</div>
              <div className="flex flex-wrap gap-2">
                {activeCategory.keyElements.map((el) => (
                  <HelperChip
                    key={el}
                    label={el}
                    active={selectedElements.includes(el)}
                    onClick={() => toggleElement(el)}
                  />
                ))}
              </div>
            </div>
          </section>

          <section className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-sm font-semibold text-black">Prompt to AI</span>
              <div className="flex items-center gap-3 text-xs text-black/60">
                <label className="inline-flex items-center gap-1">
                  <input
                    type="checkbox"
                    checked={autoPrompt}
                    onChange={(e) => {
                      setAutoPrompt(e.target.checked);
                      if (e.target.checked) {
                        applyPromptSync({});
                      }
                    }}
                  />
                  Keep synced
                </label>
                {!autoPrompt && (
                  <button
                    type="button"
                    onClick={restoreRecommendedPrompt}
                    className="rounded-full border border-black/20 px-3 py-1 font-semibold text-black transition-colors hover:bg-black hover:text-white"
                  >
                    Restore recommended
                  </button>
                )}
              </div>
            </div>
            <div className="relative">
              <textarea
                value={prompt}
                onChange={(e) => setPromptManually(e.target.value)}
                rows={5}
                className="w-full rounded-2xl border border-black/15 bg-white px-4 py-3 text-sm text-black focus:border-black/40 focus:outline-none focus:ring-2 focus:ring-black/15"
              />
              <div className="pointer-events-none absolute bottom-2 right-3 text-[10px] uppercase tracking-wide text-black/40">
                AI brief
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <AspectRatioSelector selectedRatio={aspectRatio} onSelect={setAspectRatio} />
              <div className="rounded-lg border border-dashed border-black/20 bg-black/5 px-3 py-2 text-xs text-black/60">
                <p className="font-semibold text-black/80">Thumbnail checklist</p>
                <ul className="mt-1 list-disc space-y-1 pl-4">
                  <li>Hero subject fills 60–70% of frame</li>
                  <li>Text large, 2–4 words max</li>
                  <li>Contrasting colors for scroll-stopping impact</li>
                </ul>
              </div>
            </div>
          </section>

          <section className="space-y-3">
            <button
              onClick={handleSubmit}
              disabled={isLoading || !originalImage || !prompt.trim()}
              className="btn-shine flex w-full items-center justify-center gap-2 rounded-lg bg-black px-6 py-3 text-white font-bold transition-colors duration-200 hover:bg-gray-800 disabled:cursor-not-allowed disabled:bg-gray-400"
            >
              {isAuthenticated ? (
                isLoading ? 'Generating…' : (
                  <>
                    <MagicWandIcon className="h-5 w-5" />
                    Generate thumbnail
                  </>
                )
              ) : 'Sign up to generate'}
              <span aria-hidden className="shine"></span>
            </button>
            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600">{error}</div>
            )}
            {isLoading && (
              <div className="space-y-1 text-xs text-black/70">
                <EtaTimer seconds={14} label="Usually 10–20s" />
                <p className="text-center">AI is assembling your thumbnail recipe…</p>
              </div>
            )}
          </section>
        </div>

        <div className="space-y-6 xl:sticky xl:top-6">
          <section className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-sm font-semibold text-black">Latest render</span>
              {latestResult && (
                <label className="inline-flex items-center gap-2 text-xs text-black/60">
                  <input type="checkbox" checked={showEditButtons} onChange={(e) => setShowEditButtons(e.target.checked)} />
                  Show extra actions
                </label>
              )}
            </div>
            <div className="relative flex aspect-video w-full items-center justify-center overflow-hidden rounded-2xl border border-black/12 bg-white/85">
              {latestResult ? (
                <button type="button" onClick={() => setLightbox(latestResult)} className="h-full w-full">
                  <img src={latestResult} alt="Latest thumbnail" className="h-full w-full object-contain" />
                </button>
              ) : (
                <div className="px-6 text-center text-sm text-black/60">Generate a thumbnail to preview it here.</div>
              )}
              {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/35 backdrop-blur-sm">
                  <div className="space-y-1 text-center text-xs text-white">
                    <div className="mx-auto h-6 w-6 animate-spin rounded-full border-2 border-white/60 border-b-transparent" />
                    <p>Processing…</p>
                  </div>
                </div>
              )}
            </div>
            {latestResult && (
              <div className="flex flex-wrap gap-2 text-sm text-black/70">
                <button
                  onClick={() => download(latestResult)}
                  className="rounded-lg border border-black bg-black px-3 py-2 font-semibold text-white transition-colors hover:bg-gray-800"
                >
                  Download PNG
                </button>
                {showEditButtons && (
                  <>
                    <button
                      onClick={() => setOriginalFromUrl(latestResult)}
                      className="rounded-lg border border-black px-3 py-2 font-semibold text-black transition-colors hover:bg-black hover:text-white"
                    >
                      Use as base
                    </button>
                    <button
                      onClick={() => addRefFromUrl(latestResult)}
                      className="rounded-lg border border-black px-3 py-2 font-semibold text-black transition-colors hover:bg-black hover:text-white"
                      disabled={refImages.length >= MAX_REF_IMAGES}
                    >
                      Add as reference
                    </button>
                  </>
                )}
              </div>
            )}
          </section>

          <section className="space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-sm font-semibold text-black">Reference looks</span>
              <span className="text-xs text-black/60">Click to inspect or use</span>
            </div>
            <div className="grid gap-4">
              {activeCategory.references.map((ref) => (
                <div key={ref.image} className="overflow-hidden rounded-2xl border border-black/12 bg-white">
                  <button type="button" onClick={() => setLightbox(ref.image)} className="block">
                    <img src={ref.image} alt={ref.title} className="h-40 w-full object-cover" />
                  </button>
                  <div className="space-y-2 px-4 py-3">
                    <div className="text-sm font-semibold text-black">{ref.title}</div>
                    <p className="text-xs text-black/60">{ref.description}</p>
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => setOriginalFromUrl(ref.image)}
                        className="rounded-lg border border-black px-3 py-1.5 text-xs font-semibold text-black transition-colors hover:bg-black hover:text-white"
                      >
                        Use as base
                      </button>
                      <button
                        onClick={() => addRefFromUrl(ref.image)}
                        className="rounded-lg border border-black px-3 py-1.5 text-xs font-semibold text-black transition-colors hover:bg-black hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                        disabled={refImages.length >= MAX_REF_IMAGES}
                      >
                        Add reference
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="space-y-2">
            <div className="text-sm font-semibold text-black">Reference images ({refImages.length}/{MAX_REF_IMAGES})</div>
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
              {refPreviews.map((preview, idx) => (
                <div key={idx} className="relative h-20 overflow-hidden rounded-lg border border-black/12 bg-white">
                  <img src={preview} alt={`reference ${idx + 1}`} className="h-full w-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removeRefAt(idx)}
                    className="absolute top-1 right-1 rounded-full bg-white/90 p-1 text-black"
                    title="Remove reference"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
                      <path
                        fillRule="evenodd"
                        d="M6.225 4.811a.75.75 0 011.06 0L12 9.525l4.715-4.714a.75.75 0 111.06 1.06L13.06 10.586l4.715 4.714a.75.75 0 11-1.06 1.06L12 11.646l-4.715 4.714a.75.75 0 11-1.06-1.06l4.714-4.715-4.714-4.715a.75.75 0 010-1.06z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </button>
                </div>
              ))}
              {refImages.length < MAX_REF_IMAGES && (
                <label className="flex h-20 items-center justify-center rounded-lg border-2 border-dashed border-black/30 text-xs text-black cursor-pointer hover:border-black">
                  Add
                  <input type="file" accept="image/*" multiple className="sr-only" onChange={(e) => e.target.files && addRefFiles(e.target.files)} />
                </label>
              )}
            </div>
            <p className="text-xs text-black/60">References teach the model the vibe, layout, or lighting you want.</p>
          </section>

          {previousResults.length > 0 && (
            <section className="space-y-2">
              <div className="text-sm font-semibold text-black">History</div>
              <div className="grid gap-3 sm:grid-cols-2">
                {previousResults.map((url, idx) => (
                  <div key={`${url}-${idx}`} className="overflow-hidden rounded-xl border border-black/12 bg-white/90">
                    <button type="button" onClick={() => setLightbox(url)} className="block">
                      <img src={url} alt={`Result ${idx + 2}`} className="h-28 w-full object-cover" />
                    </button>
                    <div className="flex gap-2 px-3 py-2 text-xs text-black/70">
                      <button onClick={() => download(url, `thumbnail-${idx + 2}.png`)} className="rounded border border-black px-2 py-1 font-semibold hover:bg-black hover:text-white">
                        Download
                      </button>
                      <button onClick={() => setOriginalFromUrl(url)} className="rounded border border-black px-2 py-1 font-semibold hover:bg-black hover:text-white">
                        Use as base
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>

      {lightbox && (
        <Lightbox url={lightbox} onClose={() => setLightbox(null)} />
      )}
    </SurfaceCard>
  );
};

export default YouTubeThumbnailPage;
