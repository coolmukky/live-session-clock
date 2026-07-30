import { lazy, Suspense } from 'react';

// Code-split: qrcode-generator (~25 KB) only loads when a QR is actually shown.
const QrCodeInner = lazy(() => import('./QrCode'));

interface LazyQrCodeProps {
  value: string;
  size?: number;
  onError?: () => void;
}

export function LazyQrCode({ value, size = 240, onError }: LazyQrCodeProps) {
  return (
    <Suspense
      fallback={
        <div className="qr qr--loading" style={{ width: size, height: size }} />
      }
    >
      <QrCodeInner value={value} size={size} onError={onError} />
    </Suspense>
  );
}
