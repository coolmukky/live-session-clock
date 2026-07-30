import { describe, it, expect } from 'vitest';
import { computeSnapshot } from './engine';
import type { RunState, SessionData } from './types';

const MIN = 60_000;
const T0 = 1_700_000_000_000;

const session: SessionData = {
  title: 'T',
  instructions: '',
  sections: [
    { id: 'a', title: 'A', durationMinutes: 10, activity: '' },
    { id: 'b', title: 'B', durationMinutes: 5, activity: '' },
    { id: 'c', title: 'C', durationMinutes: 15, activity: '' },
  ],
};

const idle: RunState = {
  status: 'idle',
  currentIndex: -1,
  sectionAnchor: null,
  frozenElapsed: 0,
};

describe('computeSnapshot', () => {
  it('previews the full agenda when idle', () => {
    const s = computeSnapshot(session, idle, T0);
    expect(s.total).toBe(30 * MIN);
    expect(s.remainingTotal).toBe(30 * MIN);
    expect(s.activeIndex).toBe(-1);
    expect(s.timeline.map((t) => t.state)).toEqual([
      'upcoming',
      'upcoming',
      'upcoming',
    ]);
    // Clock times are laid out cumulatively from "now".
    expect(s.timeline[0].clockStart).toBe(T0);
    expect(s.timeline[0].clockEnd).toBe(T0 + 10 * MIN);
    expect(s.timeline[1].clockStart).toBe(T0 + 10 * MIN);
    expect(s.timeline[2].clockEnd).toBe(T0 + 30 * MIN);
  });

  it('reports the active section and remaining time while running', () => {
    const run: RunState = {
      status: 'running',
      currentIndex: 1,
      sectionAnchor: T0 - 2 * MIN, // 2 min into section B (5 min)
      frozenElapsed: 0,
    };
    const s = computeSnapshot(session, run, T0);
    expect(s.activeIndex).toBe(1);
    expect(s.sectionElapsed).toBe(2 * MIN);
    expect(s.remainingInSection).toBe(3 * MIN);
    expect(s.overrunMs).toBe(0);
    // remaining = 3 min left in B + 15 min of C
    expect(s.remainingTotal).toBe(18 * MIN);
    expect(s.timeline.map((t) => t.state)).toEqual([
      'done',
      'active',
      'upcoming',
    ]);
    // Upcoming C is projected to start when B ends.
    expect(s.timeline[2].clockStart).toBe(T0 + 3 * MIN);
  });

  it('counts overrun and excludes it from remaining time', () => {
    const run: RunState = {
      status: 'running',
      currentIndex: 1,
      sectionAnchor: T0 - 7 * MIN, // 7 min into a 5 min section => 2 min over
      frozenElapsed: 0,
    };
    const s = computeSnapshot(session, run, T0);
    expect(s.remainingInSection).toBe(0);
    expect(s.overrunMs).toBe(2 * MIN);
    // Overrun does not count toward remaining; only C's 15 min remains.
    expect(s.remainingTotal).toBe(15 * MIN);
    // The active section's planned end is in the past.
    expect(s.timeline[1].clockEnd).toBe(T0 - 2 * MIN);
  });

  it('uses frozen elapsed while paused', () => {
    const run: RunState = {
      status: 'paused',
      currentIndex: 0,
      sectionAnchor: null,
      frozenElapsed: 3 * MIN,
    };
    const s = computeSnapshot(session, run, T0 + 999 * MIN);
    expect(s.activeIndex).toBe(0);
    expect(s.sectionElapsed).toBe(3 * MIN);
    expect(s.remainingInSection).toBe(7 * MIN);
  });

  it('marks everything done when finished', () => {
    const run: RunState = {
      status: 'finished',
      currentIndex: -1,
      sectionAnchor: null,
      frozenElapsed: 30 * MIN,
    };
    const s = computeSnapshot(session, run, T0);
    expect(s.activeIndex).toBe(-1);
    expect(s.timeline.every((t) => t.state === 'done')).toBe(true);
    expect(s.remainingTotal).toBe(0);
    expect(s.total).toBe(30 * MIN);
  });
});
