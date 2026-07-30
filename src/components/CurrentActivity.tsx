import type { EngineSnapshot } from '../types';
import { formatClockShort, formatDuration } from '../utils/time';

/**
 * The hero panel: what the audience should be doing right now, with a big
 * countdown for the active section and a preview of what's next.
 */
export function CurrentActivity({ snapshot }: { snapshot: EngineSnapshot }) {
  const { status, activeIndex, timeline, remainingInSection } = snapshot;

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
  const sectionDuration = active.offsetEnd - active.offsetStart;
  const progress =
    sectionDuration > 0
      ? Math.min(100, (1 - remainingInSection / sectionDuration) * 100)
      : 0;
  const almostDone = remainingInSection <= 30_000; // last 30 seconds

  return (
    <section className={`hero${almostDone ? ' hero--warning' : ''}`}>
      <div className="hero__label">
        Now · section {activeIndex + 1} of {timeline.length}
        {status === 'paused' && <span className="hero__paused">paused</span>}
      </div>
      <div className="hero__title">{active.section.title}</div>
      {active.section.activity && (
        <p className="hero__activity">{active.section.activity}</p>
      )}

      <div className="hero__countdown">
        <span className="hero__countdown-value">
          {formatDuration(remainingInSection)}
        </span>
        <span className="hero__countdown-label">remaining</span>
      </div>

      <div className="progress hero__progress">
        <div className="progress__bar" style={{ width: `${progress}%` }} />
      </div>

      {next ? (
        <div className="hero__next">
          Up next: <strong>{next.section.title}</strong>
          {next.clockStart != null && (
            <> · {formatClockShort(next.clockStart)}</>
          )}
        </div>
      ) : (
        <div className="hero__next">Last section — wrap up soon.</div>
      )}
    </section>
  );
}
