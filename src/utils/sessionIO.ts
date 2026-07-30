import type { SessionData, Section } from '../types';
import { makeId } from './time';
import { isHexColor } from './theme';

const FILE_TYPE = 'live-session-clock/agenda';

/** Trigger a download of the current session as a JSON file. */
export function exportSession(session: SessionData): void {
  const payload = { type: FILE_TYPE, version: 1, session };
  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: 'application/json',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const safe = (session.title || 'agenda')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  a.href = url;
  a.download = `${safe || 'agenda'}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

/** Validate and normalize parsed JSON into a SessionData object. Throws on
 *  invalid input. */
export function parseSession(raw: unknown): SessionData {
  const obj = raw as Record<string, unknown>;
  // Accept either a wrapped { session } payload or a bare SessionData.
  const data = (obj?.session ?? obj) as Record<string, unknown>;
  if (!data || typeof data !== 'object') throw new Error('Not a valid file.');
  const sectionsRaw = data.sections;
  if (!Array.isArray(sectionsRaw)) throw new Error('Missing "sections" array.');

  const sections: Section[] = sectionsRaw.map((s, i) => {
    const sec = s as Record<string, unknown>;
    const title = typeof sec.title === 'string' ? sec.title : '';
    const durationMinutes = Number(sec.durationMinutes);
    if (!title.trim()) throw new Error(`Section ${i + 1} is missing a title.`);
    if (!Number.isFinite(durationMinutes) || durationMinutes <= 0) {
      throw new Error(`Section ${i + 1} has an invalid duration.`);
    }
    return {
      id: typeof sec.id === 'string' && sec.id ? sec.id : makeId(),
      title: title.trim(),
      durationMinutes,
      activity: typeof sec.activity === 'string' ? sec.activity : '',
      ...(isHexColor(sec.color) ? { color: sec.color } : {}),
    };
  });

  return {
    title: typeof data.title === 'string' ? data.title : 'Imported session',
    instructions: typeof data.instructions === 'string' ? data.instructions : '',
    sections,
  };
}

/** Read a File chosen by the user and resolve to a SessionData. */
export async function importSessionFile(file: File): Promise<SessionData> {
  const text = await file.text();
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error('That file is not valid JSON.');
  }
  return parseSession(parsed);
}
