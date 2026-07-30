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
  onReset: () => void;
  onToggleSound: () => void;
  onToggleNotifications: () => void;
}

/** Start / pause / resume / reset plus session totals and alert toggles. */
export function Controls({
  status,
  snapshot,
  settings,
  canStart,
  onStart,
  onPause,
  onResume,
  onReset,
  onToggleSound,
  onToggleNotifications,
}: ControlsProps) {
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
        {(status === 'running' || status === 'paused' || status === 'finished') && (
          <button className="btn btn--ghost btn--lg" onClick={onReset}>
            ⟲ Reset
          </button>
        )}
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
          <input
            type="checkbox"
            checked={settings.sound}
            onChange={onToggleSound}
          />
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
      </div>
    </section>
  );
}
