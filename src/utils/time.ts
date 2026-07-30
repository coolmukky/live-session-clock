/** Format a duration in ms as H:MM:SS or M:SS. */
export function formatDuration(ms: number): string {
  const totalSeconds = Math.max(0, Math.round(ms / 1000));
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  const pad = (n: number) => n.toString().padStart(2, '0');
  if (h > 0) return `${h}:${pad(m)}:${pad(s)}`;
  return `${m}:${pad(s)}`;
}

/** Format an epoch (ms) as a wall-clock time, e.g. "2:05:09 PM". */
export function formatClock(epoch: number): string {
  return new Date(epoch).toLocaleTimeString([], {
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
  });
}

/** Format an epoch (ms) as a short wall-clock time, e.g. "2:05 PM". */
export function formatClockShort(epoch: number): string {
  return new Date(epoch).toLocaleTimeString([], {
    hour: 'numeric',
    minute: '2-digit',
  });
}

/** Format an epoch (ms) as a full date, e.g. "Thursday, July 30, 2026". */
export function formatDate(epoch: number): string {
  return new Date(epoch).toLocaleDateString([], {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/** Human summary of a minute count, e.g. "1 hr 5 min", "45 min". */
export function formatMinutes(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  if (h > 0 && m > 0) return `${h} hr ${m} min`;
  if (h > 0) return `${h} hr`;
  return `${m} min`;
}

/** Reasonably-unique id without external deps. */
export function makeId(): string {
  return (
    Math.random().toString(36).slice(2, 10) +
    Math.random().toString(36).slice(2, 6)
  );
}
