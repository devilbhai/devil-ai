import Link from 'next/link';

export default function TermsOfService() {
  return (
    <div className="min-h-screen flex flex-col bg-[#0a0a0f] text-gray-200 font-sans">
      <header className="py-6 px-8 border-b border-white/10 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-red-500">Devil Ai</h1>
        <div className="space-x-6">
          <Link href="/" className="text-gray-300 hover:text-white transition-colors">Home</Link>
          <Link href="/login" className="text-gray-300 hover:text-white transition-colors">Login</Link>
        </div>
      </header>
      
      <main className="flex-1 max-w-4xl mx-auto w-full px-8 py-12 space-y-8 text-gray-300 leading-relaxed">
        <h1 className="text-4xl font-bold text-white mb-2 tracking-tight">Terms of Service</h1>
        <p className="text-sm text-gray-500 mb-8 uppercase tracking-wider"><strong>Effective Date:</strong> {new Date().toLocaleDateString()}</p>
        
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-white">1. Acceptance of Terms</h2>
          <p>By accessing or using Devil Ai, you agree to be bound by these Terms of Service. If you do not agree to all the terms and conditions of this agreement, then you may not access the website or use any of its services.</p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-white">2. Description of Service</h2>
          <p>Devil Ai is an advanced AI-powered automation platform designed to assist users with executing workflows, managing data, and interacting with third-party services. The service is provided "as is" and "as available". We reserve the right to modify, suspend, or discontinue any part of the service at any time.</p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-white">3. User Responsibilities</h2>
          <p>You are responsible for maintaining the security of your account, including your connected third-party accounts, and for all activities that occur under your account. You agree not to use the service for any illegal or unauthorized purpose, nor violate any laws in your jurisdiction.</p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-white">4. Limitations of Liability</h2>
          <p>In no event shall Devil Ai, nor its directors, employees, partners, agents, suppliers, or affiliates, be liable for any indirect, incidental, special, consequential or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from your access to or use of or inability to access or use the service.</p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-white">5. Changes to Terms</h2>
          <p>We reserve the right, at our sole discretion, to modify or replace these Terms at any time. What constitutes a material change will be determined at our sole discretion. We will try to provide at least 30 days' notice prior to any new terms taking effect.</p>
        </section>
      </main>
      
      <footer className="py-8 border-t border-white/10 flex flex-col sm:flex-row justify-center items-center space-y-4 sm:space-y-0 sm:space-x-8 text-sm text-gray-500 mt-auto">
        <p>&copy; {new Date().getFullYear()} Devil Ai. All rights reserved.</p>
        <Link href="/privacy" className="hover:text-gray-300 transition-colors">Privacy Policy</Link>
      </footer>
    </div>
  );
}
