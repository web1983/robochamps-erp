'use client';

import { useState } from 'react';
import { format, isPast, isToday } from 'date-fns';

interface MeetingLink {
  _id: string;
  title: string;
  url: string;
  description?: string;
  pptDriveLink?: string;
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
    <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-all border border-gray-100 hover:border-emerald-500/50">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-3">
            <h3 className="text-xl font-semibold text-gray-900">{meetingLink.title}</h3>
            {scheduledDateTime && (
              <span className={`px-3 py-1 rounded-lg text-xs font-semibold border ${
                isPast(scheduledDateTime) 
                  ? 'bg-gray-50 text-gray-600 border-gray-200' 
                  : isTodayMeeting
                  ? 'bg-green-50 text-green-700 border-green-200'
                  : 'bg-blue-50 text-blue-700 border-blue-200'
              }`}>
                {isPast(scheduledDateTime) ? 'Past' : isTodayMeeting ? 'Today' : 'Upcoming'}
              </span>
            )}
          </div>
          {meetingLink.description && (
            <p className="text-gray-600 text-sm mb-3">{meetingLink.description}</p>
          )}
          {scheduledDateTime && (
            <p className="text-sm text-gray-600 mb-4">
              📅 <strong className="text-gray-900">Scheduled:</strong> {format(scheduledDateTime, 'PP')}
              {meetingLink.scheduledTime && ` at ${format(scheduledDateTime, 'p')}`}
            </p>
          )}
        </div>
        <div className="text-3xl ml-4">🔗</div>
      </div>
      <div className="space-y-2">
        <button
          onClick={handleClick}
          disabled={clicking}
          className={`w-full py-3 rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
            isTodayMeeting 
              ? 'bg-emerald-500 text-white hover:bg-emerald-600' 
              : 'bg-emerald-500 text-white hover:bg-emerald-600'
          }`}
        >
          {clicking ? 'Opening...' : isTodayMeeting ? 'Join Meeting (Today)' : 'Join Meeting'}
        </button>
        {meetingLink.pptDriveLink && (
          <button
            onClick={() => window.open(meetingLink.pptDriveLink, '_blank')}
            className="w-full py-3 rounded-lg font-semibold transition-colors bg-blue-500 text-white hover:bg-blue-600 border border-transparent"
          >
            📄 View PPT / Presentation
          </button>
        )}
      </div>
    </div>
  );
}
