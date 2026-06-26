import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import gsap from 'gsap';
import { Lock, ArrowRight, ArrowLeft, Mail, KeyRound, User, Loader2, AlertCircle, Info } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import './marketing.css';

const VIDEO_SRC =
  'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260510_060007_60275ce7-030c-4668-a160-8f364ec537d3.mp4';

const serif = { fontFamily: "'Instrument Serif', serif" };

// Load Google Identity Services once.
let gsiPromise = null;
function loadGsi() {
  if (gsiPromise) return gsiPromise;
  gsiPromise = new Promise((resolve, reject) => {
    if (window.google?.accounts?.id) return resolve(window.google);
    const s = document.createElement('script');
    s.src = 'https://accounts.google.com/gsi/client';
    s.async = true;
    s.defer = true;
    s.onload = () => resolve(window.google);
    s.onerror = () => reject(new Error('Failed to load Google'));
    document.head.appendChild(s);
  });
  return gsiPromise;
}

function GoogleMark() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
      <path
        fill="#FFC107"
        d="M43.6 20.5H42V20H24v8h11.3C33.7 32.4 29.3 35 24 35c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.6 6.1 29.6 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.3-.4-3.5z"
      />
      <path
        fill="#FF3D00"
        d="M6.3 14.7l6.6 4.8C14.7 16 19 13 24 13c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.6 6.1 29.6 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"
      />
      <path
        fill="#4CAF50"
        d="M24 44c5.2 0 10-2 13.6-5.2l-6.3-5.2C29.2 35.3 26.7 36 24 36c-5.3 0-9.7-2.6-11.3-7l-6.5 5C9.5 39.6 16.2 44 24 44z"
      />
      <path
        fill="#1976D2"
        d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.1-4 5.6l6.3 5.2C41.4 36.6 44 31 44 24c0-1.3-.1-2.3-.4-3.5z"
      />
    </svg>
  );
}

export default function SignIn() {
  const navigate = useNavigate();
  const wrapRef = useRef(null);
  const videoRef = useRef(null);
  const cardRef = useRef(null);
  const [mode, setMode] = useState('signin');
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [busy, setBusy] = useState(false);

  const valid =
    /\S+@\S+\.\S+/.test(form.email) &&
    form.password.length >= 4 &&
    (mode === 'signin' || form.name.trim());

  const update = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  // GSAP mouse parallax on the video.
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    let targetX = 0, targetY = 0, curX = 0, curY = 0, raf;
    const onMove = (e) => {
      const cx = window.innerWidth / 2;
      const cy = window.innerHeight / 2;
      targetX = ((e.clientX - cx) / cx) * 20;
      targetY = ((e.clientY - cy) / cy) * 20;
    };
    const loop = () => {
      curX += (targetX - curX) * 0.06;
      curY += (targetY - curY) * 0.06;
      gsap.set(el, { x: curX, y: curY });
      raf = requestAnimationFrame(loop);
    };
    window.addEventListener('mousemove', onMove);
    raf = requestAnimationFrame(loop);
    return () => {
      window.removeEventListener('mousemove', onMove);
      cancelAnimationFrame(raf);
    };
  }, []);

  // GSAP entrance.
  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from('.auth-anim', {
        y: 26,
        opacity: 0,
        duration: 0.9,
        ease: 'power3.out',
        stagger: 0.1,
        delay: 0.1,
        clearProps: 'opacity,transform',
      });
    }, cardRef);
    return () => ctx.revert();
  }, [mode]);

  // Real Google Sign-In. Client ID can come from the build-time Vite env OR
  // (more reliably in production) from the backend at runtime via /api/config.
  const [clientId, setClientId] = useState(import.meta.env.VITE_GOOGLE_CLIENT_ID || '');
  const googleDivRef = useRef(null);
  useEffect(() => {
    if (clientId) return;
    fetch('/api/config')
      .then((r) => r.json())
      .then((d) => {
        if (d && d.googleClientId) setClientId(d.googleClientId);
      })
      .catch(() => {});
  }, [clientId]);
  useEffect(() => {
    if (!clientId) return;
    let cancelled = false;
    loadGsi()
      .then((google) => {
        if (cancelled || !google) return;
        google.accounts.id.initialize({
          client_id: clientId,
          callback: async (resp) => {
            try {
              await base44.auth.googleSignIn(resp.credential);
              window.location.assign('/welcome');
            } catch (err) {
              setError(err?.message || 'Google sign-in failed.');
            }
          },
        });
        if (googleDivRef.current) {
          googleDivRef.current.innerHTML = '';
          google.accounts.id.renderButton(googleDivRef.current, {
            theme: 'filled_black',
            size: 'large',
            shape: 'pill',
            text: 'continue_with',
            width: 340,
          });
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [clientId]);

  const submit = async (e) => {
    e.preventDefault();
    if (!valid || busy) return;
    setError('');
    setInfo('');
    setBusy(true);
    try {
      if (mode === 'signup') {
        await base44.auth.register(form.name.trim(), form.email.trim(), form.password);
      } else {
        await base44.auth.login(form.email.trim(), form.password);
      }
      // Full navigation so AuthContext re-reads the now-authenticated user.
      window.location.assign('/welcome');
    } catch (err) {
      setError(err?.message || 'Something went wrong. Please try again.');
      setBusy(false);
    }
  };

  return (
    <div className="marketing-root relative min-h-screen overflow-hidden">
      {/* Video background */}
      <div ref={wrapRef} className="fixed inset-0 z-0 origin-center scale-[1.08]">
        <video
          ref={videoRef}
          className="h-full w-full object-cover"
          autoPlay
          muted
          loop
          playsInline
          onLoadedMetadata={(e) => {
            e.currentTarget.playbackRate = 1.25;
          }}
        >
          <source src={VIDEO_SRC} type="video/mp4" />
        </video>
      </div>

      {/* Navy tint + readability scrim (matches the landing's deep navy) */}
      <div
        className="fixed inset-0 z-[1]"
        style={{
          background:
            'radial-gradient(120% 90% at 50% 30%, hsla(201,100%,13%,0.45) 0%, hsla(201,100%,13%,0.78) 55%, hsla(201,100%,10%,0.92) 100%)',
        }}
      />

      {/* Header */}
      <header className="fixed inset-x-0 top-0 z-30 flex items-center justify-between px-6 py-6 sm:px-10 sm:py-8">
        <Link to="/" className="text-xl tracking-tight text-white sm:text-2xl" style={serif}>
          Proofly<sup className="text-[10px]">®</sup>
        </Link>
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-sm text-white/65 transition-colors hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" /> Back to site
        </Link>
      </header>

      {/* Auth card */}
      <main className="relative z-20 flex min-h-screen items-center justify-center px-6 py-24">
        <div
          ref={cardRef}
          className="liquid-glass w-full max-w-md rounded-[30px] p-8 sm:p-10"
          style={{ background: 'rgba(255,255,255,0.025)' }}
        >
          <p className="auth-anim text-center text-[11px] font-medium uppercase tracking-[0.22em] text-white/45">
            Proofly
          </p>
          <h1
            className="auth-anim mt-3 text-center text-4xl leading-[1.05] text-white sm:text-5xl"
            style={serif}
          >
            Welcome to <em className="not-italic text-white/55">better academics.</em>
          </h1>
          <p className="auth-anim mx-auto mt-3 max-w-xs text-center text-sm text-white/55">
            {mode === 'signin'
              ? 'Sign in to pick up right where you left off.'
              : 'Create your account and build your first study kit.'}
          </p>

          <form onSubmit={submit} className="mt-8 space-y-3">
            {mode === 'signup' && (
              <div className="auth-anim">
                <Field icon={User} type="text" placeholder="Full name" value={form.name} onChange={update('name')} />
              </div>
            )}
            <div className="auth-anim">
              <Field icon={Mail} type="email" placeholder="you@school.edu" value={form.email} onChange={update('email')} />
            </div>
            <div className="auth-anim">
              <Field
                icon={KeyRound}
                type="password"
                placeholder="Password"
                value={form.password}
                onChange={update('password')}
              />
            </div>

            {error && (
              <div className="auth-anim flex items-start gap-2 rounded-2xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-100">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={!valid || busy}
              className="auth-anim group flex w-full items-center justify-center gap-2 rounded-full bg-white px-8 py-3.5 text-[15px] font-medium text-[hsl(201,100%,13%)] transition-all hover:scale-[1.02] hover:shadow-[0_0_32px_4px_rgba(255,255,255,0.22)] active:scale-[0.98] disabled:opacity-45 disabled:hover:scale-100 disabled:hover:shadow-none"
            >
              {busy ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Please wait…
                </>
              ) : (
                <>
                  {mode === 'signin' ? 'Sign in' : 'Create account'}
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </>
              )}
            </button>
          </form>

          <div className="auth-anim my-5 flex items-center gap-3">
            <span className="h-px flex-1 bg-white/12" />
            <span className="text-xs text-white/40">or</span>
            <span className="h-px flex-1 bg-white/12" />
          </div>

          {clientId ? (
            <div ref={googleDivRef} className="auth-anim flex min-h-[44px] items-center justify-center" />
          ) : (
            <button
              type="button"
              onClick={() => {
                setError('');
                setInfo('Google sign-in is coming soon — please continue with your email for now.');
              }}
              className="auth-anim flex w-full items-center justify-center gap-2.5 rounded-full border border-white/15 bg-white/[0.04] px-8 py-3.5 text-[15px] font-medium text-white/85 transition-colors hover:bg-white/10"
            >
              <GoogleMark /> Continue with Google
              <span className="ml-1 rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white/60">
                Soon
              </span>
            </button>
          )}

          {info && (
            <div className="auth-anim mt-3 flex items-start gap-2 rounded-2xl border border-white/15 bg-white/[0.06] px-4 py-3 text-sm text-white/80">
              <Info className="mt-0.5 h-4 w-4 shrink-0" />
              {info}
            </div>
          )}

          <p className="auth-anim mt-6 text-center text-sm text-white/55">
            {mode === 'signin' ? "New to Proofly? " : 'Already have an account? '}
            <button
              onClick={() => {
                setError('');
                setInfo('');
                setMode(mode === 'signin' ? 'signup' : 'signin');
              }}
              className="font-medium text-white underline-offset-4 hover:underline"
            >
              {mode === 'signin' ? 'Create an account' : 'Sign in'}
            </button>
          </p>

          <div className="auth-anim mt-6 flex items-center justify-center gap-2 text-white/55">
            <Lock size={13} strokeWidth={1.5} />
            <span className="text-[11px] font-medium tracking-[0.14em]">
              SECURE BY DESIGN. ZERO DATA LEAKS.
            </span>
          </div>
        </div>
      </main>
    </div>
  );
}

function Field({ icon: Icon, ...props }) {
  return (
    <div
      className="flex items-center gap-3 rounded-2xl border border-white/25 px-4 transition-colors focus-within:border-white/60"
      style={{ background: 'rgba(7, 26, 40, 0.55)' }}
    >
      <Icon className="h-[18px] w-[18px] shrink-0 text-white/60" />
      <input
        {...props}
        className="w-full bg-transparent py-3.5 text-[15px] text-white placeholder-white/45 outline-none"
      />
    </div>
  );
}
