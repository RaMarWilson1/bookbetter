// src/app/auth/layout.tsx
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'BookBetter — Sign In',
  description: 'Sign in to your BookBetter account',
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex">
      {/* Left panel — branding */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        {/* Subtle grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />
        {/* Gradient orb */}
        <div className="absolute top-1/4 -left-20 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-0 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl" />

        <div className="relative z-10 flex flex-col justify-between p-12 w-full">
          {/* Logo */}
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              Book<span className="text-blue-400">Better</span>
            </h1>
          </div>

          {/* Tagline */}
          <div className="max-w-md">
            <p className="text-3xl font-semibold text-white leading-tight mb-4">
              Your schedule.{' '}
              <span className="text-blue-400">Your rules.</span>
            </p>
            <p className="text-slate-400 text-lg leading-relaxed">
              The booking platform built for independent professionals. 
              Manage clients, accept payments, and grow your business — all in one place.
            </p>
          </div>

          {/* Social proof */}
          <div className="flex items-center gap-3">
            <div className="flex -space-x-2">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="w-8 h-8 rounded-full bg-gradient-to-br from-slate-600 to-slate-700 border-2 border-slate-800 flex items-center justify-center"
                >
                  <span className="text-xs text-slate-300 font-medium">
                    {String.fromCharCode(64 + i)}
                  </span>
                </div>
              ))}
            </div>
            <p className="text-sm text-slate-400">
              Join thousands of pros already using BookBetter
            </p>
          </div>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12 bg-white">
        <div className="w-full max-w-md">{children}</div>
      </div>
    </div>
  );
}