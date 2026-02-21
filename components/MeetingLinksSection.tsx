'use client';

import { useState, useEffect } from 'react';
import MeetingLinkCard from './MeetingLinkCard';

interface MeetingLink {
  _id: string;
  title: string;
  url: string;
  description?: string;
  isActive: boolean;
  clickCount: number;
  scheduledDate?: string;
  scheduledTime?: string;
  createdAt: string;
}

export default function MeetingLinksSection() {
  const [meetingLinks, setMeetingLinks] = useState<MeetingLink[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMeetingLinks();
  }, []);

  const fetchMeetingLinks = async () => {
    try {
      const response = await fetch('/api/meeting-links');
      const data = await response.json();

      if (response.ok) {
        setMeetingLinks(data.meetingLinks || []);
      } else {
        console.error('Failed to fetch meeting links:', data.error || 'Unknown error');
      }
    } catch (error) {
      console.error('Failed to fetch meeting links:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="mb-10">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Meeting Links</h2>
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  if (meetingLinks.length === 0) {
    return null;
  }

  return (
    <div className="mb-10">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Meeting Links</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {meetingLinks.map((link) => (
          <MeetingLinkCard key={link._id} meetingLink={link} />
        ))}
      </div>
    </div>
  );
}
