import { useEffect, useRef, useState } from 'react';
import { LazyQrCode } from './LazyQrCode';

interface QrModalProps {
  url: string;
  onClose: () => void;
}

/**
 * A dialog showing a QR code for the shareable agenda link, so attendees can
 * scan it (e.g. off a projected screen) to open the read-only session view on
 * their phones. Falls back to a copy-link message if the agenda is too large
 * to encode.
 */
export function QrModal({ url, onClose }: QrModalProps) {
  const [copied, setCopied] = useState(false);
  const [tooLarge, setTooLarge] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
        return;
      }
      if (e.key !== 'Tab') return;
      const f = dialogRef.current?.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
      );
      if (!f || f.length === 0) return;
      const first = f[0];
      const last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      previouslyFocused?.focus?.();
    };
  }, [onClose]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt('Copy this link:', url);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose} role="presentation">
      <div
        ref={dialogRef}
        className="modal modal--qr"
        role="dialog"
        aria-modal="true"
        aria-labelledby="qr-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal__eyebrow">Scan to open</div>
        <h2 id="qr-title" className="modal__title">
          Share this agenda
        </h2>
        <p className="modal__activity">
          {tooLarge
            ? 'This agenda is too large to fit in a QR code — copy the link below and share it instead.'
            : 'Point a phone camera at the code to open a read-only view of this session.'}
        </p>

        {!tooLarge && (
          <div className="qr__frame">
            <LazyQrCode value={url} size={260} onError={() => setTooLarge(true)} />
          </div>
        )}

        <div className="qr__url">
          <input
            className="field__input"
            readOnly
            value={url}
            onFocus={(e) => e.target.select()}
          />
          <button className="btn btn--ghost btn--sm" onClick={copy}>
            {copied ? '✓ Copied' : 'Copy'}
          </button>
        </div>

        <button
          ref={closeRef}
          className="btn btn--primary modal__button"
          onClick={onClose}
        >
          Done
        </button>
      </div>
    </div>
  );
}

export default QrModal;
