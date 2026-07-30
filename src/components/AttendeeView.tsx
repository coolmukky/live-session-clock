import type { SessionData } from '../types';
import { Clock } from './Clock';
import { formatMinutes } from '../utils/time';

interface AttendeeViewProps {
  session: SessionData;
  now: number;
  /** Switch into the full editable timer app. */
  onOpenApp: () => void;
}

/**
 * A clean, read-only view of the session — what a scanned QR / shared link
 * opens. Shows the title, instructions, and the timed agenda, with no editing
 * or run controls. (There's no backend, so it shows the plan, not a live-synced
 * countdown.)
 */
export function AttendeeView({ session, now, onOpenApp }: AttendeeViewProps) {
  const totalMinutes = session.sections.reduce(
    (sum, s) => sum + Math.max(0, s.durationMinutes),
    0,
  );

  return (
    <div className="attendee">
      <header className="attendee__header">
        <div className="brand">
          <span className="brand__mark" aria-hidden>
            ⏱
          </span>
          <div>
            <h1 className="brand__name">{session.title || 'Session'}</h1>
            <div className="brand__session">
              {session.sections.length} sections · {formatMinutes(totalMinutes)}
            </div>
          </div>
        </div>
        <Clock now={now} />
      </header>

      {session.instructions && (
        <section className="attendee__instructions">
          <div className="panel__title">For participants</div>
          <p>{session.instructions}</p>
        </section>
      )}

      <ol className="attendee__list">
        {session.sections.map((s, i) => (
          <li
            key={s.id}
            className={`attendee__item${s.color ? ' attendee__item--colored' : ''}`}
            style={
              s.color
                ? ({ ['--section-color']: s.color } as React.CSSProperties)
                : undefined
            }
          >
            <div className="attendee__index">{i + 1}</div>
            <div className="attendee__body">
              <div className="attendee__row">
                <span className="attendee__title">
                  {s.color && (
                    <span
                      className="agenda__dot"
                      style={{ background: s.color }}
                      aria-hidden
                    />
                  )}
                  {s.title}
                </span>
                <span className="attendee__dur">
                  {formatMinutes(s.durationMinutes)}
                </span>
              </div>
              {s.activity && <p className="attendee__activity">{s.activity}</p>}
            </div>
          </li>
        ))}
      </ol>

      <footer className="attendee__footer">
        <button className="btn btn--ghost" onClick={onOpenApp}>
          Edit this agenda / use as my timer →
        </button>
      </footer>
    </div>
  );
}
