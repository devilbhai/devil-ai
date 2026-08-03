import Link from 'next/link';
import { prisma } from '../../lib/prisma';
import { Users, Activity, CreditCard, IndianRupee, ArrowRight, TrendingUp, Receipt } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function AdminDashboard({ searchParams }: { searchParams: Promise<{}> }) {
  const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000);

  const [totalUsers, activeSubscriptions, onlineUsers, recentPayments, totalRevenueData] = await Promise.all([
    prisma.user.count(),
    prisma.subscription.count({ where: { status: 'ACTIVE' } }),
    prisma.user.count({ where: { status: 'ACTIVE', lastActiveAt: { gte: fiveMinAgo } } }),
    prisma.payment.findMany({ take: 10, orderBy: { createdAt: 'desc' }, include: { user: true } }),
    prisma.payment.aggregate({ where: { status: 'COMPLETED' }, _sum: { amount: true } }),
  ]);

  const totalRevenue = totalRevenueData._sum.amount || 0;

  return (
    <div className="p-6 md:p-8 lg:p-10 max-w-7xl mx-auto">
      <header className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-white/5 pb-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2 tracking-tight">
            Dashboard
          </h1>
          <p className="text-gray-400 text-sm md:text-base flex items-center gap-2">
            <Activity size={16} className="text-red-500" /> System overview and real-time metrics
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="flex h-3 w-3 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
          </span>
          <span className="text-sm font-medium text-green-400 bg-green-400/10 px-3 py-1 rounded-full border border-green-400/20">
            System Operational
          </span>
        </div>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        <div className="group bg-[#12121a] backdrop-blur-xl border border-white/5 rounded-2xl p-6 relative overflow-hidden transition-all duration-300 hover:shadow-[0_0_30px_rgba(239,68,68,0.1)] hover:border-white/10">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Users size={64} className="text-white" />
          </div>
          <div className="relative z-10">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-blue-500/20 flex items-center justify-center mb-4">
              <Users size={20} className="text-blue-400" />
            </div>
            <p className="text-sm font-medium text-gray-400 mb-1">Total Users</p>
            <p className="text-3xl font-bold text-white">{totalUsers.toLocaleString()}</p>
          </div>
        </div>

        <div className="group bg-[#12121a] backdrop-blur-xl border border-white/5 rounded-2xl p-6 relative overflow-hidden transition-all duration-300 hover:shadow-[0_0_30px_rgba(34,197,94,0.1)] hover:border-white/10">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Activity size={64} className="text-white" />
          </div>
          <div className="relative z-10">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500/20 to-emerald-500/20 border border-green-500/20 flex items-center justify-center mb-4">
              <Activity size={20} className="text-green-400" />
            </div>
            <p className="text-sm font-medium text-gray-400 mb-1">Online Now</p>
            <p className="text-3xl font-bold text-green-400">{onlineUsers.toLocaleString()}</p>
          </div>
        </div>

        <div className="group bg-[#12121a] backdrop-blur-xl border border-white/5 rounded-2xl p-6 relative overflow-hidden transition-all duration-300 hover:shadow-[0_0_30px_rgba(168,85,247,0.1)] hover:border-white/10">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <CreditCard size={64} className="text-white" />
          </div>
          <div className="relative z-10">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500/20 to-fuchsia-500/20 border border-purple-500/20 flex items-center justify-center mb-4">
              <CreditCard size={20} className="text-purple-400" />
            </div>
            <p className="text-sm font-medium text-gray-400 mb-1">Active Subscriptions</p>
            <p className="text-3xl font-bold text-white">{activeSubscriptions.toLocaleString()}</p>
          </div>
        </div>

        <div className="group bg-[#12121a] backdrop-blur-xl border border-white/5 rounded-2xl p-6 relative overflow-hidden transition-all duration-300 hover:shadow-[0_0_30px_rgba(249,115,22,0.1)] hover:border-white/10">
          <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 to-orange-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <TrendingUp size={64} className="text-white" />
          </div>
          <div className="relative z-10">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500/20 to-orange-500/20 border border-red-500/20 flex items-center justify-center mb-4">
              <IndianRupee size={20} className="text-red-400" />
            </div>
            <p className="text-sm font-medium text-gray-400 mb-1">Total Revenue</p>
            <p className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-orange-400">
              ₹{(totalRevenue / 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-[#12121a] backdrop-blur-xl border border-white/5 rounded-2xl overflow-hidden shadow-2xl">
        <div className="p-6 border-b border-white/5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-lg font-semibold text-white">Recent Payments</h2>
            <p className="text-sm text-gray-400 mt-1">Latest transactions across the platform</p>
          </div>
          <Link 
            href="/payments" 
            className="flex items-center gap-2 text-sm font-medium text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 px-4 py-2 rounded-lg transition-all duration-300 border border-white/5"
          >
            View all <ArrowRight size={16} />
          </Link>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs uppercase text-gray-500 bg-white/[0.02] border-b border-white/5">
              <tr>
                <th className="px-6 py-4 font-semibold">User</th>
                <th className="px-6 py-4 font-semibold">Amount</th>
                <th className="px-6 py-4 font-semibold">Status</th>
                <th className="px-6 py-4 font-semibold">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {recentPayments.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Receipt size={32} className="opacity-20" />
                      <p>No payments recorded yet</p>
                    </div>
                  </td>
                </tr>
              ) : recentPayments.map((p) => (
                <tr key={p.id} className="hover:bg-white/[0.02] transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-800 to-gray-700 flex items-center justify-center text-xs font-bold text-gray-300">
                        {p.user.email.charAt(0).toUpperCase()}
                      </div>
                      <span className="font-medium text-gray-200 group-hover:text-white transition-colors">{p.user.email}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 font-medium text-gray-300">
                    ₹{(p.amount / 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
                      p.status === 'COMPLETED' 
                        ? 'bg-green-500/10 text-green-400 border-green-500/20 shadow-[0_0_10px_rgba(34,197,94,0.1)]' 
                        : p.status === 'FAILED' 
                        ? 'bg-red-500/10 text-red-400 border-red-500/20 shadow-[0_0_10px_rgba(239,68,68,0.1)]' 
                        : 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20 shadow-[0_0_10px_rgba(234,179,8,0.1)]'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${
                        p.status === 'COMPLETED' ? 'bg-green-400' : p.status === 'FAILED' ? 'bg-red-400' : 'bg-yellow-400'
                      }`} />
                      {p.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-500">
                    {new Date(p.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
