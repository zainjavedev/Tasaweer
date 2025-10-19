import { SparklesIcon, SwapIcon, MagicWandIcon, YoutubeIcon, CleanIcon } from '@/components/Icon';
import type { Page } from '@/types';

export type ToolPage = {
  page: Page;
  href: string;
  label: string;
  description: string;
  Icon: (props: { className?: string }) => JSX.Element;
};

// Single source of truth for top‑level tools used by the header dropdown
// and the homepage quick section.
export const toolPages: ToolPage[] = [
  {
    page: 'text2image',
    href: '/text2image',
    label: 'Text → Image',
    description: 'Generate new visuals from a prompt; add optional references.',
    Icon: SparklesIcon,
  },
  {
    page: 'try-apparel',
    href: '/try-apparel',
    label: 'Try Apparel',
    description: 'Upload a photo and try outfits with quick recolor options.',
    Icon: SwapIcon,
  },
  {
    page: 'photo-editor',
    href: '/photo-editor',
    label: 'Photo Editor',
    description: 'Fix lighting, denoise, remove objects, and enhance details.',
    Icon: MagicWandIcon,
  },
  {
    page: 'youtube-thumbnail-editor',
    href: '/youtube-thumbnail-editor',
    label: 'YouTube Thumbnails',
    description: 'Presets, boosters, and CTA stickers to craft scroll‑stoppers.',
    Icon: YoutubeIcon,
  },
  {
    page: 'watermark-remover',
    href: '/gemini-watermark-remover',
    label: 'Watermark Remover',
    description: 'Erase the Gemini logo while preserving photo quality.',
    Icon: CleanIcon,
  },
];

