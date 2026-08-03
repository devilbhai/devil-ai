import { prisma } from '../../../lib/prisma';

export const dynamic = 'force-dynamic';

export default async function CouponsPage() {
  const coupons = await prisma.coupon.findMany({ orderBy: { createdAt: 'desc' } });

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto min-h-screen">
      <header className="mb-8">
        <h1 className="text-2xl font-bold text-white">Coupons ({coupons.length})</h1>
      </header>

      <div className="bg-[#12121a] border border-white/5 rounded-xl p-6 mb-8 shadow-2xl">
        <h2 className="text-lg font-medium text-white mb-6">Create Coupon</h2>
        <form id="coupon-form" className="flex flex-col sm:flex-row gap-5 sm:items-end">
          <div className="w-full sm:flex-1">
            <label className="block text-sm font-medium text-gray-400 mb-2">Code</label>
            <input name="code" required placeholder="e.g. SAVE20" className="w-full px-4 py-2.5 bg-[#1a1a24] border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-red-500/50 uppercase placeholder:text-gray-600" />
          </div>
          <div className="w-full sm:w-auto">
            <label className="block text-sm font-medium text-gray-400 mb-2">Discount %</label>
            <input name="discountPercentage" type="number" min="1" max="100" required placeholder="20" className="w-full sm:w-[120px] px-4 py-2.5 bg-[#1a1a24] border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-red-500/50 placeholder:text-gray-600" />
          </div>
          <div className="w-full sm:w-auto">
            <label className="block text-sm font-medium text-gray-400 mb-2">Max Uses</label>
            <input name="maxUses" type="number" defaultValue="100" className="w-full sm:w-[120px] px-4 py-2.5 bg-[#1a1a24] border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-red-500/50" />
          </div>
          <button type="submit" className="w-full sm:w-auto px-6 py-2.5 bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white rounded-lg text-sm font-medium transition-all shadow-lg shadow-red-500/20 border border-white/10">
            Create
          </button>
        </form>
      </div>

      <div className="bg-[#12121a] border border-white/5 rounded-xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto w-full">
          <table className="w-full text-sm min-w-[600px] text-left">
            <thead className="bg-white/5 border-b border-white/10">
              <tr>
                <th className="px-5 py-4 font-medium text-gray-400">Code</th>
                <th className="px-5 py-4 font-medium text-gray-400">Discount</th>
                <th className="px-5 py-4 font-medium text-gray-400">Uses</th>
                <th className="px-5 py-4 font-medium text-gray-400">Max</th>
                <th className="px-5 py-4 font-medium text-gray-400">Created</th>
                <th className="px-5 py-4 font-medium text-gray-400">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {coupons.length === 0 ? (
                <tr><td colSpan={6} className="px-5 py-12 text-center text-gray-500">No coupons created yet</td></tr>
              ) : coupons.map((c) => (
                <tr key={c.id} className="hover:bg-white/5 transition-colors group">
                  <td className="px-5 py-4 font-bold text-white tracking-wide">
                    <span className="px-2.5 py-1 bg-white/5 border border-white/10 rounded text-xs">{c.code}</span>
                  </td>
                  <td className="px-5 py-4 text-emerald-400 font-medium">{c.discountPercentage}%</td>
                  <td className="px-5 py-4 text-gray-300">{c.currentUses}</td>
                  <td className="px-5 py-4 text-gray-400">{c.maxUses}</td>
                  <td className="px-5 py-4 text-gray-400">{new Date(c.createdAt).toLocaleDateString()}</td>
                  <td className="px-5 py-4">
                    <button 
                      data-action="delete-coupon" 
                      data-id={c.id} 
                      className="opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity px-3 py-1.5 rounded-lg text-xs font-medium bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <script dangerouslySetInnerHTML={{__html: `
        document.getElementById('coupon-form').addEventListener('submit', function(e) {
          e.preventDefault();
          var fd = new FormData(this);
          var data = { action: 'create' };
          fd.forEach(function(v, k) { data[k] = v; });
          fetch('/api/coupons', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(data) })
            .then(function(r) { return r.json(); })
            .then(function(d) { if (d.error) alert(d.error); else location.reload(); });
        });
        document.addEventListener('click', function(e) {
          var btn = e.target.closest('[data-action="delete-coupon"]');
          if (!btn) return;
          if (!confirm('Delete this coupon?')) return;
          fetch('/api/coupons', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ action: 'delete', id: btn.getAttribute('data-id') }) })
            .then(function(r) { return r.json(); })
            .then(function() { location.reload(); });
        });
      `}} />
    </div>
  );
}
