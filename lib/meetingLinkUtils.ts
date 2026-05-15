import { isBefore, isValid, parseISO, startOfDay } from 'date-fns';

export type MeetingLinkLike = {
  _id: string;
  title: string;
  url: string;
  description?: string;
  pptDriveLink?: string;
  isActive?: boolean;
  scheduledDate?: string;
  scheduledTime?: string;
};

/** Treat missing isActive as active (legacy records). */
export function isMeetingActive(link: MeetingLinkLike) {
  return link.isActive !== false;
}

export function meetingTargetDate(link: MeetingLinkLike): Date | null {
  if (!link.scheduledDate) return null;
  try {
    const datePart = link.scheduledDate.includes('T')
      ? link.scheduledDate.split('T')[0]
      : link.scheduledDate;
    const timePart = link.scheduledTime?.trim();
    const combined = timePart ? `${datePart}T${timePart}` : datePart;
    const d = parseISO(combined);
    return isValid(d) ? d : null;
  } catch {
    return null;
  }
}

export function isUpcomingMeeting(link: MeetingLinkLike, now = new Date()) {
  const t = meetingTargetDate(link);
  if (!t) return true;
  return !isBefore(startOfDay(t), startOfDay(now));
}

/** All active links for teachers — includes undated and past-dated sessions. */
export function getVisibleMeetingLinks(links: MeetingLinkLike[], now = new Date()) {
  return links
    .filter(isMeetingActive)
    .sort((a, b) => {
      const ta = meetingTargetDate(a)?.getTime();
      const tb = meetingTargetDate(b)?.getTime();
      const aUpcoming = ta == null || !isBefore(startOfDay(new Date(ta)), startOfDay(now));
      const bUpcoming = tb == null || !isBefore(startOfDay(new Date(tb)), startOfDay(now));
      if (aUpcoming !== bUpcoming) return aUpcoming ? -1 : 1;
      if (ta == null && tb == null) return 0;
      if (ta == null) return -1;
      if (tb == null) return 1;
      return ta - tb;
    });
}

export function getUpcomingMeetingLinks(links: MeetingLinkLike[], now = new Date()) {
  return getVisibleMeetingLinks(links, now).filter((m) => isUpcomingMeeting(m, now));
}
