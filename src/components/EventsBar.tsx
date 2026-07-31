import type { LibraryEvent } from '../types';

interface EventsBarProps {
  events: LibraryEvent[];
  activeId: string;
  /** Managing events is only allowed before a session starts. */
  disabled: boolean;
  onSelect: (id: string) => void;
  onNew: () => void;
  onDuplicate: (id: string) => void;
  onDelete: (id: string) => void;
}

/**
 * The events library switcher: pick which planned event is active, or
 * create / duplicate / delete events. Locked while a session is running.
 */
export function EventsBar({
  events,
  activeId,
  disabled,
  onSelect,
  onNew,
  onDuplicate,
  onDelete,
}: EventsBarProps) {
  return (
    <section className="eventsbar">
      <label className="eventsbar__label" htmlFor="event-select">
        📅 Event
      </label>
      <select
        id="event-select"
        className="field__input eventsbar__select"
        value={activeId}
        disabled={disabled}
        onChange={(e) => onSelect(e.target.value)}
      >
        {events.map((ev) => (
          <option key={ev.id} value={ev.id}>
            {ev.session.title || 'Untitled event'}
          </option>
        ))}
      </select>

      <div className="eventsbar__actions">
        <button
          className="btn btn--sm"
          onClick={onNew}
          disabled={disabled}
          title="Plan a new event"
        >
          + New
        </button>
        <button
          className="btn btn--sm"
          onClick={() => onDuplicate(activeId)}
          disabled={disabled}
          title="Duplicate this event"
        >
          ⧉ Duplicate
        </button>
        <button
          className="btn btn--sm btn--ghost"
          onClick={() => onDelete(activeId)}
          disabled={disabled || events.length <= 1}
          title={events.length <= 1 ? 'Keep at least one event' : 'Delete this event'}
        >
          ✕ Delete
        </button>
      </div>

      <span className="eventsbar__count">
        {events.length} event{events.length === 1 ? '' : 's'}
      </span>
    </section>
  );
}
