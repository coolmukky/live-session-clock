import { useEffect } from 'react';
import type { Section } from '../types';
import { formatMinutes } from '../utils/time';

export interface Reminder {
  kind: 'section' | 'finished';
  section?: Section;
  index?: number;
  total?: number;
}

interface ReminderModalProps {
  reminder: Reminder | null;
  onDismiss: () => void;
  /** Auto-dismiss delay in ms (0 disables). */
  autoDismissMs?: number;
}

/**
 * The pop-up that announces the current section to the audience. Appears when
 * a section becomes active (or the session finishes) and auto-dismisses.
 */
export function ReminderModal({
  reminder,
  onDismiss,
  autoDismissMs = 12_000,
}: ReminderModalProps) {
  useEffect(() => {
    if (!reminder || autoDismissMs <= 0) return;
    const id = window.setTimeout(onDismiss, autoDismissMs);
    return () => window.clearTimeout(id);
  }, [reminder, autoDismissMs, onDismiss]);

  useEffect(() => {
    if (!reminder) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onDismiss();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [reminder, onDismiss]);

  if (!reminder) return null;

  const finished = reminder.kind === 'finished';

  return (
    <div className="modal-backdrop" onClick={onDismiss} role="presentation">
      <div
        className={`modal${finished ? ' modal--done' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="reminder-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal__eyebrow">
          {finished ? 'Session complete' : 'Time to switch — do this now'}
        </div>

        {finished ? (
          <>
            <h2 id="reminder-title" className="modal__title">
              That's a wrap 🎉
            </h2>
            <p className="modal__activity">
              All sections have finished. Thanks everyone!
            </p>
          </>
        ) : (
          <>
            <h2 id="reminder-title" className="modal__title">
              {reminder.section?.title}
            </h2>
            {reminder.section?.activity && (
              <p className="modal__activity">{reminder.section.activity}</p>
            )}
            <div className="modal__meta">
              {reminder.index != null && reminder.total != null && (
                <span>
                  Section {reminder.index + 1} of {reminder.total}
                </span>
              )}
              {reminder.section && (
                <span>{formatMinutes(reminder.section.durationMinutes)}</span>
              )}
            </div>
          </>
        )}

        <button className="btn btn--primary modal__button" onClick={onDismiss}>
          Got it
        </button>
      </div>
    </div>
  );
}
