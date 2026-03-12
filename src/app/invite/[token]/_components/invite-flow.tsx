// src/app/invite/[token]/_components/invite-flow.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Users, Check, X, LogIn } from 'lucide-react';
import Link from 'next/link';

interface InviteFlowProps {
  token: string;
}

interface InviteDetails {
  email: string;
  role: string;
  businessName: string;
}

export function InviteFlow({ token }: InviteFlowProps) {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [invite, setInvite] = useState<InviteDetails | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [accepted, setAccepted] = useState(false);

  useEffect(() => {
    const fetchInvite = async () => {
      try {
        const res = await fetch(`/api/invite/${token}`);
        const data = await res.json();

        if (!res.ok) {
          setError(data.error || 'Invalid invite');
          return;
        }

        setInvite(data);
      } catch {
        setError('Something went wrong');
      } finally {
        setLoading(false);
      }
    };

    fetchInvite();
  }, [token]);

  const handleAccept = async () => {
    setAccepting(true);
    setError('');

    try {
      const res = await fetch(`/api/invite/${token}`, { method: 'POST' });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to accept invite');
        return;
      }

      setAccepted(true);
      setTimeout(() => router.push('/dashboard'), 2000);
    } catch {
      setError('Something went wrong');
    } finally {
      setAccepting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8">
          {/* Logo */}
          <div className="text-center mb-6">
            <p className="text-lg font-bold text-slate-900">
              Book<span className="text-blue-500">Better</span>
            </p>
          </div>

          {loading && (
            <div className="text-center py-8">
              <div className="w-8 h-8 border-2 border-slate-200 border-t-slate-900 rounded-full animate-spin mx-auto" />
              <p className="text-sm text-slate-500 mt-3">Loading invite...</p>
            </div>
          )}

          {error && !invite && (
            <div className="text-center py-8">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <X className="w-6 h-6 text-red-500" />
              </div>
              <p className="text-sm text-red-600 font-medium">{error}</p>
              <Link href="/" className="text-sm text-blue-500 hover:text-blue-600 mt-3 inline-block">
                Go to homepage
              </Link>
            </div>
          )}

          {accepted && (
            <div className="text-center py-8">
              <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Check className="w-6 h-6 text-emerald-500" />
              </div>
              <h2 className="text-lg font-bold text-slate-900 mb-1">Youre on the team!</h2>
              <p className="text-sm text-slate-500">Redirecting to dashboard...</p>
            </div>
          )}

          {invite && !accepted && (
            <>
              <div className="text-center mb-6">
                <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="w-7 h-7 text-blue-600" />
                </div>
                <h2 className="text-xl font-bold text-slate-900 mb-1">Team Invite</h2>
                <p className="text-sm text-slate-500">
                  Youve been invited to join <span className="font-semibold text-slate-700">{invite.businessName}</span> as{' '}
                  {invite.role === 'manager' ? 'a manager' : 'a staff member'}.
                </p>
              </div>

              <div className="bg-slate-50 rounded-lg p-4 mb-6 text-sm">
                <div className="flex justify-between mb-2">
                  <span className="text-slate-500">Business</span>
                  <span className="font-medium text-slate-900">{invite.businessName}</span>
                </div>
                <div className="flex justify-between mb-2">
                  <span className="text-slate-500">Role</span>
                  <span className="font-medium text-slate-900 capitalize">{invite.role}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Invited as</span>
                  <span className="font-medium text-slate-900">{invite.email}</span>
                </div>
              </div>

              {error && (
                <p className="text-sm text-red-600 mb-4 text-center">{error}</p>
              )}

              {status === 'loading' ? (
                <div className="text-center py-4">
                  <div className="w-6 h-6 border-2 border-slate-200 border-t-slate-900 rounded-full animate-spin mx-auto" />
                </div>
              ) : session?.user ? (
                <div className="space-y-3">
                  <p className="text-xs text-slate-400 text-center">
                    Signed in as {session.user.email}
                  </p>
                  <button
                    onClick={handleAccept}
                    disabled={accepting}
                    className="w-full py-3 bg-slate-900 text-white text-sm font-semibold rounded-lg hover:bg-slate-800 transition-colors disabled:opacity-50"
                  >
                    {accepting ? 'Joining...' : 'Accept & Join Team'}
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm text-slate-600 text-center">
                    Sign in with <span className="font-medium">{invite.email}</span> to accept this invite.
                  </p>
                  <Link
                    href={`/auth/sign-in?callbackUrl=/invite/${token}`}
                    className="flex items-center justify-center gap-2 w-full py-3 bg-slate-900 text-white text-sm font-semibold rounded-lg hover:bg-slate-800 transition-colors"
                  >
                    <LogIn className="w-4 h-4" />
                    Sign In
                  </Link>
                  <Link
                    href={`/auth/sign-up?callbackUrl=/invite/${token}`}
                    className="block text-center text-sm text-blue-500 hover:text-blue-600 font-medium"
                  >
                    Dont have an account? Sign up
                  </Link>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}