// src/app/dashboard/team/_components/team-content.tsx
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Users,
  UserPlus,
  Mail,
  Shield,
  Crown,
  MoreVertical,
  Trash2,
  Clock,
  Lock,
  ArrowRight,
  CreditCard,
} from 'lucide-react';

interface TeamContentProps {
  tenantName: string;
  plan: string;
  currentUserRole: string;
  currentUserId: string;
}

interface TeamMember {
  id: string;
  userId: string;
  role: string;
  active: boolean;
  createdAt: string;
  name: string | null;
  email: string;
  image: string | null;
  stripeAccountId: string | null;
  stripeOnboardingComplete: boolean | null;
}

interface PendingInvite {
  id: string;
  email: string;
  role: string;
  status: string;
  createdAt: string;
  expiresAt: string;
}

export function TeamContent({
  tenantName,
  plan,
  currentUserRole,
  currentUserId,
}: TeamContentProps) {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [invites, setInvites] = useState<PendingInvite[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'staff' | 'manager'>('staff');
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [actionMenu, setActionMenu] = useState<string | null>(null);

  const canManageStaff = currentUserRole === 'owner' || currentUserRole === 'manager';
  const isBusinessPlan = plan === 'business';

  const fetchTeam = async () => {
    try {
      const res = await fetch('/api/dashboard/team');
      const data = await res.json();
      if (res.ok) {
        setMembers(data.members || []);
        setInvites(data.invites || []);
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeam();
  }, []);

  const [successMessage, setSuccessMessage] = useState('');

  const handleInvite = async () => {
    if (!inviteEmail) return;
    setSending(true);
    setError('');
    setSuccessMessage('');

    try {
      const res = await fetch('/api/dashboard/team', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: inviteEmail, role: inviteRole }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to send invite');
        return;
      }

      // Show billing warning if extra staff cost applies
      if (data.billing) {
        setSuccessMessage(`Invite sent! Note: ${data.billing.message}`);
      } else {
        setSuccessMessage('Invite sent!');
      }

      setInviteEmail('');
      setShowInviteForm(false);
      fetchTeam();
    } catch {
      setError('Something went wrong');
    } finally {
      setSending(false);
    }
  };

  const handleUpdateRole = async (memberId: string, newRole: string) => {
    try {
      await fetch(`/api/dashboard/team/${memberId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole }),
      });
      setActionMenu(null);
      fetchTeam();
    } catch {
      // silently fail
    }
  };

  const handleRemove = async (memberId: string) => {
    if (!confirm('Remove this team member?')) return;
    try {
      await fetch(`/api/dashboard/team/${memberId}`, { method: 'DELETE' });
      setActionMenu(null);
      fetchTeam();
    } catch {
      // silently fail
    }
  };

  const handleRevokeInvite = async (inviteId: string) => {
    try {
      await fetch(`/api/dashboard/team/${inviteId}?type=invite`, { method: 'DELETE' });
      fetchTeam();
    } catch {
      // silently fail
    }
  };

  const roleIcon = (role: string) => {
    if (role === 'owner') return <Crown className="w-3.5 h-3.5 text-amber-500" />;
    if (role === 'manager') return <Shield className="w-3.5 h-3.5 text-blue-500" />;
    return <Users className="w-3.5 h-3.5 text-slate-400" />;
  };

  const roleBadgeColor = (role: string) => {
    if (role === 'owner') return 'bg-amber-100 text-amber-700';
    if (role === 'manager') return 'bg-blue-100 text-blue-700';
    return 'bg-slate-100 text-slate-600';
  };

  // Gate: if not on Business plan, show upgrade prompt
  if (!isBusinessPlan) {
    return (
      <div className="max-w-2xl space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Team</h2>
          <p className="text-slate-500 mt-1">Manage your staff and roles.</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200/60 p-8 text-center">
          <div className="w-14 h-14 bg-violet-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Lock className="w-7 h-7 text-violet-600" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 mb-2">Multi-Staff is a Business Feature</h3>
          <p className="text-sm text-slate-500 mb-4 max-w-sm mx-auto">
            Add team members, assign roles, and manage multiple calendars with the Business plan.
          </p>
          <Link
            href="/dashboard/settings/billing"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white text-sm font-medium rounded-lg hover:bg-slate-800 transition-colors"
          >
            View plans
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Team</h2>
          <p className="text-slate-500 mt-1">{tenantName} — manage your staff and roles.</p>
        </div>
        {canManageStaff && (
          <button
            onClick={() => setShowInviteForm(!showInviteForm)}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-900 text-white text-sm font-medium rounded-lg hover:bg-slate-800 transition-colors"
          >
            <UserPlus className="w-4 h-4" />
            Invite
          </button>
        )}
      </div>

      {/* Invite Form */}
      {showInviteForm && (
        <div className="bg-white rounded-xl border border-slate-200/60 p-5">
          <h3 className="font-semibold text-slate-900 mb-3">Invite a team member</h3>
          <div className="flex items-end gap-3">
            <div className="flex-1">
              <label className="block text-sm text-slate-600 mb-1">Email</label>
              <input
                type="email"
                value={inviteEmail}
                onChange={(e) => { setInviteEmail(e.target.value); setError(''); }}
                placeholder="name@example.com"
                className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
            <div className="w-32">
              <label className="block text-sm text-slate-600 mb-1">Role</label>
              <select
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value as 'staff' | 'manager')}
                className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              >
                <option value="staff">Staff</option>
                {currentUserRole === 'owner' && <option value="manager">Manager</option>}
              </select>
            </div>
            <button
              onClick={handleInvite}
              disabled={sending || !inviteEmail}
              className="px-4 py-2.5 bg-blue-500 text-white text-sm font-medium rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50"
            >
              {sending ? 'Sending...' : 'Send Invite'}
            </button>
          </div>
          {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
          <p className="text-xs text-slate-400 mt-2">
            They&apos;ll receive an invite link valid for 7 days.
          </p>
          {members.filter((m) => m.active).length >= 5 && (
            <p className="text-xs text-amber-600 mt-1">
              Your plan includes 5 staff. This invite will add $10/mo to your subscription for the extra member.
            </p>
          )}
        </div>
      )}

      {/* Success / billing warning message */}
      {successMessage && (
        <div className={`rounded-xl p-4 text-sm ${
          successMessage.includes('Note:')
            ? 'bg-amber-50 border border-amber-200 text-amber-800'
            : 'bg-emerald-50 border border-emerald-200 text-emerald-800'
        }`}>
          {successMessage}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="bg-white rounded-xl border border-slate-200/60 p-8 text-center">
          <div className="w-6 h-6 border-2 border-slate-200 border-t-slate-900 rounded-full animate-spin mx-auto" />
        </div>
      )}

      {/* Team Members */}
      {!loading && (
        <div className="bg-white rounded-xl border border-slate-200/60 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
            <Users className="w-4 h-4 text-slate-500" />
            <h3 className="font-semibold text-slate-900">
              Team Members ({members.filter((m) => m.active).length})
            </h3>
          </div>

          <div className="divide-y divide-slate-100">
            {members
              .filter((m) => m.active)
              .map((member) => (
                <div key={member.id} className="px-5 py-3.5 flex items-center gap-3">
                  {member.image ? (
                    <>{/* eslint-disable-next-line @next/next/no-img-element */}<img src={member.image} alt="" className="w-9 h-9 rounded-full object-cover" /></>
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 text-sm font-medium">
                      {(member.name || member.email)[0].toUpperCase()}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">
                      {member.name || member.email}
                      {member.userId === currentUserId && (
                        <span className="text-xs text-slate-400 ml-1">(you)</span>
                      )}
                    </p>
                    <p className="text-xs text-slate-400 truncate">{member.email}</p>
                  </div>
                  <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${roleBadgeColor(member.role)}`}>
                    {roleIcon(member.role)}
                    <span className="capitalize">{member.role}</span>
                  </div>
                  {member.stripeOnboardingComplete ? (
                    <span className="flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700">
                      <CreditCard className="w-3 h-3" />
                      Stripe
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-600">
                      <CreditCard className="w-3 h-3" />
                      No Stripe
                    </span>
                  )}
                  {canManageStaff && member.role !== 'owner' && member.userId !== currentUserId && (
                    <div className="relative">
                      <button
                        onClick={() => setActionMenu(actionMenu === member.id ? null : member.id)}
                        className="p-1.5 hover:bg-slate-100 rounded-md transition-colors"
                      >
                        <MoreVertical className="w-4 h-4 text-slate-400" />
                      </button>
                      {actionMenu === member.id && (
                        <div className="absolute right-0 top-8 bg-white rounded-lg shadow-lg border border-slate-200 py-1 w-40 z-10">
                          {member.role === 'staff' && currentUserRole === 'owner' && (
                            <button
                              onClick={() => handleUpdateRole(member.id, 'manager')}
                              className="w-full px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                            >
                              <Shield className="w-3.5 h-3.5" />
                              Make Manager
                            </button>
                          )}
                          {member.role === 'manager' && currentUserRole === 'owner' && (
                            <button
                              onClick={() => handleUpdateRole(member.id, 'staff')}
                              className="w-full px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                            >
                              <Users className="w-3.5 h-3.5" />
                              Make Staff
                            </button>
                          )}
                          <button
                            onClick={() => handleRemove(member.id)}
                            className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            Remove
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Pending Invites */}
      {!loading && invites.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200/60 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
            <Mail className="w-4 h-4 text-slate-500" />
            <h3 className="font-semibold text-slate-900">Pending Invites ({invites.length})</h3>
          </div>

          <div className="divide-y divide-slate-100">
            {invites.map((invite) => (
              <div key={invite.id} className="px-5 py-3.5 flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-amber-100 flex items-center justify-center">
                  <Clock className="w-4 h-4 text-amber-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900 truncate">{invite.email}</p>
                  <p className="text-xs text-slate-400">
                    Expires {new Date(invite.expiresAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
                  <span className="capitalize">{invite.role}</span>
                </div>
                {canManageStaff && (
                  <button
                    onClick={() => handleRevokeInvite(invite.id)}
                    className="text-xs text-red-500 hover:text-red-600 font-medium"
                  >
                    Revoke
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Role info */}
      <div className="bg-slate-50 rounded-xl p-4">
        <h4 className="text-sm font-medium text-slate-700 mb-2">Role permissions</h4>
        <div className="grid grid-cols-3 gap-3 text-xs text-slate-500">
          <div>
            <p className="font-medium text-amber-700 mb-1 flex items-center gap-1">
              <Crown className="w-3 h-3" /> Owner
            </p>
            <p>Full access. Billing, settings, team management, and all features.</p>
          </div>
          <div>
            <p className="font-medium text-blue-700 mb-1 flex items-center gap-1">
              <Shield className="w-3 h-3" /> Manager
            </p>
            <p>Manage services, staff, settings. View all appointments and clients.</p>
          </div>
          <div>
            <p className="font-medium text-slate-600 mb-1 flex items-center gap-1">
              <Users className="w-3 h-3" /> Staff
            </p>
            <p>View own appointments and manage own availability only.</p>
          </div>
        </div>
      </div>
    </div>
  );
}