import { useMemo } from 'react';
import { qrMatrix, qrPath } from '../utils/qr';

interface QrCodeProps {
  value: string;
  /** Rendered pixel size (square). */
  size?: number;
}

/**
 * Renders a scannable QR code as a single-path SVG. Always dark-on-light
 * (regardless of app theme) with a quiet zone, so it scans reliably.
 */
export function QrCode({ value, size = 240 }: QrCodeProps) {
  const { path, dim } = useMemo(() => {
    const matrix = qrMatrix(value);
    const quiet = 4;
    return { path: qrPath(matrix, quiet), dim: matrix.length + quiet * 2 };
  }, [value]);

  return (
    <svg
      className="qr"
      width={size}
      height={size}
      viewBox={`0 0 ${dim} ${dim}`}
      role="img"
      aria-label="QR code linking to this agenda"
      shapeRendering="crispEdges"
    >
      <rect width={dim} height={dim} fill="#ffffff" />
      <path d={path} fill="#000000" />
    </svg>
  );
}
