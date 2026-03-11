// src/app/search/_components/search-content.tsx
'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Search,
  MapPin,
  Star,
  ArrowRight,
  SlidersHorizontal,
  X,
} from 'lucide-react';

const CATEGORIES = [
  { value: 'all', label: 'All', emoji: '🔍' },
  { value: 'barber', label: 'Barbers', emoji: '💈' },
  { value: 'hair_salon', label: 'Hair Salons', emoji: '💇' },
  { value: 'nail_salon', label: 'Nail Salons', emoji: '💅' },
  { value: 'tattoo', label: 'Tattoo', emoji: '🎨' },
  { value: 'massage', label: 'Massage', emoji: '💆' },
  { value: 'spa', label: 'Spa', emoji: '🧖' },
  { value: 'fitness', label: 'Fitness', emoji: '🏋️' },
  { value: 'beauty', label: 'Beauty', emoji: '✨' },
  { value: 'photography', label: 'Photo', emoji: '📸' },
  { value: 'consulting', label: 'Consulting', emoji: '📋' },
  { value: 'tutoring', label: 'Tutoring', emoji: '📚' },
];

interface Business {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  city: string | null;
  state: string | null;
  logo: string | null;
  primaryColor: string | null;
  phone: string | null;
  avgRating: number | null;
  totalReviews: number;
  serviceCount: number;
  startingPrice: number | null;
}

const formatPrice = (cents: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(cents / 100);

export function SearchContent({ businesses }: { businesses: Business[] }) {
  const [query, setQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [locationFilter, setLocationFilter] = useState('');

  const filtered = useMemo(() => {
    return businesses.filter((biz) => {
      // Text search
      if (query) {
        const q = query.toLowerCase();
        const matchesName = biz.name.toLowerCase().includes(q);
        const matchesDesc = biz.description?.toLowerCase().includes(q);
        if (!matchesName && !matchesDesc) return false;
      }

      // Location filter
      if (locationFilter) {
        const loc = locationFilter.toLowerCase();
        const matchesCity = biz.city?.toLowerCase().includes(loc);
        const matchesState = biz.state?.toLowerCase().includes(loc);
        if (!matchesCity && !matchesState) return false;
      }

      return true;
    });
  }, [businesses, query, selectedCategory, locationFilter]);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200/60">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold text-slate-900 tracking-tight">
            Book<span className="text-blue-500">Better</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link
              href="/auth/sign-in"
              className="text-sm text-slate-600 hover:text-slate-900 font-medium hidden sm:block"
            >
              Sign In
            </Link>
            <Link
              href="/auth/sign-up"
              className="text-sm bg-slate-900 text-white px-4 py-2 rounded-lg hover:bg-slate-800 font-medium"
            >
              Get Started
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {/* Hero */}
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-2">
            Find your professional
          </h1>
          <p className="text-slate-500">
            Browse and book with top service professionals.
          </p>
        </div>

        {/* Search & Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={locationFilter}
              onChange={(e) => setLocationFilter(e.target.value)}
              placeholder="City or state"
              className="w-full sm:w-48 pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex gap-2 overflow-x-auto pb-4 mb-6 scrollbar-hide">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.value}
              onClick={() => setSelectedCategory(cat.value)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                selectedCategory === cat.value
                  ? 'bg-slate-900 text-white'
                  : 'bg-white text-slate-600 border border-slate-200 hover:border-slate-300 hover:shadow-sm'
              }`}
            >
              <span>{cat.emoji}</span>
              {cat.label}
            </button>
          ))}
        </div>

        {/* Results Count */}
        <p className="text-sm text-slate-500 mb-4">
          {filtered.length} {filtered.length === 1 ? 'professional' : 'professionals'} found
        </p>

        {/* Results Grid */}
        {filtered.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200/60 p-12 text-center">
            <Search className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 font-medium">No professionals found</p>
            <p className="text-sm text-slate-400 mt-1">
              Try adjusting your search or filters.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((biz) => (
              <Link
                key={biz.id}
                href={`/book/${biz.slug}`}
                className="group bg-white rounded-xl border border-slate-200/60 overflow-hidden hover:shadow-md hover:border-slate-300 transition-all duration-200"
              >
                {/* Color Banner */}
                <div
                  className="h-2"
                  style={{ backgroundColor: biz.primaryColor || '#3B82F6' }}
                />

                <div className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      {/* Logo/Avatar */}
                      {biz.logo ? (
                        <img
                          src={biz.logo}
                          alt=""
                          className="w-11 h-11 rounded-full object-cover"
                        />
                      ) : (
                        <div
                          className="w-11 h-11 rounded-full flex items-center justify-center text-white font-bold text-sm"
                          style={{ backgroundColor: biz.primaryColor || '#3B82F6' }}
                        >
                          {biz.name
                            .split(' ')
                            .map((w) => w[0])
                            .join('')
                            .slice(0, 2)
                            .toUpperCase()}
                        </div>
                      )}
                      <div>
                        <h3 className="font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">
                          {biz.name}
                        </h3>
                        {(biz.city || biz.state) && (
                          <p className="text-xs text-slate-400 flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {[biz.city, biz.state].filter(Boolean).join(', ')}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {biz.description && (
                    <p className="text-sm text-slate-500 line-clamp-2 mb-3">
                      {biz.description}
                    </p>
                  )}

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 text-sm">
                      {biz.totalReviews > 0 && (
                        <span className="flex items-center gap-1 text-slate-600">
                          <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                          <span className="font-medium">{biz.avgRating?.toFixed(1)}</span>
                          <span className="text-slate-400">({biz.totalReviews})</span>
                        </span>
                      )}
                      {biz.startingPrice && (
                        <span className="text-slate-500">
                          From {formatPrice(biz.startingPrice)}
                        </span>
                      )}
                    </div>
                    <span className="text-xs font-medium text-blue-500 group-hover:text-blue-600 flex items-center gap-0.5">
                      Book
                      <ArrowRight className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}