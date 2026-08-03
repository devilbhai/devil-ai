import { prisma } from '../../../lib/prisma';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function UsersPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams;
  const search = q || '';

  const users = await prisma.user.findMany({
    where: search ? { OR: [{ email: { contains: search } }, { name: { contains: search } }] } : {},
    include: { subscriptions: true },
    orderBy: { createdAt: 'desc' },
    take: 100,
  });

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto min-h-screen">
      <header className="mb-8 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <h1 className="text-2xl font-bold text-white">Users ({users.length})</h1>
        <form method="GET" action="/users" className="flex gap-3 w-full sm:w-auto">
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
            <Link href="/users" className="px-5 py-2.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 rounded-lg text-sm font-medium transition-colors flex items-center justify-center">
              Clear
            </Link>
          )}
        </form>
      </header>

      <div className="bg-[#12121a] border border-white/5 rounded-xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto w-full">
          <table className="w-full text-sm min-w-[800px] text-left">
            <thead className="bg-white/5 border-b border-white/10">
              <tr>
                <th className="px-5 py-4 font-medium text-gray-400">Email</th>
                <th className="px-5 py-4 font-medium text-gray-400">Name</th>
                <th className="px-5 py-4 font-medium text-gray-400">Status</th>
                <th className="px-5 py-4 font-medium text-gray-400">Subscription</th>
                <th className="px-5 py-4 font-medium text-gray-400">Joined</th>
                <th className="px-5 py-4 font-medium text-gray-400">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {users.length === 0 ? (
                <tr><td colSpan={6} className="px-5 py-12 text-center text-gray-500">No users found</td></tr>
              ) : users.map((user) => {
                const activeSub = user.subscriptions.find(s => s.status === 'ACTIVE');
                const isBanned = user.status === 'BANNED';
                return (
                  <tr key={user.id} className="hover:bg-white/5 transition-colors group">
                    <td className="px-5 py-4 font-medium text-white">{user.email}</td>
                    <td className="px-5 py-4 text-gray-400">{user.name || '—'}</td>
                    <td className="px-5 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${
                        isBanned 
                          ? 'bg-red-500/10 text-red-400 border-red-500/20 shadow-[0_0_10px_rgba(239,68,68,0.2)]' 
                          : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.2)]'
                      }`}>
                        {user.status}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-gray-400">
                      {activeSub ? (
                        <span className="px-2.5 py-1 rounded-lg bg-white/5 text-gray-300 border border-white/10 text-xs">
                          {activeSub.planId}
                        </span>
                      ) : 'None'}
                    </td>
                    <td className="px-5 py-4 text-gray-400">{new Date(user.createdAt).toLocaleDateString()}</td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          data-action="ban" 
                          data-id={user.id} 
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                            isBanned 
                              ? 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border-emerald-500/20' 
                              : 'bg-red-500/10 hover:bg-red-500/20 text-red-400 border-red-500/20'
                          }`}
                        >
                          {isBanned ? 'Unban' : 'Ban'}
                        </button>
                        <button 
                          data-action="delete" 
                          data-id={user.id} 
                          className="px-3 py-1.5 rounded-lg text-xs font-medium bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 transition-colors"
                        >
                          Delete
                        </button>
                        <a 
                          href={`/subscriptions?userId=${user.id}`} 
                          className="px-3 py-1.5 rounded-lg text-xs font-medium bg-[#1a1a24] hover:bg-[#252533] text-gray-300 border border-white/10 transition-colors"
                        >
                          Sub
                        </a>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <script dangerouslySetInnerHTML={{__html: `
        document.addEventListener('click', function(e) {
          var btn = e.target.closest('[data-action]');
          if (!btn) return;
          var action = btn.getAttribute('data-action');
          var id = btn.getAttribute('data-id');
          if (action === 'ban') {
            fetch('/api/users/ban', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({userId: id}) })
              .then(function(r) { return r.json(); }).then(function() { location.reload(); });
          }
          if (action === 'delete') {
            if (!confirm('Delete this user and all their data?')) return;
            fetch('/api/users/delete', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({userId: id}) })
              .then(function(r) { return r.json(); }).then(function() { location.reload(); });
          }
        });
      `}} />
    </div>
  );
}
