// src/app/dashboard/settings/_components/booking-page-settings.tsx
'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import {
  FileText,
  Image as ImageIcon,
  Upload,
  X,
  Check,
  Plus,
  Instagram,
  Facebook,
  Globe,
  ExternalLink,
  Loader2,
} from 'lucide-react';

interface BookingPageSettingsProps {
  slug: string;
}

export function BookingPageSettings({ slug }: BookingPageSettingsProps) {
  const [bio, setBio] = useState('');
  const [coverImage, setCoverImage] = useState('');
  const [gallery, setGallery] = useState<string[]>([]);
  const [socialInstagram, setSocialInstagram] = useState('');
  const [socialFacebook, setSocialFacebook] = useState('');
  const [socialTiktok, setSocialTiktok] = useState('');
  const [socialTwitter, setSocialTwitter] = useState('');
  const [socialWebsite, setSocialWebsite] = useState('');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const galleryInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  // Load existing data
  useEffect(() => {
    fetch('/api/dashboard/settings/booking-page')
      .then((r) => r.json())
      .then((data) => {
        setBio(data.bio || '');
        setCoverImage(data.coverImage || '');
        setGallery(data.galleryImages ? JSON.parse(data.galleryImages) : []);
        setSocialInstagram(data.socialInstagram || '');
        setSocialFacebook(data.socialFacebook || '');
        setSocialTiktok(data.socialTiktok || '');
        setSocialTwitter(data.socialTwitter || '');
        setSocialWebsite(data.socialWebsite || '');
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleCoverUpload = useCallback(async (file: File) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setError('Invalid file type. Use JPG, PNG, or WebP.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('File too large. Max 5MB.');
      return;
    }

    setUploadingCover(true);
    setError('');
    try {
      const formData = new FormData();
      formData.append('logo', file);
      const res = await fetch('/api/dashboard/settings/logo', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Upload failed');
        return;
      }
      setCoverImage(data.url);
    } catch {
      setError('Upload failed');
    } finally {
      setUploadingCover(false);
    }
  }, []);

  const handleGalleryUpload = useCallback(async (file: File) => {
    if (gallery.length >= 6) {
      setError('Gallery limit reached (6 images max)');
      return;
    }

    setUploading(true);
    setError('');
    try {
      const formData = new FormData();
      formData.append('image', file);
      const res = await fetch('/api/dashboard/settings/gallery', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Upload failed');
        return;
      }
      setGallery(data.gallery);
    } catch {
      setError('Upload failed');
    } finally {
      setUploading(false);
    }
  }, [gallery.length]);

  const handleGalleryDelete = async (url: string) => {
    try {
      const res = await fetch('/api/dashboard/settings/gallery', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });
      const data = await res.json();
      if (res.ok) {
        setGallery(data.gallery);
      }
    } catch {
      setError('Failed to remove image');
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    setSuccess(false);

    try {
      const res = await fetch('/api/dashboard/settings/booking-page', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bio: bio || null,
          coverImage: coverImage || null,
          galleryImages: gallery.length > 0 ? JSON.stringify(gallery) : null,
          socialInstagram: socialInstagram || null,
          socialFacebook: socialFacebook || null,
          socialTiktok: socialTiktok || null,
          socialTwitter: socialTwitter || null,
          socialWebsite: socialWebsite || null,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Failed to save');
        return;
      }

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch {
      setError('Something went wrong');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-slate-200/60 p-12 flex items-center justify-center">
        <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200/60 overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-slate-400" />
          <h3 className="font-semibold text-slate-900">Booking Page</h3>
        </div>
        <a
          href={`/book/${slug}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-blue-500 hover:text-blue-600 font-medium flex items-center gap-1"
        >
          Preview <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>

      <div className="p-6 space-y-6">
        {/* Bio */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            About / Bio
          </label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Tell clients about yourself, your experience, and what makes your services special..."
            rows={4}
            maxLength={1000}
            className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none"
          />
          <p className="text-xs text-slate-400 mt-1 text-right">{bio.length}/1000</p>
        </div>

        {/* Cover Image */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Cover Image
          </label>
          {coverImage ? (
            <div className="relative group rounded-xl overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={coverImage}
                alt="Cover"
                className="w-full h-40 object-cover"
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                <button
                  onClick={() => coverInputRef.current?.click()}
                  disabled={uploadingCover}
                  className="px-3 py-1.5 bg-white text-slate-900 text-xs font-medium rounded-lg hover:bg-slate-100"
                >
                  Replace
                </button>
                <button
                  onClick={() => setCoverImage('')}
                  className="px-3 py-1.5 bg-red-500 text-white text-xs font-medium rounded-lg hover:bg-red-600"
                >
                  Remove
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => coverInputRef.current?.click()}
              disabled={uploadingCover}
              className="w-full h-32 border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center gap-2 hover:border-slate-300 hover:bg-slate-50 transition-colors"
            >
              {uploadingCover ? (
                <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
              ) : (
                <Upload className="w-5 h-5 text-slate-400" />
              )}
              <span className="text-sm text-slate-500">
                {uploadingCover ? 'Uploading...' : 'Upload cover image'}
              </span>
              <span className="text-xs text-slate-400">
                Recommended: 1200×400, JPG/PNG/WebP, max 5MB
              </span>
            </button>
          )}
          <input
            ref={coverInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleCoverUpload(file);
              if (coverInputRef.current) coverInputRef.current.value = '';
            }}
            className="hidden"
          />
        </div>

        {/* Gallery */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Gallery <span className="text-slate-400 font-normal">({gallery.length}/6)</span>
          </label>
          <div className="grid grid-cols-3 gap-3">
            {gallery.map((url, i) => (
              <div key={i} className="relative group aspect-square rounded-lg overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={url}
                  alt={`Gallery ${i + 1}`}
                  className="w-full h-full object-cover"
                />
                <button
                  onClick={() => handleGalleryDelete(url)}
                  className="absolute top-1.5 right-1.5 w-6 h-6 bg-black/60 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/80"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
            {gallery.length < 6 && (
              <button
                onClick={() => galleryInputRef.current?.click()}
                disabled={uploading}
                className="aspect-square border-2 border-dashed border-slate-200 rounded-lg flex flex-col items-center justify-center gap-1 hover:border-slate-300 hover:bg-slate-50 transition-colors"
              >
                {uploading ? (
                  <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
                ) : (
                  <Plus className="w-4 h-4 text-slate-400" />
                )}
                <span className="text-xs text-slate-400">
                  {uploading ? 'Uploading' : 'Add'}
                </span>
              </button>
            )}
          </div>
          <input
            ref={galleryInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleGalleryUpload(file);
              if (galleryInputRef.current) galleryInputRef.current.value = '';
            }}
            className="hidden"
          />
        </div>

        {/* Social Links */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-3">
            Social Links
          </label>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-pink-500/10 flex items-center justify-center shrink-0">
                <Instagram className="w-4 h-4 text-pink-600" />
              </div>
              <input
                type="text"
                value={socialInstagram}
                onChange={(e) => setSocialInstagram(e.target.value)}
                placeholder="https://instagram.com/yourbusiness"
                className="flex-1 px-3 py-2 rounded-lg border border-slate-200 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0">
                <Facebook className="w-4 h-4 text-blue-600" />
              </div>
              <input
                type="text"
                value={socialFacebook}
                onChange={(e) => setSocialFacebook(e.target.value)}
                placeholder="https://facebook.com/yourbusiness"
                className="flex-1 px-3 py-2 rounded-lg border border-slate-200 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-slate-900/10 flex items-center justify-center shrink-0">
                <svg className="w-4 h-4 text-slate-700" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1v-3.49a6.37 6.37 0 0 0-.79-.05A6.34 6.34 0 0 0 3.15 15a6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.34-6.34V8.89a8.28 8.28 0 0 0 4.85 1.56v-3.5a4.85 4.85 0 0 1-1.09-.26z" />
                </svg>
              </div>
              <input
                type="text"
                value={socialTiktok}
                onChange={(e) => setSocialTiktok(e.target.value)}
                placeholder="https://tiktok.com/@yourbusiness"
                className="flex-1 px-3 py-2 rounded-lg border border-slate-200 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-sky-500/10 flex items-center justify-center shrink-0">
                <svg className="w-4 h-4 text-sky-600" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </div>
              <input
                type="text"
                value={socialTwitter}
                onChange={(e) => setSocialTwitter(e.target.value)}
                placeholder="https://x.com/yourbusiness"
                className="flex-1 px-3 py-2 rounded-lg border border-slate-200 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0">
                <Globe className="w-4 h-4 text-emerald-600" />
              </div>
              <input
                type="text"
                value={socialWebsite}
                onChange={(e) => setSocialWebsite(e.target.value)}
                placeholder="https://yourbusiness.com"
                className="flex-1 px-3 py-2 rounded-lg border border-slate-200 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Error / Success */}
        {error && <p className="text-sm text-red-600">{error}</p>}
        {success && (
          <p className="text-sm text-emerald-600 flex items-center gap-1">
            <Check className="w-4 h-4" />
            Booking page saved!
          </p>
        )}

        <button
          onClick={handleSave}
          disabled={saving || uploading || uploadingCover}
          className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white text-sm font-medium rounded-lg hover:bg-slate-800 transition-colors disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </div>
  );
}