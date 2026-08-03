'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X, LayoutDashboard, Users, CreditCard, Tag, Receipt, Gift, Settings, LogOut } from 'lucide-react';

const navItems = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Users', href: '/users', icon: Users },
  { name: 'Plans', href: '/plans', icon: Tag },
  { name: 'Subscriptions', href: '/subscriptions', icon: CreditCard },
  { name: 'Payments', href: '/payments', icon: Receipt },
  { name: 'Coupons', href: '/coupons', icon: Gift },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export function Sidebar({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen bg-[#0a0a0f]">
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-[#0d0d14]/90 backdrop-blur-md border-b border-white/5 flex items-center justify-between px-4 z-50">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-red-500 to-orange-500 rounded-lg flex items-center justify-center font-bold text-white text-sm shadow-lg shadow-red-500/20">
            D
          </div>
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-orange-500 font-bold tracking-wide">Devil-AI Admin</span>
        </div>
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            setIsOpen(true);
          }}
          className="p-2 -mr-2 text-gray-400 hover:text-white transition-colors cursor-pointer relative z-50 block"
        >
          <Menu size={24} className="pointer-events-none" />
        </button>
      </div>

      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[60] lg:hidden transition-opacity"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-[70] w-64 bg-[#0d0d14] border-r border-white/5 flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="p-6 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-orange-500 rounded-xl flex items-center justify-center font-bold text-white text-lg shadow-lg shadow-red-500/25">
              D
            </div>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-orange-500 font-bold text-xl tracking-wide lg:block hidden">Devil-AI</span>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-orange-500 font-bold text-xl tracking-wide lg:hidden block">Menu</span>
          </div>
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              setIsOpen(false);
            }}
            className="lg:hidden p-2 -mr-2 text-gray-400 hover:text-white transition-colors cursor-pointer block"
          >
            <X size={24} className="pointer-events-none" />
          </button>
        </div>

        <nav className="flex-1 py-6 overflow-y-auto space-y-1.5 px-4 custom-scrollbar">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 relative group overflow-hidden ${
                  isActive
                    ? 'text-white bg-gradient-to-r from-red-500/10 to-orange-500/5'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                {isActive && (
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-red-500 to-orange-500 rounded-r-full shadow-[0_0_10px_rgba(239,68,68,0.5)]" />
                )}
                <Icon size={18} className={`transition-transform duration-300 group-hover:scale-110 ${isActive ? 'text-red-500' : 'text-gray-400 group-hover:text-gray-200'}`} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-white/5 space-y-4">
          <div className="flex items-center gap-3 px-4 py-2">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-gray-800 to-gray-700 border border-gray-600 flex items-center justify-center text-gray-300 shadow-inner">
              <Users size={16} />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-medium text-gray-200">Admin User</span>
              <span className="text-xs text-gray-500">admin@devil.ai</span>
            </div>
          </div>
          
          <form action="/api/auth/logout" method="POST">
            <button
              type="submit"
              className="flex items-center justify-center gap-2 w-full py-2.5 px-4 bg-white/5 hover:bg-red-500/10 text-gray-300 hover:text-red-400 border border-white/5 hover:border-red-500/20 rounded-xl text-sm font-medium transition-all duration-300 group"
            >
              <LogOut size={16} className="group-hover:translate-x-1 transition-transform" />
              Logout
            </button>
          </form>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 lg:ml-64 pt-16 lg:pt-0 min-w-0 flex flex-col h-screen overflow-hidden">
        <div className="flex-1 overflow-y-auto overflow-x-hidden w-full custom-scrollbar relative">
          {/* Subtle background glow */}
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-red-500/5 rounded-full blur-[120px] pointer-events-none hidden md:block" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-orange-500/5 rounded-full blur-[120px] pointer-events-none hidden md:block" />
          
          <div className="relative z-10 h-full min-h-full">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
