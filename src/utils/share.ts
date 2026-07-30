import type { SessionData } from '../types';
import { parseSession } from './sessionIO';

/**
 * A compact, URL-safe encoding of an agenda so it can be shared as a link
 * (in the location hash) without a file. Uses a short wire form to keep URLs
 * as small as practical:
 *   { t: title, i: instructions, s: [[title, minutes, activity], ...] }
 */

interface Compact {
  t?: string;
  i?: string;
  s?: [string, number, string][];
}

function toCompact(session: SessionData): Compact {
  return {
    t: session.title,
    i: session.instructions,
    s: session.sections.map((x) => [x.title, x.durationMinutes, x.activity]),
  };
}

/** Validate a decoded compact object into a SessionData (throws on bad input). */
function fromCompact(c: Compact): SessionData {
  const sections = Array.isArray(c?.s)
    ? c.s.map((row) => ({
        title: row?.[0],
        durationMinutes: row?.[1],
        activity: row?.[2],
      }))
    : undefined;
  return parseSession({ title: c?.t, instructions: c?.i, sections });
}

function base64UrlEncode(input: string): string {
  const bytes = new TextEncoder().encode(input);
  let binary = '';
  bytes.forEach((b) => (binary += String.fromCharCode(b)));
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64UrlDecode(input: string): string {
  const b64 = input.replace(/-/g, '+').replace(/_/g, '/');
  const binary = atob(b64);
  const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

/** Encode an agenda into a `agenda=…` hash fragment (without the `#`). */
export function encodeSessionToHash(session: SessionData): string {
  return 'agenda=' + base64UrlEncode(JSON.stringify(toCompact(session)));
}

/** Decode an agenda from a location hash (`#agenda=…`), or null if absent/invalid. */
export function decodeSessionFromHash(hash: string): SessionData | null {
  const match = /agenda=([^&]+)/.exec(hash || '');
  if (!match) return null;
  try {
    const json = base64UrlDecode(decodeURIComponent(match[1]));
    return fromCompact(JSON.parse(json) as Compact);
  } catch {
    return null;
  }
}

/** Build a full shareable URL for the current page + agenda. */
export function buildShareUrl(session: SessionData): string {
  const base =
    window.location.origin +
    window.location.pathname +
    window.location.search;
  return `${base}#${encodeSessionToHash(session)}`;
}
