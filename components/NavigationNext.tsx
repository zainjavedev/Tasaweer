'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { MagicWandIcon, SwapIcon, SparklesIcon, CameraIcon, MenuIcon, XIcon, ChevronDownIcon, YoutubeIcon } from './Icon';
import { getToken, getUsernameFromToken } from '@/utils/authClient';

type NavItem =
  | { type: 'link'; href: string; label: string; icon?: React.FC<any> }
  | { type: 'menu'; label: string; icon?: React.FC<any>; id: string; items: { href: string; label: string; icon?: React.FC<any> }[] };

const baseNavItems: NavItem[] = [
  { type: 'link', href: '/', label: 'Home', icon: SparklesIcon },
  { type: 'link', href: '/text2image', label: 'Text → Image', icon: SparklesIcon },
  { type: 'link', href: '/try-apparel', label: 'Try Apparel', icon: CameraIcon },
  { type: 'link', href: '/photo-editor', label: 'Photo Editor', icon: MagicWandIcon },
  { type: 'link', href: '/youtube-thumbnail-editor', label: 'YouTube Thumbnails', icon: YoutubeIcon },
];

export const NavigationNext: React.FC = () => {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const navRef = useRef<HTMLDivElement | null>(null);
  const [authed, setAuthed] = useState(false);
  const [user, setUser] = useState<string | null>(null);

  useEffect(() => {
    const t = getToken();
    setAuthed(!!t);
    setUser(getUsernameFromToken());
  }, []);

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
          className={`relative flex items-center gap-3 px-4 py-2 rounded font-semibold tracking-wide leading-none select-none focus:ring focus:ring-indigo-300 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-900 transition duration-150 ${active ? 'bg-indigo-300/40 text-indigo-700 dark:bg-indigo-700/50 dark:text-indigo-300' : 'text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300'}`}
        >
          {Icon && <Icon className="w-5 h-5" />}
          {item.label}
        </Link>
      );
    }
    if (item.type === 'menu') {
      const active = item.items.some((i) => i.href === pathname);
      const Icon = item.icon;
      return (
        <div key={key} className="relative">
          <button
            type="button"
            aria-haspopup="true"
            aria-expanded={openMenu === item.id}
            onClick={() => setOpenMenu(openMenu === item.id ? null : item.id)}
            className={`flex items-center gap-1 rounded px-4 py-2 font-semibold tracking-wide leading-none select-none transition duration-150 focus:ring focus:ring-indigo-300 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-900 ${
              active ? 'bg-indigo-300/40 text-indigo-700 dark:bg-indigo-700/50 dark:text-indigo-300' : 'text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300'
            }`}
          >
            {Icon && <Icon className="w-5 h-5" />}
            {item.label}
            <ChevronDownIcon className="w-3 h-3 -mr-1" />
          </button>
          {openMenu === item.id && (
            <div className="absolute top-full left-0 mt-2 w-48 rounded border bg-white dark:bg-gray-800 p-2 shadow-lg text-sm">
              {item.items.map((subItem) => (
                <Link key={subItem.href} href={subItem.href} className="block rounded px-3 py-2 hover:bg-indigo-200 dark:hover:bg-indigo-700">
                  {subItem.label}
                </Link>
              ))}
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <nav
      ref={navRef}
      className="relative bg-white/40 backdrop-blur dark:bg-gray-800/40 rounded-[12px] border-2 border-white/30 mx-4 mb-4 flex flex-wrap items-center justify-between gap-1 px-4 py-3 text-indigo-600 dark:text-indigo-400 shadow-md"
    >
      <div className="flex items-center gap-1">
        <button
          type="button"
          className="sm:hidden"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu"
        >
          {mobileOpen ? <XIcon className="w-5 h-5" /> : <MenuIcon className="w-5 h-5" />}
        </button>
        {baseNavItems.map((item, i) => renderItem(item, `nav-${i}`))}
      </div>

      <div className="hidden sm:flex gap-4 items-center">
        {authed && <span className="text-indigo-600 dark:text-indigo-400 text-sm font-semibold">{user}</span>}
      </div>
    </nav>
  );
};
