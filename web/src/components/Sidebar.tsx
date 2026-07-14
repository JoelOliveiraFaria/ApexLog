import { LayoutDashboard, Settings, Bike, CircleUserRound } from 'lucide-react';

export type SidebarView = 'dashboard' | 'motorcycles' | 'profile';

interface SidebarProps {
  activeView: SidebarView;
  onNavigate: (view: SidebarView) => void;
  userName: string;
}

export function Sidebar({ activeView, onNavigate, userName }: SidebarProps) {
  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col h-screen fixed left-0 top-0">
      <div className="p-6 border-b border-slate-800 flex items-center gap-3">
        <div className="bg-emerald-500/10 p-2 rounded-lg border border-emerald-500/20 text-emerald-400">
          <Bike size={24} />
        </div>
        <div>
          <h2 className="font-bold text-white tracking-wide">APEXLOG</h2>
          <p className="text-xs text-slate-500 font-medium">Telemetry System</p>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        <button
          onClick={() => onNavigate('dashboard')}
          className={`w-full flex items-center gap-3 px-4 py-3 font-medium rounded-xl border transition-all cursor-pointer ${
            activeView === 'dashboard'
              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/10'
              : 'text-slate-400 hover:bg-slate-800/50 hover:text-white border-transparent'
          }`}
        >
          <LayoutDashboard size={20} />
          <span>Dashboard</span>
        </button>
        <button
          onClick={() => onNavigate('motorcycles')}
          className={`w-full flex items-center gap-3 px-4 py-3 font-medium rounded-xl border transition-all cursor-pointer ${
            activeView === 'motorcycles'
              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/10'
              : 'text-slate-400 hover:bg-slate-800/50 hover:text-white border-transparent'
          }`}
        >
          <Bike size={20} />
          <span>Motas</span>
        </button>
      </nav>

      <div className="p-4 border-t border-slate-800 space-y-1">
        <button
          onClick={() => onNavigate('profile')}
          className={`w-full flex items-center gap-3 px-4 py-3 font-medium rounded-xl border transition-all cursor-pointer ${
            activeView === 'profile'
              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/10'
              : 'text-slate-400 hover:bg-slate-800/50 hover:text-white border-transparent'
          }`}
        >
          <CircleUserRound size={20} />
          <span className="truncate">{userName}</span>
        </button>
        <a href="#" className="flex items-center gap-3 px-4 py-3 text-slate-400 hover:bg-slate-800/50 hover:text-white font-medium rounded-xl transition-all">
          <Settings size={20} />
          <span>Configurações</span>
        </a>
      </div>
    </aside>
  );
}
