import { formatClock, formatDate } from '../utils/time';

/** The always-on live wall clock. */
export function Clock({ now }: { now: number }) {
  return (
    <div className="clock">
      <div className="clock__time">{formatClock(now)}</div>
      <div className="clock__date">{formatDate(now)}</div>
    </div>
  );
}
