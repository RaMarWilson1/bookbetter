// src/app/dashboard/settings/_components/settings-content.tsx
'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { signOut } from 'next-auth/react';
import {
  User,
  Building,
  Link2,
  LogOut,
  Save,
  Copy,
  Check,
  Camera,
  CreditCard,
  Palette,
  FileText,
  Shield,
  ChevronRight,
  Bell,
  MessageSquare,
} from 'lucide-react';
import { BrandingSettings } from './branding-settings';
import { BookingPageSettings } from './booking-page-settings';
import { CancellationSettings } from './cancellation-settings';
import { StripeConnectCard } from './stripe-connect-card';

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
    primaryColor: string | null;
    secondaryColor: string | null;
    logo: string | null;
    cancellationWindowHours: number | null;
    lateCancellationFeeCents: number | null;
    cancellationPolicyText: string | null;
    showPoweredBy: boolean;
  } | null;
}

type SettingsTab = 'profile' | 'business' | 'branding' | 'booking-page' | 'payments' | 'cancellation' | 'notifications';

const TABS: { id: SettingsTab; label: string; icon: React.ElementType; requiresTenant?: boolean }[] = [
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'business', label: 'Business', icon: Building, requiresTenant: true },
  { id: 'branding', label: 'Branding', icon: Palette, requiresTenant: true },
  { id: 'booking-page', label: 'Booking Page', icon: FileText, requiresTenant: true },
  { id: 'payments', label: 'Payments', icon: CreditCard },
  { id: 'notifications', label: 'Notifications', icon: Bell, requiresTenant: true },
  { id: 'cancellation', label: 'Cancellation', icon: Shield, requiresTenant: true },
];

export function SettingsContent({ user, tenant }: SettingsContentProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<SettingsTab>(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam && TABS.some((t) => t.id === tabParam)) {
      return tabParam as SettingsTab;
    }
    return 'profile';
  });

  // Profile form
  const [profileForm, setProfileForm] = useState({
    name: user.name || '',
    timeZone: user.timeZone || 'America/New_York',
  });

  // Business form
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

  // Shared state
  const [saving, setSaving] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState(user.image || '');
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const [currentSlug, setCurrentSlug] = useState(tenant?.slug || '');
  const [slugInput, setSlugInput] = useState(tenant?.slug || '');
  const [editingSlug, setEditingSlug] = useState(false);
  const [savingSlug, setSavingSlug] = useState(false);
  const [slugError, setSlugError] = useState('');

  // SMS / Notifications state
  const [smsUsage, setSmsUsage] = useState<{
    plan: string; quota: number; used: number; packBalance: number;
    remaining: number; percentUsed: number; atWarning: boolean;
    atLimit: boolean; overageEnabled: boolean;
  } | null>(null);
  const [smsLoading, setSmsLoading] = useState(false);
  const [buyingPack, setBuyingPack] = useState(false);
  const [togglingOverage, setTogglingOverage] = useState(false);
  const [smsPackMessage, setSmsPackMessage] = useState<string | null>(null);

  // Check for SMS pack purchase result
  useEffect(() => {
    const packResult = searchParams.get('sms_pack');
    if (packResult === 'success') {
      setSmsPackMessage('SMS pack purchased! 100 credits have been added to your account.');
      // Clean up URL
      const url = new URL(window.location.href);
      url.searchParams.delete('sms_pack');
      router.replace(url.pathname + url.search, { scroll: false });
    } else if (packResult === 'cancelled') {
      setSmsPackMessage(null);
    }
  }, [searchParams, router]);

  // Fetch SMS usage when notifications tab is active
  useEffect(() => {
    if (activeTab === 'notifications' && tenant) {
      setSmsLoading(true);
      fetch('/api/dashboard/sms')
        .then((res) => res.json())
        .then((data) => setSmsUsage(data))
        .catch((err) => console.error('[Settings] SMS fetch error:', err))
        .finally(() => setSmsLoading(false));
    }
  }, [activeTab, tenant]);

  const handleBuyPack = async () => {
    setBuyingPack(true);
    try {
      const res = await fetch('/api/dashboard/sms/buy-pack', { method: 'POST' });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
    } catch (err) {
      console.error('[Settings] Buy pack error:', err);
    } finally {
      setBuyingPack(false);
    }
  };

  const handleToggleOverage = async () => {
    if (!smsUsage) return;
    setTogglingOverage(true);
    try {
      const res = await fetch('/api/dashboard/sms', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ smsOverageEnabled: !smsUsage.overageEnabled }),
      });
      const data = await res.json();
      setSmsUsage(data);
    } catch (err) {
      console.error('[Settings] Overage toggle error:', err);
    } finally {
      setTogglingOverage(false);
    }
  };

  // Notification preferences
  type NotifPrefs = {
    notifyEmailBooking: boolean;
    notifyEmailCancellation: boolean;
    notifyEmailReschedule: boolean;
    notifyEmailReminder: boolean;
    notifyEmailReviewRequest: boolean;
    notifySmsBooking: boolean;
    notifySmsCancellation: boolean;
    notifySmsReschedule: boolean;
    notifySmsReminder: boolean;
    notifyInAppBooking: boolean;
    notifyInAppCancellation: boolean;
    notifyInAppReschedule: boolean;
    notifyInAppReview: boolean;
    notifyInAppPayment: boolean;
  };
  const [notifPrefs, setNotifPrefs] = useState<NotifPrefs | null>(null);
  const [notifPrefsLoading, setNotifPrefsLoading] = useState(false);
  const [notifPrefsSaving, setNotifPrefsSaving] = useState<string | null>(null);

  // Fetch notification preferences when tab is active
  useEffect(() => {
    if (activeTab === 'notifications' && tenant && !notifPrefs) {
      setNotifPrefsLoading(true);
      fetch('/api/dashboard/settings/notifications')
        .then((res) => res.json())
        .then((data) => {
          if (!data.error) setNotifPrefs(data);
        })
        .catch((err) => console.error('[Settings] NotifPrefs fetch error:', err))
        .finally(() => setNotifPrefsLoading(false));
    }
  }, [activeTab, tenant, notifPrefs]);

  const handleToggleNotifPref = async (key: string) => {
    if (!notifPrefs || !(key in notifPrefs)) return;
    const prefKey = key as keyof NotifPrefs;
    const newValue = !notifPrefs[prefKey];
    // Optimistic update
    setNotifPrefs({ ...notifPrefs, [prefKey]: newValue });
    setNotifPrefsSaving(key);
    try {
      await fetch('/api/dashboard/settings/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [prefKey]: newValue }),
      });
    } catch (err) {
      // Revert on error
      setNotifPrefs({ ...notifPrefs, [prefKey]: !newValue });
      console.error('[Settings] NotifPref toggle error:', err);
    } finally {
      setNotifPrefsSaving(null);
    }
  };

  const bookingUrl = tenant ? `thebookbetter.com/book/${currentSlug}` : '';

  // Clear success message after 3s
  useEffect(() => {
    if (saveSuccess) {
      const t = setTimeout(() => setSaveSuccess(null), 3000);
      return () => clearTimeout(t);
    }
  }, [saveSuccess]);

  const handleCopy = () => {
    navigator.clipboard.writeText(`https://${bookingUrl}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveSlug = async () => {
    const trimmed = slugInput.trim();
    if (!trimmed) { setSlugError('Link cannot be empty'); return; }
    if (trimmed.length < 3) { setSlugError('Must be at least 3 characters'); return; }
    if (trimmed === currentSlug) { setEditingSlug(false); return; }

    setSavingSlug(true);
    setSlugError('');
    try {
      const res = await fetch('/api/dashboard/settings/slug', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug: trimmed }),
      });
      const data = await res.json();
      if (!res.ok) { setSlugError(data.error || 'Failed to update'); return; }
      setCurrentSlug(trimmed);
      setEditingSlug(false);
      router.refresh();
    } catch { setSlugError('Something went wrong'); }
    finally { setSavingSlug(false); }
  };

  const handleAvatarUpload = async (file: File) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) return;
    if (file.size > 2 * 1024 * 1024) return;

    setUploadingAvatar(true);
    try {
      const formData = new FormData();
      formData.append('avatar', file);
      const res = await fetch('/api/dashboard/settings/avatar', { method: 'POST', body: formData });
      const data = await res.json();
      if (res.ok) { setAvatarUrl(data.url); router.refresh(); }
    } catch { /* silently fail */ }
    finally { setUploadingAvatar(false); }
  };

  const handleRemoveAvatar = async () => {
    setUploadingAvatar(true);
    try {
      const res = await fetch('/api/dashboard/settings/avatar', { method: 'DELETE' });
      if (res.ok) { setAvatarUrl(''); router.refresh(); }
    } catch { /* silently fail */ }
    finally { setUploadingAvatar(false); }
  };

  const handleSaveProfile = async () => {
    setSaving('profile');
    try {
      await fetch('/api/dashboard/settings/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profileForm),
      });
      setSaveSuccess('profile');
      router.refresh();
    } catch { /* silently fail */ }
    finally { setSaving(null); }
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
      setSaveSuccess('business');
      router.refresh();
    } catch { /* silently fail */ }
    finally { setSaving(null); }
  };

  const TIMEZONES = [
    'America/New_York', 'America/Chicago', 'America/Denver',
    'America/Los_Angeles', 'America/Anchorage', 'Pacific/Honolulu', 'America/Phoenix',
  ];

  const visibleTabs = TABS.filter((t) => !t.requiresTenant || tenant);

  // Input class (shared across all fields)
  const inputCls =
    'w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 placeholder:text-slate-400';

  return (
    <div className="max-w-5xl">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-900">Settings</h2>
        <p className="text-slate-500 mt-1">Manage your account, business, and booking preferences.</p>
      </div>

      {/* Booking Link Banner */}
      {tenant && (
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 rounded-xl p-4 mb-6">
          {editingSlug ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Link2 className="w-4 h-4 text-slate-400 shrink-0" />
                <span className="text-xs text-slate-400">Edit your booking link</span>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                <div className="flex items-center gap-1 min-w-0">
                  <span className="text-xs sm:text-sm text-slate-400 shrink-0 truncate">thebookbetter.com/book/</span>
                  <input
                    type="text"
                    value={slugInput}
                    onChange={(e) => {
                      setSlugInput(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''));
                      setSlugError('');
                    }}
                    className="bg-white/10 border border-white/20 rounded px-2 py-1 text-white text-sm font-mono focus:outline-none focus:border-white/40 w-full sm:w-36"
                    autoFocus
                  />
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleSaveSlug}
                    disabled={savingSlug}
                    className="px-3 py-1 bg-white/20 hover:bg-white/30 text-white text-xs font-medium rounded transition-colors disabled:opacity-50"
                  >
                    {savingSlug ? '...' : 'Save'}
                  </button>
                  <button
                    onClick={() => { setEditingSlug(false); setSlugInput(tenant.slug); setSlugError(''); }}
                    className="text-slate-400 hover:text-white text-xs"
                  >
                    Cancel
                  </button>
                </div>
              </div>
              {slugError && <p className="text-xs text-red-400">{slugError}</p>}
            </div>
          ) : (
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center shrink-0 hidden sm:flex">
                  <Link2 className="w-4 h-4 text-slate-300" />
                </div>
                <code className="text-xs sm:text-sm text-white/90 truncate">{bookingUrl}</code>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => setEditingSlug(true)}
                  className="text-xs text-blue-400 hover:text-blue-300 font-medium"
                >
                  Edit
                </button>
                <button
                  onClick={handleCopy}
                  className="p-1.5 bg-white/10 hover:bg-white/20 rounded-md transition-colors"
                  title="Copy link"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-white" />}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Mobile Tab Bar - horizontal scroll */}
      <div className="md:hidden mb-4 -mx-1">
        <div className="flex gap-1 overflow-x-auto pb-2 px-1 scrollbar-hide">
          {visibleTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-all shrink-0 ${
                  isActive
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 active:bg-slate-200'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                {tab.label}
              </button>
            );
          })}
          {tenant && (
            <Link
              href="/dashboard/settings/billing"
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap bg-slate-100 text-slate-600 active:bg-slate-200 shrink-0"
            >
              <CreditCard className="w-3.5 h-3.5 text-slate-400" />
              Billing
            </Link>
          )}
        </div>
      </div>

      {/* Main Layout: Sidebar (desktop) + Content */}
      <div className="flex gap-6">
        {/* Sidebar Navigation - hidden on mobile */}
        <nav className="w-52 shrink-0 hidden md:block">
          <div className="sticky top-6 space-y-1">
            {visibleTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-slate-900 text-white shadow-sm'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  {tab.label}
                  {isActive && <ChevronRight className="w-3.5 h-3.5 ml-auto" />}
                </button>
              );
            })}

            {/* Billing link */}
            {tenant && (
              <Link
                href="/dashboard/settings/billing"
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-all"
              >
                <CreditCard className="w-4 h-4 text-slate-400" />
                Billing
                <span className="ml-auto text-xs bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded-full capitalize">
                  {tenant.plan}
                </span>
              </Link>
            )}

            {/* Divider + Sign Out */}
            <div className="pt-4 mt-4 border-t border-slate-200">
              <button
                onClick={() => signOut({ callbackUrl: '/' })}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium text-red-500 hover:bg-red-50 transition-all"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </div>
          </div>
        </nav>

        {/* Content Area */}
        <div className="flex-1 min-w-0">
          {/* Profile */}
          {activeTab === 'profile' && (
            <div className="bg-white rounded-xl border border-slate-200/60 overflow-hidden">
              <div className="px-4 sm:px-6 py-4 border-b border-slate-100">
                <h3 className="font-semibold text-slate-900 text-lg">Profile</h3>
                <p className="text-sm text-slate-500 mt-0.5">Your personal account details.</p>
              </div>
              <div className="p-4 sm:p-6">
                {/* Avatar */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-5 pb-5 border-b border-slate-100">
                  <div className="relative group">
                    {avatarUrl ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img src={avatarUrl} alt="" className="w-20 h-20 rounded-full object-cover border-2 border-slate-200" />
                    ) : (
                      <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold text-xl">
                        {(user.name || user.email)[0].toUpperCase()}
                      </div>
                    )}
                    <button
                      onClick={() => avatarInputRef.current?.click()}
                      disabled={uploadingAvatar}
                      className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                    >
                      <Camera className="w-5 h-5 text-white" />
                    </button>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-900">
                      {avatarUrl ? 'Profile photo' : 'No photo uploaded'}
                    </p>
                    <div className="flex items-center gap-3 mt-1.5">
                      <button
                        onClick={() => avatarInputRef.current?.click()}
                        disabled={uploadingAvatar}
                        className="text-sm text-blue-500 hover:text-blue-600 font-medium"
                      >
                        {uploadingAvatar ? 'Uploading...' : avatarUrl ? 'Change' : 'Upload'}
                      </button>
                      {avatarUrl && (
                        <button
                          onClick={handleRemoveAvatar}
                          disabled={uploadingAvatar}
                          className="text-sm text-red-500 hover:text-red-600 font-medium"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 mt-1">JPG, PNG, or WebP. Max 2MB.</p>
                  </div>
                  <input
                    ref={avatarInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleAvatarUpload(file);
                      if (avatarInputRef.current) avatarInputRef.current.value = '';
                    }}
                    className="hidden"
                  />
                </div>

                <div className="grid gap-4 pt-5">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Name</label>
                    <input
                      type="text"
                      value={profileForm.name}
                      onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Email</label>
                    <input type="email" value={user.email} disabled className={`${inputCls} bg-slate-50 text-slate-500`} />
                    <p className="text-xs text-slate-400 mt-1">Email cannot be changed</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Time Zone</label>
                    <select
                      value={profileForm.timeZone}
                      onChange={(e) => setProfileForm({ ...profileForm, timeZone: e.target.value })}
                      className={inputCls}
                    >
                      {TIMEZONES.map((tz) => (
                        <option key={tz} value={tz}>{tz.replace('_', ' ')}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Save Bar */}
                <div className="flex items-center gap-3 pt-5 mt-5 border-t border-slate-100">
                  <button
                    onClick={handleSaveProfile}
                    disabled={saving === 'profile'}
                    className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white text-sm font-medium rounded-lg hover:bg-slate-800 transition-colors disabled:opacity-50"
                  >
                    <Save className="w-4 h-4" />
                    {saving === 'profile' ? 'Saving...' : 'Save Profile'}
                  </button>
                  {saveSuccess === 'profile' && (
                    <span className="text-sm text-emerald-600 flex items-center gap-1">
                      <Check className="w-4 h-4" /> Saved
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Business */}
          {activeTab === 'business' && tenant && (
            <div className="bg-white rounded-xl border border-slate-200/60 overflow-hidden">
              <div className="px-4 sm:px-6 py-4 border-b border-slate-100">
                <h3 className="font-semibold text-slate-900 text-lg">Business</h3>
                <p className="text-sm text-slate-500 mt-0.5">Your business details shown to clients.</p>
              </div>
              <div className="p-4 sm:p-6">
                <div className="grid gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Business Name</label>
                    <input
                      type="text"
                      value={businessForm.name}
                      onChange={(e) => setBusinessForm({ ...businessForm, name: e.target.value })}
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Description</label>
                    <textarea
                      value={businessForm.description}
                      onChange={(e) => setBusinessForm({ ...businessForm, description: e.target.value })}
                      rows={3}
                      className={`${inputCls} resize-none`}
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">Email</label>
                      <input
                        type="email"
                        value={businessForm.email}
                        onChange={(e) => setBusinessForm({ ...businessForm, email: e.target.value })}
                        className={inputCls}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">Phone</label>
                      <input
                        type="tel"
                        value={businessForm.phone}
                        onChange={(e) => setBusinessForm({ ...businessForm, phone: e.target.value })}
                        className={inputCls}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Address</label>
                    <input
                      type="text"
                      value={businessForm.address}
                      onChange={(e) => setBusinessForm({ ...businessForm, address: e.target.value })}
                      className={inputCls}
                    />
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">City</label>
                      <input
                        type="text"
                        value={businessForm.city}
                        onChange={(e) => setBusinessForm({ ...businessForm, city: e.target.value })}
                        className={inputCls}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">State</label>
                      <input
                        type="text"
                        value={businessForm.state}
                        onChange={(e) => setBusinessForm({ ...businessForm, state: e.target.value })}
                        className={inputCls}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">ZIP</label>
                      <input
                        type="text"
                        value={businessForm.postalCode}
                        onChange={(e) => setBusinessForm({ ...businessForm, postalCode: e.target.value })}
                        className={inputCls}
                      />
                    </div>
                  </div>
                </div>

                {/* Save Bar */}
                <div className="flex items-center gap-3 pt-5 mt-5 border-t border-slate-100">
                  <button
                    onClick={handleSaveBusiness}
                    disabled={saving === 'business'}
                    className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white text-sm font-medium rounded-lg hover:bg-slate-800 transition-colors disabled:opacity-50"
                  >
                    <Save className="w-4 h-4" />
                    {saving === 'business' ? 'Saving...' : 'Save Business'}
                  </button>
                  {saveSuccess === 'business' && (
                    <span className="text-sm text-emerald-600 flex items-center gap-1">
                      <Check className="w-4 h-4" /> Saved
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Branding */}
          {activeTab === 'branding' && tenant && (
            <BrandingSettings
              tenantId={tenant.id}
              plan={tenant.plan}
              initialData={{
                primaryColor: tenant.primaryColor || '#3B82F6',
                secondaryColor: tenant.secondaryColor || '#10B981',
                logo: tenant.logo,
                name: tenant.name,
                slug: tenant.slug,
                showPoweredBy: tenant.showPoweredBy ?? true,
              }}
            />
          )}

          {/* Booking Page */}
          {activeTab === 'booking-page' && tenant && (
            <BookingPageSettings slug={tenant.slug} />
          )}

          {/* Payments */}
          {activeTab === 'payments' && (
            <StripeConnectCard />
          )}

          {/* Cancellation */}
          {activeTab === 'cancellation' && tenant && (
            <CancellationSettings
              tenantId={tenant.id}
              initialData={{
                cancellationWindowHours: tenant.cancellationWindowHours ?? 24,
                lateCancellationFeeCents: tenant.lateCancellationFeeCents ?? 0,
                cancellationPolicyText: tenant.cancellationPolicyText ?? null,
              }}
            />
          )}

          {/* Notifications / SMS */}
          {activeTab === 'notifications' && tenant && (
            <div className="space-y-6">
              {/* SMS pack purchase success */}
              {smsPackMessage && (
                <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-xl px-4 py-3">
                  <div className="flex items-center gap-2 text-sm text-green-700">
                    <Check className="w-4 h-4" />
                    {smsPackMessage}
                  </div>
                  <button
                    onClick={() => setSmsPackMessage(null)}
                    className="text-green-500 hover:text-green-700 text-sm"
                  >
                    Dismiss
                  </button>
                </div>
              )}

              {/* Email Notifications */}
              <div className="bg-white rounded-xl border border-slate-200 p-6">
                <h2 className="text-base font-semibold text-slate-900 mb-1">Email notifications</h2>
                <p className="text-sm text-slate-500 mb-4">
                  Automatic emails are sent for booking confirmations, cancellations, reschedule proposals, 24-hour reminders, and review requests.
                </p>
                <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 rounded-lg px-3 py-2">
                  <Check className="w-4 h-4" />
                  Email notifications are active
                </div>
              </div>

              {/* SMS Notifications */}
              <div className="bg-white rounded-xl border border-slate-200 p-6">
                <div className="flex items-center gap-2 mb-1">
                  <MessageSquare className="w-4 h-4 text-slate-700" />
                  <h2 className="text-base font-semibold text-slate-900">SMS notifications</h2>
                </div>
                <p className="text-sm text-slate-500 mb-5">
                  Text message reminders and confirmations to your clients.
                </p>

                {smsLoading ? (
                  <div className="flex items-center justify-center py-8 text-sm text-slate-400">Loading SMS usage...</div>
                ) : !smsUsage || smsUsage.plan === 'starter' ? (
                  <div className="bg-slate-50 rounded-lg p-4">
                    <p className="text-sm text-slate-600 font-medium mb-1">SMS is available on Growth and Business plans</p>
                    <p className="text-sm text-slate-500">Growth includes 50 SMS/month, Business includes 200 SMS/month.</p>
                  </div>
                ) : (
                  <div className="space-y-5">
                    {/* Usage bar */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-slate-700">Monthly usage</span>
                        <span className="text-sm text-slate-500">
                          {smsUsage.used} / {smsUsage.quota} used
                        </span>
                      </div>
                      <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            smsUsage.percentUsed >= 100
                              ? 'bg-red-500'
                              : smsUsage.percentUsed >= 80
                              ? 'bg-amber-500'
                              : 'bg-blue-500'
                          }`}
                          style={{ width: `${Math.min(100, smsUsage.percentUsed)}%` }}
                        />
                      </div>
                      {smsUsage.atWarning && !smsUsage.atLimit && (
                        <p className="text-xs text-amber-600 mt-1.5">
                          You&apos;ve used {smsUsage.percentUsed}% of your monthly SMS quota.
                        </p>
                      )}
                      {smsUsage.atLimit && (
                        <p className="text-xs text-red-600 mt-1.5">
                          You&apos;ve reached your monthly SMS limit. Buy a pack or enable overage to keep sending.
                        </p>
                      )}
                    </div>

                    {/* Pack balance */}
                    {smsUsage.packBalance > 0 && (
                      <div className="flex items-center justify-between bg-blue-50 rounded-lg px-4 py-2.5">
                        <span className="text-sm text-blue-700">Pack credits remaining</span>
                        <span className="text-sm font-semibold text-blue-700">{smsUsage.packBalance}</span>
                      </div>
                    )}

                    {/* Buy pack */}
                    <div className="flex items-center justify-between bg-slate-50 rounded-lg px-4 py-3">
                      <div>
                        <p className="text-sm font-medium text-slate-700">SMS Pack</p>
                        <p className="text-xs text-slate-500">100 messages for $2.50 ($0.025/SMS)</p>
                      </div>
                      <button
                        onClick={handleBuyPack}
                        disabled={buyingPack}
                        className="px-4 py-2 bg-slate-900 text-white text-sm font-medium rounded-lg hover:bg-slate-800 disabled:opacity-50 transition-colors"
                      >
                        {buyingPack ? 'Loading...' : 'Buy Pack'}
                      </button>
                    </div>

                    {/* Overage toggle */}
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-slate-700">Auto-charge overage</p>
                        <p className="text-xs text-slate-500">$0.03/SMS after quota is used (slightly higher than pack rate)</p>
                      </div>
                      <button
                        onClick={handleToggleOverage}
                        disabled={togglingOverage}
                        className={`relative w-11 h-6 rounded-full transition-colors ${
                          smsUsage.overageEnabled ? 'bg-blue-500' : 'bg-slate-200'
                        }`}
                      >
                        <span
                          className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                            smsUsage.overageEnabled ? 'translate-x-5' : ''
                          }`}
                        />
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* In-App Notifications info */}
              <div className="bg-white rounded-xl border border-slate-200 p-6">
                <h2 className="text-base font-semibold text-slate-900 mb-1">In-app notifications</h2>
                <p className="text-sm text-slate-500">
                  You&apos;ll see a notification bell in the dashboard header for new bookings, cancellations, reschedule responses, and reviews. Clients see theirs on the My Bookings page.
                </p>
                <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 rounded-lg px-3 py-2 mt-3">
                  <Check className="w-4 h-4" />
                  In-app notifications are active
                </div>
              </div>

              {/* Notification Preferences */}
              <div className="bg-white rounded-xl border border-slate-200 p-6">
                <h2 className="text-base font-semibold text-slate-900 mb-1">Notification preferences</h2>
                <p className="text-sm text-slate-500 mb-5">
                  Choose which notifications you receive for each event. These settings apply to notifications sent to you (the pro), not to your clients.
                </p>

                {notifPrefsLoading ? (
                  <div className="flex items-center justify-center py-8 text-sm text-slate-400">Loading preferences...</div>
                ) : notifPrefs ? (
                  <div className="space-y-1">
                    {/* Header row */}
                    <div className="grid grid-cols-[1fr_60px_60px_60px] gap-2 items-center pb-2 border-b border-slate-100">
                      <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Event</span>
                      <span className="text-xs font-medium text-slate-500 uppercase tracking-wider text-center">Email</span>
                      <span className="text-xs font-medium text-slate-500 uppercase tracking-wider text-center">SMS</span>
                      <span className="text-xs font-medium text-slate-500 uppercase tracking-wider text-center">In-app</span>
                    </div>

                    {/* New booking */}
                    <NotifPrefRow
                      label="New booking"
                      emailKey="notifyEmailBooking"
                      smsKey="notifySmsBooking"
                      inAppKey="notifyInAppBooking"
                      prefs={notifPrefs}
                      saving={notifPrefsSaving}
                      onToggle={handleToggleNotifPref}
                      hasSms={smsUsage?.plan !== 'starter'}
                    />
                    {/* Cancellation */}
                    <NotifPrefRow
                      label="Cancellation"
                      emailKey="notifyEmailCancellation"
                      smsKey="notifySmsCancellation"
                      inAppKey="notifyInAppCancellation"
                      prefs={notifPrefs}
                      saving={notifPrefsSaving}
                      onToggle={handleToggleNotifPref}
                      hasSms={smsUsage?.plan !== 'starter'}
                    />
                    {/* Reschedule */}
                    <NotifPrefRow
                      label="Reschedule response"
                      emailKey="notifyEmailReschedule"
                      smsKey="notifySmsReschedule"
                      inAppKey="notifyInAppReschedule"
                      prefs={notifPrefs}
                      saving={notifPrefsSaving}
                      onToggle={handleToggleNotifPref}
                      hasSms={smsUsage?.plan !== 'starter'}
                    />
                    {/* Reminder (email to client only — pro doesn't get reminders) */}
                    <div className="grid grid-cols-[1fr_60px_60px_60px] gap-2 items-center py-2.5 border-b border-slate-50">
                      <span className="text-sm text-slate-700">24hr reminder <span className="text-xs text-slate-400">(to client)</span></span>
                      <div className="flex justify-center">
                        <ToggleSwitch
                          enabled={notifPrefs.notifyEmailReminder}
                          saving={notifPrefsSaving === 'notifyEmailReminder'}
                          onToggle={() => handleToggleNotifPref('notifyEmailReminder')}
                        />
                      </div>
                      <div className="flex justify-center">
                        {smsUsage?.plan !== 'starter' ? (
                          <ToggleSwitch
                            enabled={notifPrefs.notifySmsReminder}
                            saving={notifPrefsSaving === 'notifySmsReminder'}
                            onToggle={() => handleToggleNotifPref('notifySmsReminder')}
                          />
                        ) : (
                          <span className="text-xs text-slate-300">—</span>
                        )}
                      </div>
                      <div className="flex justify-center">
                        <span className="text-xs text-slate-300">—</span>
                      </div>
                    </div>
                    {/* Review request (email to client only) */}
                    <div className="grid grid-cols-[1fr_60px_60px_60px] gap-2 items-center py-2.5 border-b border-slate-50">
                      <span className="text-sm text-slate-700">Review request <span className="text-xs text-slate-400">(to client)</span></span>
                      <div className="flex justify-center">
                        <ToggleSwitch
                          enabled={notifPrefs.notifyEmailReviewRequest}
                          saving={notifPrefsSaving === 'notifyEmailReviewRequest'}
                          onToggle={() => handleToggleNotifPref('notifyEmailReviewRequest')}
                        />
                      </div>
                      <div className="flex justify-center">
                        <span className="text-xs text-slate-300">—</span>
                      </div>
                      <div className="flex justify-center">
                        <span className="text-xs text-slate-300">—</span>
                      </div>
                    </div>
                    {/* New review (in-app to pro only) */}
                    <div className="grid grid-cols-[1fr_60px_60px_60px] gap-2 items-center py-2.5 border-b border-slate-50">
                      <span className="text-sm text-slate-700">New review received</span>
                      <div className="flex justify-center">
                        <span className="text-xs text-slate-300">—</span>
                      </div>
                      <div className="flex justify-center">
                        <span className="text-xs text-slate-300">—</span>
                      </div>
                      <div className="flex justify-center">
                        <ToggleSwitch
                          enabled={notifPrefs.notifyInAppReview}
                          saving={notifPrefsSaving === 'notifyInAppReview'}
                          onToggle={() => handleToggleNotifPref('notifyInAppReview')}
                        />
                      </div>
                    </div>
                    {/* Payment received (in-app to pro only) */}
                    <div className="grid grid-cols-[1fr_60px_60px_60px] gap-2 items-center py-2.5">
                      <span className="text-sm text-slate-700">Payment received</span>
                      <div className="flex justify-center">
                        <span className="text-xs text-slate-300">—</span>
                      </div>
                      <div className="flex justify-center">
                        <span className="text-xs text-slate-300">—</span>
                      </div>
                      <div className="flex justify-center">
                        <ToggleSwitch
                          enabled={notifPrefs.notifyInAppPayment}
                          saving={notifPrefsSaving === 'notifyInAppPayment'}
                          onToggle={() => handleToggleNotifPref('notifyInAppPayment')}
                        />
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          )}

          {/* Mobile-only Sign Out */}
          <div className="md:hidden mt-6">
            <button
              onClick={() => signOut({ callbackUrl: '/' })}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-red-50 text-red-600 text-sm font-medium rounded-lg active:bg-red-100 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// --- Helper components for notification preferences ---

function ToggleSwitch({
  enabled,
  saving,
  onToggle,
}: {
  enabled: boolean;
  saving: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      onClick={onToggle}
      disabled={saving}
      className={`relative w-9 h-5 rounded-full transition-colors ${
        enabled ? 'bg-blue-500' : 'bg-slate-200'
      } ${saving ? 'opacity-50' : ''}`}
    >
      <span
        className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${
          enabled ? 'translate-x-4' : ''
        }`}
      />
    </button>
  );
}

function NotifPrefRow({
  label,
  emailKey,
  smsKey,
  inAppKey,
  prefs,
  saving,
  onToggle,
  hasSms,
}: {
  label: string;
  emailKey: string;
  smsKey: string;
  inAppKey: string;
  prefs: Record<string, boolean>;
  saving: string | null;
  onToggle: (key: string) => void;
  hasSms: boolean;
}) {
  return (
    <div className="grid grid-cols-[1fr_60px_60px_60px] gap-2 items-center py-2.5 border-b border-slate-50">
      <span className="text-sm text-slate-700">{label}</span>
      <div className="flex justify-center">
        <ToggleSwitch
          enabled={prefs[emailKey]}
          saving={saving === emailKey}
          onToggle={() => onToggle(emailKey)}
        />
      </div>
      <div className="flex justify-center">
        {hasSms ? (
          <ToggleSwitch
            enabled={prefs[smsKey]}
            saving={saving === smsKey}
            onToggle={() => onToggle(smsKey)}
          />
        ) : (
          <span className="text-xs text-slate-300">—</span>
        )}
      </div>
      <div className="flex justify-center">
        <ToggleSwitch
          enabled={prefs[inAppKey]}
          saving={saving === inAppKey}
          onToggle={() => onToggle(inAppKey)}
        />
      </div>
    </div>
  );
}