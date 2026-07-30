import type { SessionData } from '../types';
import { parseSession } from './sessionIO';

/**
 * A compact, URL-safe encoding of an agenda so it can be shared as a link
 * (in the location hash) without a file. Uses a short wire form to keep URLs
 * as small as practical:
 *   { t: title, i: instructions, s: [[title, minutes, activity, color?], ...] }
 *
 * Links may also carry `&view=agenda`, which opens the read-only attendee view.
 */

type CompactRow = [string, number, string, string?];
interface Compact {
  t?: string;
  i?: string;
  s?: CompactRow[];
}

export interface DecodedShare {
  session: SessionData;
  /** True when the link requests the read-only attendee view. */
  view: boolean;
}

function toCompact(session: SessionData): Compact {
  return {
    t: session.title,
    i: session.instructions,
    s: session.sections.map((x) =>
      x.color
        ? [x.title, x.durationMinutes, x.activity, x.color]
        : [x.title, x.durationMinutes, x.activity],
    ),
  };
}

/** Validate a decoded compact object into a SessionData (throws on bad input). */
function fromCompact(c: Compact): SessionData {
  const sections = Array.isArray(c?.s)
    ? c.s.map((row) => ({
        title: row?.[0],
        durationMinutes: row?.[1],
        activity: row?.[2],
        color: row?.[3],
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

/** Decode an agenda + view flag from a location hash, or null if absent/invalid. */
export function decodeSessionFromHash(hash: string): DecodedShare | null {
  const match = /agenda=([^&]+)/.exec(hash || '');
  if (!match) return null;
  try {
    const json = base64UrlDecode(decodeURIComponent(match[1]));
    const session = fromCompact(JSON.parse(json) as Compact);
    const view = /(?:[#&?])view=agenda(?:&|$)/.test(hash);
    return { session, view };
  } catch {
    return null;
  }
}

function pageBase(): string {
  return (
    window.location.origin + window.location.pathname + window.location.search
  );
}

/** Full-app link that loads the agenda into the editable app. */
export function buildShareUrl(session: SessionData): string {
  return `${pageBase()}#${encodeSessionToHash(session)}`;
}

/** Read-only attendee-view link (what the QR and "share" action use). */
export function buildViewUrl(session: SessionData): string {
  return `${pageBase()}#${encodeSessionToHash(session)}&view=agenda`;
}
