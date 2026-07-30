import { useState } from 'react';
import type { Section, SectionTiming } from '../types';
import { formatClockShort, formatDuration, formatMinutes } from '../utils/time';
import { SectionForm } from './SectionForm';

interface AgendaProps {
  timeline: SectionTiming[];
  /** Editing is only allowed before the session starts (idle). */
  editable: boolean;
  now: number;
  onUpdate: (section: Section) => void;
  onDelete: (id: string) => void;
  onMove: (id: string, direction: -1 | 1) => void;
  onAdd: (section: Section) => void;
}

export function Agenda({
  timeline,
  editable,
  now,
  onUpdate,
  onDelete,
  onMove,
  onAdd,
}: AgendaProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);

  return (
    <section className="agenda">
      <header className="agenda__header">
        <h2 className="panel__title">Session agenda</h2>
        {editable && !adding && (
          <button
            className="btn btn--primary btn--sm"
            onClick={() => setAdding(true)}
          >
            + Add section
          </button>
        )}
      </header>

      {timeline.length === 0 && !adding && (
        <p className="agenda__empty">
          No sections yet. Add one to build your timed agenda.
        </p>
      )}

      <ol className="agenda__list">
        {timeline.map((t, i) => {
          const { section, state } = t;
          const isEditing = editingId === section.id;
          if (isEditing) {
            return (
              <li key={section.id} className="agenda__item agenda__item--editing">
                <SectionForm
                  initial={section}
                  onSubmit={(s) => {
                    onUpdate(s);
                    setEditingId(null);
                  }}
                  onCancel={() => setEditingId(null)}
                />
              </li>
            );
          }
          const duration = t.offsetEnd - t.offsetStart;
          const sectionProgress =
            state === 'active' && duration > 0
              ? Math.min(
                  100,
                  Math.max(0, ((now - (t.clockStart ?? now)) / duration) * 100),
                )
              : 0;
          return (
            <li key={section.id} className={`agenda__item agenda__item--${state}`}>
              <div className="agenda__index">{i + 1}</div>
              <div className="agenda__body">
                <div className="agenda__row">
                  <span className="agenda__title">{section.title}</span>
                  <span className={`badge badge--${state}`}>{state}</span>
                </div>
                {section.activity && (
                  <p className="agenda__activity">{section.activity}</p>
                )}
                <div className="agenda__meta">
                  <span>{formatMinutes(section.durationMinutes)}</span>
                  {t.clockStart != null && t.clockEnd != null && (
                    <span className="agenda__clock">
                      {formatClockShort(t.clockStart)} –{' '}
                      {formatClockShort(t.clockEnd)}
                    </span>
                  )}
                </div>
                {state === 'active' && (
                  <div className="progress agenda__progress">
                    <div
                      className="progress__bar"
                      style={{ width: `${sectionProgress}%` }}
                    />
                  </div>
                )}
              </div>
              {editable && (
                <div className="agenda__controls">
                  <button
                    className="iconbtn"
                    title="Move up"
                    disabled={i === 0}
                    onClick={() => onMove(section.id, -1)}
                  >
                    ↑
                  </button>
                  <button
                    className="iconbtn"
                    title="Move down"
                    disabled={i === timeline.length - 1}
                    onClick={() => onMove(section.id, 1)}
                  >
                    ↓
                  </button>
                  <button
                    className="iconbtn"
                    title="Edit"
                    onClick={() => setEditingId(section.id)}
                  >
                    ✎
                  </button>
                  <button
                    className="iconbtn iconbtn--danger"
                    title="Delete"
                    onClick={() => onDelete(section.id)}
                  >
                    ✕
                  </button>
                </div>
              )}
              {!editable && state === 'active' && t.clockEnd != null && (
                <div className="agenda__remaining">
                  {formatDuration(Math.max(0, t.clockEnd - now))}
                </div>
              )}
            </li>
          );
        })}
      </ol>

      {adding && (
        <div className="agenda__add">
          <SectionForm
            onSubmit={(s) => {
              onAdd(s);
              setAdding(false);
            }}
            onCancel={() => setAdding(false)}
          />
        </div>
      )}
    </section>
  );
}
