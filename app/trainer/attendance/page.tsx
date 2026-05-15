'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import PageBackLink from '@/components/PageBackLink';

export default function MarkAttendancePage() {
  const router = useRouter();
  const [classLabel, setClassLabel] = useState('');
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [location, setLocation] = useState<{ lat: number; lng: number; accuracy?: number } | null>(null);
  const [locationError, setLocationError] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const capturePhoto = () => fileInputRef.current?.click();

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhoto(file);
      const reader = new FileReader();
      reader.onloadend = () => setPhotoPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const getLocation = () => {
    if (!navigator.geolocation) { setLocationError('Geolocation not supported'); return; }
    navigator.geolocation.getCurrentPosition(
      (pos) => { setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude, accuracy: pos.coords.accuracy }); setLocationError(''); },
      () => setLocationError('Location access denied or unavailable'),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!photo) { setError('Please take a photo of the class'); return; }
    if (!classLabel) { setError('Please enter class label'); return; }
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('photo', photo);
      formData.append('classLabel', classLabel);
      if (location) {
        formData.append('lat', location.lat.toString());
        formData.append('lng', location.lng.toString());
        if (location.accuracy) formData.append('accuracy', location.accuracy.toString());
      }
      const response = await fetch('/api/attendance', { method: 'POST', body: formData });
      const contentType = response.headers.get('content-type');
      let data: any;
      if (contentType?.includes('application/json')) {
        data = await response.json();
      } else {
        const text = await response.text();
        try { data = JSON.parse(text); } catch { throw new Error(`Server error (${response.status}): ${text.substring(0, 200)}`); }
      }
      if (!response.ok) throw new Error(data.error || `Failed to mark attendance (${response.status})`);
      router.push('/trainer/dashboard?success=Attendance marked successfully');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-lg">
      <PageBackLink href="/trainer/dashboard" />
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-[#0F172A]">Mark Attendance</h1>
        <p className="text-[#6B7280] mt-1">Upload a class photo with your location to log attendance.</p>
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
          <label className="block text-sm font-semibold text-[#0F172A] mb-2">Class Label <span className="text-red-500">*</span></label>
          <input
            type="text"
            required
            value={classLabel}
            onChange={(e) => setClassLabel(e.target.value)}
            placeholder="e.g., Grade 6-A, Robotics Class 1"
            className="w-full rounded-2xl border border-[#E5E7EB] bg-white px-4 py-2.5 text-sm text-[#0F172A] placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-emerald-400"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-[#0F172A] mb-2">Class Photo <span className="text-red-500">*</span></label>
          <input ref={fileInputRef} type="file" accept="image/*" capture="environment" onChange={handlePhotoChange} className="hidden" />
          <button
            type="button"
            onClick={capturePhoto}
            className="w-full rounded-2xl bg-gradient-to-r from-emerald-500 to-emerald-600 py-3 text-sm font-semibold text-white shadow-md shadow-emerald-500/20 hover:opacity-90 transition-opacity"
          >
            📸 Take Photo
          </button>
          {photoPreview && (
            <div className="mt-4">
              <img src={photoPreview} alt="Preview" className="w-full rounded-2xl border border-[#E5E7EB]" />
              <p className="text-xs text-[#6B7280] mt-1.5 text-center">{photo?.name}</p>
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-semibold text-[#0F172A] mb-2">Location (Optional)</label>
          <button
            type="button"
            onClick={getLocation}
            className="w-full rounded-2xl border border-[#E5E7EB] bg-[#F4F7F5] py-3 text-sm font-semibold text-[#374151] hover:bg-[#EBF0EC] transition-colors"
          >
            📍 Get Location
          </button>
          {location && (
            <div className="mt-3 p-3 rounded-2xl border border-emerald-200 bg-emerald-50 text-sm text-emerald-800 space-y-0.5">
              <p><span className="font-semibold">Lat:</span> {location.lat.toFixed(6)}</p>
              <p><span className="font-semibold">Lng:</span> {location.lng.toFixed(6)}</p>
              {location.accuracy && <p><span className="font-semibold">Accuracy:</span> ±{location.accuracy.toFixed(0)} m</p>}
            </div>
          )}
          {locationError && <p className="mt-2 text-xs text-amber-600">{locationError}</p>}
        </div>

        <button
          type="submit"
          disabled={loading || !photo || !classLabel}
          className="w-full rounded-2xl bg-gradient-to-r from-emerald-500 to-emerald-600 py-3 text-sm font-semibold text-white shadow-md shadow-emerald-500/20 hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Submitting…' : 'Mark Attendance'}
        </button>
      </motion.form>
    </div>
  );
}
