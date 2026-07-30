import { describe, it, expect } from 'vitest';
import { encodeSessionToHash, decodeSessionFromHash } from './share';
import type { SessionData } from '../types';

const session: SessionData = {
  title: 'Workshop',
  instructions: 'Be nice',
  sections: [
    { id: 'a', title: 'Welcome', durationMinutes: 10, activity: 'Say hi' },
    { id: 'b', title: 'Wörk 🚀', durationMinutes: 20, activity: 'Do it' },
  ],
};

describe('share encode/decode', () => {
  it('round-trips an agenda through the URL hash', () => {
    const hash = '#' + encodeSessionToHash(session);
    const decoded = decodeSessionFromHash(hash);
    expect(decoded).not.toBeNull();
    expect(decoded!.title).toBe('Workshop');
    expect(decoded!.instructions).toBe('Be nice');
    expect(decoded!.sections.map((s) => s.title)).toEqual(['Welcome', 'Wörk 🚀']);
    expect(decoded!.sections.map((s) => s.durationMinutes)).toEqual([10, 20]);
    expect(decoded!.sections[1].activity).toBe('Do it');
  });

  it('produces a URL-safe payload (no +, /, or =)', () => {
    const payload = encodeSessionToHash(session).replace('agenda=', '');
    expect(payload).not.toMatch(/[+/=]/);
  });

  it('returns null for a hash without an agenda', () => {
    expect(decodeSessionFromHash('#nothing=here')).toBeNull();
    expect(decodeSessionFromHash('')).toBeNull();
  });

  it('returns null for a corrupt payload', () => {
    expect(decodeSessionFromHash('#agenda=not-valid-base64!!!')).toBeNull();
  });
});
