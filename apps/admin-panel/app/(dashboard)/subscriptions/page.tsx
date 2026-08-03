import { prisma } from '../../../lib/prisma';

export const dynamic = 'force-dynamic';

export default async function SubscriptionsPage({ searchParams }: { searchParams: Promise<{ userId?: string }> }) {
  const { userId: prefilledUserId } = await searchParams;

  const [subscriptions, users, plans] = await Promise.all([
    prisma.subscription.findMany({ include: { user: true }, orderBy: { createdAt: 'desc' }, take: 100 }),
    prisma.user.findMany({ orderBy: { email: 'asc' } }),
    prisma.plan.findMany({ orderBy: { sortOrder: 'asc' } }),
  ]);

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto min-h-screen">
      <header className="mb-8">
        <h1 className="text-2xl font-bold text-white">Subscriptions ({subscriptions.length})</h1>
      </header>

      <div className="bg-[#12121a] border border-white/5 rounded-xl p-6 mb-8 shadow-2xl">
        <h2 className="text-lg font-medium text-white mb-6">Assign Subscription to User</h2>
        <form id="sub-form" className="flex flex-col sm:flex-row gap-5 sm:items-end">
          <div className="flex-1 w-full sm:min-w-[250px]">
            <label className="block text-sm font-medium text-gray-400 mb-2">User</label>
            <select name="userId" id="sub-user" required className="w-full px-4 py-2.5 bg-[#1a1a24] border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-red-500/50 appearance-none">
              <option value="">Select user...</option>
              {users.map(u => <option key={u.id} value={u.id}>{u.email}</option>)}
            </select>
          </div>
          <div className="flex-1 w-full sm:min-w-[200px]">
            <label className="block text-sm font-medium text-gray-400 mb-2">Plan</label>
            <select name="planId" id="sub-plan" required className="w-full px-4 py-2.5 bg-[#1a1a24] border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-red-500/50 appearance-none">
              <option value="">Select plan...</option>
              {plans.map(p => <option key={p.id} value={p.slug} data-days={p.durationDays}>{p.name} — ₹{Math.floor(p.price/100)}</option>)}
            </select>
          </div>
          <div className="w-full sm:w-auto">
            <label className="block text-sm font-medium text-gray-400 mb-2">Days</label>
            <input name="durationDays" id="sub-days" type="number" placeholder="30" required className="w-full sm:w-[120px] px-4 py-2.5 bg-[#1a1a24] border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-red-500/50 placeholder:text-gray-600" />
          </div>
          <button type="submit" className="w-full sm:w-auto px-6 py-2.5 bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white rounded-lg text-sm font-medium transition-all shadow-lg shadow-red-500/20 border border-white/10">
            Assign
          </button>
        </form>
      </div>

      <div className="bg-[#12121a] border border-white/5 rounded-xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto w-full">
          <table className="w-full text-sm min-w-[800px] text-left">
            <thead className="bg-white/5 border-b border-white/10">
              <tr>
                <th className="px-5 py-4 font-medium text-gray-400">User</th>
                <th className="px-5 py-4 font-medium text-gray-400">Plan</th>
                <th className="px-5 py-4 font-medium text-gray-400">Status</th>
                <th className="px-5 py-4 font-medium text-gray-400">Start</th>
                <th className="px-5 py-4 font-medium text-gray-400">End</th>
                <th className="px-5 py-4 font-medium text-gray-400">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {subscriptions.length === 0 ? (
                <tr><td colSpan={6} className="px-5 py-12 text-center text-gray-500">No subscriptions</td></tr>
              ) : subscriptions.map((sub) => (
                <tr key={sub.id} className="hover:bg-white/5 transition-colors group">
                  <td className="px-5 py-4 font-medium text-white">{sub.user.email}</td>
                  <td className="px-5 py-4 text-white">
                    <span className="px-3 py-1 bg-white/5 border border-white/10 rounded-lg text-xs">{sub.planId}</span>
                  </td>
                  <td className="px-5 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${
                      sub.status === 'ACTIVE'
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.2)]'
                        : 'bg-red-500/10 text-red-400 border-red-500/20 shadow-[0_0_10px_rgba(239,68,68,0.2)]'
                    }`}>
                      {sub.status}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-gray-400">{new Date(sub.currentPeriodStart).toLocaleDateString()}</td>
                  <td className="px-5 py-4 text-gray-400">{new Date(sub.currentPeriodEnd).toLocaleDateString()}</td>
                  <td className="px-5 py-4">
                    {sub.status === 'ACTIVE' && (
                      <button 
                        data-action="cancel-sub" 
                        data-id={sub.id} 
                        className="opacity-100 sm:opacity-0 group-hover:opacity-100 transition-all px-3 py-1.5 rounded-lg text-xs font-medium bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20"
                      >
                        Cancel
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <script dangerouslySetInnerHTML={{__html: `
        var planSelect = document.getElementById('sub-plan');
        var daysInput = document.getElementById('sub-days');
        planSelect.addEventListener('change', function() {
          var opt = planSelect.options[planSelect.selectedIndex];
          var days = opt.getAttribute('data-days');
          if (days) daysInput.value = days;
        });
        document.getElementById('sub-form').addEventListener('submit', function(e) {
          e.preventDefault();
          var fd = new FormData(this);
          fetch('/api/subscriptions', {
            method: 'POST', headers: {'Content-Type':'application/json'},
            body: JSON.stringify({ action: 'create', userId: fd.get('userId'), planId: fd.get('planId'), durationDays: parseInt(fd.get('durationDays')) })
          }).then(function(r) { return r.json(); }).then(function(d) { if (d.error) alert(d.error); else location.reload(); });
        });
        document.addEventListener('click', function(e) {
          var btn = e.target.closest('[data-action="cancel-sub"]');
          if (!btn) return;
          if (!confirm('Cancel this subscription?')) return;
          fetch('/api/subscriptions', {
            method: 'POST', headers: {'Content-Type':'application/json'},
            body: JSON.stringify({ action: 'cancel', id: btn.getAttribute('data-id') })
          }).then(function(r) { return r.json(); }).then(function() { location.reload(); });
        });
      `}} />
    </div>
  );
}
