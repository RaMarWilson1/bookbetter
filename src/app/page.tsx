import Link from 'next/link';

export default function HomePage() {
  const categories = [
    { name: 'Barbers', icon: '✂️', href: '/book/barbers' },
    { name: 'Tattoo Artist', icon: '🎨', href: '/book/tattoo-artist' },
    { name: 'Massage Therapist', icon: '💆', href: '/book/massage' },
    { name: 'Hair Stylist', icon: '💇', href: '/book/hair-stylist' },
    { name: 'Nail Techs', icon: '💅', href: '/book/nail-techs' },
    { name: 'More', icon: '➕', href: '/categories' },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Header/Navigation */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo — text style matching dashboard */}
            <Link href="/" className="text-xl font-bold text-gray-900 tracking-tight">
              Book<span className="text-blue-500">Better</span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              <Link href="/about" className="text-gray-600 hover:text-gray-900 transition-colors">
                About
              </Link>
              <Link href="/resources" className="text-gray-600 hover:text-gray-900 transition-colors">
                Resources
              </Link>
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
                Get Started
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <button className="md:hidden p-2 text-gray-600 hover:text-gray-900">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </nav>
      </header>

      {/* Main Content */}
      <main className="pt-16">
        {/* Hero Section */}
        <section className="relative py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-gray-900 mb-6">
              Book<span className="text-blue-500">Better</span>
            </h1>
            <p className="text-xl sm:text-2xl text-gray-600 mb-10">
              The place where you can book better, easier, and faster
            </p>
            <Link
              href="/about"
              className="inline-block bg-black text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-gray-800 transition-colors shadow-lg hover:shadow-xl"
            >
              About
            </Link>
          </div>
        </section>

        {/* Service Images Grid */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => (
              <div
                key={i}
                className="relative aspect-square rounded-2xl overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200 hover:scale-105 transition-transform duration-300 cursor-pointer shadow-md hover:shadow-xl"
              >
                <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                  <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Find Your Professional Section */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
            Find your Professional
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-6">
            {categories.map((category) => (
              <Link
                key={category.name}
                href={category.href}
                className="group"
              >
                <div className="bg-white border-2 border-gray-200 rounded-xl p-6 text-center hover:border-gray-900 hover:shadow-lg transition-all duration-300">
                  <div className="text-4xl mb-3">{category.icon}</div>
                  <h3 className="text-sm font-semibold text-gray-900 group-hover:text-gray-900">
                    {category.name}
                  </h3>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* CTA Section */}
        <section className="bg-gray-50 py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl font-bold text-gray-900 mb-6">
              Ready to get booked?
            </h2>
            <p className="text-xl text-gray-600 mb-8">
              Join thousands of service professionals growing their business with BookBetter
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/auth/sign-up"
                className="bg-white text-gray-900 border-2 border-gray-900 px-8 py-4 rounded-lg text-lg font-semibold hover:bg-gray-50 transition-colors"
              >
                Find a Pro
              </Link>
              <Link
                href="/auth/sign-up"
                className="bg-black text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-gray-800 transition-colors"
              >
                Join as a Pro
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <Link href="/" className="text-lg font-bold text-gray-900 tracking-tight">
            Book<span className="text-blue-500">Better</span>
          </Link>
          <div className="flex items-center gap-6 text-sm text-gray-500">
            <Link href="/privacy" className="hover:text-gray-900 transition-colors">Privacy</Link>
            <Link href="/terms" className="hover:text-gray-900 transition-colors">Terms</Link>
            <Link href="/help" className="hover:text-gray-900 transition-colors">Help</Link>
          </div>
          <p className="text-sm text-gray-400">
            &copy; {new Date().getFullYear()} BookBetter
          </p>
        </div>
      </footer>
    </div>
  );
}