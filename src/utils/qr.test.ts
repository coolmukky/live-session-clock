import { describe, it, expect } from 'vitest';
import { qrMatrix, qrPath } from './qr';

describe('qr', () => {
  it('produces a square boolean matrix at least 21x21', () => {
    const m = qrMatrix('https://example.com/#agenda=abc');
    expect(m.length).toBeGreaterThanOrEqual(21);
    expect(m.every((row) => row.length === m.length)).toBe(true);
    expect(typeof m[0][0]).toBe('boolean');
  });

  it('has the finder-pattern corner dark (module 0,0)', () => {
    const m = qrMatrix('hello');
    expect(m[0][0]).toBe(true);
  });

  it('is deterministic for the same input', () => {
    expect(qrMatrix('same')).toEqual(qrMatrix('same'));
  });

  it('builds a non-empty path with a quiet-zone offset', () => {
    const m = qrMatrix('x');
    const d = qrPath(m, 4);
    expect(d.length).toBeGreaterThan(0);
    // First dark run starts at the quiet-zone offset (module 0,0 -> x=4, y=4).
    expect(d.startsWith('M4 4h')).toBe(true);
  });
});
