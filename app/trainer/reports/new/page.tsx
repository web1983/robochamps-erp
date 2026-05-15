'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import PageBackLink from '@/components/PageBackLink';

export default function NewReportPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    classLabel: '',
    topics: '',
    summary: '',
    notes: '',
    datetime: new Date().toISOString().slice(0, 16),
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const response = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'TRAINER_CLASS',
          classLabel: formData.classLabel,
          topics: formData.topics,
          summary: formData.summary,
          notes: formData.notes || undefined,
          datetime: formData.datetime,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to create report');
      router.push('/trainer/reports?success=Report created successfully');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const field = 'w-full rounded-2xl border border-[#E5E7EB] bg-white px-4 py-2.5 text-sm text-[#0F172A] placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-emerald-400';

  return (
    <div className="space-y-6 max-w-2xl">
      <PageBackLink href="/trainer/reports" />
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-[#0F172A]">Create Class Report</h1>
        <p className="text-[#6B7280] mt-1">Log topics, summary, and notes for today's session.</p>
      </motion.div>

      {error && <div className="p-4 rounded-2xl border border-red-200 bg-red-50 text-red-800 text-sm">{error}</div>}

      <motion.form
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        onSubmit={handleSubmit}
        className="rounded-3xl border border-[#E5E7EB] bg-white/90 backdrop-blur-md p-6 shadow-sm space-y-5"
      >
        <div>
          <label className="block text-sm font-semibold text-[#0F172A] mb-2">Class Label</label>
          <input type="text" value={formData.classLabel} onChange={(e) => setFormData({ ...formData, classLabel: e.target.value })} placeholder="e.g., Grade 6-A" className={field} />
        </div>

        <div>
          <label className="block text-sm font-semibold text-[#0F172A] mb-2">Date &amp; Time <span className="text-red-500">*</span></label>
          <input type="datetime-local" required value={formData.datetime} onChange={(e) => setFormData({ ...formData, datetime: e.target.value })} className={field} />
        </div>

        <div>
          <label className="block text-sm font-semibold text-[#0F172A] mb-2">Topics Taught <span className="text-red-500">*</span></label>
          <textarea required value={formData.topics} onChange={(e) => setFormData({ ...formData, topics: e.target.value })} placeholder="What topics did you teach today?" rows={4} className={field} />
        </div>

        <div>
          <label className="block text-sm font-semibold text-[#0F172A] mb-2">Summary <span className="text-red-500">*</span></label>
          <textarea required value={formData.summary} onChange={(e) => setFormData({ ...formData, summary: e.target.value })} placeholder="Brief summary of the class" rows={4} className={field} />
        </div>

        <div>
          <label className="block text-sm font-semibold text-[#0F172A] mb-2">Additional Notes</label>
          <textarea value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} placeholder="Any additional notes or remarks" rows={3} className={field} />
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 rounded-2xl bg-gradient-to-r from-emerald-500 to-emerald-600 py-3 text-sm font-semibold text-white shadow-md shadow-emerald-500/20 hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Creating…' : 'Create Report'}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="flex-1 rounded-2xl border border-[#E5E7EB] bg-white py-3 text-sm font-semibold text-[#374151] hover:bg-[#F4F7F5] transition-colors"
          >
            Cancel
          </button>
        </div>
      </motion.form>
    </div>
  );
}
