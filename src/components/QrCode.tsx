import { useEffect, useMemo } from 'react';
import { safeQrMatrix, qrPath } from '../utils/qr';

interface QrCodeProps {
  value: string;
  /** Rendered pixel size (square). */
  size?: number;
  /** Called when the value is too large to encode as a QR. */
  onError?: () => void;
}

/**
 * Renders a scannable QR code as a single-path SVG. Always dark-on-light
 * (regardless of app theme) with a quiet zone, so it scans reliably. Renders a
 * small fallback (and calls onError) when the value is too large to encode.
 */
export function QrCode({ value, size = 240, onError }: QrCodeProps) {
  const result = useMemo(() => {
    const matrix = safeQrMatrix(value);
    if (!matrix) return null;
    const quiet = 4;
    return { path: qrPath(matrix, quiet), dim: matrix.length + quiet * 2 };
  }, [value]);

  useEffect(() => {
    if (!result) onError?.();
  }, [result, onError]);

  if (!result) {
    return (
      <div className="qr qr--error" style={{ width: size, height: size }}>
        Too much data for a QR code.
      </div>
    );
  }

  return (
    <svg
      className="qr"
      width={size}
      height={size}
      viewBox={`0 0 ${result.dim} ${result.dim}`}
      role="img"
      aria-label="QR code linking to this agenda"
      shapeRendering="crispEdges"
    >
      <rect width={result.dim} height={result.dim} fill="#ffffff" />
      <path d={result.path} fill="#000000" />
    </svg>
  );
}

export default QrCode;
