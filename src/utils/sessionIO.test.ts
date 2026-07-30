import { describe, it, expect } from 'vitest';
import { parseSession } from './sessionIO';

describe('parseSession', () => {
  const valid = {
    title: 'Deck',
    instructions: 'hi',
    sections: [{ id: 'x', title: 'One', durationMinutes: 5, activity: 'go' }],
  };

  it('accepts a bare SessionData object', () => {
    const s = parseSession(valid);
    expect(s.title).toBe('Deck');
    expect(s.sections).toHaveLength(1);
    expect(s.sections[0].durationMinutes).toBe(5);
  });

  it('accepts a wrapped { session } payload', () => {
    const s = parseSession({ type: 'x', version: 1, session: valid });
    expect(s.sections[0].title).toBe('One');
  });

  it('generates an id when one is missing', () => {
    const s = parseSession({
      title: 'D',
      sections: [{ title: 'One', durationMinutes: 3, activity: '' }],
    });
    expect(s.sections[0].id).toBeTruthy();
  });

  it('throws when sections is not an array', () => {
    expect(() => parseSession({ title: 'x' })).toThrow();
  });

  it('throws on an empty section title', () => {
    expect(() =>
      parseSession({ sections: [{ title: '  ', durationMinutes: 5 }] }),
    ).toThrow();
  });

  it('throws on a non-positive duration', () => {
    expect(() =>
      parseSession({ sections: [{ title: 'One', durationMinutes: 0 }] }),
    ).toThrow();
  });
});
