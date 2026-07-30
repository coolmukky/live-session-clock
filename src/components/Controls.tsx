import type { EngineSnapshot, RunStatus, Settings } from '../types';
import { formatDuration } from '../utils/time';

interface ControlsProps {
  status: RunStatus;
  snapshot: EngineSnapshot;
  settings: Settings;
  canStart: boolean;
  onStart: () => void;
  onPause: () => void;
  onResume: () => void;
  onNext: () => void;
  onReset: () => void;
  onPresent: () => void;
  onToggleSound: () => void;
  onToggleNotifications: () => void;
  onToggleAutoAdvance: () => void;
}

/** Start / pause / resume / skip / reset plus totals, present, and toggles. */
export function Controls({
  status,
  snapshot,
  settings,
  canStart,
  onStart,
  onPause,
  onResume,
  onNext,
  onReset,
  onPresent,
  onToggleSound,
  onToggleNotifications,
  onToggleAutoAdvance,
}: ControlsProps) {
  const live = status === 'running' || status === 'paused';
  const isLast =
    snapshot.activeIndex >= 0 &&
    snapshot.activeIndex === snapshot.timeline.length - 1;

  return (
    <section className="controls">
      <div className="controls__buttons">
        {status === 'idle' && (
          <button
            className="btn btn--primary btn--lg"
            onClick={onStart}
            disabled={!canStart}
          >
            ▶ Start session
          </button>
        )}
        {status === 'running' && (
          <button className="btn btn--warning btn--lg" onClick={onPause}>
            ⏸ Pause
          </button>
        )}
        {status === 'paused' && (
          <button className="btn btn--primary btn--lg" onClick={onResume}>
            ▶ Resume
          </button>
        )}
        {live && (
          <button className="btn btn--lg" onClick={onNext}>
            {isLast ? '✓ Finish' : '⏭ Skip to next'}
          </button>
        )}
        {(live || status === 'finished') && (
          <button className="btn btn--ghost btn--lg" onClick={onReset}>
            ⟲ Reset
          </button>
        )}
        <button
          className="btn btn--ghost btn--lg"
          onClick={onPresent}
          title="Fullscreen presenter view"
        >
          ⛶ Present
        </button>
      </div>

      <div className="controls__stats">
        <div className="stat">
          <span className="stat__value">{formatDuration(snapshot.total)}</span>
          <span className="stat__label">Total planned</span>
        </div>
        {status !== 'idle' && (
          <div className="stat">
            <span className="stat__value">
              {formatDuration(snapshot.remainingTotal)}
            </span>
            <span className="stat__label">Remaining</span>
          </div>
        )}
      </div>

      <div className="controls__toggles">
        <label className="toggle">
          <input type="checkbox" checked={settings.sound} onChange={onToggleSound} />
          <span>🔔 Chime</span>
        </label>
        <label className="toggle">
          <input
            type="checkbox"
            checked={settings.notifications}
            onChange={onToggleNotifications}
          />
          <span>💬 Notifications</span>
        </label>
        <label className="toggle" title="Advance sections automatically at their planned end">
          <input
            type="checkbox"
            checked={settings.autoAdvance}
            onChange={onToggleAutoAdvance}
          />
          <span>⏱ Auto-advance</span>
        </label>
      </div>
    </section>
  );
}
