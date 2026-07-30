import { useEffect, useRef, useState } from 'react';
import { QrCode } from './QrCode';

interface QrModalProps {
  url: string;
  onClose: () => void;
}

/**
 * A dialog showing a QR code for the shareable agenda link, so attendees can
 * scan it (e.g. off a projected screen) to open the session on their phones.
 */
export function QrModal({ url, onClose }: QrModalProps) {
  const [copied, setCopied] = useState(false);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
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
          Point a phone camera at the code to load this session and its timer.
        </p>

        <div className="qr__frame">
          <QrCode value={url} size={260} />
        </div>

        <div className="qr__url">
          <input className="field__input" readOnly value={url} onFocus={(e) => e.target.select()} />
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
