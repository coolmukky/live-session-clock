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
  /** Optional accent color (hex) for this section on the agenda/hero/presenter.
   *  Undefined falls back to the app accent. */
  color?: string;
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
  /** Index of the section currently in focus; -1 when idle/finished. */
  currentIndex: number;
  /** Wall-clock epoch (ms) that maps to sectionElapsed === 0 while running.
   *  Derived as `Date.now() - sectionElapsed`, so it survives refreshes. */
  sectionAnchor: number | null;
  /** Elapsed time (ms) in the current section, frozen while paused. */
  frozenElapsed: number;
}

export type ChimeId = 'twoTone' | 'bell' | 'ding' | 'triad';

export interface Settings {
  /** Play a chime when a section changes. */
  sound: boolean;
  /** Which chime to play. */
  chime: ChimeId;
  /** Chime volume, 0..1. */
  volume: number;
  /** Show a browser notification when a section changes. */
  notifications: boolean;
  /** When true, sections advance automatically at their planned end (strict
   *  schedule). When false, a section holds and overruns until you press Next. */
  autoAdvance: boolean;
  /** Accent color key from the presets, or a custom hex string. */
  accent: string;
  /** Light or dark UI theme. */
  theme: 'dark' | 'light';
}

/** Everything the engine derives from the session + run state for a given
 *  instant. Consumed by the UI. */
export interface EngineSnapshot {
  status: RunStatus;
  /** Index of the currently active section, or -1 if none. */
  activeIndex: number;
  /** Per-section computed timing. */
  timeline: SectionTiming[];
  /** ms elapsed within the active section (0 when not running). */
  sectionElapsed: number;
  /** ms remaining in the active section (0 once overrunning). */
  remainingInSection: number;
  /** ms the active section has run past its planned end (0 when on time). */
  overrunMs: number;
  /** ms remaining across all not-yet-finished sections (excludes overrun). */
  remainingTotal: number;
  /** Total planned session length in ms. */
  total: number;
}

export interface SectionTiming {
  section: Section;
  /** Projected absolute wall-clock start (epoch ms); null when unknown. */
  clockStart: number | null;
  /** Projected absolute wall-clock end (epoch ms); null when unknown. */
  clockEnd: number | null;
  state: 'done' | 'active' | 'upcoming';
}
