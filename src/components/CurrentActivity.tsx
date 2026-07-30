import type { EngineSnapshot } from '../types';
import { formatClockShortDated, formatDuration } from '../utils/time';

/**
 * The hero panel: what the audience should be doing right now, with a big
 * countdown for the active section, an overrun state, and a preview of what's
 * next.
 */
export function CurrentActivity({ snapshot }: { snapshot: EngineSnapshot }) {
  const { status, activeIndex, timeline, remainingInSection, overrunMs } =
    snapshot;

  if (status === 'idle') {
    return (
      <section className="hero hero--idle">
        <div className="hero__label">Ready to start</div>
        <div className="hero__title">Press Start when your session begins</div>
        <p className="hero__activity">
          The agenda below will sync to the clock and each section will show
          here automatically.
        </p>
      </section>
    );
  }

  if (status === 'finished' || activeIndex < 0) {
    return (
      <section className="hero hero--done">
        <div className="hero__label">Session complete</div>
        <div className="hero__title">That's a wrap — thank you!</div>
        <p className="hero__activity">All sections have finished.</p>
      </section>
    );
  }

  const active = timeline[activeIndex];
  const next = timeline[activeIndex + 1];
  const isOverrun = overrunMs > 0;
  const almostDone = !isOverrun && remainingInSection <= 30_000; // last 30s

  const activeDuration =
    active.clockStart != null && active.clockEnd != null
      ? active.clockEnd - active.clockStart
      : 0;
  const progress =
    activeDuration > 0
      ? Math.min(100, ((activeDuration - remainingInSection) / activeDuration) * 100)
      : 0;

  const heroClass = isOverrun
    ? ' hero--overrun'
    : almostDone
      ? ' hero--warning'
      : '';

  // Tint the hero's accent bar with the active section's color (if any).
  const color = active.section.color;
  const heroStyle =
    color && !isOverrun && !almostDone
      ? ({ ['--accent']: color, ['--accent-2']: color } as React.CSSProperties)
      : undefined;
  const dayRef = active.clockStart ?? Date.now();

  return (
    <section className={`hero${heroClass}`} style={heroStyle}>
      <div className="hero__label">
        Now · section {activeIndex + 1} of {timeline.length}
        {status === 'paused' && <span className="hero__paused">paused</span>}
        {isOverrun && <span className="hero__over-pill">over time</span>}
      </div>
      <div className="hero__title">{active.section.title}</div>
      {active.section.activity && (
        <p className="hero__activity">{active.section.activity}</p>
      )}

      <div className="hero__countdown">
        {isOverrun ? (
          <>
            <span className="hero__countdown-value hero__countdown-value--over">
              +{formatDuration(overrunMs)}
            </span>
            <span className="hero__countdown-label">over — wrap up / next</span>
          </>
        ) : (
          <>
            <span className="hero__countdown-value">
              {formatDuration(remainingInSection)}
            </span>
            <span className="hero__countdown-label">remaining</span>
          </>
        )}
      </div>

      <div className="progress hero__progress">
        <div
          className={`progress__bar${isOverrun ? ' progress__bar--over' : ''}`}
          style={{ width: `${isOverrun ? 100 : progress}%` }}
        />
      </div>

      {next ? (
        <div className="hero__next">
          Up next: <strong>{next.section.title}</strong>
          {next.clockStart != null && (
            <> · {formatClockShortDated(next.clockStart, dayRef)}</>
          )}
        </div>
      ) : (
        <div className="hero__next">Last section — wrap up soon.</div>
      )}
    </section>
  );
}
