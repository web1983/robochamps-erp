'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import { format } from 'date-fns';

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

interface MeetingLinkClick {
  _id: string;
  meetingLinkId: string;
  userName: string;
  userEmail: string;
  schoolName?: string;
  clickedAt: string;
}

export default function MeetingLinksPage() {
  const router = useRouter();
  const [meetingLinks, setMeetingLinks] = useState<MeetingLink[]>([]);
  const [recentClicks, setRecentClicks] = useState<MeetingLinkClick[]>([]);
  const [filteredClicks, setFilteredClicks] = useState<MeetingLinkClick[]>([]);
  const [totalClicks, setTotalClicks] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    url: '',
    description: '',
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

  useEffect(() => {
    fetchSchools();
    fetchStats();
  }, []);

  useEffect(() => {
    if (filters.schoolId || filters.email || filters.startDate || filters.endDate || filters.meetingLinkId) {
      fetchFilteredStats();
    } else {
      fetchStats();
    }
  }, [filters]);

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
      const response = await fetch('/api/meeting-links', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create meeting link');
      }

      setFormData({ title: '', url: '', description: '', isActive: true, scheduledDate: '', scheduledTime: '' });
      setShowAddForm(false);
      fetchStats();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
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
    
    // Get meeting link titles
    const linkMap = new Map(meetingLinks.map(link => [link._id, link.title]));
    
    // CSV header
    const headers = ['Name', 'Email', 'School Name', 'Meeting Link', 'Clicked At'];
    const rows = clicksToDownload.map(click => [
      click.userName,
      click.userEmail,
      click.schoolName || 'N/A',
      linkMap.get(click.meetingLinkId) || 'Unknown',
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

  if (loading) {
    return (
      <div className="min-h-screen ">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <p className="text-gray-900">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen ">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Meeting Links</h1>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors font-semibold"
          >
            {showAddForm ? 'Cancel' : '+ Add Meeting Link'}
          </button>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        {showAddForm && (
          <div className="bg-white p-6 rounded-lg shadow-md mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Add New Meeting Link</h2>
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
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
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
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
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
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                  rows={2}
                  placeholder="Optional description"
                />
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
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
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
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
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
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors font-semibold disabled:opacity-50"
              >
                {submitting ? 'Creating...' : 'Create Link'}
              </button>
            </form>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Total Links</h3>
            <p className="text-3xl font-bold text-blue-600">{meetingLinks.length}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Active Links</h3>
            <p className="text-3xl font-bold text-green-600">
              {meetingLinks.filter(link => link.isActive).length}
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Total Clicks</h3>
            <p className="text-3xl font-bold text-purple-600">{totalClicks}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md mb-6">
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
    </div>
  );
}
