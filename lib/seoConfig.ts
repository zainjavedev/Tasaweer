import meta from '../metadata.json';

interface StructuredDataContext {
  baseUrl: string;
  path: string;
}

export interface SeoConfigEntry {
  title: string;
  description: string;
  keywords?: string[];
  robots?: string;
  structuredData?: (ctx: StructuredDataContext) => Record<string, unknown>[];
}

const DEFAULT_TITLE = 'Tasaweers | AI Photo Editing Suite';
const DEFAULT_DESCRIPTION = meta.description;

const defaultStructuredData = ({ baseUrl }: StructuredDataContext) => [
  {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Tasaweers',
    url: baseUrl,
    potentialAction: {
      '@type': 'SearchAction',
      target: `${baseUrl}/?q={search_term_string}`,
      'query-input': 'required name=search_term_string',
    },
  },
];

const ROUTE_MAP: Record<string, SeoConfigEntry> = {
  '/': {
    title: 'Tasaweers | AI Photo Editor, Try-On & Real Estate Enhancer',
    description:
      'Tasaweers is your AI-powered studio for photo editing, virtual try-on, real estate enhancements, and creative makeovers. Clean clutter, restyle rooms, and generate new visuals in minutes.',
    keywords: [
      'tasaweers',
      'ai photo editor',
      'ai try on clothes',
      'real estate photo editing',
      'ai background remover',
      'ai watermark remover',
      'virtual staging ai',
      'ai real estate marketing',
    ],
    structuredData: ({ baseUrl }) => [
      ...defaultStructuredData({ baseUrl, path: '/' }),
      {
        '@context': 'https://schema.org',
        '@type': 'ItemList',
        name: 'Tasaweers AI Toolset',
        url: baseUrl,
        itemListElement: [
          {
            '@type': 'ListItem',
            position: 1,
            name: 'AI Photo Editor',
            url: `${baseUrl}/photo-editor`,
          },
          {
            '@type': 'ListItem',
            position: 2,
            name: 'AI Text to Image Generator',
            url: `${baseUrl}/text2image`,
          },
          {
            '@type': 'ListItem',
            position: 3,
            name: 'AI Apparel Try-On',
            url: `${baseUrl}/try-apparel`,
          },
          {
            '@type': 'ListItem',
            position: 4,
            name: 'AI Photo Restoration',
            url: `${baseUrl}/restoration`,
          },
          {
            '@type': 'ListItem',
            position: 5,
            name: 'AI Object Replacement',
            url: `${baseUrl}/replace`,
          },
          {
            '@type': 'ListItem',
            position: 6,
            name: 'Gemini Watermark Remover',
            url: `${baseUrl}/gemini-watermark-remover`,
          },
        ],
      },
    ],
  },
  '/photo-editor': {
    title: 'AI Photo Editor by Tasaweers | Retouch, Enhance & Remove Backgrounds',
    description:
      'Edit photos with Tasaweers using Gemini AI. Retouch portraits, clean backgrounds, improve lighting, and generate studio-quality results in your browser.',
    keywords: [
      'tasaweers photo editor',
      'ai photo retouch',
      'ai remove background',
      'gemini photo editor',
      'online photo enhancer',
    ],
    structuredData: ({ baseUrl }) => [
      {
        '@context': 'https://schema.org',
        '@type': 'SoftwareApplication',
        name: 'Tasaweers AI Photo Editor',
        applicationCategory: 'PhotographyApplication',
        operatingSystem: 'Web',
        url: `${baseUrl}/photo-editor`,
        offers: {
          '@type': 'Offer',
          price: '0',
          priceCurrency: 'USD',
        },
        featureList: [
          'AI-powered photo retouching',
          'Background cleanup and removal',
          'Lighting and color enhancements',
          'Prompt presets for quick edits',
        ],
      },
      {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          {
            '@type': 'ListItem',
            position: 1,
            name: 'Tasaweers',
            item: baseUrl,
          },
          {
            '@type': 'ListItem',
            position: 2,
            name: 'AI Photo Editor',
            item: `${baseUrl}/photo-editor`,
          },
        ],
      },
    ],
  },
  '/text2image': {
    title: 'AI Text to Image Generator | Tasaweers',
    description:
      'Turn your prompts into beautiful visuals with the Tasaweers text-to-image generator. Guide Gemini AI with references, aspect ratios, and detailed descriptions.',
    keywords: [
      'tasaweers text to image',
      'ai image generator',
      'prompt to image',
      'gemini image generation',
    ],
    structuredData: ({ baseUrl }) => [
      {
        '@context': 'https://schema.org',
        '@type': 'WebApplication',
        name: 'Tasaweers Text to Image Generator',
        applicationCategory: 'MultimediaApplication',
        operatingSystem: 'Web',
        url: `${baseUrl}/text2image`,
        offers: {
          '@type': 'Offer',
          price: '0',
          priceCurrency: 'USD',
        },
      },
      {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          {
            '@type': 'ListItem',
            position: 1,
            name: 'Tasaweers',
            item: baseUrl,
          },
          {
            '@type': 'ListItem',
            position: 2,
            name: 'Text to Image',
            item: `${baseUrl}/text2image`,
          },
        ],
      },
    ],
  },
  '/try-apparel': {
    title: 'AI Try-On Photo Editor | Tasaweers',
    description:
      'Upload a full-body image and test new outfits instantly with the Tasaweers AI try-on experience. Swap apparel styles without a studio.',
    keywords: [
      'tasaweers try on',
      'ai virtual fitting room',
      'ai apparel try on',
      'virtual wardrobe',
    ],
    structuredData: ({ baseUrl }) => [
      {
        '@context': 'https://schema.org',
        '@type': 'WebApplication',
        name: 'Tasaweers AI Try-On',
        applicationCategory: 'FashionApplication',
        operatingSystem: 'Web',
        url: `${baseUrl}/try-apparel`,
        offers: {
          '@type': 'Offer',
          price: '0',
          priceCurrency: 'USD',
        },
      },
      {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          {
            '@type': 'ListItem',
            position: 1,
            name: 'Tasaweers',
            item: baseUrl,
          },
          {
            '@type': 'ListItem',
            position: 2,
            name: 'AI Try-On',
            item: `${baseUrl}/try-apparel`,
          },
        ],
      },
    ],
  },
  '/restoration': {
    title: 'AI Photo Restoration | Fix Damaged Images with Tasaweers',
    description:
      'Repair scratches, restore colors, and bring old photos back to life using the Tasaweers AI restoration workflow. Upload, describe the damage, and let Gemini clean it up.',
    keywords: [
      'tasaweers photo restoration',
      'ai fix old photos',
      'restore damaged photos ai',
      'photo colorization ai',
    ],
    structuredData: ({ baseUrl }) => [
      {
        '@context': 'https://schema.org',
        '@type': 'Service',
        name: 'Tasaweers AI Photo Restoration',
        provider: {
          '@type': 'Organization',
          name: 'Tasaweers',
          url: baseUrl,
        },
        areaServed: 'Worldwide',
        serviceType: 'AI photo restoration',
        url: `${baseUrl}/restoration`,
      },
      {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          {
            '@type': 'ListItem',
            position: 1,
            name: 'Tasaweers',
            item: baseUrl,
          },
          {
            '@type': 'ListItem',
            position: 2,
            name: 'Photo Restoration',
            item: `${baseUrl}/restoration`,
          },
        ],
      },
    ],
  },
  '/replace': {
    title: 'AI Object Replacement Tool | Tasaweers',
    description:
      'Swap objects in any scene with the Tasaweers AI object replacement tool. Upload a reference and describe the object you want to remove or add.',
    keywords: [
      'tasaweers object replacement',
      'ai object remover',
      'replace object in photo ai',
    ],
    structuredData: ({ baseUrl }) => [
      {
        '@context': 'https://schema.org',
        '@type': 'WebApplication',
        name: 'Tasaweers Object Replacement',
        applicationCategory: 'PhotographyApplication',
        operatingSystem: 'Web',
        url: `${baseUrl}/replace`,
      },
      {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          {
            '@type': 'ListItem',
            position: 1,
            name: 'Tasaweers',
            item: baseUrl,
          },
          {
            '@type': 'ListItem',
            position: 2,
            name: 'Object Replacement',
            item: `${baseUrl}/replace`,
          },
        ],
      },
    ],
  },
  '/bulk-edit': {
    title: 'Bulk Photo Editing for Real Estate | Tasaweers',
    description:
      'Queue up multiple property photos and enhance them together with the Tasaweers bulk editor. Maintain consistent lighting, remove clutter, and restyle interiors instantly.',
    keywords: [
      'tasaweers bulk photo editing',
      'real estate bulk editing',
      'ai batch photo processing',
    ],
    structuredData: ({ baseUrl }) => [
      {
        '@context': 'https://schema.org',
        '@type': 'Service',
        name: 'Tasaweers Bulk Photo Editing',
        provider: {
          '@type': 'Organization',
          name: 'Tasaweers',
          url: baseUrl,
        },
        serviceType: 'Bulk AI photo editing',
        areaServed: 'Worldwide',
        url: `${baseUrl}/bulk-edit`,
      },
      {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          {
            '@type': 'ListItem',
            position: 1,
            name: 'Tasaweers',
            item: baseUrl,
          },
          {
            '@type': 'ListItem',
            position: 2,
            name: 'Bulk Editing',
            item: `${baseUrl}/bulk-edit`,
          },
        ],
      },
    ],
  },
  '/gemini-watermark-remover': {
    title: 'Gemini Watermark Remover | Clean AI Images with Tasaweers',
    description:
      'Remove Gemini watermarks and polish AI-generated visuals in one click. Upload an image, let Tasaweers detect the watermark, and download a clean result after signing in.',
    keywords: [
      'gemini watermark remover',
      'remove google watermark',
      'ai watermark remover',
      'tasaweers watermark tool',
    ],
    structuredData: ({ baseUrl }) => [
      {
        '@context': 'https://schema.org',
        '@type': 'WebApplication',
        name: 'Tasaweers Gemini Watermark Remover',
        applicationCategory: 'PhotographyApplication',
        operatingSystem: 'Web',
        url: `${baseUrl}/gemini-watermark-remover`,
        offers: {
          '@type': 'Offer',
          price: '0',
          priceCurrency: 'USD',
        },
      },
      {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          {
            '@type': 'ListItem',
            position: 1,
            name: 'Tasaweers',
            item: baseUrl,
          },
          {
            '@type': 'ListItem',
            position: 2,
            name: 'Gemini Watermark Remover',
            item: `${baseUrl}/gemini-watermark-remover`,
          },
        ],
      },
    ],
  },
  '/login': {
    title: 'Login | Tasaweers',
    description: 'Access your Tasaweers account to manage AI edits and generation history.',
    robots: 'noindex, nofollow',
  },
  '/register': {
    title: 'Create a Tasaweers Account',
    description: 'Sign up for Tasaweers and unlock AI-powered photo editing tools.',
    robots: 'noindex, nofollow',
  },
  '/verify': {
    title: 'Verify Your Tasaweers Account',
    description: 'Enter your verification code to activate your Tasaweers access.',
    robots: 'noindex, nofollow',
  },
  '/profile': {
    title: 'Your Profile | Tasaweers',
    description: 'Manage your Tasaweers profile, subscription, and image history.',
    robots: 'noindex, nofollow',
  },
  '/myimages': {
    title: 'My Images | Tasaweers',
    description: 'Review and download your generated Tasaweers creations.',
    robots: 'noindex, nofollow',
  },
  '/admin': {
    title: 'Admin | Tasaweers',
    description: 'Administrative dashboard for Tasaweers.',
    robots: 'noindex, nofollow',
  },
};

export function getSeoConfig(pathname: string): Required<Pick<SeoConfigEntry, 'title' | 'description'>> & {
  keywords?: string[];
  robots: string;
  structuredData: (ctx: StructuredDataContext) => Record<string, unknown>[];
} {
  const normalized = pathname === '/' ? '/' : pathname.replace(/\/$/, '');
  const entry = ROUTE_MAP[normalized] || {};
  return {
    title: entry.title || DEFAULT_TITLE,
    description: entry.description || DEFAULT_DESCRIPTION,
    keywords: entry.keywords,
    robots: entry.robots || 'index,follow',
    structuredData: entry.structuredData || defaultStructuredData,
  };
}
