// src/app/auth/sign-up/page.tsx
'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { OAuthButtons } from '../_components/oauth-buttons';
import { Eye, EyeOff, AlertCircle, Check } from 'lucide-react';

type Role = 'client' | 'pro';

export default function SignUpPage() {
  const router = useRouter();

  const [role, setRole] = useState<Role>('pro');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Password strength checks
  const checks = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    number: /[0-9]/.test(password),
  };
  const allChecks = Object.values(checks).every(Boolean);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!allChecks) {
      setError('Please meet all password requirements');
      return;
    }

    setLoading(true);

    try {
      // Register user
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, role }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Registration failed');
        setLoading(false);
        return;
      }

      // Auto sign-in after registration
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError(result.error);
        setLoading(false);
        return;
      }

      // Redirect based on role
      if (role === 'pro') {
        router.push('/onboarding');
      } else {
        router.push('/');
      }
      router.refresh();
    } catch {
      setError('Something went wrong. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div>
      {/* Mobile logo */}
      <div className="lg:hidden mb-8">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
          Book<span className="text-blue-500">Better</span>
        </h1>
      </div>

      <div className="mb-8">
        <h2 className="text-2xl font-bold text-slate-900 mb-2">
          Create your account
        </h2>
        <p className="text-slate-500">Get started in under a minute</p>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-6 flex items-start gap-3 p-4 rounded-xl bg-red-50 border border-red-100">
          <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Role selector */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-slate-700 mb-2">
          I want to...
        </label>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setRole('pro')}
            className={`p-4 rounded-xl border-2 text-left transition-all duration-200 ${
              role === 'pro'
                ? 'border-blue-500 bg-blue-50/50'
                : 'border-slate-200 hover:border-slate-300'
            }`}
          >
            <span className="text-lg mb-1 block">💼</span>
            <span
              className={`text-sm font-semibold block ${
                role === 'pro' ? 'text-blue-700' : 'text-slate-700'
              }`}
            >
              Accept bookings
            </span>
            <span className="text-xs text-slate-500">
              I&apos;m a service pro
            </span>
          </button>
          <button
            type="button"
            onClick={() => setRole('client')}
            className={`p-4 rounded-xl border-2 text-left transition-all duration-200 ${
              role === 'client'
                ? 'border-blue-500 bg-blue-50/50'
                : 'border-slate-200 hover:border-slate-300'
            }`}
          >
            <span className="text-lg mb-1 block">📅</span>
            <span
              className={`text-sm font-semibold block ${
                role === 'client' ? 'text-blue-700' : 'text-slate-700'
              }`}
            >
              Book services
            </span>
            <span className="text-xs text-slate-500">
              I&apos;m a customer
            </span>
          </button>
        </div>
      </div>

      {/* OAuth */}
      <OAuthButtons callbackUrl={role === 'pro' ? '/onboarding' : '/'} />

      {/* Divider */}
      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-slate-200" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-white px-3 text-slate-400 font-medium tracking-wider">
            or sign up with email
          </span>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="name"
            className="block text-sm font-medium text-slate-700 mb-1.5"
          >
            Full name
          </label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="John Doe"
            required
            autoComplete="name"
            className="w-full px-4 py-3 rounded-xl border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200"
          />
        </div>

        <div>
          <label
            htmlFor="signup-email"
            className="block text-sm font-medium text-slate-700 mb-1.5"
          >
            Email
          </label>
          <input
            id="signup-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
            autoComplete="email"
            className="w-full px-4 py-3 rounded-xl border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200"
          />
        </div>

        <div>
          <label
            htmlFor="signup-password"
            className="block text-sm font-medium text-slate-700 mb-1.5"
          >
            Password
          </label>
          <div className="relative">
            <input
              id="signup-password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              autoComplete="new-password"
              className="w-full px-4 py-3 pr-12 rounded-xl border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              {showPassword ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
            </button>
          </div>

          {/* Password strength */}
          {password.length > 0 && (
            <div className="mt-3 space-y-1.5">
              {[
                { key: 'length', label: 'At least 8 characters' },
                { key: 'uppercase', label: 'One uppercase letter' },
                { key: 'number', label: 'One number' },
              ].map(({ key, label }) => (
                <div key={key} className="flex items-center gap-2">
                  <div
                    className={`w-4 h-4 rounded-full flex items-center justify-center transition-colors ${
                      checks[key as keyof typeof checks]
                        ? 'bg-emerald-500'
                        : 'bg-slate-200'
                    }`}
                  >
                    {checks[key as keyof typeof checks] && (
                      <Check className="w-2.5 h-2.5 text-white" />
                    )}
                  </div>
                  <span
                    className={`text-xs ${
                      checks[key as keyof typeof checks]
                        ? 'text-emerald-600'
                        : 'text-slate-400'
                    }`}
                  >
                    {label}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={loading || !allChecks}
          className="w-full py-3 px-4 rounded-xl bg-blue-500 text-white font-semibold text-sm hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed mt-2"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <svg
                className="w-4 h-4 animate-spin"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
              Creating account...
            </span>
          ) : (
            'Create account'
          )}
        </button>
      </form>

      {/* Terms */}
      <p className="mt-4 text-center text-xs text-slate-400">
        By signing up, you agree to our{' '}
        <Link href="/terms" className="text-blue-500 hover:underline">
          Terms
        </Link>{' '}
        and{' '}
        <Link href="/privacy" className="text-blue-500 hover:underline">
          Privacy Policy
        </Link>
      </p>

      {/* Sign in link */}
      <p className="mt-6 text-center text-sm text-slate-500">
        Already have an account?{' '}
        <Link
          href="/auth/sign-in"
          className="text-blue-500 hover:text-blue-600 font-semibold"
        >
          Sign in
        </Link>
      </p>
    </div>
  );
}