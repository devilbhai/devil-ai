export const dynamic = 'force-dynamic';

export default function SettingsPage() {
  return (
    <div className="p-4 sm:p-8 max-w-3xl mx-auto min-h-screen">
      <header className="mb-8">
        <h1 className="text-2xl font-bold text-white">Settings</h1>
      </header>

      <div className="bg-[#12121a] border border-white/5 rounded-xl p-6 mb-8 shadow-2xl">
        <h2 className="text-lg font-medium text-white mb-6">Razorpay Configuration</h2>
        <form id="razorpay-form" className="flex flex-col gap-5">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Razorpay Key ID</label>
            <input 
              name="keyId" 
              placeholder="rzp_live_..." 
              className="w-full px-4 py-2.5 bg-[#1a1a24] border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-red-500/50 placeholder:text-gray-600 transition-all" 
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Razorpay Key Secret</label>
            <input 
              name="keySecret" 
              type="password" 
              placeholder="••••••••" 
              className="w-full px-4 py-2.5 bg-[#1a1a24] border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-red-500/50 placeholder:text-gray-600 transition-all" 
            />
          </div>
          <div className="pt-2 flex items-center gap-4">
            <button 
              type="submit" 
              className="px-6 py-2.5 bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white rounded-lg text-sm font-medium transition-all shadow-lg shadow-red-500/20 border border-white/10"
            >
              Save Settings
            </button>
            <div id="save-msg" className="text-emerald-400 text-sm font-medium hidden">
              Saved successfully!
            </div>
          </div>
        </form>
      </div>

      <script dangerouslySetInnerHTML={{__html: `
        document.getElementById('razorpay-form').addEventListener('submit', function(e) {
          e.preventDefault();
          document.getElementById('save-msg').style.display = 'block';
          setTimeout(function() { document.getElementById('save-msg').style.display = 'none'; }, 3000);
        });
      `}} />
    </div>
  );
}
