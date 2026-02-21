'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import DashboardHeader from '@/components/DashboardHeader';

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

  const capturePhoto = () => {
    fileInputRef.current?.click();
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhoto(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const getLocation = () => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy,
        });
        setLocationError('');
      },
      (err) => {
        setLocationError('Location access denied or unavailable');
        console.error('Geolocation error:', err);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!photo) {
      setError('Please take a photo of the class');
      return;
    }

    if (!classLabel) {
      setError('Please enter class label');
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('photo', photo);
      formData.append('classLabel', classLabel);
      if (location) {
        formData.append('lat', location.lat.toString());
        formData.append('lng', location.lng.toString());
        if (location.accuracy) {
          formData.append('accuracy', location.accuracy.toString());
        }
      }

      const response = await fetch('/api/attendance', {
        method: 'POST',
        body: formData,
      });

      // Check if response is JSON
      const contentType = response.headers.get('content-type');
      let data;
      
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        // If not JSON, get text and try to parse
        const text = await response.text();
        try {
          data = JSON.parse(text);
        } catch {
          throw new Error(`Server error (${response.status}): ${text.substring(0, 200)}`);
        }
      }

      if (!response.ok) {
        throw new Error(data.error || `Failed to mark attendance (${response.status})`);
      }

      router.push('/trainer/dashboard?success=Attendance marked successfully');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900">
      <DashboardHeader showBackButton backHref="/trainer/dashboard" role="TRAINER_SCHOOL" />
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          Mark Attendance
        </h1>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-md space-y-6 border border-gray-100">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Class Label *
            </label>
            <input
              type="text"
              required
              value={classLabel}
              onChange={(e) => setClassLabel(e.target.value)}
              placeholder="e.g., Grade 6-A, Robotics Class 1"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-gray-900 bg-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Class Photo *
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
              className="w-full px-4 py-3 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors font-semibold"
            >
              📸 Take Photo
            </button>
            {photoPreview && (
              <div className="mt-4">
                <img
                  src={photoPreview}
                  alt="Preview"
                  className="w-full max-w-md mx-auto rounded-lg border border-gray-300"
                />
                <p className="text-sm text-gray-600 mt-2 text-center">
                  Photo captured: {photo?.name}
                </p>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Location (Optional)
            </label>
            <button
              type="button"
              onClick={getLocation}
              className="w-full px-4 py-3 bg-gray-100 text-gray-900 rounded-lg hover:bg-gray-200 transition-colors font-semibold border border-gray-200"
            >
              📍 Get Location
            </button>
            {location && (
              <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-green-700">
                  <strong>Latitude:</strong> {location.lat.toFixed(6)}
                </p>
                <p className="text-sm text-green-700">
                  <strong>Longitude:</strong> {location.lng.toFixed(6)}
                </p>
                {location.accuracy && (
                  <p className="text-sm text-green-700">
                    <strong>Accuracy:</strong> {location.accuracy.toFixed(2)} meters
                  </p>
                )}
              </div>
            )}
            {locationError && (
              <p className="mt-2 text-sm text-yellow-600">{locationError}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading || !photo || !classLabel}
            className="w-full bg-emerald-500 text-white py-3 rounded-lg font-semibold hover:bg-emerald-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Submitting...' : 'Mark Attendance'}
          </button>
        </form>
      </div>
    </div>
  );
}
