import React, { useEffect, useState, MouseEvent } from 'react';
import { Page } from '../types';
import { SparklesIcon, MagicWandIcon, SwapIcon, CheckIcon, StarIcon } from '../components/Icon';
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

  useEffect(() => {
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
    <div className="max-w-7xl mx-auto">
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-gray-800 dark:to-gray-900 rounded-3xl p-8 md:p-14 shadow-xl border border-indigo-100/60 dark:border-gray-700">
        <div className="hero-floating">
          <span className="absolute -top-10 -left-10 w-56 h-56 rounded-full bg-indigo-300/40 blur-3xl animate-float" />
          <span className="absolute bottom-0 -right-10 w-72 h-72 rounded-full bg-purple-300/30 blur-3xl animate-float-slow" />
          <span className="absolute top-1/3 left-1/2 w-24 h-24 rounded-2xl bg-white/20 dark:bg-white/5 animate-blob" />
        </div>
        <div className="grid md:grid-cols-2 gap-8 items-center">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300 text-xs font-semibold">
              <SparklesIcon className="w-4 h-4" /> AI visual editing
            </div>
            <h2 className="mt-4 text-4xl md:text-6xl font-extrabold leading-tight">Create, restore, and replace — with Tasaweer</h2>
            <p className="mt-4 text-lg text-gray-600 dark:text-gray-300">Restore old photos to life, or swap objects seamlessly with guided samples.</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <button onClick={() => goTo('restoration')} className="px-5 py-3 rounded-lg bg-purple-600 text-white font-semibold shadow hover:bg-purple-700 inline-flex items-center gap-2"><MagicWandIcon className="w-5 h-5"/>Start Restoration</button>
              <button onClick={() => goTo('replace')} className="px-5 py-3 rounded-lg bg-white dark:bg-gray-700 border font-semibold shadow hover:bg-gray-50 dark:hover:bg-gray-600 inline-flex items-center gap-2"><SwapIcon className="w-5 h-5"/>Try Replacement</button>
            </div>
          </div>
          <div className="relative" onMouseMove={onHeroMove} onMouseLeave={onHeroLeave}>
            <div className="absolute -inset-6 bg-gradient-to-r from-indigo-200 to-purple-200 dark:from-indigo-900/30 dark:to-purple-900/20 blur-2xl rounded-3xl" />
            <div className="relative rounded-2xl border glass p-4 shadow-xl will-change-transform" style={{ transform: `perspective(1000px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)` }}>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-2 rounded-lg bg-gray-50 dark:bg-gray-900/30 flex flex-col items-center">
                  <img src={bookBefore.src} alt="before" className="w-11/12 h-auto object-contain" />
                  <span className="mt-1 text-xs">Original</span>
                </div>
                <div className="p-2 rounded-lg bg-white dark:bg-gray-800 border-2 border-purple-500 flex flex-col items-center">
                  <img src={bookAfterManga.src} alt="after" className="w-11/12 h-auto object-contain" />
                  <span className="mt-1 text-xs">Generated</span>
                </div>
                <div className="p-2 rounded-lg bg-gray-50 dark:bg-gray-900/30 flex flex-col items-center">
                  <img src={laptopBefore.src} alt="before" className="w-11/12 h-auto object-contain" />
                  <span className="mt-1 text-xs">Original</span>
                </div>
                <div className="p-2 rounded-lg bg-white dark:bg-gray-800 border-2 border-purple-500 flex flex-col items-center">
                  <img src={laptopAfter.src} alt="after" className="w-11/12 h-auto object-contain" />
                  <span className="mt-1 text-xs">Generated</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Quick features */}
      <section className="mt-12 grid gap-4 md:grid-cols-3" data-reveal>
        <FeatureCard title="Image Restoration" desc="Fix damage, denoise, and color-correct — add optional notes." onClick={() => goTo('restoration')} />
        <FeatureCard title="Object Replacement" desc="Describe what to swap and with what; add a sample if you like." onClick={() => goTo('replace')} />
        <div className="rounded-2xl border p-6 bg-white dark:bg-gray-800">
          <div className="text-lg font-semibold">Why Tasaweer?</div>
          <ul className="mt-2 space-y-1 text-sm text-gray-600 dark:text-gray-300">
            <li className="flex items-center gap-2"><CheckIcon className="w-4 h-4 text-green-500"/> Natural-looking edits</li>
            <li className="flex items-center gap-2"><CheckIcon className="w-4 h-4 text-green-500"/> Fast & interactive</li>
            <li className="flex items-center gap-2"><CheckIcon className="w-4 h-4 text-green-500"/> No setup required</li>
          </ul>
        </div>
      </section>

      {/* Interactive Showcase removed */}

      {/* Variations */}
      <section className="mt-12" data-reveal>
        <h3 className="text-2xl font-bold">Variations</h3>
        <div className="mt-4 grid gap-6">
          {/* Wand variations with original sizing */}
          <div className="rounded-2xl border bg-white dark:bg-gray-800 overflow-hidden">
            <div className="grid md:grid-cols-2 items-start">
              <div className="p-3 bg-gray-50 dark:bg-gray-900/30 flex flex-col items-center justify-center">
                <img src={wandBefore.src} alt="Wand before" className="max-w-full h-auto object-contain" />
                <span className="mt-2 text-xs text-gray-600 dark:text-gray-300">Original</span>
              </div>
              <div className="p-3 grid grid-cols-2 gap-3">
                {[
                  { src: wandAfter1.src, label: 'Hold Wand' },
                  { src: wandAfter2.src, label: 'Add Magic' },
                  { src: wandAfter3.src, label: 'Add Electricity' },
                  { src: wandAfter4.src, label: 'Make Simple' },
                ].map((it) => (
                  <div key={it.label} className="relative rounded-lg overflow-hidden border-2 border-purple-500 bg-white dark:bg-gray-800 flex items-center justify-center">
                    <img src={it.src} alt={it.label} className="max-w-full h-auto object-contain" />
                    <span className="absolute left-2 top-2 text-[10px] font-semibold bg-purple-600 text-white px-1.5 py-0.5 rounded">{it.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Laptop fun variations including Omnitrix */}
          <div className="rounded-2xl border bg-white dark:bg-gray-800 overflow-hidden">
            <div className="grid md:grid-cols-2 items-start">
              <div className="p-3 bg-gray-50 dark:bg-gray-900/30 flex flex-col items-center justify-center">
                <img src={laptopBefore.src} alt="Laptop before" className="max-w-full h-auto object-contain" />
                <span className="mt-2 text-xs text-gray-600 dark:text-gray-300">Original</span>
              </div>
              <div className="p-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="relative rounded-lg overflow-hidden border-2 border-purple-500 bg-white dark:bg-gray-800 flex items-center justify-center">
                  <img src={laptopAfter.src} alt="Laptop after Omnitrix" className="max-w-full h-auto object-contain" />
                  <span className="absolute left-2 top-2 text-[10px] font-semibold bg-purple-600 text-white px-1.5 py-0.5 rounded">Omnitrix</span>
                </div>
                <div className="relative rounded-lg overflow-hidden border-2 border-purple-500 bg-white dark:bg-gray-800 flex items-center justify-center">
                  <img src={laptopAfterDragonBalls.src} alt="Laptop after Dragon Balls" className="max-w-full h-auto object-contain" />
                  <span className="absolute left-2 top-2 text-[10px] font-semibold bg-purple-600 text-white px-1.5 py-0.5 rounded">Dragon Balls</span>
                </div>
                <div className="relative rounded-lg overflow-hidden border-2 border-purple-500 bg-white dark:bg-gray-800 flex items-center justify-center sm:col-span-2">
                  <img src={laptopAfterDominoes.src} alt="Laptop after Dominoes" className="max-w-full h-auto object-contain" />
                  <span className="absolute left-2 top-2 text-[10px] font-semibold bg-purple-600 text-white px-1.5 py-0.5 rounded">Dominoes</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="mt-14" data-reveal>
        <h3 className="text-2xl font-bold">Loved by creators</h3>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {[{ name: 'Alex R.', role: 'Archivist', quote: 'Restoration quality blew me away.' }, { name: 'Jamie L.', role: 'Designer', quote: 'Object replacement looks natural.' }, { name: 'Morgan C.', role: 'Photographer', quote: 'Fast and intuitive workflow.' }].map((t) => (
            <div key={t.name} className="rounded-2xl border bg-white dark:bg-gray-800 p-6">
              <div className="flex items-center gap-2 text-amber-500">
                {[0,1,2,3,4].map((i) => (<StarIcon key={i} className="w-5 h-5" />))}
              </div>
              <p className="mt-3 text-gray-700 dark:text-gray-200">“{t.quote}”</p>
              <div className="mt-4 text-sm text-gray-500 dark:text-gray-400">{t.name} — {t.role}</div>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="mt-14" data-reveal>
        <h3 className="text-2xl font-bold">FAQs</h3>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {[{ q: 'Can I add extra instructions?', a: 'Yes — on the restoration page, add any notes.' }, { q: 'How do I guide replacement?', a: 'Attach a sample image to show the style of the target object.' }, { q: 'Can I download results?', a: 'Yes, each tool shows a download button after generating.' }, { q: 'Supported formats?', a: 'JPG, PNG, WEBP up to 10MB.' }].map((item) => (
            <div key={item.q} className="rounded-2xl border bg-white dark:bg-gray-800 p-6">
              <div className="font-semibold">{item.q}</div>
              <p className="text-sm text-gray-600 dark:text-gray-300">{item.a}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="mt-16 text-center" data-reveal>
        <div className="inline-flex items-center gap-2 px-4 py-3 rounded-full bg-purple-600 text-white text-sm font-semibold shadow">
          <SparklesIcon className="w-4 h-4" /> Start editing in seconds
        </div>
        <div className="mt-4 flex gap-3 justify-center">
          <button onClick={() => goTo('restoration')} className="px-5 py-3 rounded-lg bg-purple-600 text-white font-semibold shadow hover:bg-purple-700 inline-flex items-center gap-2"><MagicWandIcon className="w-5 h-5"/>Restore a photo</button>
          <button onClick={() => goTo('replace')} className="px-5 py-3 rounded-lg bg-white dark:bg-gray-700 border font-semibold shadow hover:bg-gray-50 dark:hover:bg-gray-600 inline-flex items-center gap-2"><SwapIcon className="w-5 h-5"/>Replace an object</button>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
