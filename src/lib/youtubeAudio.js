// Focus music via YouTube's official IFrame Player API.
// Plays real tracks INLINE (no redirect) through a hidden 1x1 embedded player.
// A module-level singleton keeps audio playing across route changes.

export const YT_TRACKS = [
  { id: 'classical', name: 'Classical', desc: 'Timeless focus pieces', tag: 'Calm focus', videoId: 'oExWo1rIZsQ' },
  { id: 'electronic', name: 'Electronic', desc: 'Lofi beats radio', tag: 'Flow state', videoId: 'jfKfPfyJRdk' },
  { id: 'binaural', name: 'Binaural Beats', desc: 'Alpha waves · 12 Hz', tag: 'Relaxed focus', videoId: 'kqna5SZzg-o' },
  { id: 'gamma40', name: '40 Hz Gamma', desc: 'Memory & concentration', tag: 'Deep work', videoId: 'Z8ANihFXlgU' },
  { id: 'white', name: 'White Noise', desc: 'Even, full-spectrum hush', tag: 'Block distractions', videoId: 'nMfPqeZjc2c' },
  { id: 'pink', name: 'Pink Noise', desc: 'Softer, balanced noise', tag: 'Steady & calm', videoId: 'HIkAOMw_sjw' },
];

let apiPromise = null;
function loadAPI() {
  if (apiPromise) return apiPromise;
  apiPromise = new Promise((resolve) => {
    if (window.YT && window.YT.Player) return resolve(window.YT);
    const prev = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      if (prev) prev();
      resolve(window.YT);
    };
    if (!document.getElementById('yt-iframe-api')) {
      const tag = document.createElement('script');
      tag.id = 'yt-iframe-api';
      tag.src = 'https://www.youtube.com/iframe_api';
      document.head.appendChild(tag);
    }
  });
  return apiPromise;
}

class YouTubeAudio {
  constructor() {
    this.player = null;
    this.ready = false;
    this.current = null;
    this.playing = false;
    this.loadingId = null;
    this.volume = 0.6;
    this.listeners = new Set();
  }

  subscribe(fn) {
    this.listeners.add(fn);
    fn(this.state());
    return () => this.listeners.delete(fn);
  }
  state() {
    return {
      current: this.current,
      playing: this.playing,
      volume: this.volume,
      loadingId: this.loadingId,
    };
  }
  emit() {
    const s = this.state();
    this.listeners.forEach((f) => f(s));
  }

  async _ensure() {
    if (this.player) return;
    const YT = await loadAPI();
    let host = document.getElementById('proofly-yt-host');
    if (!host) {
      host = document.createElement('div');
      host.id = 'proofly-yt-host';
      Object.assign(host.style, {
        position: 'fixed',
        left: '-9999px',
        bottom: '0',
        width: '1px',
        height: '1px',
        opacity: '0',
        pointerEvents: 'none',
      });
      const inner = document.createElement('div');
      inner.id = 'proofly-yt-player';
      host.appendChild(inner);
      document.body.appendChild(host);
    }
    await new Promise((resolve) => {
      this.player = new YT.Player('proofly-yt-player', {
        height: '1',
        width: '1',
        playerVars: {
          autoplay: 0,
          controls: 0,
          disablekb: 1,
          fs: 0,
          modestbranding: 1,
          playsinline: 1,
          rel: 0,
        },
        events: {
          onReady: () => {
            this.ready = true;
            this.player.setVolume(Math.round(this.volume * 100));
            resolve();
          },
          onStateChange: (e) => {
            const S = window.YT.PlayerState;
            if (e.data === S.PLAYING) {
              this.playing = true;
              this.loadingId = null;
            } else if (e.data === S.PAUSED) {
              this.playing = false;
            } else if (e.data === S.ENDED) {
              this.player.seekTo(0);
              this.player.playVideo();
            }
            this.emit();
          },
          onError: () => {
            this.loadingId = null;
            this.playing = false;
            this.emit();
          },
        },
      });
    });
  }

  async toggle(trackId) {
    if (this.current === trackId && this.playing) {
      this.pause();
      return;
    }
    await this.play(trackId);
  }

  async play(trackId) {
    const t = YT_TRACKS.find((x) => x.id === trackId);
    if (!t) return;
    this.loadingId = trackId;
    this.current = trackId;
    this.emit();
    await this._ensure();
    this.player.setVolume(Math.round(this.volume * 100));
    this.player.loadVideoById(t.videoId);
    this.player.playVideo();
  }

  pause() {
    if (this.player) this.player.pauseVideo();
    this.playing = false;
    this.emit();
  }

  resume() {
    if (this.player) this.player.playVideo();
  }

  stop() {
    if (this.player) this.player.stopVideo();
    this.playing = false;
    this.current = null;
    this.loadingId = null;
    this.emit();
  }

  setVolume(v) {
    this.volume = v;
    if (this.player && this.ready) this.player.setVolume(Math.round(v * 100));
    this.emit();
  }
}

export const youtubeAudio = new YouTubeAudio();
