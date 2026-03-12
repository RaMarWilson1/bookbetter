// src/app/help/_components/help-search.tsx
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { searchArticles } from '@/lib/help-articles';

export function HelpSearch() {
  const [query, setQuery] = useState('');
  const [focused, setFocused] = useState(false);

  const results = query.length >= 2 ? searchArticles(query).slice(0, 6) : [];

  return (
    <div className="relative max-w-xl mx-auto">
      <div className="relative">
        <svg
          className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setTimeout(() => setFocused(false), 200)}
          placeholder="Search for help..."
          className="w-full pl-12 pr-4 py-4 rounded-xl border border-gray-200 text-base focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white shadow-sm"
        />
      </div>

      {focused && results.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl border border-gray-200 shadow-lg overflow-hidden z-20">
          {results.map((article) => (
            <Link
              key={article.slug}
              href={`/help/${article.category}/${article.slug}`}
              className="block px-4 py-3 hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-0"
            >
              <p className="text-sm font-medium text-gray-900">{article.title}</p>
              <p className="text-xs text-gray-500 mt-0.5">{article.description}</p>
            </Link>
          ))}
        </div>
      )}

      {focused && query.length >= 2 && results.length === 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl border border-gray-200 shadow-lg p-6 text-center z-20">
          <p className="text-sm text-gray-500">No articles found for &ldquo;{query}&rdquo;</p>
          <a
            href="mailto:support@thebookbetter.com"
            className="text-sm text-blue-500 hover:text-blue-600 font-medium mt-2 inline-block"
          >
            Contact support →
          </a>
        </div>
      )}
    </div>
  );
}