import Link from 'next/link';

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#0a0a0f] text-gray-200 font-sans">
      <header className="py-6 px-8 border-b border-white/10 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-red-500">Devil Ai</h1>
        <div className="space-x-6">
          <Link href="/login" className="text-gray-300 hover:text-white transition-colors">Login</Link>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center p-8 text-center">
        <h2 className="text-5xl font-extrabold mb-6 text-white tracking-tight">Welcome to Devil Ai</h2>
        <p className="text-xl max-w-2xl text-gray-400 mb-10 leading-relaxed">
          Devil Ai is a powerful autonomous AI agent platform. Our purpose is to streamline your workflow by connecting with your favorite tools, managing complex tasks, and executing multi-step instructions with precision. Connect your accounts securely, configure your agents, and let Devil Ai do the heavy lifting for you.
        </p>
        <Link href="/login" className="px-8 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition-colors shadow-lg shadow-red-500/20">
          Go to Dashboard
        </Link>
      </main>

      <footer className="py-8 border-t border-white/10 flex flex-col sm:flex-row justify-center items-center space-y-4 sm:space-y-0 sm:space-x-8 text-sm text-gray-500">
        <p>&copy; {new Date().getFullYear()} Devil Ai. All rights reserved.</p>
        <Link href="/privacy" className="hover:text-gray-300 transition-colors">Privacy Policy</Link>
        <Link href="/terms" className="hover:text-gray-300 transition-colors">Terms of Service</Link>
      </footer>
    </div>
  );
}
