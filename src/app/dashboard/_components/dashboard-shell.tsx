// src/app/dashboard/_components/dashboard-shell.tsx
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import {
  LayoutDashboard,
  Calendar,
  Scissors,
  Clock,
  Users,
  Star,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronDown,
  Bell,
  UserPlus,
  CreditCard,
} from 'lucide-react';

interface DashboardShellProps {
  user: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
    role: string;
  };
  children: React.ReactNode;
}

const navItems = [
  { label: 'Overview', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Appointments', href: '/dashboard/appointments', icon: Calendar },
  { label: 'Services', href: '/dashboard/services', icon: Scissors },
  { label: 'Availability', href: '/dashboard/availability', icon: Clock },
  { label: 'Clients', href: '/dashboard/clients', icon: Users },
  { label: 'Reviews', href: '/dashboard/reviews', icon: Star },
  { label: 'Team', href: '/dashboard/team', icon: UserPlus },
];

const bottomNavItems = [
  { label: 'Settings', href: '/dashboard/settings', icon: Settings },
];

export function DashboardShell({ user, children }: DashboardShellProps) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const initials = user.name
    ? user.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : user.email?.[0]?.toUpperCase() || '?';

  const isActive = (href: string) => {
    if (href === '/dashboard') return pathname === '/dashboard';
    return pathname.startsWith(href);
  };

  const NavLink = ({ item, onClick }: { item: typeof navItems[0]; onClick?: () => void }) => {
    const active = isActive(item.href);
    const Icon = item.icon;
    return (
      <Link
        href={item.href}
        onClick={onClick}
        className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
          active
            ? 'bg-slate-900 text-white'
            : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
        }`}
      >
        <Icon className="w-[18px] h-[18px] shrink-0" />
        {item.label}
      </Link>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-50 h-full w-64 bg-slate-950 flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Logo */}
        <div className="flex items-center justify-between px-5 h-16 border-b border-slate-800/60">
          <Link href="/dashboard" className="text-lg font-bold text-white tracking-tight">
            Book<span className="text-blue-400">Better</span>
          </Link>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-1 text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Main nav */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.href}
              item={item}
              onClick={() => setSidebarOpen(false)}
            />
          ))}
        </nav>

        {/* Bottom nav */}
        <div className="px-3 py-3 border-t border-slate-800/60 space-y-1">
          {bottomNavItems.map((item) => (
            <NavLink
              key={item.href}
              item={item}
              onClick={() => setSidebarOpen(false)}
            />
          ))}

          {/* User */}
          <div className="relative">
            <button
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm hover:bg-slate-800/60 transition-all duration-150"
            >
              {user.image ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={user.image}
                  alt=""
                  className="w-8 h-8 rounded-full object-cover"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center text-xs font-bold">
                  {initials}
                </div>
              )}
              <div className="flex-1 text-left min-w-0">
                <p className="text-white font-medium truncate text-sm">
                  {user.name || 'User'}
                </p>
                <p className="text-slate-500 truncate text-xs">
                  {user.email}
                </p>
              </div>
              <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform ${userMenuOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* User dropdown */}
            {userMenuOpen && (
              <div className="absolute bottom-full left-0 right-0 mb-1 bg-slate-900 border border-slate-800 rounded-lg shadow-xl overflow-hidden">
                <Link
                  href="/dashboard/settings"
                  className="flex items-center gap-2 px-4 py-2.5 text-sm text-slate-300 hover:bg-slate-800 transition-colors"
                  onClick={() => { setUserMenuOpen(false); setSidebarOpen(false); }}
                >
                  <Settings className="w-4 h-4" />
                  Settings
                </Link>
                <button
                  onClick={() => signOut({ callbackUrl: '/' })}
                  className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-400 hover:bg-slate-800 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Sign out
                </button>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Main content area */}
      <div className="lg:pl-64">
        {/* Top bar */}
        <header className="sticky top-0 z-30 h-16 bg-white/80 backdrop-blur-md border-b border-slate-200/60 flex items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 -ml-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>
            <h1 className="text-lg font-semibold text-slate-900 hidden sm:block">
              {navItems.find((item) => isActive(item.href))?.label ||
                bottomNavItems.find((item) => isActive(item.href))?.label ||
                'Dashboard'}
            </h1>
          </div>

          <div className="flex items-center gap-2">
            {/* Notifications */}
            <button className="relative p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-blue-500 rounded-full" />
            </button>

            {/* Mobile user avatar */}
            <div className="lg:hidden">
              {user.image ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={user.image}
                  alt=""
                  className="w-8 h-8 rounded-full object-cover"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-blue-500/10 text-blue-600 flex items-center justify-center text-xs font-bold">
                  {initials}
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}