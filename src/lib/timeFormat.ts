export function formatDisplayTime(time?: string | null): string {
  if (!time) return 'TBD';

  const value = String(time).trim();
  const existingPeriodMatch = value.match(/^(\d{1,2})(?::(\d{2}))?\s*(AM|PM)$/i);
  if (existingPeriodMatch) {
    const hour = Number(existingPeriodMatch[1]);
    const minute = existingPeriodMatch[2];
    const period = existingPeriodMatch[3].toUpperCase();
    if (!minute || minute === '00') return `${hour} ${period}`;
    return `${hour}:${minute} ${period}`;
  }

  const match = value.match(/^(\d{1,2}):(\d{2})/);
  if (!match) return value;

  const hours = Number(match[1]);
  const minutes = match[2];
  if (Number.isNaN(hours)) return value;

  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12;
  return minutes === '00' ? `${displayHours} ${period}` : `${displayHours}:${minutes} ${period}`;
}

export function formatDisplayTimeRange(startTime?: string | null, endTime?: string | null): string {
  return `${formatDisplayTime(startTime)} - ${formatDisplayTime(endTime)}`;
}
