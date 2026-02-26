import React from 'react';
import { useLocation, Link } from 'wouter';
import { Terminal, Cpu, Activity, LogOut, Hash, Command, MessageSquare } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { MatrixRain } from '../effects/MatrixRain';
import { CrtOverlay } from '../effects/CrtOverlay';
import { GlitchText } from '../effects/GlitchText';

const NavItem = ({ href, icon: Icon, label, isActive }: { href: string, icon: any, label: string, isActive: boolean }) => (
  <Link href={href} className={`
    flex items-center gap-3 px-4 py-3 font-mono text-sm uppercase tracking-wider
    transition-all duration-200 border-l-2
    ${isActive 
      ? 'border-primary bg-primary/10 text-primary neon-text' 
      : 'border-transparent text-muted-foreground hover:border-primary/50 hover:bg-primary/5 hover:text-primary'}
  `}>
    <Icon className="w-5 h-5" />
    <span>{label}</span>
  </Link>
);

export function AppLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const activeToken = useAppStore(state => state.getActiveToken());
  const tokens = useAppStore(state => state.tokens);

  return (
    <div className="min-h-screen bg-background text-foreground flex overflow-hidden">
      <MatrixRain opacity={0.05} />
      <CrtOverlay />

      {/* Sidebar */}
      <aside className="w-64 border-r border-border glass-panel z-10 flex flex-col relative shrink-0">
        <div className="p-6 border-b border-border/50">
          <Link href="/dashboard" className="flex items-center gap-3 group cursor-pointer">
            <Terminal className="w-8 h-8 text-primary group-hover:animate-pulse" />
            <div>
              <GlitchText text="BOTY" className="text-xl font-bold block" />
              <span className="text-[10px] text-primary/60 tracking-widest block font-mono">TERMINAL v2.4</span>
            </div>
          </Link>
        </div>

        <nav className="flex-1 py-6 flex flex-col gap-2">
          <div className="px-4 mb-2 text-xs text-primary/40 font-mono">SYSTEM_CORE</div>
          <NavItem href="/dashboard" icon={Activity} label="Dashboard" isActive={location === '/dashboard'} />
          <NavItem href="/tokens" icon={Hash} label="Token Auth" isActive={location === '/tokens'} />
          <NavItem href="/terminal" icon={Command} label="Terminal" isActive={location === '/terminal'} />
          
          <div className="px-4 mt-6 mb-2 text-xs text-primary/40 font-mono">ACTIVE_NODE</div>
          <NavItem 
            href={activeToken ? "/control" : "/tokens"} 
            icon={Cpu} 
            label="Control Panel" 
            isActive={location === '/control'} 
          />
          <NavItem 
            href={activeToken ? "/discord" : "/tokens"} 
            icon={MessageSquare} 
            label="Discord Client" 
            isActive={location === '/discord'} 
          />
        </nav>

        {/* Active Token Status Mini */}
        <div className="p-4 border-t border-border/50 bg-black/40">
          <div className="text-[10px] text-primary/50 mb-2 font-mono">CONNECTION_STATUS</div>
          {activeToken ? (
            <div className="flex items-center gap-3">
              <div className="relative">
                <img 
                  src={activeToken.profile?.avatar ? `https://cdn.discordapp.com/avatars/${activeToken.profile.id}/${activeToken.profile.avatar}.png` : `https://cdn.discordapp.com/embed/avatars/0.png`} 
                  alt="Avatar" 
                  className="w-10 h-10 border border-primary/50"
                />
                <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-primary border border-black shadow-[0_0_5px_rgba(0,255,65,1)] rounded-full"></div>
              </div>
              <div className="overflow-hidden">
                <div className="font-mono text-xs text-primary truncate">{activeToken.profile?.username || activeToken.label}</div>
                <div className="font-mono text-[10px] text-primary/60 truncate uppercase">ID: {activeToken.id.substring(0,8)}...</div>
              </div>
            </div>
          ) : (
            <div className="font-mono text-xs text-destructive animate-pulse flex items-center gap-2">
              <div className="w-2 h-2 bg-destructive rounded-full"></div>
              NO TOKEN SELECTED
            </div>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col z-10 relative h-screen overflow-hidden">
        {/* Top Header */}
        <header className="h-16 border-b border-border/50 glass-panel flex items-center justify-between px-6 shrink-0">
          <div className="font-mono text-sm text-primary/70 flex items-center gap-2">
            <span className="text-secondary">root@boty</span>
            <span>:</span>
            <span className="text-white">~{location}</span>
            <span className="animate-[pulse_1s_infinite] w-2 h-4 bg-primary inline-block ml-1"></span>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="text-xs font-mono text-primary/50">
              TOKENS_LOADED: {tokens.length}
            </div>
            <Link href="/" className="text-muted-foreground hover:text-destructive transition-colors" title="Disconnect Session">
              <LogOut className="w-5 h-5" />
            </Link>
          </div>
        </header>

        {/* Page Content Scrollable Area */}
        <div className="flex-1 overflow-y-auto scrollbar-cyber p-6">
          <div className="max-w-6xl mx-auto">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
