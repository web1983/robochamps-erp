'use client';

import { useState } from 'react';
import { format, isPast, isToday } from 'date-fns';

interface MeetingLink {
  _id: string;
  title: string;
  url: string;
  description?: string;
  scheduledDate?: string;
  scheduledTime?: string;
}

interface MeetingLinkCardProps {
  meetingLink: MeetingLink;
}

export default function MeetingLinkCard({ meetingLink }: MeetingLinkCardProps) {
  const [clicking, setClicking] = useState(false);

  const handleClick = async () => {
    setClicking(true);
    
    // Track the click
    try {
      await fetch('/api/meeting-links/click', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ meetingLinkId: meetingLink._id }),
      });
    } catch (error) {
      console.error('Failed to track click:', error);
    }

    // Open the link in a new tab
    window.open(meetingLink.url, '_blank');
    
    setTimeout(() => setClicking(false), 1000);
  };

  const getScheduledDateTime = () => {
    if (!meetingLink.scheduledDate) return null;
    try {
      const dateStr = meetingLink.scheduledDate;
      const timeStr = meetingLink.scheduledTime || '';
      if (timeStr) {
        return new Date(`${dateStr}T${timeStr}`);
      }
      return new Date(dateStr);
    } catch (e) {
      return null;
    }
  };

  const scheduledDateTime = getScheduledDateTime();
  const isUpcoming = scheduledDateTime ? !isPast(scheduledDateTime) : false;
  const isTodayMeeting = scheduledDateTime ? isToday(scheduledDateTime) : false;

  return (
    <div className="bg-white/5 backdrop-blur-lg p-6 rounded-2xl shadow-2xl hover:shadow-3xl transition-all border border-white/10 hover:border-white/30">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-3">
            <h3 className="text-xl font-semibold text-white">{meetingLink.title}</h3>
            {scheduledDateTime && (
              <span className={`px-3 py-1 rounded-lg text-xs font-semibold ${
                isPast(scheduledDateTime) 
                  ? 'bg-white/10 text-white/70' 
                  : isTodayMeeting
                  ? 'bg-green-500/30 text-green-300 border border-green-400/50'
                  : 'bg-blue-500/30 text-blue-300 border border-blue-400/50'
              }`}>
                {isPast(scheduledDateTime) ? 'Past' : isTodayMeeting ? 'Today' : 'Upcoming'}
              </span>
            )}
          </div>
          {meetingLink.description && (
            <p className="text-white/70 text-sm mb-3">{meetingLink.description}</p>
          )}
          {scheduledDateTime && (
            <p className="text-sm text-white/80 mb-4">
              📅 <strong>Scheduled:</strong> {format(scheduledDateTime, 'PP')}
              {meetingLink.scheduledTime && ` at ${format(scheduledDateTime, 'p')}`}
            </p>
          )}
        </div>
        <div className="text-3xl ml-4">🔗</div>
      </div>
      <button
        onClick={handleClick}
        disabled={clicking}
        className={`w-full py-3 rounded-xl font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl ${
          isTodayMeeting 
            ? 'bg-green-500 text-white hover:bg-green-600' 
            : 'bg-white text-gray-900 hover:bg-gray-100'
        }`}
      >
        {clicking ? 'Opening...' : isTodayMeeting ? 'Join Meeting (Today)' : 'Join Meeting'}
      </button>
    </div>
  );
}
