import React, { useEffect, useState } from 'react';
import { Play, Pause, Volume2, Music2, Waves, Radio, Brain, Wind, AudioLines, Loader2 } from 'lucide-react';
import { youtubeAudio, YT_TRACKS } from '@/lib/youtubeAudio';

const ICONS = {
  classical: Music2,
  electronic: AudioLines,
  binaural: Radio,
  gamma40: Brain,
  white: Wind,
  pink: Waves,
};

export function useFocusAudio() {
  const [state, setState] = useState(youtubeAudio.state());
  useEffect(() => youtubeAudio.subscribe(setState), []);
  return state;
}

function Equalizer({ color = 'currentColor' }) {
  return (
    <span className="flex items-end gap-[2px]" aria-hidden="true">
      {[0, 1, 2, 3].map((i) => (
        <span
          key={i}
          className="w-[3px] rounded-full"
          style={{
            backgroundColor: color,
            height: 14,
            animation: `eq 0.9s ease-in-out ${i * 0.12}s infinite alternate`,
          }}
        />
      ))}
      <style>{`@keyframes eq { from { transform: scaleY(0.3); } to { transform: scaleY(1); } }`}</style>
    </span>
  );
}

/**
 * FocusSounds — continuous focus music streamed inline from YouTube (no redirect).
 * variant: 'light' (app) | 'dark' (marketing).
 */
export default function FocusSounds({ variant = 'light', compact = false }) {
  const { current, playing, volume, loadingId } = useFocusAudio();
  const dark = variant === 'dark';

  const surface = dark ? 'liquid-glass border-0' : 'card-elevated';
  const cardBase = dark
    ? 'border border-white/10 bg-white/[0.03] hover:border-white/25'
    : 'border border-border bg-card hover:border-primary/40';
  const cardActive = dark ? 'border-white/40 bg-white/10' : 'border-primary bg-primary/5';
  const textMain = dark ? 'text-white' : 'text-foreground';
  const textSub = dark ? 'text-white/55' : 'text-muted-foreground';

  return (
    <div className={`rounded-3xl p-5 ${surface}`}>
      <div className={`grid gap-3 ${compact ? 'sm:grid-cols-2' : 'sm:grid-cols-2 lg:grid-cols-3'}`}>
        {YT_TRACKS.map((t) => {
          const Icon = ICONS[t.id] || Music2;
          const active = current === t.id && playing;
          const loading = loadingId === t.id;
          return (
            <button
              key={t.id}
              onClick={() => youtubeAudio.toggle(t.id)}
              className={`group flex items-center gap-3 rounded-2xl p-3.5 text-left transition-all ${
                active || loading ? cardActive : cardBase
              }`}
            >
              <div
                className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${
                  active
                    ? dark
                      ? 'bg-white text-[hsl(201,100%,13%)]'
                      : 'bg-brand-gradient text-white'
                    : dark
                    ? 'bg-white/10 text-white'
                    : 'bg-secondary text-primary'
                }`}
              >
                {loading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : active ? (
                  <Equalizer color={dark ? '#0a2a3a' : '#fff'} />
                ) : (
                  <Icon className="h-5 w-5" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className={`truncate text-sm font-semibold ${textMain}`}>{t.name}</p>
                <p className={`truncate text-xs ${textSub}`}>{t.desc}</p>
              </div>
              <div
                className={`grid h-8 w-8 shrink-0 place-items-center rounded-full ${
                  dark ? 'bg-white/10 text-white' : 'bg-secondary text-foreground/70'
                } opacity-0 transition-opacity group-hover:opacity-100`}
              >
                {active ? <Pause className="h-4 w-4" /> : <Play className="ml-0.5 h-4 w-4" />}
              </div>
            </button>
          );
        })}
      </div>

      {/* Now-playing bar */}
      <div
        className={`mt-4 flex items-center gap-4 rounded-2xl p-3.5 ${
          dark ? 'bg-white/[0.05]' : 'bg-secondary/60'
        }`}
      >
        <button
          onClick={() => (playing ? youtubeAudio.pause() : current ? youtubeAudio.resume() : null)}
          className={`grid h-11 w-11 shrink-0 place-items-center rounded-full ${
            dark ? 'bg-white text-[hsl(201,100%,13%)]' : 'bg-brand-gradient text-white shadow-brand'
          }`}
        >
          {playing ? <Pause className="h-5 w-5" /> : <Play className="ml-0.5 h-5 w-5" />}
        </button>
        <div className="min-w-0 flex-1">
          <p className={`truncate text-sm font-semibold ${textMain}`}>
            {current ? YT_TRACKS.find((t) => t.id === current)?.name : 'Pick a sound'}
          </p>
          <p className={`truncate text-xs ${textSub}`}>
            {loadingId
              ? 'Loading…'
              : playing
              ? 'Now playing · streamed inline'
              : 'Tap a track to start'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Volume2 className={`h-4 w-4 ${textSub}`} />
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={volume}
            onChange={(e) => youtubeAudio.setVolume(parseFloat(e.target.value))}
            className="w-24"
            style={{ accentColor: dark ? '#ffffff' : 'hsl(262 83% 58%)' }}
          />
        </div>
      </div>
    </div>
  );
}
