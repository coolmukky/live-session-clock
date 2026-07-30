import { useEffect } from 'react';
import type { EngineSnapshot } from '../types';
import { formatClock, formatDuration } from '../utils/time';

interface PresenterViewProps {
  snapshot: EngineSnapshot;
  now: number;
  onExit: () => void;
}

/**
 * A minimal, big-screen view for projecting to the room: the current activity,
 * a giant countdown, and the live clock. Toggled from the controls.
 */
export function PresenterView({ snapshot, now, onExit }: PresenterViewProps) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onExit();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onExit]);

  const { status, activeIndex, timeline, remainingInSection, overrunMs } =
    snapshot;
  const active = activeIndex >= 0 ? timeline[activeIndex] : null;
  const next = activeIndex >= 0 ? timeline[activeIndex + 1] : null;
  const isOverrun = overrunMs > 0;
  const almostDone = !isOverrun && remainingInSection <= 30_000;

  const stateClass = isOverrun
    ? ' presenter--overrun'
    : almostDone
      ? ' presenter--warning'
      : '';

  return (
    <div className={`presenter${stateClass}`}>
      <div className="presenter__top">
        <div className="presenter__clock">{formatClock(now)}</div>
        <button className="btn btn--ghost presenter__exit" onClick={onExit}>
          ✕ Exit (Esc)
        </button>
      </div>

      <div className="presenter__center">
        {status === 'idle' && (
          <>
            <div className="presenter__eyebrow">Ready</div>
            <div className="presenter__title">Waiting to start</div>
          </>
        )}

        {(status === 'finished' || (!active && status !== 'idle')) && (
          <>
            <div className="presenter__eyebrow">Complete</div>
            <div className="presenter__title">That's a wrap 🎉</div>
          </>
        )}

        {active && status !== 'finished' && (
          <>
            <div className="presenter__eyebrow">
              Now · {activeIndex + 1} of {timeline.length}
              {status === 'paused' && ' · paused'}
            </div>
            <div className="presenter__title">{active.section.title}</div>
            {active.section.activity && (
              <div className="presenter__activity">{active.section.activity}</div>
            )}
            <div
              className={`presenter__count${isOverrun ? ' presenter__count--over' : ''}`}
            >
              {isOverrun ? `+${formatDuration(overrunMs)}` : formatDuration(remainingInSection)}
            </div>
            <div className="presenter__sub">
              {isOverrun ? 'over time — wrap up or skip to next' : 'remaining'}
            </div>
            {next && (
              <div className="presenter__next">
                Up next: {next.section.title}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
