import { lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { Clock } from './components/Clock';
import { Controls } from './components/Controls';
import { CurrentActivity } from './components/CurrentActivity';
import { Agenda } from './components/Agenda';
import { InstructionsPanel } from './components/InstructionsPanel';
import { SettingsPanel } from './components/SettingsPanel';
import { PresenterView } from './components/PresenterView';
import { ReminderModal, type Reminder } from './components/ReminderModal';
import { AttendeeView } from './components/AttendeeView';

// Code-split: the QR modal (and qrcode-generator) load only when shown.
const QrModal = lazy(() => import('./components/QrModal'));
import { DEFAULT_SESSION } from './defaultSession';
import { useLocalStorage } from './hooks/useLocalStorage';
import { useNow } from './hooks/useNow';
import { useSessionEngine } from './hooks/useSessionEngine';
import { useWakeLock } from './hooks/useWakeLock';
import type { RunState, Section, SessionData, Settings } from './types';
import {
  playChime,
  requestNotificationPermission,
  showNotification,
} from './utils/alerts';
import { applyTheme } from './utils/theme';
import { exportSession, importSessionFile } from './utils/sessionIO';
import { buildViewUrl, decodeSessionFromHash } from './utils/share';
import { formatDuration } from './utils/time';

const IDLE_RUN: RunState = {
  status: 'idle',
  currentIndex: -1,
  sectionAnchor: null,
  frozenElapsed: 0,
};

const DEFAULT_SETTINGS: Settings = {
  sound: true,
  chime: 'twoTone',
  volume: 0.6,
  notifications: false,
  autoAdvance: true,
  accent: 'indigo',
  theme: 'dark',
};

export default function App() {
  const [session, setSession] = useLocalStorage<SessionData>(
    'lsc.session',
    DEFAULT_SESSION,
  );
  const [run, setRun] = useLocalStorage<RunState>('lsc.run.v2', IDLE_RUN);
  const [settings, setSettings] = useLocalStorage<Settings>(
    'lsc.settings.v2',
    DEFAULT_SETTINGS,
  );

  const now = useNow(250);
  const snapshot = useSessionEngine(session, run, now);
  const [reminder, setReminder] = useState<Reminder | null>(null);
  const [presenter, setPresenter] = useState(false);
  const [qrUrl, setQrUrl] = useState<string | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  // Read-only attendee view (opened by a shared/QR link with view=agenda).
  const [attendee, setAttendee] = useState(false);
  // Set true when a new service worker version is ready.
  const [updateReady, setUpdateReady] = useState(false);
  // Screen-reader announcement, updated only on section change (not every tick).
  const [announcement, setAnnouncement] = useState('');

  const editable = run.status === 'idle';
  const canStart = snapshot.total > 0;

  // Keep the screen awake while a session is actively running.
  useWakeLock(run.status === 'running');

  // Load an agenda shared via URL (#agenda=…) once on mount, then strip the
  // hash so edits persist to localStorage and a refresh doesn't re-apply it.
  useEffect(() => {
    const decoded = decodeSessionFromHash(window.location.hash);
    if (decoded) {
      setSession(decoded.session);
      setRun(IDLE_RUN);
      if (decoded.view) setAttendee(true);
      window.history.replaceState(
        null,
        '',
        window.location.pathname + window.location.search,
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Listen for a new deployed version (dispatched from the SW registration).
  useEffect(() => {
    const onUpdate = () => setUpdateReady(true);
    window.addEventListener('lsc-sw-update', onUpdate);
    return () => window.removeEventListener('lsc-sw-update', onUpdate);
  }, []);

  // --- Theme ---------------------------------------------------------------
  useEffect(() => {
    applyTheme(settings.accent, settings.theme);
  }, [settings.accent, settings.theme]);

  // --- Browser tab title reflects the live countdown -----------------------
  useEffect(() => {
    const base = 'Live Session Clock';
    let title = base;
    if (snapshot.status === 'running' || snapshot.status === 'paused') {
      const name =
        snapshot.activeIndex >= 0
          ? snapshot.timeline[snapshot.activeIndex].section.title
          : '';
      const time =
        snapshot.overrunMs > 0
          ? `+${formatDuration(snapshot.overrunMs)}`
          : formatDuration(snapshot.remainingInSection);
      const paused = snapshot.status === 'paused' ? '⏸ ' : '';
      title = `${paused}${time} · ${name}`;
    } else if (snapshot.status === 'finished') {
      title = `✓ Complete · ${base}`;
    }
    document.title = title;
    return () => {
      document.title = base;
    };
  }, [
    snapshot.status,
    snapshot.activeIndex,
    snapshot.remainingInSection,
    snapshot.overrunMs,
    snapshot.timeline,
  ]);

  // --- Reminder + alert firing --------------------------------------------
  const lastKey = useRef<string>('');
  const primed = useRef(false);
  const settingsRef = useRef(settings);
  settingsRef.current = settings;

  const fireReminder = useCallback((r: Reminder) => {
    setReminder(r);
    const s = settingsRef.current;
    if (r.kind === 'finished') {
      setAnnouncement('Session complete. All sections have finished.');
    } else if (r.section) {
      setAnnouncement(
        `Now: ${r.section.title}. ${r.section.activity || ''}`.trim(),
      );
    }
    if (s.sound) playChime(s.chime, s.volume);
    if (s.notifications) {
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
    // session is already live (page refresh mid-session). Starting idle leaves
    // the baseline empty so the first Start fires normally.
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

  // --- Run controls --------------------------------------------------------
  const advance = useCallback(() => {
    setRun((prev) => {
      const next = prev.currentIndex + 1;
      if (next >= session.sections.length) {
        return { ...IDLE_RUN, status: 'finished' };
      }
      return {
        status: 'running',
        currentIndex: next,
        sectionAnchor: Date.now(),
        frozenElapsed: 0,
      };
    });
  }, [setRun, session.sections.length]);

  // Auto-advance at the planned end when enabled.
  useEffect(() => {
    if (
      settings.autoAdvance &&
      run.status === 'running' &&
      snapshot.remainingInSection <= 0
    ) {
      advance();
    }
  }, [settings.autoAdvance, run.status, snapshot.remainingInSection, advance]);

  const handleStart = useCallback(() => {
    if (settingsRef.current.notifications) void requestNotificationPermission();
    // Play a chime inside the click gesture so browsers unlock audio.
    if (settingsRef.current.sound)
      playChime(settingsRef.current.chime, settingsRef.current.volume);
    lastKey.current = '';
    if (session.sections.length === 0) return;
    setRun({
      status: 'running',
      currentIndex: 0,
      sectionAnchor: Date.now(),
      frozenElapsed: 0,
    });
  }, [setRun, session.sections.length]);

  const handlePause = useCallback(() => {
    setRun((prev) => {
      const elapsed =
        prev.sectionAnchor != null
          ? Date.now() - prev.sectionAnchor
          : prev.frozenElapsed;
      return {
        ...prev,
        status: 'paused',
        sectionAnchor: null,
        frozenElapsed: Math.max(0, elapsed),
      };
    });
  }, [setRun]);

  const handleResume = useCallback(() => {
    setRun((prev) => ({
      ...prev,
      status: 'running',
      sectionAnchor: Date.now() - prev.frozenElapsed,
    }));
  }, [setRun]);

  const handleReset = useCallback(() => {
    if (
      (run.status === 'running' || run.status === 'paused') &&
      !window.confirm('End the running session and reset the timer?')
    ) {
      return;
    }
    lastKey.current = '';
    setReminder(null);
    setRun(IDLE_RUN);
  }, [run.status, setRun]);

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

  // Add/remove minutes on the currently-running section (min 1 minute).
  const extendActive = useCallback(
    (deltaMinutes: number) => {
      const idx = run.currentIndex;
      if (idx < 0) return;
      setSession((s) => {
        if (idx >= s.sections.length) return s;
        const next = [...s.sections];
        const cur = next[idx];
        next[idx] = {
          ...cur,
          durationMinutes: Math.max(1, cur.durationMinutes + deltaMinutes),
        };
        return { ...s, sections: next };
      });
    },
    [run.currentIndex, setSession],
  );

  // --- Settings ------------------------------------------------------------
  const updateSettings = useCallback(
    (patch: Partial<Settings>) => {
      if (patch.notifications) void requestNotificationPermission();
      setSettings((s) => ({ ...s, ...patch }));
    },
    [setSettings],
  );

  // --- Import / export -----------------------------------------------------
  const handleExport = useCallback(() => exportSession(session), [session]);
  const handleImport = useCallback(
    (file: File) => {
      setImportError(null);
      importSessionFile(file)
        .then((data) => {
          setSession(data);
          setRun(IDLE_RUN);
        })
        .catch((err: unknown) =>
          setImportError(err instanceof Error ? err.message : 'Import failed.'),
        );
    },
    [setSession, setRun],
  );

  // --- Presenter mode ------------------------------------------------------
  const enterPresenter = useCallback(() => {
    setPresenter(true);
    document.documentElement.requestFullscreen?.().catch(() => {});
  }, []);
  const exitPresenter = useCallback(() => {
    setPresenter(false);
    if (document.fullscreenElement) document.exitFullscreen?.().catch(() => {});
  }, []);

  // --- Keyboard shortcuts --------------------------------------------------
  // Space = pause/resume (or start), → = skip to next, P/F = presenter view.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (attendee) return; // shortcuts off in the read-only view
      const el = e.target as HTMLElement | null;
      if (
        el &&
        (['INPUT', 'TEXTAREA', 'SELECT', 'BUTTON'].includes(el.tagName) ||
          el.isContentEditable)
      ) {
        return; // don't hijack typing or button activation
      }
      if (e.metaKey || e.ctrlKey || e.altKey) return;

      switch (e.key) {
        case ' ':
        case 'Spacebar':
          e.preventDefault();
          if (run.status === 'running') handlePause();
          else if (run.status === 'paused') handleResume();
          else if (run.status === 'idle' && canStart) handleStart();
          break;
        case 'ArrowRight':
          if (run.status === 'running' || run.status === 'paused') {
            e.preventDefault();
            advance();
          }
          break;
        case 'p':
        case 'P':
        case 'f':
        case 'F':
          e.preventDefault();
          if (presenter) exitPresenter();
          else enterPresenter();
          break;
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [
    run.status,
    canStart,
    presenter,
    attendee,
    handleStart,
    handlePause,
    handleResume,
    advance,
    enterPresenter,
    exitPresenter,
  ]);

  if (attendee) {
    return (
      <AttendeeView
        session={session}
        now={now}
        onOpenApp={() => setAttendee(false)}
      />
    );
  }

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
            onNext={advance}
            onReset={handleReset}
            onPresent={enterPresenter}
            onExtend={extendActive}
            onToggleSound={() => updateSettings({ sound: !settings.sound })}
            onToggleNotifications={() =>
              updateSettings({ notifications: !settings.notifications })
            }
            onToggleAutoAdvance={() =>
              updateSettings({ autoAdvance: !settings.autoAdvance })
            }
          />
        </div>

        <aside className="app__side">
          <InstructionsPanel
            title={session.title}
            instructions={session.instructions}
            editable={editable}
            onChange={updateSession}
          />
          <SettingsPanel
            settings={settings}
            onChange={updateSettings}
            onExport={handleExport}
            onImportFile={handleImport}
            importError={importError}
            canImport={editable}
            buildShareUrl={() => buildViewUrl(session)}
            onShowQr={(url) => setQrUrl(url)}
          />
          <Agenda
            timeline={snapshot.timeline}
            editable={editable}
            remainingInSection={snapshot.remainingInSection}
            overrunMs={snapshot.overrunMs}
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
        <span className="app__shortcuts">
          {' '}· Shortcuts: <kbd>Space</kbd> pause · <kbd>→</kbd> next ·{' '}
          <kbd>P</kbd> present
        </span>
      </footer>

      {/* Screen-reader-only live region: announces each section change. */}
      <div className="sr-only" role="status" aria-live="polite">
        {announcement}
      </div>

      <ReminderModal reminder={reminder} onDismiss={() => setReminder(null)} />
      {qrUrl && (
        <Suspense fallback={null}>
          <QrModal url={qrUrl} onClose={() => setQrUrl(null)} />
        </Suspense>
      )}
      {presenter && (
        <PresenterView
          snapshot={snapshot}
          now={now}
          shareUrl={buildViewUrl(session)}
          onExit={exitPresenter}
        />
      )}
      {updateReady && (
        <div className="toast" role="status">
          <span className="toast__text">A new version is available.</span>
          <button
            className="btn btn--primary btn--sm"
            onClick={() => window.location.reload()}
          >
            Refresh
          </button>
          <button
            className="btn btn--ghost btn--sm"
            onClick={() => setUpdateReady(false)}
          >
            Later
          </button>
        </div>
      )}
    </div>
  );
}
