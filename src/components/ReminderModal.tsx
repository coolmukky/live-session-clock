import { useEffect, useRef } from 'react';
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
  const dialogRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!reminder || autoDismissMs <= 0) return;
    const id = window.setTimeout(onDismiss, autoDismissMs);
    return () => window.clearTimeout(id);
  }, [reminder, autoDismissMs, onDismiss]);

  // Focus management: move focus into the dialog, trap Tab within it, and
  // restore focus to the previously-focused element on close.
  useEffect(() => {
    if (!reminder) return;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    buttonRef.current?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onDismiss();
        return;
      }
      if (e.key !== 'Tab') return;
      const focusables = dialogRef.current?.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
      );
      if (!focusables || focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      previouslyFocused?.focus?.();
    };
  }, [reminder, onDismiss]);

  if (!reminder) return null;

  const finished = reminder.kind === 'finished';

  return (
    <div className="modal-backdrop" onClick={onDismiss} role="presentation">
      <div
        ref={dialogRef}
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

        <button
          ref={buttonRef}
          className="btn btn--primary modal__button"
          onClick={onDismiss}
        >
          Got it
        </button>
      </div>
    </div>
  );
}
