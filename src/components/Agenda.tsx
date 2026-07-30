import { useState } from 'react';
import type { Section, SectionTiming } from '../types';
import {
  formatClockShortDated,
  formatDuration,
  formatMinutes,
} from '../utils/time';
import { SectionForm } from './SectionForm';

interface AgendaProps {
  timeline: SectionTiming[];
  /** Editing is only allowed before the session starts (idle). */
  editable: boolean;
  /** ms left in the active section (for the active row). */
  remainingInSection: number;
  /** ms the active section is over (for the active row). */
  overrunMs: number;
  onUpdate: (section: Section) => void;
  onDelete: (id: string) => void;
  onMove: (id: string, direction: -1 | 1) => void;
  onAdd: (section: Section) => void;
}

export function Agenda({
  timeline,
  editable,
  remainingInSection,
  overrunMs,
  onUpdate,
  onDelete,
  onMove,
  onAdd,
}: AgendaProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  // Reference day for cross-midnight labels: the session's first known start.
  const dayRef =
    timeline.find((t) => t.clockStart != null)?.clockStart ?? Date.now();

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
          const duration = section.durationMinutes * 60_000;
          const isOver = state === 'active' && overrunMs > 0;
          const sectionProgress =
            state === 'active' && duration > 0
              ? Math.min(100, ((duration - remainingInSection) / duration) * 100)
              : 0;
          return (
            <li
              key={section.id}
              className={`agenda__item agenda__item--${state}${
                isOver ? ' agenda__item--overrun' : ''
              }${section.color ? ' agenda__item--colored' : ''}`}
              style={
                section.color
                  ? ({ ['--section-color']: section.color } as React.CSSProperties)
                  : undefined
              }
            >
              <div className="agenda__index">{i + 1}</div>
              <div className="agenda__body">
                <div className="agenda__row">
                  <span className="agenda__title">
                    {section.color && (
                      <span
                        className="agenda__dot"
                        style={{ background: section.color }}
                        aria-hidden
                      />
                    )}
                    {section.title}
                  </span>
                  <span className={`badge badge--${isOver ? 'overrun' : state}`}>
                    {isOver ? 'over' : state}
                  </span>
                </div>
                {section.activity && (
                  <p className="agenda__activity">{section.activity}</p>
                )}
                <div className="agenda__meta">
                  <span>{formatMinutes(section.durationMinutes)}</span>
                  {t.clockStart != null && t.clockEnd != null && (
                    <span className="agenda__clock">
                      {formatClockShortDated(t.clockStart, dayRef)} –{' '}
                      {formatClockShortDated(t.clockEnd, dayRef)}
                    </span>
                  )}
                </div>
                {state === 'active' && (
                  <div className="progress agenda__progress">
                    <div
                      className={`progress__bar${isOver ? ' progress__bar--over' : ''}`}
                      style={{ width: `${isOver ? 100 : sectionProgress}%` }}
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
              {!editable && state === 'active' && (
                <div className={`agenda__remaining${isOver ? ' agenda__remaining--over' : ''}`}>
                  {isOver ? `+${formatDuration(overrunMs)}` : formatDuration(remainingInSection)}
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
