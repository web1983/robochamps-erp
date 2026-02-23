'use client';

import { useState, useEffect } from 'react';
import { format, isPast, isToday, differenceInMinutes } from 'date-fns';

interface MeetingLink {
  _id: string;
  title: string;
  url: string;
  description?: string;
  pptDriveLink?: string;
  scheduledDate?: string;
  scheduledTime?: string;
  isActive?: boolean;
}

interface MeetingLinkCardProps {
  meetingLink: MeetingLink;
}

export default function MeetingLinkCard({ meetingLink }: MeetingLinkCardProps) {
  const [clicking, setClicking] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update current time every minute to check if meeting is accessible
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, []);

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

  // Check if meeting link is clickable (5 minutes before scheduled time or later)
  // Only applies if meeting is scheduled AND link is active
  const isMeetingClickable = () => {
    // If link is not active, disable clicking
    if (meetingLink.isActive === false) {
      return false;
    }

    // If no scheduled time, allow clicking (backward compatible)
    if (!scheduledDateTime || !meetingLink.scheduledTime) {
      return true;
    }

    // If meeting is scheduled and link is active, check time restriction
    // Calculate 5 minutes before scheduled time
    const fiveMinutesBefore = new Date(scheduledDateTime.getTime() - 5 * 60 * 1000);
    
    // Allow clicking if current time is >= 5 minutes before scheduled time
    return currentTime >= fiveMinutesBefore;
  };

  const canClickMeeting = isMeetingClickable();
  
  // Calculate time until meeting becomes accessible
  const getTimeUntilAccessible = () => {
    if (!scheduledDateTime || !meetingLink.scheduledTime) return null;
    
    const fiveMinutesBefore = new Date(scheduledDateTime.getTime() - 5 * 60 * 1000);
    const minutesUntil = differenceInMinutes(fiveMinutesBefore, currentTime);
    
    if (minutesUntil <= 0) return null;
    
    if (minutesUntil < 60) {
      return `${minutesUntil} minute${minutesUntil !== 1 ? 's' : ''}`;
    }
    
    const hours = Math.floor(minutesUntil / 60);
    const remainingMinutes = minutesUntil % 60;
    if (remainingMinutes === 0) {
      return `${hours} hour${hours !== 1 ? 's' : ''}`;
    }
    return `${hours} hour${hours !== 1 ? 's' : ''} ${remainingMinutes} minute${remainingMinutes !== 1 ? 's' : ''}`;
  };

  const timeUntilAccessible = getTimeUntilAccessible();

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
          disabled={clicking || !canClickMeeting}
          className={`w-full py-3 rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
            canClickMeeting
              ? isTodayMeeting 
                ? 'bg-emerald-500 text-white hover:bg-emerald-600' 
                : 'bg-emerald-500 text-white hover:bg-emerald-600'
              : 'bg-gray-300 text-gray-600 cursor-not-allowed'
          }`}
          title={!canClickMeeting && timeUntilAccessible ? `Meeting will be available in ${timeUntilAccessible}` : ''}
        >
          {clicking 
            ? 'Opening...' 
            : !canClickMeeting && timeUntilAccessible
            ? `Join Meeting (Available in ${timeUntilAccessible})`
            : isTodayMeeting 
            ? 'Join Meeting (Today)' 
            : 'Join Meeting'}
        </button>
        {!canClickMeeting && timeUntilAccessible && (
          <p className="text-xs text-gray-500 text-center">
            Meeting link will be available 5 minutes before the scheduled time
          </p>
        )}
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
