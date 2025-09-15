import React, { useEffect, useState, MouseEvent } from 'react';
import { Page } from '../types';
import { SparklesIcon, MagicWandIcon, SwapIcon, CheckIcon, StarIcon } from '../components/Icon';
import { Inter } from 'next/font/google';
import { getToken, getUsernameFromToken } from '@/utils/authClient';
import { getUserLimits, getRemainingImages, canUserGenerate } from '@/utils/userLimits';

const inter = Inter({ subsets: ['latin'], weight: ['400', '500', '600', '700', '900'] });
// Interactive showcase removed per request

// Showcase assets
import bookBefore from '../assets/showcase/book-before.jpg';
import bookAfterManga from '../assets/showcase/book-after-manga.png';
import laptopBefore from '../assets/showcase/laptop-before.png';
import laptopAfter from '../assets/showcase/laptop-after-omnitrix.png';
import laptopAfterDragonBalls from '../assets/showcase/laptop-after-dragon-balls.png';
import laptopAfterDominoes from '../assets/showcase/laptop-after-dominoes.png';
import wandBefore from '../assets/showcase/wand-before.jpg';
import wandAfter1 from '../assets/showcase/wand-after-1.png';
import wandAfter2 from '../assets/showcase/wand-after-2.png';
import wandAfter3 from '../assets/showcase/wand-after-3.png';
import wandAfter4 from '../assets/showcase/wand-after-4.png';

interface HomePageProps { goTo: (page: Page) => void; }

const FeatureCard: React.FC<{ title: string; desc: string; onClick: () => void; }>
  = ({ title, desc, onClick }) => {
    const handleMove = (e: MouseEvent<HTMLButtonElement>) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      e.currentTarget.style.setProperty('--mx', `${x}px`);
      e.currentTarget.style.setProperty('--my', `${y}px`);
    };
    return (
      <button onClick={onClick} onMouseMove={handleMove}
        className="group relative text-left rounded-2xl border p-6 bg-white dark:bg-gray-800 shadow hover:shadow-lg transform hover:-translate-y-0.5 transition card-glow">
        <div className="text-lg font-semibold">{title}</div>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">{desc}</p>
        <span className="absolute right-4 bottom-4 text-xs font-semibold opacity-70 group-hover:opacity-100">Explore →</span>
      </button>
    );
  };

const HomePage: React.FC<HomePageProps> = ({ goTo }) => {
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState<string | null>(null);
  const [userLimits, setUserLimits] = useState(null);
  const [canGenerate, setCanGenerate] = useState(true);
  const [remainingImages, setRemainingImages] = useState(-1);

  useEffect(() => {
    const checkAuthAndLimits = () => {
      const token = getToken();
      const user = getUsernameFromToken();
      const limits = getUserLimits();

      setIsAuthenticated(!!token);
      setUsername(user);
      setUserLimits(limits);
      setCanGenerate(canUserGenerate());
      setRemainingImages(getRemainingImages());
    };

    checkAuthAndLimits();

    const els = document.querySelectorAll<HTMLElement>('[data-reveal]');
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => entry.isIntersecting && entry.target.classList.add('is-visible'));
    }, { threshold: 0.12 });
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  const onHeroMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width;
    const py = (e.clientY - rect.top) / rect.height;
    setTilt({ x: (py - 0.5) * 6, y: (0.5 - px) * 6 });
  };
  const onHeroLeave = () => setTilt({ x: 0, y: 0 });

  return (
    <div className={`max-w-7xl mx-auto ${inter.className}`}>
      {/* Hero */}
      <section className="relative overflow-hidden bg-white/40 backdrop-blur-xl rounded-3xl p-8 md:p-14 border-2 border-white/30 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.25)]">
        <div className="hero-floating">
          <span className="absolute -top-10 -left-10 w-56 h-56 rounded-full bg-black/10 blur-3xl animate-float" />
          <span className="absolute bottom-0 -right-10 w-72 h-72 rounded-full bg-black/5 blur-3xl animate-float-slow" />
          <span className="absolute top-1/3 left-1/2 w-24 h-24 rounded-2xl bg-white/10 blur-xl animate-blob" />
        </div>
        <div className="grid md:grid-cols-2 gap-8 items-center">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/30 text-black text-xs font-semibold backdrop-blur-sm border border-white/20">
              <SparklesIcon className="w-4 h-4" /> AI visual editing
            </div>
            <h2 className="mt-4 text-5xl lg:text-7xl font-black leading-[0.95] text-black">Create stunning visuals with AI</h2>

            {/* User Limits Display */}
            {isAuthenticated && userLimits && (
              <div className="mt-4 px-4 py-2 rounded-lg bg-black/20 backdrop-blur-sm border border-black/10 text-sm font-semibold text-black">
                <div className="flex items-center gap-2">
                  <SparklesIcon className="w-4 h-4" />
                  {remainingImages === -1 ? (
                    <span>Unlimited AI generations available</span>
                  ) : (
                    <span>
                      {remainingImages} of {userLimits.imageLimit} generations remaining
                      {!canGenerate && (
                        <span className="ml-2 text-red-600">• Limit reached</span>
                      )}
                    </span>
                  )}
                </div>
              </div>
            )}

            <p className="mt-6 text-xl text-black font-medium leading-relaxed">Generate images from text, try apparel on your photo, or quickly edit a photo — all in one place.</p>
            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
              <button
                onClick={() => goTo('text2image')}
                disabled={isAuthenticated && !canGenerate && remainingImages !== -1}
                className={`btn-shine px-6 py-3 rounded-lg bg-black text-white font-bold shadow-[0_10px_40px_-10px_rgba(0,0,0,0.25)] hover:bg-gray-800 hover:scale-105 transition-all duration-200 inline-flex items-center gap-3 text-lg ${isAuthenticated && !canGenerate && remainingImages !== -1 ? 'opacity-50 cursor-not-allowed hover:scale-100' : ''}`}
                ><SparklesIcon className="w-5 h-5"/>Text → Image{(!canGenerate && remainingImages !== -1) ? ' (Limited)' : ''}<span aria-hidden className="shine"></span></button>
              <button
                onClick={() => goTo('try-apparel')}
                disabled={isAuthenticated && !canGenerate && remainingImages !== -1}
                className={`px-6 py-3 rounded-lg bg-white text-black border-2 border-black font-bold shadow-[0_10px_40px_-10px_rgba(0,0,0,0.25)] hover:bg-gray-50 hover:scale-105 transition-all duration-200 inline-flex items-center gap-3 text-lg ${isAuthenticated && !canGenerate && remainingImages !== -1 ? 'opacity-50 cursor-not-allowed hover:scale-100' : ''}`}
                ><SwapIcon className="w-5 h-5"/>Try Apparel{(!canGenerate && remainingImages !== -1) ? ' (Limited)' : ''}</button>
              <button
                onClick={() => goTo('photo-editor')}
                disabled={isAuthenticated && !canGenerate && remainingImages !== -1}
                className={`md:col-span-2 w-full btn-shine px-6 py-3 rounded-lg bg-black text-white font-bold shadow-[0_10px_40px_-10px_rgba(0,0,0,0.25)] hover:bg-gray-800 hover:scale-105 transition-all duration-200 inline-flex items-center justify-center gap-3 text-lg ${isAuthenticated && !canGenerate && remainingImages !== -1 ? 'opacity-50 cursor-not-allowed hover:scale-100' : ''}`}
                ><MagicWandIcon className="w-5 h-5"/>Photo Editor{(!canGenerate && remainingImages !== -1) ? ' (Limited)' : ''}<span aria-hidden className="shine"></span></button>
            </div>
          </div>
          <div className="relative" onMouseMove={onHeroMove} onMouseLeave={onHeroLeave}>
            <div className="absolute -inset-6 bg-black/5 blur-2xl rounded-3xl" />
            <div className="relative rounded-2xl bg-white/40 backdrop-blur-xl border-2 border-white/30 p-4 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.25)] will-change-transform" style={{ transform: `perspective(1000px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)` }}>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-2 rounded-lg bg-white/30 flex flex-col items-center">
                  <img src={bookBefore.src} alt="before" className="w-11/12 h-auto object-contain" />
                  <span className="mt-1 text-xs text-black">Original</span>
                </div>
                <div className="p-2 rounded-lg bg-white border-2 border-black flex flex-col items-center">
                  <img src={bookAfterManga.src} alt="after" className="w-11/12 h-auto object-contain" />
                  <span className="mt-1 text-xs text-black">Generated</span>
                </div>
                <div className="p-2 rounded-lg bg-white/30 flex flex-col items-center">
                  <img src={laptopBefore.src} alt="before" className="w-11/12 h-auto object-contain" />
                  <span className="mt-1 text-xs text-black">Original</span>
                </div>
                <div className="p-2 rounded-lg bg-white border-2 border-black flex flex-col items-center">
                  <img src={laptopAfter.src} alt="after" className="w-11/12 h-auto object-contain" />
                  <span className="mt-1 text-xs text-black">Generated</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Quick features */}
      <section className="mt-12 grid gap-4 md:grid-cols-3" data-reveal>
        <div className="bg-white/40 backdrop-blur-xl rounded-2xl border-2 border-white/30 p-6 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.25)] hover:scale-105 transition-all duration-200">
          <div className="text-lg font-semibold text-black">Image Restoration</div>
          <p className="mt-2 text-sm text-black">Fix damage, denoise, and color-correct — add optional notes.</p>
          <button onClick={() => goTo('restoration')} className="mt-4 px-4 py-2 rounded-lg bg-black text-white font-semibold hover:bg-gray-800 transition duration-200 inline-flex items-center gap-2">Explore</button>
        </div>
        <div className="bg-white/40 backdrop-blur-xl rounded-2xl border-2 border-white/30 p-6 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.25)] hover:scale-105 transition-all duration-200">
          <div className="text-lg font-semibold text-black">Object Replacement</div>
          <p className="mt-2 text-sm text-black">Describe what to swap and with what; add a sample if you like.</p>
          <button onClick={() => goTo('replace')} className="mt-4 px-4 py-2 rounded-lg bg-black text-white font-semibold hover:bg-gray-800 transition duration-200 inline-flex items-center gap-2">Explore</button>
        </div>
        <div className="bg-white/40 backdrop-blur-xl rounded-2xl border-2 border-white/30 p-6 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.25)]">
          <div className="text-lg font-semibold text-black">Why Tasaweers?</div>
          <ul className="mt-2 space-y-1 text-sm text-black">
            <li className="flex items-center gap-2"><CheckIcon className="w-4 h-4 text-black"/> Natural-looking edits</li>
            <li className="flex items-center gap-2"><CheckIcon className="w-4 h-4 text-black"/> Fast & interactive</li>
            <li className="flex items-center gap-2"><CheckIcon className="w-4 h-4 text-black"/> No setup required</li>
          </ul>
        </div>
      </section>

      {/* Interactive Showcase removed */}

      {/* Variations */}
      <section className="mt-12" data-reveal>
        <h3 className="text-2xl font-bold text-black">Variations</h3>
        <div className="mt-4 grid gap-6">
          {/* Wand variations with original sizing */}
          <div className="bg-white/40 backdrop-blur-xl rounded-2xl border-2 border-white/30 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.25)] overflow-hidden">
            <div className="grid md:grid-cols-2 items-start">
              <div className="p-3 bg-white/30 flex flex-col items-center justify-center">
                <img src={wandBefore.src} alt="Wand before" className="max-w-full h-auto object-contain" />
                <span className="mt-2 text-xs text-black">Original</span>
              </div>
              <div className="p-3 grid grid-cols-2 gap-3">
                {[
                  { src: wandAfter1.src, label: 'Hold Wand' },
                  { src: wandAfter2.src, label: 'Add Magic' },
                  { src: wandAfter3.src, label: 'Add Electricity' },
                  { src: wandAfter4.src, label: 'Make Simple' },
                ].map((it) => (
                  <div key={it.label} className="relative rounded-lg overflow-hidden border-2 border-black bg-white flex items-center justify-center">
                    <img src={it.src} alt={it.label} className="max-w-full h-auto object-contain" />
                    <span className="absolute left-2 top-2 text-[10px] font-semibold bg-black text-white px-1.5 py-0.5 rounded">{it.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Laptop fun variations including Omnitrix */}
          <div className="bg-white/40 backdrop-blur-xl rounded-2xl border-2 border-white/30 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.25)] overflow-hidden">
            <div className="grid md:grid-cols-2 items-start">
              <div className="p-3 bg-white/30 flex flex-col items-center justify-center">
                <img loading="lazy" src={laptopBefore.src} alt="Laptop before" className="max-w-full h-auto object-contain" />
                <span className="mt-2 text-xs text-black">Original</span>
              </div>
              <div className="p-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="relative rounded-lg overflow-hidden border-2 border-black bg-white flex items-center justify-center">
                  <img loading="lazy" src={laptopAfter.src} alt="Laptop after Omnitrix" className="max-w-full h-auto object-contain" />
                  <span className="absolute left-2 top-2 text-[10px] font-semibold bg-black text-white px-1.5 py-0.5 rounded">Omnitrix</span>
                </div>
                <div className="relative rounded-lg overflow-hidden border-2 border-black bg-white flex items-center justify-center">
                  <img loading="lazy" src={laptopAfterDragonBalls.src} alt="Laptop after Dragon Balls" className="max-w-full h-auto object-contain" />
                  <span className="absolute left-2 top-2 text-[10px] font-semibold bg-black text-white px-1.5 py-0.5 rounded">Dragon Balls</span>
                </div>
                <div className="relative rounded-lg overflow-hidden border-2 border-black bg-white flex items-center justify-center sm:col-span-2">
                  <img loading="lazy" src={laptopAfterDominoes.src} alt="Laptop after Dominoes" className="max-w-full h-auto object-contain" />
                  <span className="absolute left-2 top-2 text-[10px] font-semibold bg-black text-white px-1.5 py-0.5 rounded">Dominoes</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="mt-14" data-reveal>
        <h3 className="text-2xl font-bold text-black">Loved by creators</h3>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {[{ name: 'Alex R.', role: 'Archivist', quote: 'Restoration quality blew me away.' }, { name: 'Jamie L.', role: 'Designer', quote: 'Object replacement looks natural.' }, { name: 'Morgan C.', role: 'Photographer', quote: 'Fast and intuitive workflow.' }].map((t) => (
            <div key={t.name} className="bg-white/40 backdrop-blur-xl rounded-2xl border-2 border-white/30 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.25)] p-6">
              <div className="flex items-center gap-2 text-black">
                {[0,1,2,3,4].map((i) => (<StarIcon key={i} className="w-5 h-5" />))}
              </div>
              <p className="mt-3 text-black">"{t.quote}"</p>
              <div className="mt-4 text-sm text-black">{t.name} — {t.role}</div>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="mt-14" data-reveal>
        <h3 className="text-2xl font-bold text-black">FAQs</h3>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {[{ q: 'Can I add extra instructions?', a: 'Yes — on the restoration page, add any notes.' }, { q: 'How do I guide replacement?', a: 'Attach a sample image to show the style of the target object.' }, { q: 'Can I download results?', a: 'Yes, each tool shows a download button after generating.' }, { q: 'Supported formats?', a: 'JPG, PNG, WEBP up to 10MB.' }].map((item) => (
            <div key={item.q} className="bg-white/40 backdrop-blur-xl rounded-2xl border-2 border-white/30 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.25)] p-6">
              <div className="font-semibold text-black">{item.q}</div>
              <p className="text-sm text-black">{item.a}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="mt-16 text-center" data-reveal>
        <div className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-black text-white text-sm font-semibold shadow-[0_10px_40px_-10px_rgba(0,0,0,0.25)] hover:scale-105 transition-all duration-200">
          <SparklesIcon className="w-4 h-4" /> Start editing in seconds
        </div>
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            onClick={() => goTo('text2image')}
            disabled={isAuthenticated && !canGenerate && remainingImages !== -1}
            className={`btn-shine px-6 py-3 rounded-lg bg-black text-white font-bold shadow-[0_10px_40px_-10px_rgba(0,0,0,0.25)] hover:bg-gray-800 hover:scale-105 transition-all duration-200 inline-flex items-center gap-3 ${isAuthenticated && !canGenerate && remainingImages !== -1 ? 'opacity-50 cursor-not-allowed hover:scale-100' : ''}`}

            ><SparklesIcon className="w-5 h-5"/>Text → Image{(!canGenerate && remainingImages !== -1) ? ' (Limited)' : ''}<span aria-hidden className="shine"></span></button>
          <button
            onClick={() => goTo('try-apparel')}
            disabled={isAuthenticated && !canGenerate && remainingImages !== -1}
            className={`px-6 py-3 rounded-lg bg-white text-black border-2 border-black font-bold shadow-[0_10px_40px_-10px_rgba(0,0,0,0.25)] hover:bg-gray-50 hover:scale-105 transition-all duration-200 inline-flex items-center gap-3 ${isAuthenticated && !canGenerate && remainingImages !== -1 ? 'opacity-50 cursor-not-allowed hover:scale-100' : ''}`}
            ><SwapIcon className="w-5 h-5"/>Try Apparel{(!canGenerate && remainingImages !== -1) ? ' (Limited)' : ''}</button>
          <button
            onClick={() => goTo('photo-editor')}
            disabled={isAuthenticated && !canGenerate && remainingImages !== -1}
            className={`md:col-span-2 w-full btn-shine px-6 py-3 rounded-lg bg-black text-white font-bold shadow-[0_10px_40px_-10px_rgba(0,0,0,0.25)] hover:bg-gray-800 hover:scale-105 transition-all duration-200 inline-flex items-center justify-center gap-3 ${isAuthenticated && !canGenerate && remainingImages !== -1 ? 'opacity-50 cursor-not-allowed hover:scale-100' : ''}`}
            ><MagicWandIcon className="w-5 h-5"/>Photo Editor{(!canGenerate && remainingImages !== -1) ? ' (Limited)' : ''}<span aria-hidden className="shine"></span></button>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
