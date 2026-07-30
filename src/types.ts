export interface Section {
  /** Stable unique id. */
  id: string;
  /** Short name shown on the agenda, e.g. "Welcome & intros". */
  title: string;
  /** Length of this section in minutes. */
  durationMinutes: number;
  /** What the audience should be doing during this section. Shown big and in
   *  the reminder pop-up when the section becomes active. */
  activity: string;
}

export interface SessionData {
  /** Title of the whole session. */
  title: string;
  /** General instructions to participants, shown before/while running. */
  instructions: string;
  /** Ordered list of timed sections. */
  sections: Section[];
}

export type RunStatus = 'idle' | 'running' | 'paused' | 'finished';

export interface RunState {
  status: RunStatus;
  /** Wall-clock epoch (ms) that maps to elapsed === 0. Derived as
   *  `Date.now() - elapsed`, so it survives page refreshes. */
  anchorStart: number | null;
  /** Elapsed time (ms) frozen while paused or finished. */
  frozenElapsed: number;
}

export interface Settings {
  /** Play a chime when a section changes. */
  sound: boolean;
  /** Show a browser notification when a section changes. */
  notifications: boolean;
}

/** Everything the engine derives from the session + run state for a given
 *  instant. Consumed by the UI. */
export interface EngineSnapshot {
  status: RunStatus;
  /** Elapsed ms into the whole session, clamped to [0, total]. */
  elapsed: number;
  /** Total session length in ms. */
  total: number;
  /** Index of the currently active section, or -1 if none (idle/finished/empty). */
  activeIndex: number;
  /** Per-section computed timing. */
  timeline: SectionTiming[];
  /** ms remaining in the active section (0 when not running). */
  remainingInSection: number;
  /** ms remaining in the whole session. */
  remainingTotal: number;
}

export interface SectionTiming {
  section: Section;
  /** Offset (ms) from session start where this section begins. */
  offsetStart: number;
  /** Offset (ms) from session start where this section ends. */
  offsetEnd: number;
  /** Absolute wall-clock start (epoch ms) when anchored; null when idle. */
  clockStart: number | null;
  /** Absolute wall-clock end (epoch ms) when anchored; null when idle. */
  clockEnd: number | null;
  state: 'done' | 'active' | 'upcoming';
}
