import type { SessionData } from './types';

/** A sample agenda so the app is useful the moment it loads. */
export const DEFAULT_SESSION: SessionData = {
  title: 'Workshop Session',
  instructions:
    'Welcome! Please keep your microphone muted unless you are speaking, and drop any questions in the chat at any time. We will follow the timed agenda below.',
  sections: [
    {
      id: 'seed-welcome',
      title: 'Welcome & introductions',
      durationMinutes: 10,
      activity:
        'Introduce yourself in the chat: your name, role, and one thing you want to get out of today.',
    },
    {
      id: 'seed-overview',
      title: 'Overview & goals',
      durationMinutes: 15,
      activity:
        'Listen along and note any questions. We will cover the agenda and goals for the session.',
    },
    {
      id: 'seed-activity',
      title: 'Hands-on activity',
      durationMinutes: 20,
      activity:
        'Work through the exercise in your breakout group. Share your screen and collaborate.',
    },
    {
      id: 'seed-wrap',
      title: 'Wrap-up & Q&A',
      durationMinutes: 10,
      activity:
        'Bring your questions! Add any final thoughts or feedback in the chat.',
    },
  ],
};
