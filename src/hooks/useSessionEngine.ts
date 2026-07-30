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
 * The run is anchored to the wall clock: `elapsed = now - anchorStart` while
 * running, or the frozen value while paused/finished. Section boundaries are
 * cumulative offsets from the start, and each section's absolute start/end
 * clock time is `anchorStart + offset`. This is what keeps the agenda synced
 * to the real clock and lets a refreshed page resume exactly where it was.
 */
export function useSessionEngine(
  session: SessionData,
  run: RunState,
  now: number,
): EngineSnapshot {
  return useMemo(() => {
    const { sections } = session;
    const total = sections.reduce(
      (sum, s) => sum + Math.max(0, s.durationMinutes) * MIN_MS,
      0,
    );

    // Raw elapsed based on the run state.
    let elapsed: number;
    if (run.status === 'running' && run.anchorStart != null) {
      elapsed = now - run.anchorStart;
    } else {
      elapsed = run.frozenElapsed;
    }
    elapsed = Math.min(Math.max(elapsed, 0), total);

    // Build cumulative timeline.
    const timeline: SectionTiming[] = [];
    let cursor = 0;
    let activeIndex = -1;

    const isLive = run.status === 'running' || run.status === 'paused';
    // Anchor used to project absolute clock times. When idle we preview the
    // schedule as if it started "now".
    const anchor =
      run.anchorStart != null
        ? run.anchorStart
        : run.status === 'idle'
          ? now
          : null;

    sections.forEach((section, i) => {
      const dur = Math.max(0, section.durationMinutes) * MIN_MS;
      const offsetStart = cursor;
      const offsetEnd = cursor + dur;
      cursor = offsetEnd;

      let state: SectionTiming['state'] = 'upcoming';
      if (run.status === 'finished' || elapsed >= total) {
        state = 'done';
      } else if (isLive && elapsed >= offsetStart && elapsed < offsetEnd) {
        state = 'active';
        activeIndex = i;
      } else if (isLive && elapsed >= offsetEnd) {
        state = 'done';
      }

      timeline.push({
        section,
        offsetStart,
        offsetEnd,
        clockStart: anchor != null ? anchor + offsetStart : null,
        clockEnd: anchor != null ? anchor + offsetEnd : null,
        state,
      });
    });

    const remainingTotal = Math.max(0, total - elapsed);
    const remainingInSection =
      activeIndex >= 0 ? timeline[activeIndex].offsetEnd - elapsed : 0;

    return {
      status: run.status,
      elapsed,
      total,
      activeIndex,
      timeline,
      remainingInSection: Math.max(0, remainingInSection),
      remainingTotal,
    };
  }, [session, run, now]);
}
