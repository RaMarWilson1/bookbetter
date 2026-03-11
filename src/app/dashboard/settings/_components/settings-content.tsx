// src/app/dashboard/settings/_components/settings-content.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { User, Building, Link2, LogOut, Save, Copy, Check } from 'lucide-react';

interface SettingsContentProps {
  user: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
    timeZone: string | null;
  };
  tenant: {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    email: string | null;
    phone: string | null;
    address: string | null;
    city: string | null;
    state: string | null;
    postalCode: string | null;
    timeZone: string | null;
    plan: string;
  } | null;
}

export function SettingsContent({ user, tenant }: SettingsContentProps) {
  const router = useRouter();
  const [profileForm, setProfileForm] = useState({
    name: user.name || '',
    timeZone: user.timeZone || 'America/New_York',
  });
  const [businessForm, setBusinessForm] = useState({
    name: tenant?.name || '',
    description: tenant?.description || '',
    email: tenant?.email || '',
    phone: tenant?.phone || '',
    address: tenant?.address || '',
    city: tenant?.city || '',
    state: tenant?.state || '',
    postalCode: tenant?.postalCode || '',
  });
  const [saving, setSaving] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const bookingUrl = tenant ? `bookbetter.vercel.app/book/${tenant.slug}` : '';

  const handleCopy = () => {
    navigator.clipboard.writeText(`https://${bookingUrl}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveProfile = async () => {
    setSaving('profile');
    try {
      await fetch('/api/dashboard/settings/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profileForm),
      });
      router.refresh();
    } catch {
      // silently fail
    } finally {
      setSaving(null);
    }
  };

  const handleSaveBusiness = async () => {
    if (!tenant) return;
    setSaving('business');
    try {
      await fetch('/api/dashboard/settings/business', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...businessForm, tenantId: tenant.id }),
      });
      router.refresh();
    } catch {
      // silently fail
    } finally {
      setSaving(null);
    }
  };

  const TIMEZONES = [
    'America/New_York',
    'America/Chicago',
    'America/Denver',
    'America/Los_Angeles',
    'America/Anchorage',
    'Pacific/Honolulu',
    'America/Phoenix',
  ];

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Settings</h2>
        <p className="text-slate-500 mt-1">Manage your profile and business settings.</p>
      </div>

      {/* Booking Link */}
      {tenant && (
        <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-xl p-5 text-white">
          <div className="flex items-center gap-2 mb-2">
            <Link2 className="w-4 h-4 text-slate-400" />
            <p className="text-sm font-medium text-slate-300">Your Booking Link</p>
          </div>
          <div className="flex items-center gap-2">
            <code className="flex-1 text-sm bg-white/10 px-3 py-2 rounded-md truncate">
              {bookingUrl}
            </code>
            <button
              onClick={handleCopy}
              className="p-2 bg-white/10 hover:bg-white/20 rounded-md transition-colors"
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
          <p className="text-xs text-slate-400 mt-2">Share this link with clients so they can book you.</p>
        </div>
      )}

      {/* Profile Settings */}
      <div className="bg-white rounded-xl border border-slate-200/60">
        <div className="p-5 border-b border-slate-100 flex items-center gap-2">
          <User className="w-4 h-4 text-slate-500" />
          <h3 className="font-semibold text-slate-900">Profile</h3>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Name</label>
            <input
              type="text"
              value={profileForm.name}
              onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
              className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Email</label>
            <input
              type="email"
              value={user.email}
              disabled
              className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm bg-slate-50 text-slate-500"
            />
            <p className="text-xs text-slate-400 mt-1">Email cannot be changed</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Time Zone</label>
            <select
              value={profileForm.timeZone}
              onChange={(e) => setProfileForm({ ...profileForm, timeZone: e.target.value })}
              className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            >
              {TIMEZONES.map((tz) => (
                <option key={tz} value={tz}>{tz.replace('_', ' ')}</option>
              ))}
            </select>
          </div>
          <button
            onClick={handleSaveProfile}
            disabled={saving === 'profile'}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-900 text-white text-sm font-medium rounded-lg hover:bg-slate-800 transition-colors disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {saving === 'profile' ? 'Saving...' : 'Save Profile'}
          </button>
        </div>
      </div>

      {/* Business Settings */}
      {tenant && (
        <div className="bg-white rounded-xl border border-slate-200/60">
          <div className="p-5 border-b border-slate-100 flex items-center gap-2">
            <Building className="w-4 h-4 text-slate-500" />
            <h3 className="font-semibold text-slate-900">Business</h3>
            <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full font-medium capitalize">
              {tenant.plan}
            </span>
          </div>
          <div className="p-5 space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Business Name</label>
              <input
                type="text"
                value={businessForm.name}
                onChange={(e) => setBusinessForm({ ...businessForm, name: e.target.value })}
                className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Description</label>
              <textarea
                value={businessForm.description}
                onChange={(e) => setBusinessForm({ ...businessForm, description: e.target.value })}
                rows={3}
                className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Email</label>
                <input
                  type="email"
                  value={businessForm.email}
                  onChange={(e) => setBusinessForm({ ...businessForm, email: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Phone</label>
                <input
                  type="tel"
                  value={businessForm.phone}
                  onChange={(e) => setBusinessForm({ ...businessForm, phone: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Address</label>
              <input
                type="text"
                value={businessForm.address}
                onChange={(e) => setBusinessForm({ ...businessForm, address: e.target.value })}
                className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">City</label>
                <input
                  type="text"
                  value={businessForm.city}
                  onChange={(e) => setBusinessForm({ ...businessForm, city: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">State</label>
                <input
                  type="text"
                  value={businessForm.state}
                  onChange={(e) => setBusinessForm({ ...businessForm, state: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">ZIP</label>
                <input
                  type="text"
                  value={businessForm.postalCode}
                  onChange={(e) => setBusinessForm({ ...businessForm, postalCode: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>
            </div>
            <button
              onClick={handleSaveBusiness}
              disabled={saving === 'business'}
              className="flex items-center gap-2 px-4 py-2.5 bg-slate-900 text-white text-sm font-medium rounded-lg hover:bg-slate-800 transition-colors disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {saving === 'business' ? 'Saving...' : 'Save Business'}
            </button>
          </div>
        </div>
      )}

      {/* Danger Zone */}
      <div className="bg-white rounded-xl border border-red-200">
        <div className="p-5">
          <h3 className="font-semibold text-red-600 mb-2">Sign Out</h3>
          <p className="text-sm text-slate-500 mb-4">Sign out of your BookBetter account.</p>
          <button
            onClick={() => signOut({ callbackUrl: '/' })}
            className="flex items-center gap-2 px-4 py-2.5 bg-red-50 text-red-600 text-sm font-medium rounded-lg hover:bg-red-100 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}