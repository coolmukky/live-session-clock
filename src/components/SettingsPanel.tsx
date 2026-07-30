import { useRef, useState } from 'react';
import type { ChimeId, Settings } from '../types';
import { ACCENTS } from '../utils/theme';
import { CHIMES, playChime } from '../utils/alerts';

interface SettingsPanelProps {
  settings: Settings;
  onChange: (patch: Partial<Settings>) => void;
  onExport: () => void;
  onImportFile: (file: File) => void;
  importError: string | null;
  /** Import replaces the agenda, so only allow it before the session starts. */
  canImport: boolean;
  /** Builds a shareable URL that encodes the current agenda. */
  buildShareUrl: () => string;
  /** Opens the QR dialog for the given URL. */
  onShowQr: (url: string) => void;
}

export function SettingsPanel({
  settings,
  onChange,
  onExport,
  onImportFile,
  importError,
  canImport,
  buildShareUrl,
  onShowQr,
}: SettingsPanelProps) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleShare = async () => {
    const url = buildShareUrl();
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard blocked (e.g. insecure context) — fall back to a prompt.
      window.prompt('Copy this shareable link:', url);
    }
  };

  return (
    <section className="settings">
      <button
        className="instructions__toggle"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
      >
        <span className="panel__title">⚙ Appearance, sound & files</span>
        <span className="instructions__chevron">{open ? '▾' : '▸'}</span>
      </button>

      {open && (
        <div className="settings__body">
          {/* Theme */}
          <div className="settings__group">
            <span className="field__label">Theme</span>
            <div className="segmented">
              {(['dark', 'light'] as const).map((t) => (
                <button
                  key={t}
                  className={`segmented__opt${settings.theme === t ? ' is-active' : ''}`}
                  onClick={() => onChange({ theme: t })}
                >
                  {t === 'dark' ? '🌙 Dark' : '☀ Light'}
                </button>
              ))}
            </div>
          </div>

          {/* Accent color */}
          <div className="settings__group">
            <span className="field__label">Accent color</span>
            <div className="swatches">
              {ACCENTS.map((a) => (
                <button
                  key={a.key}
                  className={`swatch${settings.accent === a.key ? ' is-active' : ''}`}
                  style={{ background: a.color }}
                  title={a.label}
                  aria-label={a.label}
                  onClick={() => onChange({ accent: a.key })}
                />
              ))}
              <label className="swatch swatch--custom" title="Custom color">
                <input
                  type="color"
                  value={/^#/.test(settings.accent) ? settings.accent : '#6366f1'}
                  onChange={(e) => onChange({ accent: e.target.value })}
                />
                <span>+</span>
              </label>
            </div>
          </div>

          {/* Chime */}
          <div className="settings__group">
            <span className="field__label">Chime sound</span>
            <div className="settings__row">
              <select
                className="field__input"
                value={settings.chime}
                onChange={(e) => onChange({ chime: e.target.value as ChimeId })}
              >
                {CHIMES.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
              </select>
              <button
                className="btn btn--ghost btn--sm"
                onClick={() => playChime(settings.chime, settings.volume)}
              >
                ▶ Test
              </button>
            </div>
            <div className="settings__row">
              <span className="settings__mini">Volume</span>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={settings.volume}
                onChange={(e) => onChange({ volume: Number(e.target.value) })}
                className="settings__range"
              />
            </div>
          </div>

          {/* Share / import / export */}
          <div className="settings__group">
            <span className="field__label">Share &amp; agenda files</span>
            <div className="settings__row">
              <button className="btn btn--ghost btn--sm" onClick={handleShare}>
                {copied ? '✓ Link copied' : '🔗 Copy share link'}
              </button>
              <button
                className="btn btn--ghost btn--sm"
                onClick={() => onShowQr(buildShareUrl())}
              >
                ▦ QR code
              </button>
              <button className="btn btn--ghost btn--sm" onClick={onExport}>
                ⬇ Export JSON
              </button>
              <button
                className="btn btn--ghost btn--sm"
                onClick={() => fileRef.current?.click()}
                disabled={!canImport}
                title={
                  canImport ? 'Load an agenda file' : 'Reset the session to import'
                }
              >
                ⬆ Import JSON
              </button>
              <input
                ref={fileRef}
                type="file"
                accept="application/json,.json"
                hidden
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) onImportFile(f);
                  e.target.value = '';
                }}
              />
            </div>
            <p className="settings__mini settings__hint">
              The share link encodes this agenda in the URL — no file needed.
            </p>
            {importError && <p className="settings__error">{importError}</p>}
          </div>
        </div>
      )}
    </section>
  );
}
