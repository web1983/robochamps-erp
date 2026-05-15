'use client';

import { useState, useEffect } from 'react';
import { format, startOfDay, parseISO, isValid, isBefore } from 'date-fns';
import { useSession } from 'next-auth/react';
import { motion } from 'framer-motion';

interface MeetingLink {
  _id: string;
  title: string;
  url: string;
  description?: string;
  pptDriveLink?: string;
  isActive: boolean;
  clickCount: number;
  scheduledDate?: string;
  scheduledTime?: string;
  createdAt: string;
}

interface MeetingLinkClick {
  _id: string;
  meetingLinkId: string;
  userName: string;
  userEmail: string;
  schoolName?: string;
  clickedAt: string;
}

export default function MeetingLinksPage() {
  const { data: session, status: sessionStatus } = useSession();
  const isAdmin = (session?.user as any)?.role === 'ADMIN';

  const [meetingLinks, setMeetingLinks] = useState<MeetingLink[]>([]);
  const [recentClicks, setRecentClicks] = useState<MeetingLinkClick[]>([]);
  const [filteredClicks, setFilteredClicks] = useState<MeetingLinkClick[]>([]);
  const [totalClicks, setTotalClicks] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingLink, setEditingLink] = useState<MeetingLink | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    url: '',
    description: '',
    pptDriveLink: '',
    isActive: true,
    scheduledDate: '',
    scheduledTime: '',
  });
  const [schools, setSchools] = useState<{ _id: string; name: string }[]>([]);
  const [filters, setFilters] = useState({
    schoolId: '',
    email: '',
    startDate: '',
    endDate: '',
    meetingLinkId: '',
  });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchTeacherLinks = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/meeting-links');
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to load meetings');
      setMeetingLinks(data.meetingLinks || []);
      setRecentClicks([]);
      setFilteredClicks([]);
      setTotalClicks(0);
      setError('');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (sessionStatus === 'loading') return;
    if (!isAdmin) {
      void fetchTeacherLinks();
      return;
    }
    fetchSchools();
    fetchStats();
  }, [sessionStatus, isAdmin]);

  useEffect(() => {
    if (sessionStatus === 'loading' || !isAdmin) return;
    if (filters.schoolId || filters.email || filters.startDate || filters.endDate || filters.meetingLinkId) {
      fetchFilteredStats();
    } else {
      fetchStats();
    }
  }, [filters, sessionStatus, isAdmin]);

  const fetchSchools = async () => {
    try {
      const response = await fetch('/api/schools');
      const data = await response.json();
      if (response.ok) {
        setSchools(data.schools || []);
      }
    } catch (err) {
      console.error('Failed to fetch schools:', err);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/meeting-links/stats');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch stats');
      }

      setMeetingLinks(data.meetingLinks || []);
      setRecentClicks(data.recentClicks || []);
      setFilteredClicks(data.recentClicks || []);
      setTotalClicks(data.totalClicks || 0);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchFilteredStats = async () => {
    try {
      const params = new URLSearchParams();
      if (filters.schoolId) params.append('schoolId', filters.schoolId);
      if (filters.email) params.append('email', filters.email);
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);
      if (filters.meetingLinkId) params.append('meetingLinkId', filters.meetingLinkId);

      const response = await fetch(`/api/meeting-links/stats?${params.toString()}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch stats');
      }

      setMeetingLinks(data.meetingLinks || []);
      setRecentClicks(data.recentClicks || []);
      setFilteredClicks(data.filteredClicks || []);
      setTotalClicks(data.totalClicks || 0);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      const url = editingLink ? `/api/meeting-links/${editingLink._id}` : '/api/meeting-links';
      const method = editingLink ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `Failed to ${editingLink ? 'update' : 'create'} meeting link`);
      }

      setFormData({ title: '', url: '', description: '', pptDriveLink: '', isActive: true, scheduledDate: '', scheduledTime: '' });
      setShowAddForm(false);
      setEditingLink(null);
      fetchStats();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditLink = (link: MeetingLink) => {
    setEditingLink(link);
    setFormData({
      title: link.title,
      url: link.url,
      description: link.description || '',
      pptDriveLink: link.pptDriveLink || '',
      isActive: link.isActive,
      scheduledDate: link.scheduledDate ? link.scheduledDate.split('T')[0] : '',
      scheduledTime: link.scheduledTime || '',
    });
    setShowAddForm(false);
    setError('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelEditLink = () => {
    setEditingLink(null);
    setFormData({ title: '', url: '', description: '', pptDriveLink: '', isActive: true, scheduledDate: '', scheduledTime: '' });
    setError('');
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this meeting link?')) {
      return;
    }

    try {
      const response = await fetch(`/api/meeting-links/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete meeting link');
      }

      fetchStats();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const toggleActive = async (id: string, currentActive: boolean) => {
    try {
      const response = await fetch(`/api/meeting-links/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !currentActive }),
      });

      if (!response.ok) {
        throw new Error('Failed to update meeting link');
      }

      fetchStats();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const downloadCSV = () => {
    const clicksToDownload = filteredClicks.length > 0 ? filteredClicks : recentClicks;
    
    // Get meeting link titles and PPT drive links
    const linkMap = new Map(meetingLinks.map(link => [link._id, link.title]));
    const pptDriveLinkMap = new Map(meetingLinks.map(link => [link._id, link.pptDriveLink || 'N/A']));
    
    // CSV header
    const headers = ['Name', 'Email', 'School Name', 'Meeting Link', 'PPT Drive Link', 'Clicked At'];
    const rows = clicksToDownload.map(click => [
      click.userName,
      click.userEmail,
      click.schoolName || 'N/A',
      linkMap.get(click.meetingLinkId) || 'Unknown',
      pptDriveLinkMap.get(click.meetingLinkId) || 'N/A',
      format(new Date(click.clickedAt), 'yyyy-MM-dd HH:mm:ss'),
    ]);

    // Create CSV content
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    // Create blob and download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `meeting-link-clicks-${format(new Date(), 'yyyy-MM-dd')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const clearFilters = () => {
    setFilters({
      schoolId: '',
      email: '',
      startDate: '',
      endDate: '',
      meetingLinkId: '',
    });
  };

  if (sessionStatus === 'loading' || loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-10 w-64 rounded-xl bg-white border border-[#E5E7EB]" />
        <div className="h-48 rounded-3xl bg-white border border-[#E5E7EB]" />
      </div>
    );
  }

  if (!isAdmin) {
    const meetingTarget = (link: MeetingLink) => {
      if (!link.scheduledDate) return null as Date | null;
      try {
        const t = link.scheduledTime ? `${link.scheduledDate}T${link.scheduledTime}` : link.scheduledDate;
        const d = parseISO(t);
        return isValid(d) ? d : null;
      } catch {
        return null;
      }
    };

    const trackJoin = async (meetingLinkId: string) => {
      try {
        await fetch('/api/meeting-links/click', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ meetingLinkId }),
        });
      } catch {
        /* ignore */
      }
    };

    const now = new Date();
    const visible = meetingLinks
      .filter((m) => m.isActive)
      .filter((m) => {
        const t = meetingTarget(m);
        if (!t) return true;
        return !isBefore(startOfDay(t), startOfDay(now));
      })
      .sort((a, b) => (meetingTarget(a)?.getTime() ?? Infinity) - (meetingTarget(b)?.getTime() ?? Infinity));

    return (
      <div className="space-y-6">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[#0F172A]">Meeting links</h1>
            <p className="text-[#6B7280] mt-1">Join sessions and open shared decks.</p>
          </div>
        </motion.div>

        {error && (
          <div className="p-4 rounded-2xl border border-red-200 bg-red-50 text-red-800 text-sm">{error}</div>
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
                  className="rounded-3xl border border-[#E5E7EB] bg-white/95 backdrop-blur-md p-6 shadow-sm hover:shadow-lg hover:shadow-emerald-500/10 transition-shadow"
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
                  <p className="text-sm text-[#6B7280] mb-2 line-clamp-3">{link.description || 'Live training session'}</p>
                  {target && <p className="text-sm text-[#0F172A] font-medium mb-4">{format(target, 'PPp')}</p>}
                  <div className="flex flex-wrap gap-2">
                    <a
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => void trackJoin(link._id)}
                      className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-emerald-500/25 hover:opacity-90 transition-opacity"
                    >
                      Join meeting
                    </a>
                    {link.pptDriveLink ? (
                      <a
                        href={link.pptDriveLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center rounded-xl border border-[#E5E7EB] bg-white px-4 py-2.5 text-sm font-semibold text-[#0F172A] hover:border-emerald-300 transition-colors"
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

  return (
    <div className="font-sans text-gray-900">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Meeting Links</h1>
          <button
            onClick={() => {
              if (editingLink) {
                cancelEditLink();
              } else {
                setShowAddForm(!showAddForm);
              }
            }}
            className="bg-emerald-500 text-white px-6 py-2 rounded-lg hover:bg-emerald-600 transition-colors font-semibold"
          >
            {showAddForm || editingLink ? 'Cancel' : '+ Add Meeting Link'}
          </button>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        {(showAddForm || editingLink) && (
          <div className="bg-white p-6 rounded-lg shadow-md mb-6 border border-gray-100">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              {editingLink ? 'Edit Meeting Link' : 'Add New Meeting Link'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Title *
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-gray-900 bg-white"
                  placeholder="e.g., Weekly Training Meeting"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Meeting URL *
                </label>
                <input
                  type="url"
                  required
                  value={formData.url}
                  onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-gray-900 bg-white"
                  placeholder="https://meet.google.com/..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-gray-900 bg-white"
                  rows={2}
                  placeholder="Optional description"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  PPT Drive Link
                </label>
                <input
                  type="url"
                  value={formData.pptDriveLink}
                  onChange={(e) => setFormData({ ...formData, pptDriveLink: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-gray-900 bg-white"
                  placeholder="https://drive.google.com/..."
                />
                <p className="mt-1 text-xs text-gray-500">Optional: Google Drive link to the meeting PPT/presentation</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Scheduled Date
                  </label>
                  <input
                    type="date"
                    value={formData.scheduledDate}
                    onChange={(e) => setFormData({ ...formData, scheduledDate: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-gray-900 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Scheduled Time
                  </label>
                  <input
                    type="time"
                    value={formData.scheduledTime}
                    onChange={(e) => setFormData({ ...formData, scheduledTime: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-gray-900 bg-white"
                  />
                </div>
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="mr-2"
                />
                <label htmlFor="isActive" className="text-sm text-gray-700">
                  Active (visible to users)
                </label>
              </div>
              <button
                type="submit"
                disabled={submitting}
                className="bg-emerald-500 text-white px-6 py-2 rounded-lg hover:bg-emerald-600 transition-colors font-semibold disabled:opacity-50"
              >
                {submitting
                  ? (editingLink ? 'Updating...' : 'Creating...')
                  : (editingLink ? 'Update Link' : 'Create Link')}
              </button>
            </form>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-md border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Total Links</h3>
            <p className="text-3xl font-bold text-emerald-600">{meetingLinks.length}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Active Links</h3>
            <p className="text-3xl font-bold text-emerald-600">
              {meetingLinks.filter(link => link.isActive).length}
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Total Clicks</h3>
            <p className="text-3xl font-bold text-emerald-600">{totalClicks}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md mb-6 border border-gray-100">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Meeting Links</h2>
          {meetingLinks.length === 0 ? (
            <p className="text-gray-600">No meeting links created yet.</p>
          ) : (
            <div className="space-y-4">
              {meetingLinks.map((link) => (
                <div key={link._id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">{link.title}</h3>
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${
                          link.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {link.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{link.url}</p>
                      {link.description && (
                        <p className="text-sm text-gray-700 mb-2">{link.description}</p>
                      )}
                      {link.pptDriveLink && (
                        <p className="text-sm text-gray-700 mb-2">
                          📄 <a href={link.pptDriveLink} target="_blank" rel="noopener noreferrer" className="text-emerald-600 hover:underline">PPT Drive Link</a>
                        </p>
                      )}
                      {link.scheduledDate && (() => {
                        const scheduledDateTime = link.scheduledTime 
                          ? new Date(`${link.scheduledDate}T${link.scheduledTime}`)
                          : new Date(link.scheduledDate);
                        const isPast = scheduledDateTime < new Date();
                        const isToday = scheduledDateTime.toDateString() === new Date().toDateString();
                        return (
                          <div className="mb-2">
                            <span className="text-sm font-semibold text-gray-700">📅 Scheduled: </span>
                            <span className="text-sm text-gray-600">
                              {format(scheduledDateTime, 'PP')}
                              {link.scheduledTime && ` at ${link.scheduledTime}`}
                            </span>
                            <span className={`ml-2 px-2 py-1 rounded text-xs font-semibold ${
                              isPast 
                                ? 'bg-gray-100 text-gray-800' 
                                : isToday
                                ? 'bg-green-100 text-green-800'
                                : 'bg-blue-100 text-blue-800'
                            }`}>
                              {isPast ? 'Past' : isToday ? 'Today' : 'Upcoming'}
                            </span>
                          </div>
                        );
                      })()}
                      <div className="flex items-center space-x-4 text-sm text-gray-600">
                        <span>👆 {link.clickCount} clicks</span>
                        <span>Created: {format(new Date(link.createdAt), 'PPp')}</span>
                      </div>
                    </div>
                    <div className="flex space-x-2 ml-4">
                      <button
                        onClick={() => handleEditLink(link)}
                        className="px-3 py-1 bg-blue-100 text-blue-800 rounded text-sm font-semibold hover:bg-blue-200"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => toggleActive(link._id, link.isActive)}
                        className={`px-3 py-1 rounded text-sm font-semibold ${
                          link.isActive
                            ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                            : 'bg-green-100 text-green-800 hover:bg-green-200'
                        }`}
                      >
                        {link.isActive ? 'Deactivate' : 'Activate'}
                      </button>
                      <button
                        onClick={() => handleDelete(link._id)}
                        className="px-3 py-1 bg-red-100 text-red-800 rounded text-sm font-semibold hover:bg-red-200"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Click Statistics</h2>
            <button
              onClick={downloadCSV}
              className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors font-semibold"
            >
              📥 Download CSV
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">School</label>
              <select
                value={filters.schoolId}
                onChange={(e) => setFilters({ ...filters, schoolId: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 text-sm"
              >
                <option value="">All Schools</option>
                {schools.map((school) => (
                  <option key={school._id} value={school._id}>
                    {school.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={filters.email}
                onChange={(e) => setFilters({ ...filters, email: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 text-sm"
                placeholder="Filter by email"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Meeting Link</label>
              <select
                value={filters.meetingLinkId}
                onChange={(e) => setFilters({ ...filters, meetingLinkId: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 text-sm"
              >
                <option value="">All Links</option>
                {meetingLinks.map(link => (
                  <option key={link._id} value={link._id}>{link.title}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="mb-4">
            <button
              onClick={clearFilters}
              className="text-sm text-blue-600 hover:underline"
            >
              Clear Filters
            </button>
          </div>

          {recentClicks.length === 0 ? (
            <p className="text-gray-600">No clicks recorded yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-2 px-4 text-sm font-semibold text-gray-900">Name</th>
                    <th className="text-left py-2 px-4 text-sm font-semibold text-gray-900">Email</th>
                    <th className="text-left py-2 px-4 text-sm font-semibold text-gray-900">School Name</th>
                    <th className="text-left py-2 px-4 text-sm font-semibold text-gray-900">Meeting Link</th>
                    <th className="text-left py-2 px-4 text-sm font-semibold text-gray-900">Clicked At</th>
                  </tr>
                </thead>
                <tbody>
                  {recentClicks.map((click) => {
                    const linkTitle = meetingLinks.find(l => l._id === click.meetingLinkId)?.title || 'Unknown';
                    return (
                      <tr key={click._id} className="border-b border-gray-100">
                        <td className="py-2 px-4 text-sm text-gray-900">{click.userName}</td>
                        <td className="py-2 px-4 text-sm text-gray-600">{click.userEmail}</td>
                        <td className="py-2 px-4 text-sm text-gray-600">{click.schoolName || 'N/A'}</td>
                        <td className="py-2 px-4 text-sm text-gray-600">{linkTitle}</td>
                        <td className="py-2 px-4 text-sm text-gray-600">
                          {format(new Date(click.clickedAt), 'PPp')}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
    </div>
  );
}
