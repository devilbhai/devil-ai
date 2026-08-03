import { prisma } from '../../../lib/prisma';

export const dynamic = 'force-dynamic';

export default async function PlansPage() {
  const plans = await prisma.plan.findMany({ orderBy: { sortOrder: 'asc' } });

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto min-h-screen">
      <header className="mb-8">
        <h1 className="text-2xl font-bold text-white">Subscription Plans</h1>
      </header>

      <div className="bg-[#12121a] border border-white/5 rounded-xl p-6 mb-8 shadow-2xl">
        <h2 className="text-lg font-medium text-white mb-6" id="form-title">Create New Plan</h2>
        <form id="plan-form" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5 items-end">
          <input type="hidden" name="id" id="plan-id" />
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Slug</label>
            <input name="slug" id="plan-slug" required placeholder="e.g. WEEKLY" className="w-full px-4 py-2.5 bg-[#1a1a24] border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-red-500/50 placeholder:text-gray-600" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Name</label>
            <input name="name" id="plan-name" required placeholder="e.g. Weekly" className="w-full px-4 py-2.5 bg-[#1a1a24] border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-red-500/50 placeholder:text-gray-600" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Price (paise)</label>
            <input name="price" id="plan-price" type="number" required placeholder="4900 = ₹49" className="w-full px-4 py-2.5 bg-[#1a1a24] border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-red-500/50 placeholder:text-gray-600" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Duration (days)</label>
            <input name="durationDays" id="plan-duration" type="number" required placeholder="7" className="w-full px-4 py-2.5 bg-[#1a1a24] border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-red-500/50 placeholder:text-gray-600" />
          </div>
          <div className="sm:col-span-2 lg:col-span-2">
            <label className="block text-sm font-medium text-gray-400 mb-2">Features (comma-separated)</label>
            <input name="features" id="plan-features" placeholder="Unlimited chat,Priority support" className="w-full px-4 py-2.5 bg-[#1a1a24] border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-red-500/50 placeholder:text-gray-600" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Sort Order</label>
            <input name="sortOrder" id="plan-sort" type="number" defaultValue="0" className="w-full px-4 py-2.5 bg-[#1a1a24] border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-red-500/50" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Best Value?</label>
            <select name="isBestValue" id="plan-best" className="w-full px-4 py-2.5 bg-[#1a1a24] border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-red-500/50 appearance-none">
              <option value="false">No</option>
              <option value="true">Yes</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Active (Visible)?</label>
            <select name="isActive" id="plan-active" className="w-full px-4 py-2.5 bg-[#1a1a24] border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-red-500/50 appearance-none">
              <option value="true">Yes</option>
              <option value="false">No (Hidden)</option>
            </select>
          </div>
          <div className="sm:col-span-2 lg:col-span-5 flex gap-3 mt-2">
            <button type="submit" className="px-6 py-2.5 bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white rounded-lg text-sm font-medium transition-all shadow-lg shadow-red-500/20 border border-white/10">
              Save Plan
            </button>
            <button type="button" id="cancel-btn" className="px-6 py-2.5 bg-[#1a1a24] hover:bg-[#252533] border border-white/10 text-white rounded-lg text-sm font-medium transition-colors hidden">
              Cancel Edit
            </button>
          </div>
        </form>
      </div>

      <div className="bg-[#12121a] border border-white/5 rounded-xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto w-full">
          <table className="w-full text-sm min-w-[900px] text-left">
            <thead className="bg-white/5 border-b border-white/10">
              <tr>
                <th className="px-5 py-4 font-medium text-gray-400">Slug</th>
                <th className="px-5 py-4 font-medium text-gray-400">Name</th>
                <th className="px-5 py-4 font-medium text-gray-400">Price</th>
                <th className="px-5 py-4 font-medium text-gray-400">Duration</th>
                <th className="px-5 py-4 font-medium text-gray-400">Features</th>
                <th className="px-5 py-4 font-medium text-gray-400">Best</th>
                <th className="px-5 py-4 font-medium text-gray-400">Status</th>
                <th className="px-5 py-4 font-medium text-gray-400">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {plans.map((plan) => (
                <tr key={plan.id} className="hover:bg-white/5 transition-colors group">
                  <td className="px-5 py-4 font-medium text-white">
                    <span className="px-2.5 py-1 bg-white/5 border border-white/10 rounded text-xs">{plan.slug}</span>
                  </td>
                  <td className="px-5 py-4 text-white">{plan.name}</td>
                  <td className="px-5 py-4 text-white font-medium">₹{Math.floor(plan.price / 100)}</td>
                  <td className="px-5 py-4 text-gray-400">{plan.durationDays}d</td>
                  <td className="px-5 py-4 text-gray-400 max-w-[200px] truncate">{plan.features}</td>
                  <td className="px-5 py-4 text-center">
                    {plan.isBestValue ? <span className="text-yellow-500 drop-shadow-[0_0_5px_rgba(234,179,8,0.5)]">⭐</span> : <span className="text-gray-600">—</span>}
                  </td>
                  <td className="px-5 py-4">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium border ${
                      plan.isActive 
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.1)]' 
                        : 'bg-white/5 text-gray-400 border-white/10'
                    }`}>
                      {plan.isActive ? 'Active' : 'Hidden'}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        data-action="edit" 
                        data-id={plan.id} 
                        data-slug={plan.slug} 
                        data-name={plan.name} 
                        data-price={plan.price} 
                        data-days={plan.durationDays} 
                        data-features={plan.features} 
                        data-sort={plan.sortOrder} 
                        data-best={String(plan.isBestValue)} 
                        data-active={String(plan.isActive)}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium bg-[#1a1a24] hover:bg-[#252533] text-gray-300 border border-white/10 transition-colors"
                      >
                        Edit
                      </button>
                      <button 
                        data-action="delete-plan" 
                        data-id={plan.id} 
                        className="px-3 py-1.5 rounded-lg text-xs font-medium bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <script dangerouslySetInnerHTML={{__html: `
        document.getElementById('plan-form').addEventListener('submit', function(e) {
          e.preventDefault();
          var fd = new FormData(this);
          var data = {};
          fd.forEach(function(v, k) { data[k] = v; });
          data.isBestValue = data.isBestValue === 'true';
          data.isActive = data.isActive === 'true';
          data.price = parseInt(data.price);
          data.durationDays = parseInt(data.durationDays);
          data.sortOrder = parseInt(data.sortOrder || '0');
          fetch('/api/plans/update', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(data) })
            .then(function(r) { return r.json(); })
            .then(function(d) { if (d.error) alert(d.error); else location.reload(); });
        });
        document.getElementById('cancel-btn').addEventListener('click', function() {
          document.getElementById('plan-form').reset();
          document.getElementById('plan-id').value = '';
          document.getElementById('form-title').textContent = 'Create New Plan';
          this.style.display = 'none';
        });
        document.addEventListener('click', function(e) {
          var btn = e.target.closest('[data-action]');
          if (!btn) return;
          var action = btn.getAttribute('data-action');
          if (action === 'edit') {
            document.getElementById('plan-id').value = btn.getAttribute('data-id');
            document.getElementById('plan-slug').value = btn.getAttribute('data-slug');
            document.getElementById('plan-name').value = btn.getAttribute('data-name');
            document.getElementById('plan-price').value = btn.getAttribute('data-price');
            document.getElementById('plan-duration').value = btn.getAttribute('data-days');
            document.getElementById('plan-features').value = btn.getAttribute('data-features');
            document.getElementById('plan-sort').value = btn.getAttribute('data-sort');
            document.getElementById('plan-best').value = btn.getAttribute('data-best');
            document.getElementById('plan-active').value = btn.getAttribute('data-active');
            document.getElementById('form-title').textContent = 'Edit Plan';
            document.getElementById('cancel-btn').style.display = 'inline-block';
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }
          if (action === 'delete-plan') {
            if (!confirm('Delete this plan?')) return;
            fetch('/api/plans/delete', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({id: btn.getAttribute('data-id')}) })
              .then(function(r) { return r.json(); }).then(function() { location.reload(); });
          }
        });
      `}} />
    </div>
  );
}
