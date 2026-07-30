import { useMemo } from 'react';
import type {
  EngineSnapshot,
  RunState,
  SectionTiming,
  SessionData,
} from '../types';

const MIN_MS = 60_000;

/**
 * Pure derivation of the live session state for a given instant.
 *
 * Each section is timed independently and anchored to the wall clock: while
 * running, `sectionElapsed = now - sectionAnchor`. A section can run past its
 * planned length (overrun) — upcoming sections are then projected forward from
 * "now", so the schedule shifts to stay honest. When the session is idle the
 * agenda is previewed as if it started now.
 */
export function useSessionEngine(
  session: SessionData,
  run: RunState,
  now: number,
): EngineSnapshot {
  return useMemo(() => {
    const { sections } = session;
    const durations = sections.map((s) => Math.max(0, s.durationMinutes) * MIN_MS);
    const total = durations.reduce((a, b) => a + b, 0);

    const isLive = run.status === 'running' || run.status === 'paused';
    const activeIndex = isLive ? run.currentIndex : -1;

    // Elapsed within the active section.
    let sectionElapsed = 0;
    if (activeIndex >= 0) {
      sectionElapsed =
        run.status === 'running' && run.sectionAnchor != null
          ? now - run.sectionAnchor
          : run.frozenElapsed;
      sectionElapsed = Math.max(0, sectionElapsed);
    }

    const activeDuration = activeIndex >= 0 ? durations[activeIndex] : 0;
    const remainingInSection =
      activeIndex >= 0 ? Math.max(0, activeDuration - sectionElapsed) : 0;
    const overrunMs =
      activeIndex >= 0 ? Math.max(0, sectionElapsed - activeDuration) : 0;

    // Projected wall-clock start for the section *after* the active one.
    // If we're overrunning, treat the current section as ending "now".
    let projection = now + remainingInSection;

    const timeline: SectionTiming[] = sections.map((section, i) => {
      let state: SectionTiming['state'];
      let clockStart: number | null = null;
      let clockEnd: number | null = null;

      if (run.status === 'finished') {
        state = 'done';
      } else if (run.status === 'idle') {
        state = 'upcoming';
      } else if (i < activeIndex) {
        state = 'done';
      } else if (i === activeIndex) {
        state = 'active';
        // Actual start of the active section; planned end from its duration.
        clockStart =
          run.sectionAnchor != null ? run.sectionAnchor : now - sectionElapsed;
        clockEnd = clockStart + durations[i];
      } else {
        state = 'upcoming';
        clockStart = projection;
        clockEnd = projection + durations[i];
        projection = clockEnd;
      }

      return { section, state, clockStart, clockEnd };
    });

    // Idle preview: lay the whole agenda out starting now.
    if (run.status === 'idle') {
      let cursor = now;
      timeline.forEach((t, i) => {
        t.clockStart = cursor;
        t.clockEnd = cursor + durations[i];
        cursor = t.clockEnd;
      });
    }

    // Remaining across the current (excluding overrun) + all upcoming sections.
    let remainingTotal = 0;
    if (isLive && activeIndex >= 0) {
      remainingTotal = remainingInSection;
      for (let i = activeIndex + 1; i < durations.length; i++) {
        remainingTotal += durations[i];
      }
    } else if (run.status === 'idle') {
      remainingTotal = total;
    }

    return {
      status: run.status,
      activeIndex,
      timeline,
      sectionElapsed,
      remainingInSection,
      overrunMs,
      remainingTotal,
      total,
    };
  }, [session, run, now]);
}
