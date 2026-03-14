// src/app/_components/navbar.tsx
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import {
  Calendar,
  LayoutDashboard,
  LogOut,
  ChevronDown,
  User,
  Menu,
  X,
} from 'lucide-react';

export function Navbar() {
  const { data: session, status } = useSession();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  const isLoggedIn = status === 'authenticated' && !!session?.user;
  const isPro = session?.user?.role === 'pro' || session?.user?.role === 'staff';
  const firstName = session?.user?.name?.split(' ')[0];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link href="/" className="text-xl font-bold text-gray-900 tracking-tight">
            Book<span className="text-blue-500">Better</span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center space-x-8">
            <Link href="#how-it-works" className="text-gray-600 hover:text-gray-900 transition-colors">
              How It Works
            </Link>
            <Link href="#pricing" className="text-gray-600 hover:text-gray-900 transition-colors">
              Pricing
            </Link>
            <Link href="/help" className="text-gray-600 hover:text-gray-900 transition-colors">
              Help
            </Link>

            {isLoggedIn ? (
              <>
                {/* My Bookings — visible to all logged-in users */}
                <Link
                  href="/my-bookings"
                  className="text-gray-600 hover:text-gray-900 transition-colors flex items-center gap-1.5"
                >
                  <Calendar className="w-4 h-4" />
                  My Bookings
                </Link>

                {/* User dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex items-center gap-2 text-gray-700 hover:text-gray-900 transition-colors"
                  >
                    {session.user.image ? (
                      <img
                        src={session.user.image}
                        alt=""
                        className="w-7 h-7 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-7 h-7 rounded-full bg-slate-200 flex items-center justify-center">
                        <User className="w-4 h-4 text-slate-500" />
                      </div>
                    )}
                    <span className="text-sm font-medium">{firstName || 'Account'}</span>
                    <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showUserMenu ? 'rotate-180' : ''}`} />
                  </button>

                  {showUserMenu && (
                    <>
                      <div
                        className="fixed inset-0 z-10"
                        onClick={() => setShowUserMenu(false)}
                      />
                      <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl border border-slate-200 shadow-lg py-1 z-20">
                        {isPro && (
                          <Link
                            href="/dashboard"
                            onClick={() => setShowUserMenu(false)}
                            className="flex items-center gap-2 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                          >
                            <LayoutDashboard className="w-4 h-4 text-slate-400" />
                            Pro Dashboard
                          </Link>
                        )}
                        <Link
                          href="/my-bookings"
                          onClick={() => setShowUserMenu(false)}
                          className="flex items-center gap-2 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                        >
                          <Calendar className="w-4 h-4 text-slate-400" />
                          My Bookings
                        </Link>
                        <div className="border-t border-slate-100 my-1" />
                        <button
                          onClick={() => {
                            setShowUserMenu(false);
                            signOut({ callbackUrl: '/' });
                          }}
                          className="flex items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors w-full text-left"
                        >
                          <LogOut className="w-4 h-4" />
                          Sign Out
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </>
            ) : (
              <>
                <Link
                  href="/auth/sign-in"
                  className="text-gray-600 hover:text-gray-900 transition-colors font-medium"
                >
                  Sign In
                </Link>
                <Link
                  href="/auth/sign-up"
                  className="bg-black text-white px-6 py-2 rounded-lg hover:bg-gray-800 transition-colors font-medium"
                >
                  Get Started Free
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setShowMobileMenu(!showMobileMenu)}
            className="md:hidden p-2 text-gray-600 hover:text-gray-900"
          >
            {showMobileMenu ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        {showMobileMenu && (
          <div className="md:hidden border-t border-gray-100 py-4 space-y-1">
            <Link
              href="#how-it-works"
              onClick={() => setShowMobileMenu(false)}
              className="block px-3 py-2.5 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors"
            >
              How It Works
            </Link>
            <Link
              href="#pricing"
              onClick={() => setShowMobileMenu(false)}
              className="block px-3 py-2.5 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors"
            >
              Pricing
            </Link>
            <Link
              href="/help"
              onClick={() => setShowMobileMenu(false)}
              className="block px-3 py-2.5 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors"
            >
              Help
            </Link>

            {isLoggedIn ? (
              <>
                <div className="border-t border-gray-100 my-2" />
                <Link
                  href="/my-bookings"
                  onClick={() => setShowMobileMenu(false)}
                  className="flex items-center gap-2 px-3 py-2.5 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors font-medium"
                >
                  <Calendar className="w-4 h-4" />
                  My Bookings
                </Link>
                {isPro && (
                  <Link
                    href="/dashboard"
                    onClick={() => setShowMobileMenu(false)}
                    className="flex items-center gap-2 px-3 py-2.5 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors font-medium"
                  >
                    <LayoutDashboard className="w-4 h-4" />
                    Pro Dashboard
                  </Link>
                )}
                <button
                  onClick={() => {
                    setShowMobileMenu(false);
                    signOut({ callbackUrl: '/' });
                  }}
                  className="flex items-center gap-2 px-3 py-2.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors w-full text-left"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <div className="border-t border-gray-100 my-2" />
                <Link
                  href="/auth/sign-in"
                  onClick={() => setShowMobileMenu(false)}
                  className="block px-3 py-2.5 text-gray-900 font-medium hover:bg-gray-50 rounded-lg transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  href="/auth/sign-up"
                  onClick={() => setShowMobileMenu(false)}
                  className="block mx-3 mt-2 text-center bg-black text-white px-6 py-2.5 rounded-lg hover:bg-gray-800 transition-colors font-medium"
                >
                  Get Started Free
                </Link>
              </>
            )}
          </div>
        )}
      </nav>
    </header>
  );
}