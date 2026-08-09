const MINUTE = 60 * 1000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

/** "Just now", "4m ago", "Yesterday", "Mar 3". */
export function formatRelativeTime(timestamp: number): string {
  const elapsed = Date.now() - timestamp;

  if (elapsed < MINUTE) return 'Just now';
  if (elapsed < HOUR) return `${Math.floor(elapsed / MINUTE)}m ago`;
  if (elapsed < DAY) return `${Math.floor(elapsed / HOUR)}h ago`;
  if (elapsed < 2 * DAY) return 'Yesterday';

  return new Date(timestamp).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  });
}
