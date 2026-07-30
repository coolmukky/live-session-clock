import { useEffect, useState } from 'react';
import type { Section } from '../types';
import { makeId } from '../utils/time';
import { SECTION_COLORS } from '../utils/theme';

interface SectionFormProps {
  /** When provided, the form edits this section; otherwise it adds a new one. */
  initial?: Section;
  onSubmit: (section: Section) => void;
  onCancel?: () => void;
}

/** Form used to add a new section or edit an existing one. */
export function SectionForm({ initial, onSubmit, onCancel }: SectionFormProps) {
  const [title, setTitle] = useState(initial?.title ?? '');
  const [durationMinutes, setDurationMinutes] = useState(
    initial ? String(initial.durationMinutes) : '10',
  );
  const [activity, setActivity] = useState(initial?.activity ?? '');
  const [color, setColor] = useState<string | undefined>(initial?.color);

  useEffect(() => {
    setTitle(initial?.title ?? '');
    setDurationMinutes(initial ? String(initial.durationMinutes) : '10');
    setActivity(initial?.activity ?? '');
    setColor(initial?.color);
  }, [initial]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const minutes = Math.max(0, Number(durationMinutes) || 0);
    if (!title.trim() || minutes <= 0) return;
    onSubmit({
      id: initial?.id ?? makeId(),
      title: title.trim(),
      durationMinutes: minutes,
      activity: activity.trim(),
      ...(color ? { color } : {}),
    });
    if (!initial) {
      setTitle('');
      setDurationMinutes('10');
      setActivity('');
      setColor(undefined);
    }
  };

  const valid = title.trim().length > 0 && Number(durationMinutes) > 0;

  return (
    <form className="section-form" onSubmit={handleSubmit}>
      <div className="section-form__row">
        <label className="field field--grow">
          <span className="field__label">Section name</span>
          <input
            className="field__input"
            type="text"
            value={title}
            placeholder="e.g. Welcome & introductions"
            onChange={(e) => setTitle(e.target.value)}
            autoFocus
          />
        </label>
        <label className="field field--minutes">
          <span className="field__label">Minutes</span>
          <input
            className="field__input"
            type="number"
            min={1}
            step={1}
            value={durationMinutes}
            onChange={(e) => setDurationMinutes(e.target.value)}
          />
        </label>
      </div>
      <label className="field">
        <span className="field__label">
          What should participants be doing?
        </span>
        <textarea
          className="field__input field__input--area"
          value={activity}
          placeholder="e.g. Introduce yourself in the chat: name, role, and one goal for today."
          rows={2}
          onChange={(e) => setActivity(e.target.value)}
        />
      </label>
      <div className="field">
        <span className="field__label">Color (optional)</span>
        <div className="swatches">
          <button
            type="button"
            className={`swatch swatch--none${!color ? ' is-active' : ''}`}
            title="No color"
            aria-label="No color"
            onClick={() => setColor(undefined)}
          >
            ∅
          </button>
          {SECTION_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              className={`swatch${color === c ? ' is-active' : ''}`}
              style={{ background: c }}
              title={c}
              aria-label={`Color ${c}`}
              onClick={() => setColor(c)}
            />
          ))}
        </div>
      </div>
      <div className="section-form__actions">
        <button type="submit" className="btn btn--primary" disabled={!valid}>
          {initial ? 'Save changes' : 'Add section'}
        </button>
        {onCancel && (
          <button type="button" className="btn btn--ghost" onClick={onCancel}>
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
