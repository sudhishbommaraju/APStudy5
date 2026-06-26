import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, ArrowUpRight } from 'lucide-react';
import Lenis from 'lenis';
import './marketing.css';

const NAV = [
  { label: 'Home', to: '/' },
  { label: 'Features', to: '/features' },
  { label: 'About', to: '/about' },
  { label: 'Contact', to: '/contact' },
];

const serif = { fontFamily: "'Instrument Serif', serif" };

function NavBar() {
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => setOpen(false), [pathname]);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 flex flex-col items-center transition-all duration-300 ${
        scrolled ? 'py-3' : 'py-5'
      }`}
    >
      <div className="liquid-glass liquid-glass-strong flex w-[calc(100vw-2rem)] max-w-4xl items-center justify-between rounded-full py-2.5 pl-7 pr-2.5">
        <Link to="/" className="text-2xl tracking-tight text-white" style={serif}>
          Proofly<sup className="text-xs">®</sup>
        </Link>

        <nav className="hidden items-center gap-10 md:flex">
          {NAV.map((n) => {
            const active = n.to === '/' ? pathname === '/' : pathname.startsWith(n.to);
            return (
              <Link
                key={n.to}
                to={n.to}
                className={`text-sm transition-colors ${
                  active ? 'text-white' : 'text-white/55 hover:text-white'
                }`}
              >
                {n.label}
              </Link>
            );
          })}
        </nav>

        <Link
          to="/signin"
          className="hidden items-center gap-1.5 rounded-full bg-white px-5 py-2.5 text-sm font-medium text-[hsl(201,100%,13%)] transition-transform hover:scale-[1.03] md:flex"
        >
          Begin Journey <ArrowUpRight className="h-4 w-4" />
        </Link>
        <button
          onClick={() => setOpen((o) => !o)}
          className="grid h-10 w-10 place-items-center rounded-full text-white md:hidden"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {open && (
        <div className="mt-2 w-[calc(100vw-2rem)] max-w-sm rounded-3xl liquid-glass liquid-glass-strong p-5 md:hidden">
          <nav className="flex flex-col gap-1">
            {NAV.map((n) => (
              <Link
                key={n.to}
                to={n.to}
                className="rounded-xl px-3 py-3 text-base text-white/80 hover:bg-white/5 hover:text-white"
              >
                {n.label}
              </Link>
            ))}
            <Link
              to="/signin"
              className="mt-2 flex items-center justify-center gap-1.5 rounded-full bg-white px-6 py-3 text-sm font-medium text-[hsl(201,100%,13%)]"
            >
              Begin Journey <ArrowUpRight className="h-4 w-4" />
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}

function Footer() {
  return (
    <footer className="relative z-10 border-t border-white/10 px-6 py-14">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col items-start justify-between gap-10 md:flex-row">
          <div className="max-w-sm">
            <p className="text-3xl tracking-tight text-white" style={serif}>
              Proofly<sup className="text-xs">®</sup>
            </p>
            <p className="mt-3 text-sm leading-relaxed text-white/55">
              Turn anything — a PDF, a lecture, a video — into AP-ready notes, flashcards, and
              practice. Built for deep focus and inspired work.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-x-16 gap-y-8 sm:grid-cols-3">
            <FooterCol
              title="Product"
              links={[
                ['Features', '/features'],
                ['Dashboard', '/Dashboard'],
                ['Create', '/Create'],
              ]}
            />
            <FooterCol
              title="Company"
              links={[
                ['About', '/about'],
                ['Contact', '/contact'],
              ]}
            />
            <FooterCol
              title="Study"
              links={[
                ['Practice', '/Practice'],
                ['Flashcards', '/Flashcards'],
                ['Focus', '/Focus'],
              ]}
            />
          </div>
        </div>
        <div className="mt-12 flex flex-col items-center justify-between gap-3 border-t border-white/10 pt-6 text-xs text-white/40 sm:flex-row">
          <p>© {2026} Proofly. All rights reserved.</p>
          <p>Designed for thinkers, creators, and quiet rebels.</p>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({ title, links }) {
  return (
    <div>
      <p className="mb-3 text-xs uppercase tracking-wider text-white/40">{title}</p>
      <ul className="space-y-2.5">
        {links.map(([label, to]) => (
          <li key={label}>
            <Link to={to} className="text-sm text-white/65 transition-colors hover:text-white">
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function MarketingLayout({ children, hideFooter = false }) {
  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.15,
      smoothWheel: true,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    });
    let raf;
    const loop = (t) => {
      lenis.raf(t);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      lenis.destroy();
    };
  }, []);

  return (
    <div className="marketing-root">
      <NavBar />
      {children}
      {!hideFooter && <Footer />}
    </div>
  );
}
