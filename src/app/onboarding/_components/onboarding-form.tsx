// src/app/onboarding/_components/onboarding-form.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import {
  Building,
  Scissors,
  MapPin,
  Clock,
  ArrowRight,
  ArrowLeft,
  Check,
  Sparkles,
  AlertCircle,
} from 'lucide-react';

const STEPS = [
  { id: 'business', label: 'Business', icon: Building },
  { id: 'category', label: 'Category', icon: Scissors },
  { id: 'location', label: 'Location', icon: MapPin },
  { id: 'service', label: 'First Service', icon: Clock },
];

const CATEGORIES = [
  { value: 'barber', label: 'Barbershop', emoji: '💈' },
  { value: 'hair_salon', label: 'Hair Salon', emoji: '💇' },
  { value: 'nail_salon', label: 'Nail Salon', emoji: '💅' },
  { value: 'tattoo', label: 'Tattoo Studio', emoji: '🎨' },
  { value: 'massage', label: 'Massage Therapy', emoji: '💆' },
  { value: 'spa', label: 'Spa & Wellness', emoji: '🧖' },
  { value: 'fitness', label: 'Fitness & Training', emoji: '🏋️' },
  { value: 'beauty', label: 'Beauty & Makeup', emoji: '✨' },
  { value: 'photography', label: 'Photography', emoji: '📸' },
  { value: 'consulting', label: 'Consulting', emoji: '📋' },
  { value: 'tutoring', label: 'Tutoring', emoji: '📚' },
  { value: 'other', label: 'Other', emoji: '🔧' },
];

interface OnboardingFormProps {
  userId: string;
  userName: string;
  userEmail: string;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 60);
}

export function OnboardingForm({ userId, userName, userEmail }: OnboardingFormProps) {
  const router = useRouter();
  const { update: updateSession } = useSession();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Form state
  const [businessName, setBusinessName] = useState('');
  const [slug, setSlug] = useState('');
  const [slugEdited, setSlugEdited] = useState(false);
  const [category, setCategory] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [timeZone, setTimeZone] = useState('America/New_York');

  // First service (optional)
  const [serviceName, setServiceName] = useState('');
  const [servicePrice, setServicePrice] = useState('');
  const [serviceDuration, setServiceDuration] = useState('30');

  const handleBusinessNameChange = (value: string) => {
    setBusinessName(value);
    if (!slugEdited) {
      setSlug(slugify(value));
    }
  };

  const canProceed = () => {
    switch (step) {
      case 0:
        return businessName.trim().length >= 2 && slug.trim().length >= 2;
      case 1:
        return category !== '';
      case 2:
        return true; // Location is optional
      case 3:
        return true; // Service is optional
      default:
        return false;
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          businessName: businessName.trim(),
          slug: slug.trim(),
          category,
          phone: phone || null,
          address: address || null,
          city: city || null,
          state: state || null,
          postalCode: postalCode || null,
          timeZone,
          // First service
          serviceName: serviceName.trim() || null,
          servicePriceCents: servicePrice ? Math.round(parseFloat(servicePrice) * 100) : null,
          serviceDurationMinutes: serviceName ? parseInt(serviceDuration) : null,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Something went wrong');
        setLoading(false);
        return;
      }

      // Update the session role to 'pro' so middleware allows dashboard access
      await updateSession({ role: 'pro' });

      // Redirect to dashboard
      router.push('/dashboard');
      router.refresh();
    } catch {
      setError('Something went wrong. Please try again.');
      setLoading(false);
    }
  };

  const next = () => {
    if (step < STEPS.length - 1) {
      setStep(step + 1);
      setError('');
    } else {
      handleSubmit();
    }
  };

  const back = () => {
    if (step > 0) {
      setStep(step - 1);
      setError('');
    }
  };

  const firstName = userName?.split(' ')[0] || 'there';

  return (
    <div>
      {/* Progress */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-6">
          {STEPS.map((s, i) => {
            const Icon = s.icon;
            const isActive = i === step;
            const isComplete = i < step;
            return (
              <div key={s.id} className="flex items-center gap-2 flex-1">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm shrink-0 transition-all duration-300 ${
                    isComplete
                      ? 'bg-emerald-500 text-white'
                      : isActive
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-200 text-slate-400'
                  }`}
                >
                  {isComplete ? <Check className="w-4 h-4" /> : <Icon className="w-3.5 h-3.5" />}
                </div>
                {i < STEPS.length - 1 && (
                  <div
                    className={`flex-1 h-0.5 rounded-full transition-colors duration-300 ${
                      isComplete ? 'bg-emerald-500' : 'bg-slate-200'
                    }`}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-6 flex items-start gap-3 p-4 rounded-xl bg-red-50 border border-red-100">
          <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Step Content */}
      <div className="bg-white rounded-xl border border-slate-200/60 p-6 sm:p-8">
        {/* Step 1: Business Info */}
        {step === 0 && (
          <div className="space-y-6">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Sparkles className="w-5 h-5 text-blue-500" />
                <h2 className="text-xl font-bold text-slate-900">Welcome, {firstName}!</h2>
              </div>
              <p className="text-slate-500">
                Let&apos;s set up your business. This takes about 2 minutes.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Business Name *
              </label>
              <input
                type="text"
                value={businessName}
                onChange={(e) => handleBusinessNameChange(e.target.value)}
                placeholder="e.g. Fresh Cuts Barbershop"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                autoFocus
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Booking URL
              </label>
              <div className="flex items-center rounded-xl border border-slate-200 overflow-hidden focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500">
                <span className="px-4 py-3 bg-slate-50 text-sm text-slate-500 border-r border-slate-200 whitespace-nowrap">
                  thebookbetter.com/book/
                </span>
                <input
                  type="text"
                  value={slug}
                  onChange={(e) => {
                    setSlug(slugify(e.target.value));
                    setSlugEdited(true);
                  }}
                  placeholder="your-business"
                  className="flex-1 px-4 py-3 text-slate-900 text-sm placeholder:text-slate-400 focus:outline-none"
                />
              </div>
              <p className="text-xs text-slate-400 mt-1.5">
                This is the link you&apos;ll share with clients. You can change it later.
              </p>
            </div>
          </div>
        )}

        {/* Step 2: Category */}
        {step === 1 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-slate-900 mb-1">
                What type of business?
              </h2>
              <p className="text-slate-500">
                This helps us customize your experience.
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.value}
                  type="button"
                  onClick={() => setCategory(cat.value)}
                  className={`p-4 rounded-xl border-2 text-left transition-all duration-200 ${
                    category === cat.value
                      ? 'border-blue-500 bg-blue-50/50'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <span className="text-xl block mb-1">{cat.emoji}</span>
                  <span
                    className={`text-sm font-medium block ${
                      category === cat.value ? 'text-blue-700' : 'text-slate-700'
                    }`}
                  >
                    {cat.label}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 3: Location */}
        {step === 2 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-slate-900 mb-1">
                Where are you located?
              </h2>
              <p className="text-slate-500">
                Optional — helps clients find you. You can add this later.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Phone Number
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="(555) 123-4567"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Address
              </label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="123 Main St"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">City</label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="City"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">State</label>
                <input
                  type="text"
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  placeholder="PA"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">ZIP</label>
                <input
                  type="text"
                  value={postalCode}
                  onChange={(e) => setPostalCode(e.target.value)}
                  placeholder="19101"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Time Zone</label>
              <select
                value={timeZone}
                onChange={(e) => setTimeZone(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              >
                <option value="America/New_York">Eastern Time</option>
                <option value="America/Chicago">Central Time</option>
                <option value="America/Denver">Mountain Time</option>
                <option value="America/Los_Angeles">Pacific Time</option>
                <option value="America/Anchorage">Alaska Time</option>
                <option value="Pacific/Honolulu">Hawaii Time</option>
              </select>
            </div>
          </div>
        )}

        {/* Step 4: First Service */}
        {step === 3 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-slate-900 mb-1">
                Add your first service
              </h2>
              <p className="text-slate-500">
                Optional — you can always add more from your dashboard.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Service Name
              </label>
              <input
                type="text"
                value={serviceName}
                onChange={(e) => setServiceName(e.target.value)}
                placeholder={
                  category === 'barber'
                    ? 'e.g. Classic Haircut'
                    : category === 'tattoo'
                    ? 'e.g. Small Tattoo (2-3 hours)'
                    : category === 'massage'
                    ? 'e.g. 60-Minute Deep Tissue'
                    : 'e.g. Basic Session'
                }
                className="w-full px-4 py-3 rounded-xl border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Price
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">$</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={servicePrice}
                    onChange={(e) => setServicePrice(e.target.value)}
                    placeholder="0.00"
                    className="w-full pl-8 pr-4 py-3 rounded-xl border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Duration
                </label>
                <select
                  value={serviceDuration}
                  onChange={(e) => setServiceDuration(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                >
                  <option value="15">15 min</option>
                  <option value="30">30 min</option>
                  <option value="45">45 min</option>
                  <option value="60">1 hour</option>
                  <option value="90">1.5 hours</option>
                  <option value="120">2 hours</option>
                  <option value="180">3 hours</option>
                </select>
              </div>
            </div>

            {!serviceName && (
              <button
                type="button"
                onClick={() => next()}
                className="text-sm text-slate-500 hover:text-slate-700 underline underline-offset-2"
              >
                Skip — I&apos;ll add services later
              </button>
            )}
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between mt-6">
        <button
          onClick={back}
          disabled={step === 0}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg transition-colors ${
            step === 0
              ? 'text-transparent cursor-default'
              : 'text-slate-600 hover:bg-white hover:shadow-sm'
          }`}
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>

        <div className="flex items-center gap-1.5">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className={`w-2 h-2 rounded-full transition-colors ${
                i === step ? 'bg-slate-900' : i < step ? 'bg-emerald-500' : 'bg-slate-300'
              }`}
            />
          ))}
        </div>

        <button
          onClick={next}
          disabled={!canProceed() || loading}
          className="flex items-center gap-2 px-6 py-2.5 bg-slate-900 text-white text-sm font-medium rounded-lg hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Setting up...
            </>
          ) : step === STEPS.length - 1 ? (
            <>
              Finish Setup
              <Check className="w-4 h-4" />
            </>
          ) : (
            <>
              Continue
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </div>
    </div>
  );
}