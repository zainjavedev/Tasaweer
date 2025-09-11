'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { MagicWandIcon, SwapIcon, SparklesIcon, CameraIcon, MenuIcon, XIcon, ChevronDownIcon } from './Icon';

type NavItem =
  | { type: 'link'; href: string; label: string; icon?: React.FC<any> }
  | { type: 'menu'; label: string; icon?: React.FC<any>; id: string; items: { href: string; label: string; icon?: React.FC<any> }[] };

const navItems: NavItem[] = [
  { type: 'link', href: '/', label: 'Home', icon: SparklesIcon },
  { type: 'menu', id: 't2i', label: 'Text → Image', icon: SparklesIcon, items: [{ href: '/text2image', label: 'Text to Image', icon: SparklesIcon }] },
  { type: 'menu', id: 'i2i', label: 'Image → Image', icon: SwapIcon, items: [{ href: '/replace', label: 'Object Replacement', icon: SwapIcon }] },
  { type: 'menu', id: 'edit', label: 'Image Editing', icon: MagicWandIcon, items: [{ href: '/restoration', label: 'Image Restoration', icon: MagicWandIcon }] },
  { type: 'link', href: '/try-apparel', label: 'Try Apparel', icon: CameraIcon },
  { type: 'link', href: '/myimages', label: 'My Images', icon: CameraIcon },
];

export const NavigationNext: React.FC = () => {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const navRef = useRef<HTMLDivElement | null>(null);

  // Close menus on outside click
  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (!navRef.current) return;
      if (!navRef.current.contains(e.target as Node)) {
        setOpenMenu(null);
      }
    };
    document.addEventListener('click', onDocClick);
    return () => document.removeEventListener('click', onDocClick);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileOpen(false);
    setOpenMenu(null);
  }, [pathname]);

  const renderItem = (item: NavItem, key: string) => {
    if (item.type === 'link') {
      const active = pathname === item.href;
      const Icon = item.icon;
      return (
        <Link
          key={key}
          href={item.href}
          className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
            active
              ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300'
              : 'text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700'
          }`}
        >
          {Icon && <Icon className="w-5 h-5" />}
          <span>{item.label}</span>
        </Link>
      );
    }

    const active = item.items.some((it) => it.href === pathname);
    const Icon = item.icon;
    const expanded = openMenu === item.id;
    return (
      <div key={key} className="relative">
        <button
          aria-haspopup="menu"
          aria-expanded={expanded}
          onClick={() => setOpenMenu(expanded ? null : item.id)}
          onKeyDown={(e) => {
            if (e.key === 'Escape') setOpenMenu(null);
          }}
          className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium w-full sm:w-auto focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
            active
              ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300'
              : 'text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700'
          }`}
        >
          {Icon && <Icon className="w-5 h-5" />}
          <span>{item.label}</span>
          <ChevronDownIcon className={`w-4 h-4 transition-transform ${expanded ? 'rotate-180' : ''}`} />
        </button>
        {/* Desktop dropdown */}
        <div
          className={`${expanded ? 'block' : 'hidden'} sm:absolute sm:left-0 sm:mt-1 sm:min-w-[12rem]`}
          role="menu"
        >
          <div className="rounded-md border bg-white dark:bg-gray-800 shadow-lg overflow-hidden">
            {item.items.map((sub) => {
              const SubIcon = sub.icon;
              const subActive = pathname === sub.href;
              return (
                <Link
                  key={sub.href}
                  href={sub.href}
                  role="menuitem"
                  className={`block px-4 py-2 text-sm flex items-center gap-2 hover:bg-gray-50 dark:hover:bg-gray-700 ${
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
  };

  return (
    <nav className="bg-white/90 backdrop-blur dark:bg-gray-800/90 shadow-sm sticky top-0 z-30" ref={navRef as any}>
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between py-2">
          <div className="flex items-center gap-2">
            <Link href="/" className="text-sm font-semibold text-indigo-600 dark:text-indigo-300">Tasaweer</Link>
          </div>
          <div className="sm:hidden">
            <button
              onClick={() => setMobileOpen((v) => !v)}
              aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={mobileOpen}
              className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {mobileOpen ? <XIcon className="w-6 h-6" /> : <MenuIcon className="w-6 h-6" />}
            </button>
          </div>
          <div className="hidden sm:flex sm:items-center sm:gap-2">
            {navItems.map((item, idx) => renderItem(item, `top-${idx}`))}
          </div>
        </div>
        {/* Mobile drawer */}
        {mobileOpen && (
          <div className="sm:hidden pb-3 flex flex-col gap-1 border-t border-gray-200 dark:border-gray-700">
            {navItems.map((item, idx) => renderItem(item, `mobile-${idx}`))}
          </div>
        )}
      </div>
    </nav>
  );
};
