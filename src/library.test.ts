import { describe, it, expect } from 'vitest';
import {
  activeEvent,
  createEvent,
  deleteEvent,
  duplicateEvent,
  migrateOrDefault,
  selectEvent,
  updateActiveSession,
} from './library';
import type { Library, SessionData } from './types';

const DEFAULT: SessionData = {
  title: 'Default',
  instructions: '',
  sections: [{ id: 's1', title: 'A', durationMinutes: 5, activity: '' }],
};

function base(): Library {
  return { activeId: 'e1', events: [{ id: 'e1', session: DEFAULT }] };
}

describe('library', () => {
  it('migrates an existing single session into a one-event library', () => {
    const lib = migrateOrDefault(JSON.stringify(DEFAULT), DEFAULT);
    expect(lib.events).toHaveLength(1);
    expect(activeEvent(lib).session.title).toBe('Default');
    expect(lib.activeId).toBe(activeEvent(lib).id);
  });

  it('seeds the default when there is nothing to migrate', () => {
    const lib = migrateOrDefault(null, DEFAULT);
    expect(lib.events).toHaveLength(1);
    expect(activeEvent(lib).session).toBe(DEFAULT);
  });

  it('creates a new event and makes it active', () => {
    const lib = createEvent(base());
    expect(lib.events).toHaveLength(2);
    expect(activeEvent(lib).session.sections).toHaveLength(0);
    expect(lib.activeId).toBe(lib.events[1].id);
  });

  it('duplicates an event with a new id, fresh section ids, and a (copy) title', () => {
    const lib = duplicateEvent(base(), 'e1');
    expect(lib.events).toHaveLength(2);
    const copy = activeEvent(lib);
    expect(copy.id).not.toBe('e1');
    expect(copy.session.title).toBe('Default (copy)');
    expect(copy.session.sections[0].id).not.toBe('s1');
    expect(copy.session.sections[0].title).toBe('A');
  });

  it('deletes an event and reassigns active; never empties the library', () => {
    const two = createEvent(base()); // active is the new (2nd) event
    const afterDelete = deleteEvent(two, two.activeId);
    expect(afterDelete.events).toHaveLength(1);
    expect(afterDelete.activeId).toBe('e1');

    const emptied = deleteEvent(base(), 'e1');
    expect(emptied.events).toHaveLength(1); // recreated a blank event
    expect(emptied.events[0].session.sections).toHaveLength(0);
  });

  it('selects an event (ignores unknown ids)', () => {
    const two = createEvent(base());
    expect(selectEvent(two, 'e1').activeId).toBe('e1');
    expect(selectEvent(two, 'nope').activeId).toBe(two.activeId);
  });

  it('updates only the active event session', () => {
    const two = createEvent(base()); // active = new blank event
    const updated = updateActiveSession(two, (s) => ({ ...s, title: 'Renamed' }));
    expect(activeEvent(updated).session.title).toBe('Renamed');
    // the original first event is untouched
    expect(updated.events[0].session.title).toBe('Default');
  });
});
