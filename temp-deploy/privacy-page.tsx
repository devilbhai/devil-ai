import Link from 'next/link';

export default function PrivacyPolicy() {
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
        <h1 className="text-4xl font-bold text-white mb-2 tracking-tight">Privacy Policy</h1>
        <p className="text-sm text-gray-500 mb-8 uppercase tracking-wider"><strong>Effective Date:</strong> {new Date().toLocaleDateString()}</p>
        
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-white">1. Introduction</h2>
          <p>Welcome to Devil Ai. We respect your privacy and are committed to protecting your personal data. This Privacy Policy explains how we collect, use, and safeguard your information when you use our application. Our primary purpose is to serve as an autonomous AI agent platform that connects with your tools to streamline your workflows.</p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-white">2. Data We Collect</h2>
          <p>We may collect information you provide directly to us, such as your email address and profile information during authentication. When you connect third-party accounts (like Google or Microsoft), we request necessary permissions to perform automated tasks on your behalf.</p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-white">3. How We Use Your Data</h2>
          <p>Your data is used strictly to provide the features of Devil Ai, including authenticating your account, responding to your queries, and executing automated workflows that you authorize. We do not sell your personal data to third parties.</p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-white">4. Data Protection</h2>
          <p>We implement a variety of security measures to maintain the safety of your personal information. Your connected API keys and OAuth tokens are stored securely and are only used for the automated actions you initiate through the Devil Ai platform.</p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-white">5. Contact Us</h2>
          <p>If you have any questions about this Privacy Policy or how we handle your data, please contact us at support@agribee.in.</p>
        </section>
      </main>
      
      <footer className="py-8 border-t border-white/10 flex flex-col sm:flex-row justify-center items-center space-y-4 sm:space-y-0 sm:space-x-8 text-sm text-gray-500 mt-auto">
        <p>&copy; {new Date().getFullYear()} Devil Ai. All rights reserved.</p>
        <Link href="/terms" className="hover:text-gray-300 transition-colors">Terms of Service</Link>
      </footer>
    </div>
  );
}
