import React, { useEffect, useRef, useState } from 'react';
import { Music2, Play, Pause, Volume2, ChevronRight, Waves, Radio, Wind, AudioLines } from 'lucide-react';
import { focusAudio, TRACKS } from '@/lib/focusAudio';

const QUICK = ['classical', 'electronic', 'binaural', 'white'];
const QUICK_ICON = { classical: Music2, electronic: AudioLines, binaural: Radio, white: Wind, pink: Waves };

function SpotifyMark() {
  return (
    <span className="grid h-8 w-8 place-items-center rounded-lg bg-[#1DB954]">
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="#fff">
        <path d="M12 2a10 10 0 100 20 10 10 0 000-20zm4.6 14.4a.62.62 0 01-.86.21c-2.35-1.44-5.3-1.76-8.79-.96a.62.62 0 11-.28-1.21c3.81-.87 7.08-.5 9.72 1.11.3.18.39.57.21.85zm1.23-2.74a.78.78 0 01-1.07.26c-2.69-1.65-6.79-2.13-9.97-1.17a.78.78 0 11-.45-1.49c3.63-1.1 8.15-.56 11.24 1.33.36.22.48.7.25 1.07zm.1-2.85C14.8 8.95 9.5 8.78 6.45 9.7a.93.93 0 11-.54-1.78c3.5-1.06 9.35-.86 13.04 1.33a.93.93 0 11-.95 1.6z" />
      </svg>
    </span>
  );
}
function AppleMusicMark() {
  return (
    <span className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-[#FA57C1] to-[#FB5C74]">
      <Music2 className="h-4 w-4 text-white" />
    </span>
  );
}
function BrainMark() {
  return (
    <span className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-sky-400 to-blue-600 text-white text-[11px] font-bold">
      fm
    </span>
  );
}

const SERVICES = [
  { id: 'spotify', name: 'Spotify', Mark: SpotifyMark, url: 'https://open.spotify.com' },
  { id: 'apple', name: 'Apple Music', Mark: AppleMusicMark, url: 'https://music.apple.com' },
  { id: 'brainfm', name: 'Brain.fm', Mark: BrainMark, url: 'https://brain.fm' },
];

export default function MusicMenu() {
  const [open, setOpen] = useState(false);
  const [state, setState] = useState(focusAudio.state());
  const ref = useRef(null);

  useEffect(() => focusAudio.subscribe(setState), []);
  useEffect(() => {
    const h = (e) => ref.current && !ref.current.contains(e.target) && setOpen(false);
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const { current, playing, volume } = state;
  const currentTrack = current ? TRACKS.find((t) => t.id === current) : null;

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className={`flex items-center gap-2 rounded-full border px-3 py-2 text-sm transition-colors ${
          playing
            ? 'border-primary/40 bg-primary/10 text-primary'
            : 'border-border bg-card text-foreground/80 hover:bg-secondary'
        }`}
        title="Music"
      >
        <Music2 className="h-4 w-4" />
        {playing && currentTrack ? (
          <span className="hidden max-w-[90px] truncate sm:inline">{currentTrack.name}</span>
        ) : (
          <span className="hidden sm:inline">Music</span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-80 origin-top-right overflow-hidden rounded-3xl border border-white/10 bg-popover/95 p-4 shadow-2xl shadow-black/60 backdrop-blur-xl">
          <p className="px-1 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/70">
            Now playing
          </p>
          <div className="mt-2 flex items-center gap-3 rounded-2xl bg-secondary/60 p-3">
            <div className="grid h-11 w-11 place-items-center rounded-xl bg-brand-gradient text-white">
              <Music2 className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-foreground">
                {currentTrack ? currentTrack.name : 'Nothing playing'}
              </p>
              <p className="truncate text-xs text-muted-foreground">
                {currentTrack ? currentTrack.desc : 'Pick a focus sound below'}
              </p>
            </div>
            <button
              onClick={() => (playing ? focusAudio.stop() : current && focusAudio.play(current))}
              className="grid h-9 w-9 place-items-center rounded-full bg-brand-gradient text-white shadow-brand"
            >
              {playing ? <Pause className="h-4 w-4" /> : <Play className="ml-0.5 h-4 w-4" />}
            </button>
          </div>

          {/* Volume */}
          <div className="mt-3 flex items-center gap-2 px-1">
            <Volume2 className="h-4 w-4 text-muted-foreground" />
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={volume}
              onChange={(e) => focusAudio.setVolume(parseFloat(e.target.value))}
              className="w-full"
              style={{ accentColor: 'hsl(214 95% 60%)' }}
            />
          </div>

          {/* Built-in focus sounds */}
          <p className="mt-4 px-1 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/70">
            Proofly focus sounds
          </p>
          <div className="mt-2 grid grid-cols-2 gap-2">
            {QUICK.map((id) => {
              const t = TRACKS.find((x) => x.id === id);
              const Icon = QUICK_ICON[id] || Music2;
              const active = current === id && playing;
              return (
                <button
                  key={id}
                  onClick={() => focusAudio.toggle(id)}
                  className={`flex items-center gap-2 rounded-xl border px-3 py-2.5 text-left text-sm transition-all ${
                    active ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-card hover:border-primary/40'
                  }`}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span className="truncate">{t?.name}</span>
                </button>
              );
            })}
          </div>

          {/* Connect a service */}
          <p className="mt-4 px-1 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/70">
            Connect a service
          </p>
          <div className="mt-2 space-y-1.5">
            {SERVICES.map((s) => (
              <a
                key={s.id}
                href={s.url}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-3 rounded-xl border border-border bg-card px-3 py-2.5 transition-colors hover:bg-secondary"
              >
                <s.Mark />
                <span className="flex-1 text-sm font-medium text-foreground">{s.name}</span>
                <span className="text-xs text-muted-foreground">Connect</span>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
