// src/app/help/[category]/page.tsx
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getCategory, getArticlesByCategory, HELP_CATEGORIES } from '@/lib/help-articles';

export async function generateStaticParams() {
  return HELP_CATEGORIES.map((cat) => ({ category: cat.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ category: string }> }) {
  const { category } = await params;
  const cat = getCategory(category);
  if (!cat) return {};
  return {
    title: `${cat.name} — BookBetter Help`,
    description: cat.description,
  };
}

export default async function HelpCategoryPage({
  params,
}: {
  params: Promise<{ category: string }>;
}) {
  const { category } = await params;
  const cat = getCategory(category);
  if (!cat) notFound();

  const articles = getArticlesByCategory(category);

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
          <span className="text-gray-600">{cat.name}</span>
        </div>

        <div className="flex items-center gap-3 mb-8">
          <span className="text-4xl">{cat.icon}</span>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{cat.name}</h1>
            <p className="text-gray-500 mt-1">{cat.description}</p>
          </div>
        </div>

        {articles.length === 0 ? (
          <p className="text-gray-400 text-sm">No articles in this category yet.</p>
        ) : (
          <div className="space-y-3">
            {articles.map((article) => (
              <Link
                key={article.slug}
                href={`/help/${category}/${article.slug}`}
                className="block p-5 rounded-xl border border-gray-200 hover:border-gray-300 hover:shadow-sm transition-all group"
              >
                <h3 className="font-semibold text-gray-900 group-hover:text-blue-500 transition-colors">
                  {article.title}
                </h3>
                <p className="text-sm text-gray-500 mt-1">{article.description}</p>
              </Link>
            ))}
          </div>
        )}
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