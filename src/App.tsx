import { useCallback, useEffect, useRef, useState } from 'react';
import { Clock } from './components/Clock';
import { Controls } from './components/Controls';
import { CurrentActivity } from './components/CurrentActivity';
import { Agenda } from './components/Agenda';
import { InstructionsPanel } from './components/InstructionsPanel';
import { ReminderModal, type Reminder } from './components/ReminderModal';
import { DEFAULT_SESSION } from './defaultSession';
import { useLocalStorage } from './hooks/useLocalStorage';
import { useNow } from './hooks/useNow';
import { useSessionEngine } from './hooks/useSessionEngine';
import type { RunState, Section, SessionData, Settings } from './types';
import {
  playChime,
  requestNotificationPermission,
  showNotification,
} from './utils/alerts';

const IDLE_RUN: RunState = {
  status: 'idle',
  anchorStart: null,
  frozenElapsed: 0,
};

export default function App() {
  const [session, setSession] = useLocalStorage<SessionData>(
    'lsc.session',
    DEFAULT_SESSION,
  );
  const [run, setRun] = useLocalStorage<RunState>('lsc.run', IDLE_RUN);
  const [settings, setSettings] = useLocalStorage<Settings>('lsc.settings', {
    sound: true,
    notifications: false,
  });

  const now = useNow(250);
  const snapshot = useSessionEngine(session, run, now);
  const [reminder, setReminder] = useState<Reminder | null>(null);

  const editable = run.status === 'idle';
  const canStart = snapshot.total > 0;

  // --- Reminder + alert firing --------------------------------------------
  const lastKey = useRef<string>('');
  const primed = useRef(false);
  const settingsRef = useRef(settings);
  settingsRef.current = settings;

  const fireReminder = useCallback((r: Reminder) => {
    setReminder(r);
    if (settingsRef.current.sound) playChime();
    if (settingsRef.current.notifications) {
      if (r.kind === 'finished') {
        showNotification('Session complete', 'All sections have finished.');
      } else if (r.section) {
        showNotification(
          `Now: ${r.section.title}`,
          r.section.activity || 'Section starting.',
        );
      }
    }
  }, []);

  useEffect(() => {
    const running = snapshot.status === 'running';
    const finished = snapshot.status === 'finished';

    // On first render, prime the baseline without firing — but only when a
    // session is already live (e.g. after a page refresh mid-session). If we
    // start idle, leave the baseline empty so the first Start fires normally.
    if (!primed.current) {
      primed.current = true;
      if (running || finished) {
        lastKey.current = finished
          ? 'finished'
          : `section-${snapshot.activeIndex}`;
        return;
      }
    }

    if (!running && !finished) return;

    const key = finished ? 'finished' : `section-${snapshot.activeIndex}`;
    if (key === lastKey.current) return;
    lastKey.current = key;

    if (finished) {
      fireReminder({ kind: 'finished' });
    } else if (snapshot.activeIndex >= 0) {
      fireReminder({
        kind: 'section',
        section: snapshot.timeline[snapshot.activeIndex].section,
        index: snapshot.activeIndex,
        total: snapshot.timeline.length,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [snapshot.status, snapshot.activeIndex]);

  // Transition running -> finished once the clock passes the end.
  useEffect(() => {
    if (run.status === 'running' && snapshot.remainingTotal <= 0) {
      setRun({ status: 'finished', anchorStart: null, frozenElapsed: snapshot.total });
    }
  }, [run.status, snapshot.remainingTotal, snapshot.total, setRun]);

  // --- Run controls --------------------------------------------------------
  const handleStart = useCallback(() => {
    if (settingsRef.current.notifications) {
      void requestNotificationPermission();
    }
    // Play a chime directly inside the click gesture so browsers unlock audio.
    if (settingsRef.current.sound) playChime();
    lastKey.current = '';
    setRun({ status: 'running', anchorStart: Date.now(), frozenElapsed: 0 });
  }, [setRun]);

  const handlePause = useCallback(() => {
    setRun((prev) => {
      const elapsed =
        prev.anchorStart != null ? Date.now() - prev.anchorStart : prev.frozenElapsed;
      return {
        status: 'paused',
        anchorStart: null,
        frozenElapsed: Math.max(0, elapsed),
      };
    });
  }, [setRun]);

  const handleResume = useCallback(() => {
    setRun((prev) => ({
      status: 'running',
      anchorStart: Date.now() - prev.frozenElapsed,
      frozenElapsed: prev.frozenElapsed,
    }));
  }, [setRun]);

  const handleReset = useCallback(() => {
    lastKey.current = '';
    setReminder(null);
    setRun(IDLE_RUN);
  }, [setRun]);

  // --- Session editing -----------------------------------------------------
  const updateSession = useCallback(
    (patch: Partial<SessionData>) => setSession((s) => ({ ...s, ...patch })),
    [setSession],
  );

  const addSection = useCallback(
    (section: Section) =>
      setSession((s) => ({ ...s, sections: [...s.sections, section] })),
    [setSession],
  );

  const updateSection = useCallback(
    (section: Section) =>
      setSession((s) => ({
        ...s,
        sections: s.sections.map((x) => (x.id === section.id ? section : x)),
      })),
    [setSession],
  );

  const deleteSection = useCallback(
    (id: string) =>
      setSession((s) => ({
        ...s,
        sections: s.sections.filter((x) => x.id !== id),
      })),
    [setSession],
  );

  const moveSection = useCallback(
    (id: string, direction: -1 | 1) =>
      setSession((s) => {
        const idx = s.sections.findIndex((x) => x.id === id);
        const target = idx + direction;
        if (idx < 0 || target < 0 || target >= s.sections.length) return s;
        const next = [...s.sections];
        [next[idx], next[target]] = [next[target], next[idx]];
        return { ...s, sections: next };
      }),
    [setSession],
  );

  // --- Settings ------------------------------------------------------------
  const toggleSound = useCallback(
    () => setSettings((s) => ({ ...s, sound: !s.sound })),
    [setSettings],
  );

  const toggleNotifications = useCallback(() => {
    setSettings((s) => {
      const next = !s.notifications;
      if (next) void requestNotificationPermission();
      return { ...s, notifications: next };
    });
  }, [setSettings]);

  return (
    <div className="app">
      <header className="app__header">
        <div className="brand">
          <span className="brand__mark" aria-hidden>
            ⏱
          </span>
          <div>
            <h1 className="brand__name">Live Session Clock</h1>
            {session.title && (
              <div className="brand__session">{session.title}</div>
            )}
          </div>
        </div>
        <Clock now={now} />
      </header>

      <main className="app__main">
        <div className="app__primary">
          <CurrentActivity snapshot={snapshot} />
          <Controls
            status={run.status}
            snapshot={snapshot}
            settings={settings}
            canStart={canStart}
            onStart={handleStart}
            onPause={handlePause}
            onResume={handleResume}
            onReset={handleReset}
            onToggleSound={toggleSound}
            onToggleNotifications={toggleNotifications}
          />
        </div>

        <aside className="app__side">
          <InstructionsPanel
            title={session.title}
            instructions={session.instructions}
            editable={editable}
            onChange={updateSession}
          />
          <Agenda
            timeline={snapshot.timeline}
            editable={editable}
            now={now}
            onAdd={addSection}
            onUpdate={updateSection}
            onDelete={deleteSection}
            onMove={moveSection}
          />
          {!editable && (
            <p className="app__hint">
              Editing is locked while the session runs. Press{' '}
              <strong>Reset</strong> to make changes.
            </p>
          )}
        </aside>
      </main>

      <footer className="app__footer">
        Times sync to your device clock · your agenda is saved in this browser.
      </footer>

      <ReminderModal reminder={reminder} onDismiss={() => setReminder(null)} />
    </div>
  );
}
