// src/app/auth/error/page.tsx
'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { AlertCircle } from 'lucide-react';

const errorMessages: Record<string, string> = {
  Configuration: 'There is a problem with the server configuration.',
  AccessDenied: 'Access was denied. You may not have permission to sign in.',
  Verification: 'The verification link has expired or has already been used.',
  OAuthSignin: 'Could not start the sign-in process. Please try again.',
  OAuthCallback: 'Could not complete the sign-in process. Please try again.',
  OAuthCreateAccount: 'Could not create your account. An account with this email may already exist.',
  EmailCreateAccount: 'Could not create your account. Please try again.',
  Callback: 'Something went wrong during sign-in. Please try again.',
  OAuthAccountNotLinked: 'This email is already associated with another sign-in method. Please use your original sign-in method.',
  Default: 'An unexpected error occurred. Please try again.',
};

function ErrorContent() {
  const searchParams = useSearchParams();
  const errorType = searchParams.get('error') || 'Default';
  const message = errorMessages[errorType] || errorMessages.Default;

  return (
    <div className="text-center">
      <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-6">
        <AlertCircle className="w-8 h-8 text-red-500" />
      </div>

      <h2 className="text-2xl font-bold text-slate-900 mb-2">
        Sign-in error
      </h2>
      <p className="text-slate-500 mb-8">{message}</p>

      <div className="space-y-3">
        <Link
          href="/auth/sign-in"
          className="block w-full py-3 px-4 rounded-xl bg-blue-500 text-white font-semibold text-sm hover:bg-blue-600 transition-all duration-200 text-center"
        >
          Try again
        </Link>
        <Link
          href="/"
          className="block w-full py-3 px-4 rounded-xl border border-slate-200 text-slate-700 font-medium text-sm hover:bg-slate-50 transition-all duration-200 text-center"
        >
          Back to home
        </Link>
      </div>
    </div>
  );
}

export default function AuthErrorPage() {
  return (
    <Suspense fallback={<div className="animate-pulse text-center py-20 text-slate-400">Loading...</div>}>
      <ErrorContent />
    </Suspense>
  );
}