import { useCallback, useMemo } from 'react';
import { useLocalStorage } from './useLocalStorage';
import type { Library, LibraryEvent, SessionData } from '../types';
import { DEFAULT_SESSION } from '../defaultSession';
import * as lib from '../library';

export interface LibraryApi {
  /** The active event's session. */
  session: SessionData;
  /** Update the active event's session (useState-like). */
  setSession: (v: SessionData | ((prev: SessionData) => SessionData)) => void;
  events: LibraryEvent[];
  activeId: string;
  selectEvent: (id: string) => void;
  createEvent: (session?: SessionData) => void;
  duplicateEvent: (id: string) => void;
  deleteEvent: (id: string) => void;
}

/**
 * Manages the library of events in localStorage, exposing the active event's
 * session with a useState-like setter (so existing session-editing code is
 * unchanged) plus event-management actions.
 */
export function useLibrary(): LibraryApi {
  const initial = useMemo(
    () =>
      lib.migrateOrDefault(
        typeof window !== 'undefined'
          ? window.localStorage.getItem('lsc.session')
          : null,
        DEFAULT_SESSION,
      ),
    [],
  );

  const [state, setState] = useLocalStorage<Library>('lsc.library.v1', initial);
  const safe = state.events.length ? state : initial;
  const active = lib.activeEvent(safe);

  const setSession = useCallback(
    (v: SessionData | ((prev: SessionData) => SessionData)) =>
      setState((l) =>
        lib.updateActiveSession(
          l.events.length ? l : initial,
          typeof v === 'function'
            ? (v as (p: SessionData) => SessionData)
            : () => v,
        ),
      ),
    [setState, initial],
  );

  const selectEvent = useCallback(
    (id: string) => setState((l) => lib.selectEvent(l, id)),
    [setState],
  );
  const createEvent = useCallback(
    (session?: SessionData) => setState((l) => lib.createEvent(l, session)),
    [setState],
  );
  const duplicateEvent = useCallback(
    (id: string) => setState((l) => lib.duplicateEvent(l, id)),
    [setState],
  );
  const deleteEvent = useCallback(
    (id: string) => setState((l) => lib.deleteEvent(l, id)),
    [setState],
  );

  return {
    session: active.session,
    setSession,
    events: safe.events,
    activeId: active.id,
    selectEvent,
    createEvent,
    duplicateEvent,
    deleteEvent,
  };
}
