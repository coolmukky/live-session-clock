import { useMemo } from 'react';
import type { EngineSnapshot, RunState, SessionData } from '../types';
import { computeSnapshot } from '../engine';

/** React wrapper around the pure {@link computeSnapshot} engine. */
export function useSessionEngine(
  session: SessionData,
  run: RunState,
  now: number,
): EngineSnapshot {
  return useMemo(
    () => computeSnapshot(session, run, now),
    [session, run, now],
  );
}
