'use client';

import { useEffect, useState } from 'react';
import { format, startOfDay, parseISO, isValid, isBefore } from 'date-fns';
import { motion } from 'framer-motion';
import PageBackLink from '@/components/PageBackLink';

interface MeetingLink {
  _id: string;
  title: string;
  url: string;
  description?: string;
  pptDriveLink?: string;
  isActive: boolean;
  scheduledDate?: string;
  scheduledTime?: string;
}

function meetingTarget(link: MeetingLink): Date | null {
  if (!link.scheduledDate) return null;
  try {
    const t = link.scheduledTime ? `${link.scheduledDate}T${link.scheduledTime}` : link.scheduledDate;
    const d = parseISO(t);
    return isValid(d) ? d : null;
  } catch {
    return null;
  }
}

export default function TrainerMeetingLinksPage() {
  const [links, setLinks] = useState<MeetingLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/meeting-links');
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to load meetings');
        setLinks(data.meetingLinks || []);
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const trackJoin = async (id: string) => {
    try {
      await fetch('/api/meeting-links/click', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ meetingLinkId: id }),
      });
    } catch {
      /* ignore */
    }
  };

  const now = new Date();
  const visible = links
    .filter((m) => m.isActive)
    .filter((m) => {
      const t = meetingTarget(m);
      if (!t) return true;
      return !isBefore(startOfDay(t), startOfDay(now));
    })
    .sort((a, b) => (meetingTarget(a)?.getTime() ?? Infinity) - (meetingTarget(b)?.getTime() ?? Infinity));

  if (loading) {
    return <div className="h-48 rounded-3xl bg-white border border-[#E5E7EB] animate-pulse" />;
  }

  return (
    <div className="space-y-6">
      <PageBackLink href="/trainer/dashboard" />
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-[#0F172A]">Meeting links</h1>
        <p className="text-[#6B7280] mt-1">Join sessions and open shared decks.</p>
      </motion.div>
      {error && (
        <div className="p-4 rounded-2xl border border-red-200 bg-red-50 text-red-800 text-sm">
          {error}
        </div>
      )}
      {visible.length === 0 ? (
        <p className="text-sm text-[#6B7280]">No active meetings right now.</p>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
          {visible.map((link, idx) => {
            const target = meetingTarget(link);
            const isToday = target && startOfDay(target).getTime() === startOfDay(now).getTime();
            return (
              <motion.div
                key={link._id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.04 * idx }}
                whileHover={{ y: -3 }}
                className="rounded-3xl border border-[#E5E7EB] bg-white/95 backdrop-blur-md p-6 shadow-sm hover:shadow-lg hover:shadow-emerald-500/10"
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <h2 className="text-lg font-bold text-[#0F172A]">{link.title}</h2>
                  <span
                    className={`text-xs font-semibold px-2.5 py-1 rounded-full border shrink-0 ${
                      isToday ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-50 text-slate-600 border-slate-200'
                    }`}
                  >
                    {isToday ? 'Today' : target ? format(target, 'MMM d') : 'Open'}
                  </span>
                </div>
                <p className="text-sm text-[#6B7280] mb-2">{link.description || 'Live training session'}</p>
                {target && <p className="text-sm text-[#0F172A] font-medium mb-4">{format(target, 'PPp')}</p>}
                <div className="flex flex-wrap gap-2">
                  <a
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => void trackJoin(link._id)}
                    className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-emerald-500/25 hover:opacity-90"
                  >
                    Join meeting
                  </a>
                  {link.pptDriveLink ? (
                    <a
                      href={link.pptDriveLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center rounded-xl border border-[#E5E7EB] bg-white px-4 py-2.5 text-sm font-semibold text-[#0F172A] hover:border-emerald-300"
                    >
                      View PPT
                    </a>
                  ) : (
                    <span className="inline-flex items-center rounded-xl border border-dashed border-[#E5E7EB] px-4 py-2.5 text-sm text-[#6B7280]">
                      PPT not linked
                    </span>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
