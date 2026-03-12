// src/app/help/page.tsx
import Link from 'next/link';
import { HELP_CATEGORIES, HELP_ARTICLES } from '@/lib/help-articles';
import { HelpSearch } from './_components/help-search';

export const metadata = {
  title: 'Help Center — BookBetter',
  description: 'Find answers to common questions about BookBetter.',
};

export default function HelpPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-gray-50 border-b border-gray-200">
        <nav className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold text-gray-900 tracking-tight">
            Book<span className="text-blue-500">Better</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/auth/sign-in" className="text-sm text-gray-600 hover:text-gray-900 font-medium">
              Sign In
            </Link>
            <Link
              href="/auth/sign-up"
              className="text-sm bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors font-medium"
            >
              Get Started
            </Link>
          </div>
        </nav>
      </header>

      {/* Hero */}
      <section className="bg-gray-50 py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Help Center</h1>
          <p className="text-lg text-gray-500 mb-8">
            Find answers, guides, and documentation for BookBetter.
          </p>
          <HelpSearch />
        </div>
      </section>

      {/* Categories */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {HELP_CATEGORIES.map((cat) => {
            const articleCount = HELP_ARTICLES.filter((a) => a.category === cat.slug).length;
            return (
              <Link
                key={cat.slug}
                href={`/help/${cat.slug}`}
                className="group p-6 rounded-xl border border-gray-200 hover:border-gray-300 hover:shadow-md transition-all"
              >
                <div className="text-3xl mb-3">{cat.icon}</div>
                <h3 className="font-semibold text-gray-900 mb-1 group-hover:text-blue-500 transition-colors">
                  {cat.name}
                </h3>
                <p className="text-sm text-gray-500">{cat.description}</p>
                <p className="text-xs text-gray-400 mt-2">
                  {articleCount} {articleCount === 1 ? 'article' : 'articles'}
                </p>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Contact */}
      <section className="bg-gray-50 py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-3">Still need help?</h2>
          <p className="text-gray-500 mb-6">
            Can&apos;t find what you&apos;re looking for? Reach out and we&apos;ll get back to you.
          </p>
          <a
            href="mailto:support@thebookbetter.com"
            className="inline-block bg-black text-white px-6 py-3 rounded-lg text-sm font-semibold hover:bg-gray-800 transition-colors"
          >
            Contact Support
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <Link href="/" className="text-lg font-bold text-gray-900 tracking-tight">
            Book<span className="text-blue-500">Better</span>
          </Link>
          <p className="text-sm text-gray-400">&copy; {new Date().getFullYear()} BookBetter</p>
        </div>
      </footer>
    </div>
  );
}