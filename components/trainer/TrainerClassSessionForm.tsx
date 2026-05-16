'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { captureTrainerLocation } from '@/lib/geolocation';
import { compressImageForUpload } from '@/lib/compressImage';

const fieldClass =
  'w-full rounded-2xl border border-[#E5E7EB] bg-white px-4 py-2.5 text-sm text-[#0F172A] placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-emerald-400 [color-scheme:light]';

type TrainerClassSessionFormProps = {
  backHref?: string;
};

export default function TrainerClassSessionForm({ backHref = '/trainer/dashboard' }: TrainerClassSessionFormProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const previewUrlRef = useRef<string | null>(null);

  const [classLabel, setClassLabel] = useState('');
  const [datetime, setDatetime] = useState(() => new Date().toISOString().slice(0, 16));
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoProcessing, setPhotoProcessing] = useState(false);
  const [location, setLocation] = useState<{ lat: number; lng: number; accuracy?: number } | null>(null);
  const [locationError, setLocationError] = useState('');
  const [locationLoading, setLocationLoading] = useState(false);
  const [topics, setTopics] = useState('');
  const [summary, setSummary] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const revokePreviewUrl = useCallback(() => {
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = null;
    }
  }, []);

  useEffect(() => () => revokePreviewUrl(), [revokePreviewUrl]);

  const capturePhoto = () => {
    if (!photoProcessing) fileInputRef.current?.click();
  };

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    setError('');
    setPhotoProcessing(true);
    revokePreviewUrl();
    setPhoto(null);
    setPhotoPreview(null);

    try {
      const compressed = await compressImageForUpload(file);
      const previewUrl = URL.createObjectURL(compressed);
      previewUrlRef.current = previewUrl;
      setPhoto(compressed);
      setPhotoPreview(previewUrl);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Could not process the photo. Try again.');
    } finally {
      setPhotoProcessing(false);
    }
  };

  const getLocation = async () => {
    setLocationError('');
    setLocationLoading(true);
    try {
      const coords = await captureTrainerLocation();
      setLocation(coords);
    } catch (err: unknown) {
      setLocation(null);
      setLocationError(err instanceof Error ? err.message : 'Could not get location');
    } finally {
      setLocationLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const label = classLabel.trim();
    if (!label) {
      setError('Please enter a class label');
      return;
    }
    if (!photo) {
      setError('Please take a photo of the class');
      return;
    }
    if (!topics.trim()) {
      setError('Please enter topics taught');
      return;
    }
    if (!summary.trim()) {
      setError('Please enter a class summary');
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('photo', photo);
      formData.append('classLabel', label);
      formData.append('datetime', datetime);
      if (location) {
        formData.append('lat', location.lat.toString());
        formData.append('lng', location.lng.toString());
        if (location.accuracy) formData.append('accuracy', location.accuracy.toString());
      }

      const attendanceRes = await fetch('/api/attendance', { method: 'POST', body: formData });
      const attendanceContentType = attendanceRes.headers.get('content-type');
      let attendanceData: { error?: string } = {};
      if (attendanceContentType?.includes('application/json')) {
        attendanceData = await attendanceRes.json();
      } else {
        const text = await attendanceRes.text();
        try {
          attendanceData = JSON.parse(text);
        } catch {
          throw new Error(`Server error (${attendanceRes.status}): ${text.substring(0, 200)}`);
        }
      }
      if (!attendanceRes.ok) {
        throw new Error(attendanceData.error || `Failed to mark attendance (${attendanceRes.status})`);
      }

      const reportRes = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'TRAINER_CLASS',
          classLabel: label,
          topics: topics.trim(),
          summary: summary.trim(),
          notes: notes.trim() || undefined,
          datetime,
        }),
      });
      const reportData = await reportRes.json();
      if (!reportRes.ok) {
        throw new Error(
          reportData.error ||
            'Attendance was saved, but the class report could not be submitted. Please try again from Session History or contact support.'
        );
      }

      router.push(
        `${backHref}?success=${encodeURIComponent('Class logged successfully — attendance and report saved.')}`
      );
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to submit class session');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {error && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-2xl border border-red-200 bg-red-50 text-red-800 text-sm"
        >
          {error}
        </motion.div>
      )}

      <motion.form
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        onSubmit={handleSubmit}
        className="rounded-3xl border border-[#E5E7EB] bg-white/90 backdrop-blur-md p-6 shadow-sm space-y-8"
      >
        {/* Class details */}
        <section className="space-y-4">
          <motion.div>
            <h2 className="text-sm font-bold text-[#0F172A] uppercase tracking-wide">Class details</h2>
            <p className="text-xs text-[#6B7280] mt-0.5">When and which class you taught</p>
          </motion.div>
          <div>
            <label className="block text-sm font-semibold text-[#0F172A] mb-2">
              Class label <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={classLabel}
              onChange={(e) => setClassLabel(e.target.value)}
              placeholder="e.g., Grade 6-A, Robotics Class 1"
              className={fieldClass}
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-[#0F172A] mb-2">
              Date &amp; time <span className="text-red-500">*</span>
            </label>
            <input
              type="datetime-local"
              required
              value={datetime}
              onChange={(e) => setDatetime(e.target.value)}
              className={fieldClass}
            />
          </div>
        </section>

        <hr className="border-[#E5E7EB]" />

        {/* Attendance */}
        <section className="space-y-4">
          <motion.div>
            <h2 className="text-sm font-bold text-[#0F172A] uppercase tracking-wide">Attendance proof</h2>
            <p className="text-xs text-[#6B7280] mt-0.5">Photo and optional location for this session</p>
          </motion.div>
          <div>
            <label className="block text-sm font-semibold text-[#0F172A] mb-2">
              Class photo <span className="text-red-500">*</span>
            </label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handlePhotoChange}
              className="hidden"
            />
            <button
              type="button"
              onClick={capturePhoto}
              disabled={photoProcessing}
              className="w-full rounded-2xl bg-gradient-to-r from-emerald-500 to-emerald-600 py-3 text-sm font-semibold text-white shadow-md shadow-emerald-500/20 hover:opacity-90 transition-opacity disabled:opacity-60 disabled:cursor-wait"
            >
              {photoProcessing ? 'Processing photo…' : photo ? 'Retake photo' : 'Take photo'}
            </button>
            <p className="text-xs text-[#6B7280] mt-2">
              Photos are resized on your device before upload to avoid memory issues on mobile.
            </p>
            {photoPreview && (
              <motion.div className="mt-4">
                <img
                  src={photoPreview}
                  alt="Class preview"
                  decoding="async"
                  className="w-full max-h-64 object-cover rounded-2xl border border-[#E5E7EB]"
                />
                <p className="text-xs text-[#6B7280] mt-1.5 text-center">
                  {photo?.name}
                  {photo ? ` · ${(photo.size / 1024).toFixed(0)} KB` : ''}
                </p>
              </motion.div>
            )}
          </div>
          <div>
            <label className="block text-sm font-semibold text-[#0F172A] mb-2">Location (optional)</label>
            <button
              type="button"
              onClick={() => void getLocation()}
              disabled={locationLoading}
              className="w-full rounded-2xl border border-[#E5E7EB] bg-[#F4F7F5] py-3 text-sm font-semibold text-[#374151] hover:bg-[#EBF0EC] transition-colors disabled:opacity-60 disabled:cursor-wait"
            >
              {locationLoading ? 'Getting location…' : 'Get location'}
            </button>
            <p className="text-xs text-[#6B7280] mt-2">
              Allow location when prompted. Requires HTTPS and GPS/location enabled on your device.
            </p>
            {location && (
              <div className="mt-3 p-3 rounded-2xl border border-emerald-200 bg-emerald-50 text-sm text-emerald-800 space-y-0.5">
                <p>
                  <span className="font-semibold">Lat:</span> {location.lat.toFixed(6)}
                </p>
                <p>
                  <span className="font-semibold">Lng:</span> {location.lng.toFixed(6)}
                </p>
                {location.accuracy != null && (
                  <p>
                    <span className="font-semibold">Accuracy:</span> ±{location.accuracy.toFixed(0)} m
                  </p>
                )}
              </div>
            )}
            {locationError && <p className="mt-2 text-xs text-amber-600">{locationError}</p>}
          </div>
        </section>

        <hr className="border-[#E5E7EB]" />

        {/* Report */}
        <section className="space-y-4">
          <motion.div>
            <h2 className="text-sm font-bold text-[#0F172A] uppercase tracking-wide">Class report</h2>
            <p className="text-xs text-[#6B7280] mt-0.5">What you taught and how the session went</p>
          </motion.div>
          <div>
            <label className="block text-sm font-semibold text-[#0F172A] mb-2">
              Topics taught <span className="text-red-500">*</span>
            </label>
            <textarea
              required
              value={topics}
              onChange={(e) => setTopics(e.target.value)}
              placeholder="What topics did you cover in this class?"
              rows={4}
              className={fieldClass}
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-[#0F172A] mb-2">
              Summary <span className="text-red-500">*</span>
            </label>
            <textarea
              required
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="Brief summary of the session"
              rows={4}
              className={fieldClass}
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-[#0F172A] mb-2">Additional notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Homework, challenges, student participation, etc. (optional)"
              rows={3}
              className={fieldClass}
            />
          </div>
        </section>

        <button
          type="submit"
          disabled={
            loading || photoProcessing || !photo || !classLabel.trim() || !topics.trim() || !summary.trim()
          }
          className="w-full rounded-2xl bg-gradient-to-r from-emerald-500 to-emerald-600 py-3.5 text-sm font-semibold text-white shadow-md shadow-emerald-500/20 hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Saving class session…' : 'Submit attendance & report'}
        </button>
      </motion.form>
    </>
  );
}
