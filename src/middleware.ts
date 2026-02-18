//src/middleware.ts

import { auth } from '@/lib/auth';
import { NextResponse } from 'next/server';

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isLoggedIn = !!req.auth;

  // Protected routes
  const protectedPaths = ['/dashboard', '/onboarding'];
  const isProtected = protectedPaths.some((path) => pathname.startsWith(path));

  // Auth pages (redirect if already logged in)
  const authPaths = ['/auth/sign-in', '/auth/sign-up'];
  const isAuthPage = authPaths.some((path) => pathname.startsWith(path));

  if (isProtected && !isLoggedIn) {
    const signInUrl = new URL('/auth/sign-in', req.url);
    signInUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(signInUrl);
  }

  if (isAuthPage && isLoggedIn) {
    // Redirect logged-in users based on role
    const role = req.auth?.user?.role;
    if (role === 'pro') {
      return NextResponse.redirect(new URL('/dashboard', req.url));
    }
    return NextResponse.redirect(new URL('/', req.url));
  }

  // Pro dashboard access check
  if (pathname.startsWith('/dashboard') && isLoggedIn) {
    const role = req.auth?.user?.role;
    if (role !== 'pro' && role !== 'staff') {
      return NextResponse.redirect(new URL('/', req.url));
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: ['/dashboard/:path*', '/onboarding/:path*', '/auth/:path*'],
};