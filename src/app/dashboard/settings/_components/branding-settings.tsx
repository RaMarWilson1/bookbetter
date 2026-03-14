// src/app/dashboard/settings/_components/branding-settings.tsx
'use client';

import { useState, useRef, useCallback } from 'react';
import { Palette, Upload, Check, Eye, X, ImageIcon, ExternalLink } from 'lucide-react';

interface BrandingSettingsProps {
  tenantId: string;
  plan: string;
  initialData: {
    primaryColor: string;
    secondaryColor: string;
    logo: string | null;
    name: string;
    slug: string;
    showPoweredBy: boolean;
  };
}

const PRESET_COLORS = [
  { label: 'Blue', value: '#3B82F6' },
  { label: 'Purple', value: '#8B5CF6' },
  { label: 'Rose', value: '#F43F5E' },
  { label: 'Orange', value: '#F97316' },
  { label: 'Emerald', value: '#10B981' },
  { label: 'Teal', value: '#14B8A6' },
  { label: 'Slate', value: '#475569' },
  { label: 'Black', value: '#18181B' },
];

export function BrandingSettings({ tenantId, plan, initialData }: BrandingSettingsProps) {
  const [primaryColor, setPrimaryColor] = useState(initialData.primaryColor);
  const [secondaryColor, setSecondaryColor] = useState(initialData.secondaryColor);
  const [logoUrl, setLogoUrl] = useState(initialData.logo || '');
  const [showPoweredBy, setShowPoweredBy] = useState(initialData.showPoweredBy);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleLogoUpload = useCallback(async (file: File) => {
    // Validate on client side too
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'];
    if (!allowedTypes.includes(file.type)) {
      setError('Invalid file type. Use JPG, PNG, WebP, or SVG.');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setError('File too large. Max 2MB.');
      return;
    }

    setUploading(true);
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

      setLogoUrl(data.url);
    } catch {
      setError('Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  }, []);

  const handleRemoveLogo = async () => {
    setUploading(true);
    setError('');

    try {
      const res = await fetch('/api/dashboard/settings/logo', { method: 'DELETE' });
      if (res.ok) {
        setLogoUrl('');
      }
    } catch {
      setError('Failed to remove logo');
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) handleLogoUpload(file);
    },
    [handleLogoUpload]
  );

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleLogoUpload(file);
    // Reset input so same file can be re-selected
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    setSuccess(false);

    try {
      const res = await fetch('/api/dashboard/settings/branding', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          primaryColor,
          secondaryColor,
          logo: logoUrl || null,
          showPoweredBy,
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

  return (
    <div className="bg-white rounded-xl border border-slate-200/60 overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
        <Palette className="w-5 h-5 text-slate-400" />
        <h3 className="font-semibold text-slate-900">Branding</h3>
      </div>

      <div className="p-6 space-y-6">
        {/* Logo Upload */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Logo
          </label>

          {logoUrl ? (
            /* Logo Preview */
            <div className="flex items-center gap-4">
              <div className="relative group">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={logoUrl}
                  alt="Your logo"
                  className="w-20 h-20 rounded-xl object-cover border border-slate-200"
                />
                <button
                  onClick={handleRemoveLogo}
                  disabled={uploading}
                  className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              <div>
                <p className="text-sm text-slate-700 font-medium">Logo uploaded</p>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="text-sm text-blue-500 hover:text-blue-600 font-medium mt-0.5"
                >
                  {uploading ? 'Uploading...' : 'Replace'}
                </button>
              </div>
            </div>
          ) : (
            /* Drop Zone */
            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
                dragOver
                  ? 'border-blue-400 bg-blue-50'
                  : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
              }`}
            >
              <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3">
                {uploading ? (
                  <svg className="w-5 h-5 animate-spin text-slate-400" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                ) : (
                  <Upload className="w-5 h-5 text-slate-400" />
                )}
              </div>
              <p className="text-sm text-slate-600 font-medium">
                {uploading ? 'Uploading...' : 'Drop your logo here, or click to browse'}
              </p>
              <p className="text-xs text-slate-400 mt-1">
                JPG, PNG, WebP, or SVG. Max 2MB.
              </p>
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/svg+xml"
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>

        {/* Primary Color */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Brand Color
          </label>
          <div className="flex flex-wrap gap-2 mb-3">
            {PRESET_COLORS.map((preset) => (
              <button
                key={preset.value}
                onClick={() => setPrimaryColor(preset.value)}
                className={`w-9 h-9 rounded-lg transition-all ${
                  primaryColor === preset.value
                    ? 'ring-2 ring-offset-2 ring-slate-900 scale-110'
                    : 'hover:scale-105'
                }`}
                style={{ backgroundColor: preset.value }}
                title={preset.label}
              />
            ))}
          </div>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={primaryColor}
              onChange={(e) => setPrimaryColor(e.target.value)}
              className="w-9 h-9 rounded cursor-pointer border-0"
            />
            <input
              type="text"
              value={primaryColor}
              onChange={(e) => setPrimaryColor(e.target.value)}
              placeholder="#3B82F6"
              className="w-28 px-3 py-2 rounded-lg border border-slate-200 text-sm text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
            <span className="text-xs text-slate-400">Custom hex</span>
          </div>
        </div>

        {/* Accent Color */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Accent Color
          </label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={secondaryColor}
              onChange={(e) => setSecondaryColor(e.target.value)}
              className="w-9 h-9 rounded cursor-pointer border-0"
            />
            <input
              type="text"
              value={secondaryColor}
              onChange={(e) => setSecondaryColor(e.target.value)}
              placeholder="#10B981"
              className="w-28 px-3 py-2 rounded-lg border border-slate-200 text-sm text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
            <span className="text-xs text-slate-400">Used for success states & accents</span>
          </div>
        </div>

        {/* Preview */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            <Eye className="w-4 h-4 inline mr-1" />
            Preview
          </label>
          <div className="rounded-xl border border-slate-200 overflow-hidden">
            {/* Banner */}
            <div className="h-2" style={{ backgroundColor: primaryColor }} />
            <div className="p-4 bg-slate-50">
              <div className="flex items-center gap-3 mb-3">
                {logoUrl ? (
                  <>{/* eslint-disable-next-line @next/next/no-img-element */}<img src={logoUrl} alt="" className="w-10 h-10 rounded-full object-cover" /></>
                ) : (
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm"
                    style={{ backgroundColor: primaryColor }}
                  >
                    {initialData.name.slice(0, 2).toUpperCase()}
                  </div>
                )}
                <div>
                  <p className="font-semibold text-slate-900 text-sm">{initialData.name}</p>
                  <p className="text-xs text-slate-400">Your booking page preview</p>
                </div>
              </div>
              <button
                className="w-full py-2 text-white text-sm font-medium rounded-lg"
                style={{ backgroundColor: primaryColor }}
              >
                Book Now
              </button>
            </div>
          </div>
          <a
            href={`/book/${initialData.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-sm text-blue-500 hover:text-blue-600 font-medium mt-2"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            View live booking page
          </a>
        </div>

        {/* Powered by BookBetter Toggle */}
        <div className="flex items-center justify-between py-3 border-t border-slate-100">
          <div>
            <p className="text-sm font-medium text-slate-700">
              Show &quot;Powered by BookBetter&quot;
            </p>
            <p className="text-xs text-slate-400 mt-0.5">
              {plan === 'starter'
                ? 'Upgrade to Growth to remove the BookBetter badge'
                : 'Display a BookBetter badge on your booking page footer'}
            </p>
          </div>
          <button
            onClick={() => {
              if (plan !== 'starter') setShowPoweredBy(!showPoweredBy);
            }}
            disabled={plan === 'starter'}
            className={`relative w-11 h-6 rounded-full transition-colors ${
              showPoweredBy ? 'bg-blue-500' : 'bg-slate-200'
            } ${plan === 'starter' ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <div
              className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${
                showPoweredBy ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* Error / Success */}
        {error && (
          <p className="text-sm text-red-600">{error}</p>
        )}
        {success && (
          <p className="text-sm text-emerald-600 flex items-center gap-1">
            <Check className="w-4 h-4" />
            Branding saved!
          </p>
        )}

        <button
          onClick={handleSave}
          disabled={saving || uploading}
          className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white text-sm font-medium rounded-lg hover:bg-slate-800 transition-colors disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save Branding'}
        </button>
      </div>
    </div>
  );
}