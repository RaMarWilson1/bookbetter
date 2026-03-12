// src/app/help/[category]/[slug]/page.tsx
import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  getArticle,
  getCategory,
  getArticlesByCategory,
  HELP_ARTICLES,
} from '@/lib/help-articles';

export async function generateStaticParams() {
  return HELP_ARTICLES.map((article) => ({
    category: article.category,
    slug: article.slug,
  }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string; slug: string }>;
}) {
  const { slug } = await params;
  const article = getArticle(slug);
  if (!article) return {};
  return {
    title: `${article.title} — BookBetter Help`,
    description: article.description,
  };
}

export default async function HelpArticlePage({
  params,
}: {
  params: Promise<{ category: string; slug: string }>;
}) {
  const { category, slug } = await params;
  const article = getArticle(slug);
  const cat = getCategory(category);

  if (!article || !cat || article.category !== category) notFound();

  // Get related articles in same category (exclude current)
  const related = getArticlesByCategory(category).filter((a) => a.slug !== slug);

  // Simple markdown-ish rendering: bold and paragraphs
  const renderContent = (text: string) => {
    return text.split('\n\n').map((paragraph, i) => {
      // Process bold markers
      const parts = paragraph.split(/\*\*(.*?)\*\*/g);
      return (
        <p key={i} className="text-gray-600 leading-relaxed mb-4 last:mb-0">
          {parts.map((part, j) =>
            j % 2 === 1 ? (
              <strong key={j} className="text-gray-900 font-semibold">
                {part}
              </strong>
            ) : (
              <span key={j}>{part}</span>
            )
          )}
        </p>
      );
    });
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-gray-50 border-b border-gray-200">
        <nav className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold text-gray-900 tracking-tight">
            Book<span className="text-blue-500">Better</span>
          </Link>
          <Link href="/help" className="text-sm text-gray-600 hover:text-gray-900 font-medium">
            ← Help Center
          </Link>
        </nav>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-gray-400 mb-8">
          <Link href="/help" className="hover:text-gray-900 transition-colors">Help</Link>
          <span>/</span>
          <Link href={`/help/${category}`} className="hover:text-gray-900 transition-colors">
            {cat.name}
          </Link>
          <span>/</span>
          <span className="text-gray-600 truncate">{article.title}</span>
        </div>

        {/* Article */}
        <article>
          <h1 className="text-3xl font-bold text-gray-900 mb-3">{article.title}</h1>
          <p className="text-lg text-gray-500 mb-8">{article.description}</p>

          <div className="prose-sm">
            {renderContent(article.content)}
          </div>
        </article>

        {/* Related Articles */}
        {related.length > 0 && (
          <div className="mt-16 pt-8 border-t border-gray-200">
            <h3 className="font-semibold text-gray-900 mb-4">
              More in {cat.name}
            </h3>
            <div className="space-y-2">
              {related.map((r) => (
                <Link
                  key={r.slug}
                  href={`/help/${category}/${r.slug}`}
                  className="block p-4 rounded-lg border border-gray-200 hover:border-gray-300 hover:shadow-sm transition-all group"
                >
                  <p className="font-medium text-gray-900 text-sm group-hover:text-blue-500 transition-colors">
                    {r.title}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">{r.description}</p>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Contact CTA */}
        <div className="mt-12 bg-gray-50 rounded-xl p-6 text-center">
          <p className="text-sm text-gray-600 mb-3">Didn&apos;t find what you were looking for?</p>
          <a
            href="mailto:support@thebookbetter.com"
            className="text-sm text-blue-500 hover:text-blue-600 font-medium"
          >
            Contact support →
          </a>
        </div>
      </main>

      <footer className="border-t border-gray-200 py-8 px-4 sm:px-6 lg:px-8 mt-12">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <Link href="/" className="text-lg font-bold text-gray-900 tracking-tight">
            Book<span className="text-blue-500">Better</span>
          </Link>
          <p className="text-sm text-gray-400">&copy; {new Date().getFullYear()} BookBetter</p>
        </div>
      </footer>
    </div>
  );
}