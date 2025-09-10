'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { MagicWandIcon, SwapIcon, SparklesIcon, CameraIcon } from './Icon';

type NavItem =
  | { type: 'link'; href: string; label: string; icon?: React.FC<any> }
  | { type: 'menu'; label: string; icon?: React.FC<any>; items: { href: string; label: string; icon?: React.FC<any> }[] };

const navItems: NavItem[] = [
  { type: 'link', href: '/', label: 'Home', icon: SparklesIcon },
  {
    type: 'menu',
    label: 'Text → Image',
    icon: SparklesIcon,
    items: [{ href: '/text2image', label: 'Text to Image', icon: SparklesIcon }],
  },
  {
    type: 'menu',
    label: 'Image → Image',
    icon: SwapIcon,
    items: [{ href: '/replace', label: 'Object Replacement', icon: SwapIcon }],
  },
  {
    type: 'menu',
    label: 'Image Editing',
    icon: MagicWandIcon,
    items: [{ href: '/restoration', label: 'Image Restoration', icon: MagicWandIcon }],
  },
  { type: 'link', href: '/camera', label: 'Camera Fun', icon: CameraIcon },
  { type: 'link', href: '/myimages', label: 'My Images', icon: CameraIcon },
];

export const NavigationNext: React.FC = () => {
  const pathname = usePathname();
  return (
    <nav className="bg-white dark:bg-gray-800 shadow-sm sticky top-0 z-20">
      <div className="container mx-auto px-4">
        <div className="flex justify-start sm:justify-center items-center space-x-2 sm:space-x-4 py-2">
          {navItems.map((item, idx) => {
            if (item.type === 'link') {
              const active = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={`link-${item.href}`}
                  href={item.href}
                  className={`flex items-center justify-center gap-2 px-3 sm:px-4 py-3 text-sm sm:text-base font-medium border-b-4 transition-all duration-200 focus:outline-none ${
                    active
                      ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                      : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                >
                  {Icon && <Icon className="w-5 h-5" />}
                  <span>{item.label}</span>
                </Link>
              );
            }
            const active = item.items.some((it) => it.href === pathname);
            const Icon = item.icon;
            return (
              <div key={`menu-${idx}`} className="relative group">
                <div
                  className={`flex items-center gap-2 px-3 sm:px-4 py-3 text-sm sm:text-base font-medium border-b-4 ${
                    active
                      ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                      : 'border-transparent text-gray-600 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white group-hover:border-gray-300 dark:group-hover:border-gray-600'
                  }`}
                >
                  {Icon && <Icon className="w-5 h-5" />}
                  <span>{item.label}</span>
                </div>
                <div className="absolute left-0 mt-1 hidden group-hover:block">
                  <div className="rounded-lg border bg-white dark:bg-gray-800 shadow-lg overflow-hidden min-w-[12rem]">
                    {item.items.map((sub) => {
                      const SubIcon = sub.icon;
                      const subActive = pathname === sub.href;
                      return (
                        <Link
                          key={sub.href}
                          href={sub.href}
                          className={`w-full text-left px-4 py-2 flex items-center gap-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 ${
                            subActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-700 dark:text-gray-200'
                          }`}
                        >
                          {SubIcon && <SubIcon className="w-4 h-4" />}
                          <span>{sub.label}</span>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </nav>
  );
};

