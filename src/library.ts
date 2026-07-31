import type { Library, LibraryEvent, SessionData } from './types';
import { makeId } from './utils/time';

/** A fresh, empty event. */
export function blankSession(): SessionData {
  return { title: 'New event', instructions: '', sections: [] };
}

/** The currently-active event (falls back to the first if the id is stale). */
export function activeEvent(lib: Library): LibraryEvent {
  return lib.events.find((e) => e.id === lib.activeId) ?? lib.events[0];
}

/** Switch the active event (no-op if the id isn't in the library). */
export function selectEvent(lib: Library, id: string): Library {
  return lib.events.some((e) => e.id === id) ? { ...lib, activeId: id } : lib;
}

/** Replace the active event's session via an updater. */
export function updateActiveSession(
  lib: Library,
  updater: (s: SessionData) => SessionData,
): Library {
  const activeId = lib.events.some((e) => e.id === lib.activeId)
    ? lib.activeId
    : lib.events[0].id;
  return {
    activeId,
    events: lib.events.map((e) =>
      e.id === activeId ? { ...e, session: updater(e.session) } : e,
    ),
  };
}

/** Add a new event (blank, or from a given session) and make it active. */
export function createEvent(lib: Library, session?: SessionData): Library {
  const id = makeId();
  return {
    activeId: id,
    events: [...lib.events, { id, session: session ?? blankSession() }],
  };
}

/** Duplicate an event (fresh ids, "(copy)" title) and make the copy active. */
export function duplicateEvent(lib: Library, id: string): Library {
  const src = lib.events.find((e) => e.id === id);
  if (!src) return lib;
  const copy: LibraryEvent = {
    id: makeId(),
    session: {
      ...src.session,
      title: src.session.title ? `${src.session.title} (copy)` : 'Copy',
      sections: src.session.sections.map((s) => ({ ...s, id: makeId() })),
    },
  };
  const idx = lib.events.findIndex((e) => e.id === id);
  const events = [...lib.events];
  events.splice(idx + 1, 0, copy);
  return { activeId: copy.id, events };
}

/** Delete an event. Never leaves the library empty. */
export function deleteEvent(lib: Library, id: string): Library {
  const events = lib.events.filter((e) => e.id !== id);
  if (events.length === 0) {
    const nid = makeId();
    return { activeId: nid, events: [{ id: nid, session: blankSession() }] };
  }
  return {
    activeId: lib.activeId === id ? events[0].id : lib.activeId,
    events,
  };
}

/**
 * Build the initial library: migrate a pre-existing single session
 * (`lsc.session`) into a one-event library, otherwise seed with the default.
 */
export function migrateOrDefault(
  oldSessionJson: string | null,
  defaultSession: SessionData,
): Library {
  if (oldSessionJson) {
    try {
      const s = JSON.parse(oldSessionJson) as SessionData;
      if (s && Array.isArray(s.sections)) {
        const id = makeId();
        return { activeId: id, events: [{ id, session: s }] };
      }
    } catch {
      /* fall through to default */
    }
  }
  const id = makeId();
  return { activeId: id, events: [{ id, session: defaultSession }] };
}
