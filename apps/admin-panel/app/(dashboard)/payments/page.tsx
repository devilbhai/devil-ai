import { prisma } from '../../../lib/prisma';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function PaymentsPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams;
  const search = q || '';

  const payments = await prisma.payment.findMany({
    where: search ? { user: { email: { contains: search } } } : {},
    include: { user: true },
    orderBy: { createdAt: 'desc' },
    take: 100,
  });

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto min-h-screen">
      <header className="mb-8 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <h1 className="text-2xl font-bold text-white">Payments ({payments.length})</h1>
        <form method="GET" action="/payments" className="flex gap-3 w-full sm:w-auto">
          <input 
            type="text" 
            name="q" 
            defaultValue={search} 
            placeholder="Search email..." 
            className="px-4 py-2.5 bg-[#1a1a24] border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-red-500/50 w-full sm:w-[280px] transition-all placeholder:text-gray-500" 
          />
          <button type="submit" className="px-5 py-2.5 bg-[#1a1a24] hover:bg-[#252533] border border-white/10 text-white rounded-lg text-sm font-medium transition-colors">
            Search
          </button>
          {search && (
            <Link href="/payments" className="px-5 py-2.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 rounded-lg text-sm font-medium transition-colors flex items-center justify-center">
              Clear
            </Link>
          )}
        </form>
      </header>

      <div className="bg-[#12121a] border border-white/5 rounded-xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto w-full">
          <table className="w-full text-sm min-w-[700px] text-left">
            <thead className="bg-white/5 border-b border-white/10">
              <tr>
                <th className="px-5 py-4 font-medium text-gray-400">User</th>
                <th className="px-5 py-4 font-medium text-gray-400">Amount</th>
                <th className="px-5 py-4 font-medium text-gray-400">Status</th>
                <th className="px-5 py-4 font-medium text-gray-400">Razorpay ID</th>
                <th className="px-5 py-4 font-medium text-gray-400">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {payments.length === 0 ? (
                <tr><td colSpan={5} className="px-5 py-12 text-center text-gray-500">No payments found</td></tr>
              ) : payments.map((p) => (
                <tr key={p.id} className="hover:bg-white/5 transition-colors">
                  <td className="px-5 py-4 font-medium text-white">{p.user.email}</td>
                  <td className="px-5 py-4 text-white font-medium">₹{(p.amount / 100).toLocaleString()}</td>
                  <td className="px-5 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${
                      p.status === 'COMPLETED' 
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.2)]' 
                        : p.status === 'FAILED' 
                        ? 'bg-red-500/10 text-red-400 border-red-500/20 shadow-[0_0_10px_rgba(239,68,68,0.2)]' 
                        : 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20 shadow-[0_0_10px_rgba(234,179,8,0.2)]'
                    }`}>
                      {p.status}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-gray-500 font-mono text-xs">{p.razorpayPaymentId || '—'}</td>
                  <td className="px-5 py-4 text-gray-400">{new Date(p.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
