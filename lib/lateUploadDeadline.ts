/**
 * Combined sheet upload deadline: 5th of the month after the sheet month (UTC end of day).
 * Example: sheet month 2026-04 (April) → deadline 2026-05-05 23:59:59.999 UTC.
 */
export function getLateUploadDeadlineUtc(monthYear: string): Date | null {
  const match = /^(\d{4})-(\d{2})$/.exec(monthYear.trim());
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]); // 1–12
  if (month < 1 || month > 12) return null;

  // Date.UTC month index for the month *after* sheet month (month is 1-based in YYYY-MM)
  return new Date(Date.UTC(year, month, 5, 23, 59, 59, 999));
}

export function isLateUploadDeadlinePassed(monthYear: string, now = new Date()): boolean {
  const deadline = getLateUploadDeadlineUtc(monthYear);
  if (!deadline) return false;
  return now.getTime() > deadline.getTime();
}

export function canRequestLateUpload(monthYear: string, now = new Date()): boolean {
  return isLateUploadDeadlinePassed(monthYear, now);
}
