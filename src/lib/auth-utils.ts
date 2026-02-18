// lib/auth-utils.ts

import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';

/**
 * Get the current session in a server component.
 * Redirects to sign-in if not authenticated.
 */
export async function getRequiredSession() {
  const session = await auth();

  if (!session?.user) {
    redirect('/auth/sign-in');
  }

  return session;
}

/**
 * Get the current session in a server component.
 * Returns null if not authenticated (no redirect).
 */
export async function getOptionalSession() {
  return await auth();
}

/**
 * Require the user to have a specific role.
 * Redirects to home if role doesn't match.
 */
export async function requireRole(role: string | string[]) {
  const session = await getRequiredSession();
  const roles = Array.isArray(role) ? role : [role];

  if (!roles.includes(session.user.role)) {
    redirect('/');
  }

  return session;
}