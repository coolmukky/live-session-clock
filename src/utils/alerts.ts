import type { ChimeId } from '../types';

export const CHIMES: { id: ChimeId; label: string }[] = [
  { id: 'twoTone', label: 'Two-tone' },
  { id: 'bell', label: 'Bell' },
  { id: 'ding', label: 'Ding' },
  { id: 'triad', label: 'Triad' },
];

// Frequencies (Hz) and note timing per chime.
const RECIPES: Record<ChimeId, { freq: number; at: number; len: number }[]> = {
  twoTone: [
    { freq: 880, at: 0, len: 0.22 },
    { freq: 1174.66, at: 0.18, len: 0.24 },
  ],
  bell: [
    { freq: 1318.51, at: 0, len: 0.6 },
    { freq: 2637.02, at: 0, len: 0.4 },
  ],
  ding: [{ freq: 1567.98, at: 0, len: 0.35 }],
  triad: [
    { freq: 523.25, at: 0, len: 0.5 },
    { freq: 659.25, at: 0.12, len: 0.5 },
    { freq: 783.99, at: 0.24, len: 0.5 },
  ],
};

/** Play a short chime using the Web Audio API (no asset needed). */
export function playChime(chime: ChimeId = 'twoTone', volume = 0.6): void {
  try {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;
    const vol = Math.max(0, Math.min(1, volume)) * 0.4;
    let end = now;
    RECIPES[chime].forEach(({ freq, at, len }) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = chime === 'bell' ? 'triangle' : 'sine';
      osc.frequency.value = freq;
      const start = now + at;
      const stop = start + len;
      end = Math.max(end, stop);
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(Math.max(0.0002, vol), start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, stop);
      osc.connect(gain).connect(ctx.destination);
      osc.start(start);
      osc.stop(stop + 0.02);
    });
    window.setTimeout(() => ctx.close().catch(() => {}), (end - now) * 1000 + 300);
  } catch {
    /* audio not available — ignore */
  }
}

/** Ask for browser notification permission (call from a user gesture). */
export async function requestNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) return false;
  if (Notification.permission === 'granted') return true;
  if (Notification.permission === 'denied') return false;
  try {
    const result = await Notification.requestPermission();
    return result === 'granted';
  } catch {
    return false;
  }
}

/** Show a browser notification if permitted. */
export function showNotification(title: string, body: string): void {
  if (!('Notification' in window) || Notification.permission !== 'granted') {
    return;
  }
  try {
    new Notification(title, { body, icon: './clock.svg' });
  } catch {
    /* ignore */
  }
}
