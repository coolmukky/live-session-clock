import { useState } from 'react';

interface InstructionsPanelProps {
  title: string;
  instructions: string;
  editable: boolean;
  onChange: (patch: { title?: string; instructions?: string }) => void;
}

/**
 * Session title + general instructions to participants. Editable before the
 * session starts; read-only once running so it can stay on a shared screen.
 */
export function InstructionsPanel({
  title,
  instructions,
  editable,
  onChange,
}: InstructionsPanelProps) {
  const [open, setOpen] = useState(true);

  return (
    <section className="instructions">
      <button
        className="instructions__toggle"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
      >
        <span className="panel__title">Instructions for participants</span>
        <span className="instructions__chevron">{open ? '▾' : '▸'}</span>
      </button>

      {open &&
        (editable ? (
          <div className="instructions__edit">
            <label className="field">
              <span className="field__label">Session title</span>
              <input
                className="field__input"
                type="text"
                value={title}
                placeholder="e.g. Onboarding Workshop"
                onChange={(e) => onChange({ title: e.target.value })}
              />
            </label>
            <label className="field">
              <span className="field__label">General instructions</span>
              <textarea
                className="field__input field__input--area"
                value={instructions}
                rows={3}
                placeholder="e.g. Welcome! Please keep your mic muted unless speaking, and drop questions in the chat at any time."
                onChange={(e) => onChange({ instructions: e.target.value })}
              />
            </label>
          </div>
        ) : (
          <div className="instructions__read">
            {instructions ? (
              <p>{instructions}</p>
            ) : (
              <p className="instructions__empty">No instructions provided.</p>
            )}
          </div>
        ))}
    </section>
  );
}
