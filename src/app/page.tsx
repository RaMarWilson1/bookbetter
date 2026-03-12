import Link from 'next/link';

export default function HomePage() {
  const categories = [
    { name: 'Barbers', icon: '✂️', href: '/search?category=barber' },
    { name: 'Tattoo Artists', icon: '🎨', href: '/search?category=tattoo' },
    { name: 'Massage', icon: '💆', href: '/search?category=massage' },
    { name: 'Hair Stylists', icon: '💇', href: '/search?category=hair_stylist' },
    { name: 'Nail Techs', icon: '💅', href: '/search?category=nails' },
    { name: 'More', icon: '➕', href: '/search' },
  ];

  const steps = [
    {
      number: '01',
      title: 'Create your page',
      description: 'Sign up, add your services and pricing, set your availability. Takes about 5 minutes.',
    },
    {
      number: '02',
      title: 'Share your link',
      description: 'Get a custom booking link you can drop in your bio, send to clients, or add to your website.',
    },
    {
      number: '03',
      title: 'Clients book you',
      description: 'They pick a service, choose a time, and book — no back-and-forth DMs.',
    },
    {
      number: '04',
      title: 'You get paid',
      description: 'Collect deposits or full payments at booking. Money hits your account via Stripe.',
    },
  ];

  const faqs = [
    {
      q: 'Is it really free to start?',
      a: 'Yes. The Starter plan is free forever with up to 15 bookings a month. No credit card needed.',
    },
    {
      q: 'What does BookBetter charge?',
      a: 'We never take a cut of your bookings. Growth is $19/mo and Business is $79/mo. Stripe processing fees apply but we don\'t add any platform markup.',
    },
    {
      q: 'Can my clients book without creating an account?',
      a: 'Yes. Clients enter their name, email, and phone — no sign-up required.',
    },
    {
      q: 'Can I add my team?',
      a: 'On the Business plan you can invite up to 5 staff members with individual calendars and roles. Extra staff is $10/mo each.',
    },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="text-xl font-bold text-gray-900 tracking-tight">
              Book<span className="text-blue-500">Better</span>
            </Link>
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
            </div>
            <button className="md:hidden p-2 text-gray-600 hover:text-gray-900">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </nav>
      </header>

      <main className="pt-16">
        {/* Hero */}
        <section className="relative py-24 sm:py-32 px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-gray-900 mb-6 tracking-tight">
              Book<span className="text-blue-500">Better</span>
            </h1>
            <p className="text-xl sm:text-2xl text-gray-600 mb-4">
              The booking platform built for independent pros
            </p>
            <p className="text-base text-gray-400 mb-10 max-w-xl mx-auto">
              Set up your booking page in 5 minutes. Share your link. Get booked and paid — no more DM scheduling.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/auth/sign-up"
                className="bg-black text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-gray-800 transition-colors shadow-lg hover:shadow-xl"
              >
                Start Free
              </Link>
              <Link
                href="/search"
                className="bg-white text-gray-900 border-2 border-gray-200 px-8 py-4 rounded-lg text-lg font-semibold hover:border-gray-400 transition-colors"
              >
                Find a Pro
              </Link>
            </div>
            <p className="text-sm text-gray-400 mt-4">Free forever on Starter. No credit card required.</p>
          </div>
        </section>

        {/* Categories */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
            Find your Professional
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-6">
            {categories.map((category) => (
              <Link key={category.name} href={category.href} className="group">
                <div className="bg-white border-2 border-gray-200 rounded-xl p-6 text-center hover:border-gray-900 hover:shadow-lg transition-all duration-300">
                  <div className="text-4xl mb-3">{category.icon}</div>
                  <h3 className="text-sm font-semibold text-gray-900">{category.name}</h3>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* How It Works */}
        <section id="how-it-works" className="bg-gray-50 py-24 px-4 sm:px-6 lg:px-8">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-16">
              <p className="text-sm font-semibold text-blue-500 tracking-wide uppercase mb-3">How it works</p>
              <h2 className="text-4xl font-bold text-gray-900 mb-4">
                Up and running in minutes
              </h2>
              <p className="text-lg text-gray-500 max-w-2xl mx-auto">
                No complicated setup. No contracts. Just a clean booking page your clients will actually use.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {steps.map((step) => (
                <div
                  key={step.number}
                  className="bg-white rounded-2xl p-8 border border-gray-200 hover:border-gray-300 hover:shadow-md transition-all"
                >
                  <div className="flex items-start gap-4">
                    <span className="text-4xl font-bold text-gray-200 leading-none shrink-0">
                      {step.number}
                    </span>
                    <div>
                      <h3 className="text-lg font-bold text-gray-900 mb-2">{step.title}</h3>
                      <p className="text-gray-500 text-sm leading-relaxed">{step.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="text-center mt-12">
              <Link
                href="/auth/sign-up"
                className="inline-block bg-black text-white px-8 py-4 rounded-lg text-base font-semibold hover:bg-gray-800 transition-colors"
              >
                Create your booking page
              </Link>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="py-24 px-4 sm:px-6 lg:px-8">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-gray-900 mb-4">
                Everything you need to get booked
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                { icon: '📅', title: 'Smart scheduling', desc: 'Clients see your real-time availability. No double-bookings, no back-and-forth.' },
                { icon: '💳', title: 'Get paid upfront', desc: 'Collect deposits or full payments when clients book. Powered by Stripe.' },
                { icon: '📱', title: 'Your own booking page', desc: 'A clean, branded page you can share anywhere — bio links, texts, social.' },
                { icon: '🔔', title: 'Reminders & notifications', desc: 'Automatic email and SMS reminders so clients don\'t forget.' },
                { icon: '⭐', title: 'Reviews & reputation', desc: 'Collect reviews after appointments. Show them on your booking page.' },
                { icon: '👥', title: 'Team management', desc: 'Add staff, set individual schedules, assign roles. Built for shops and studios.' },
              ].map((feature) => (
                <div key={feature.title} className="p-6 rounded-2xl border border-gray-200 hover:border-gray-300 transition-colors">
                  <div className="text-3xl mb-4">{feature.icon}</div>
                  <h3 className="text-base font-bold text-gray-900 mb-2">{feature.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{feature.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing */}
        <section id="pricing" className="bg-gray-50 py-24 px-4 sm:px-6 lg:px-8">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-16">
              <p className="text-sm font-semibold text-blue-500 tracking-wide uppercase mb-3">Pricing</p>
              <h2 className="text-4xl font-bold text-gray-900 mb-4">
                Simple, honest pricing
              </h2>
              <p className="text-lg text-gray-500">
                No commissions. No hidden fees. No markup on payment processing.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-2xl border border-gray-200 p-8">
                <h3 className="text-lg font-bold text-gray-900">Starter</h3>
                <p className="text-sm text-gray-500 mt-1">For new & solo pros</p>
                <div className="mt-6 mb-6">
                  <span className="text-4xl font-bold text-gray-900">Free</span>
                </div>
                <ul className="space-y-3 text-sm text-gray-600 mb-8">
                  <li className="flex items-start gap-2"><span className="text-green-500 mt-0.5">✓</span> Up to 15 bookings/month</li>
                  <li className="flex items-start gap-2"><span className="text-green-500 mt-0.5">✓</span> Directory listing</li>
                  <li className="flex items-start gap-2"><span className="text-green-500 mt-0.5">✓</span> Email reminders</li>
                  <li className="flex items-start gap-2"><span className="text-green-500 mt-0.5">✓</span> Basic analytics</li>
                </ul>
                <Link
                  href="/auth/sign-up"
                  className="block text-center w-full py-3 border-2 border-gray-200 text-gray-900 text-sm font-semibold rounded-lg hover:border-gray-400 transition-colors"
                >
                  Get started free
                </Link>
              </div>

              <div className="bg-white rounded-2xl border-2 border-gray-900 p-8 relative">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-blue-500 text-white text-xs font-semibold rounded-full">
                  Popular
                </div>
                <h3 className="text-lg font-bold text-gray-900">Growth</h3>
                <p className="text-sm text-gray-500 mt-1">For active solo pros</p>
                <div className="mt-6 mb-6">
                  <span className="text-4xl font-bold text-gray-900">$19</span>
                  <span className="text-gray-500 text-sm">/month</span>
                </div>
                <ul className="space-y-3 text-sm text-gray-600 mb-8">
                  <li className="flex items-start gap-2"><span className="text-green-500 mt-0.5">✓</span> Unlimited bookings</li>
                  <li className="flex items-start gap-2"><span className="text-green-500 mt-0.5">✓</span> Deposits & full pay at booking</li>
                  <li className="flex items-start gap-2"><span className="text-green-500 mt-0.5">✓</span> Basic CRM</li>
                  <li className="flex items-start gap-2"><span className="text-green-500 mt-0.5">✓</span> 50 SMS/month included</li>
                  <li className="flex items-start gap-2"><span className="text-green-500 mt-0.5">✓</span> Priority email support</li>
                </ul>
                <Link
                  href="/auth/sign-up"
                  className="block text-center w-full py-3 bg-black text-white text-sm font-semibold rounded-lg hover:bg-gray-800 transition-colors"
                >
                  Start with Growth
                </Link>
              </div>

              <div className="bg-white rounded-2xl border border-gray-200 p-8">
                <h3 className="text-lg font-bold text-gray-900">Business</h3>
                <p className="text-sm text-gray-500 mt-1">For studios & shops</p>
                <div className="mt-6 mb-6">
                  <span className="text-4xl font-bold text-gray-900">$79</span>
                  <span className="text-gray-500 text-sm">/month</span>
                </div>
                <ul className="space-y-3 text-sm text-gray-600 mb-8">
                  <li className="flex items-start gap-2"><span className="text-green-500 mt-0.5">✓</span> Everything in Growth</li>
                  <li className="flex items-start gap-2"><span className="text-green-500 mt-0.5">✓</span> Up to 5 staff (+$10/mo extra)</li>
                  <li className="flex items-start gap-2"><span className="text-green-500 mt-0.5">✓</span> Roles & permissions</li>
                  <li className="flex items-start gap-2"><span className="text-green-500 mt-0.5">✓</span> White-label branding</li>
                  <li className="flex items-start gap-2"><span className="text-green-500 mt-0.5">✓</span> Advanced analytics</li>
                </ul>
                <Link
                  href="/auth/sign-up"
                  className="block text-center w-full py-3 border-2 border-gray-200 text-gray-900 text-sm font-semibold rounded-lg hover:border-gray-400 transition-colors"
                >
                  Start with Business
                </Link>
              </div>
            </div>

            <p className="text-center text-sm text-gray-400 mt-6">
              All plans include annual billing (2 months free). No marketplace commissions. Pass-through Stripe fees only.
            </p>
          </div>
        </section>

        {/* FAQ */}
        <section className="py-24 px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold text-gray-900 mb-12 text-center">
              Common questions
            </h2>
            <div className="space-y-6">
              {faqs.map((faq) => (
                <div key={faq.q} className="border-b border-gray-200 pb-6">
                  <h3 className="text-base font-semibold text-gray-900 mb-2">{faq.q}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{faq.a}</p>
                </div>
              ))}
            </div>
            <div className="text-center mt-10">
              <Link href="/help" className="text-sm text-blue-500 hover:text-blue-600 font-medium">
                View all help articles →
              </Link>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="bg-gray-900 py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl font-bold text-white mb-4">
              Ready to get booked?
            </h2>
            <p className="text-lg text-gray-400 mb-8">
              Join the first 100 pros and get 50% off for 6 months with a 2-year price lock.
            </p>
            <Link
              href="/auth/sign-up"
              className="inline-block bg-white text-gray-900 px-8 py-4 rounded-lg text-lg font-semibold hover:bg-gray-100 transition-colors"
            >
              Claim your Founding Pro spot
            </Link>
            <p className="text-xs text-gray-500 mt-4">Limited to the first 100 professionals.</p>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 mb-8">
            <div>
              <Link href="/" className="text-lg font-bold text-gray-900 tracking-tight">
                Book<span className="text-blue-500">Better</span>
              </Link>
              <p className="text-sm text-gray-400 mt-2">The booking platform for independent pros.</p>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-gray-900 mb-3">Product</h4>
              <div className="space-y-2 text-sm text-gray-500">
                <Link href="#how-it-works" className="block hover:text-gray-900 transition-colors">How It Works</Link>
                <Link href="#pricing" className="block hover:text-gray-900 transition-colors">Pricing</Link>
                <Link href="/search" className="block hover:text-gray-900 transition-colors">Find a Pro</Link>
              </div>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-gray-900 mb-3">Support</h4>
              <div className="space-y-2 text-sm text-gray-500">
                <Link href="/help" className="block hover:text-gray-900 transition-colors">Help Center</Link>
                <Link href="/help/getting-started" className="block hover:text-gray-900 transition-colors">Getting Started</Link>
                <Link href="/help/billing" className="block hover:text-gray-900 transition-colors">Billing</Link>
              </div>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-gray-900 mb-3">Legal</h4>
              <div className="space-y-2 text-sm text-gray-500">
                <Link href="/privacy" className="block hover:text-gray-900 transition-colors">Privacy Policy</Link>
                <Link href="/terms" className="block hover:text-gray-900 transition-colors">Terms of Service</Link>
              </div>
            </div>
          </div>
          <div className="border-t border-gray-100 pt-6">
            <p className="text-sm text-gray-400">&copy; {new Date().getFullYear()} BookBetter. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}