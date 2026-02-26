import React from 'react';
import { useLocation } from 'wouter';
import { motion } from 'framer-motion';
import { Activity, Users, Hash, Shield, Zap } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { AppLayout } from '@/components/layout/AppLayout';
import { GlitchText } from '@/components/effects/GlitchText';
import { CyberButton } from '@/components/ui/CyberButton';

const StatCard = ({ title, value, icon: Icon, delay = 0 }: any) => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay, duration: 0.4 }}
    className="glass-panel p-6 neon-border relative overflow-hidden group"
  >
    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
      <Icon className="w-16 h-16" />
    </div>
    <h3 className="text-xs font-mono text-primary/60 mb-2">{title}</h3>
    <div className="text-4xl font-bold font-mono text-white neon-text">{value}</div>
  </motion.div>
);

export default function Dashboard() {
  const [_, setLocation] = useLocation();
  const tokens = useAppStore(state => state.tokens);
  const activeToken = useAppStore(state => state.getActiveToken());

  const onlineTokens = tokens.filter(t => t.status === 'online').length;

  return (
    <AppLayout>
      <div className="mb-8">
        <GlitchText text="SYSTEM_DASHBOARD" className="text-3xl font-bold mb-2" />
        <p className="font-mono text-primary/60 text-sm">Global overview of connected nodes and authentication tokens.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        <StatCard title="TOTAL_TOKENS" value={tokens.length} icon={Hash} delay={0.1} />
        <StatCard title="ACTIVE_NODES" value={onlineTokens} icon={Activity} delay={0.2} />
        <StatCard title="NETWORK_STATUS" value="SECURE" icon={Shield} delay={0.3} />
        <StatCard title="API_LATENCY" value="24ms" icon={Zap} delay={0.4} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
          className="lg:col-span-2 glass-panel p-6 neon-border"
        >
          <div className="flex items-center justify-between mb-6 border-b border-border/50 pb-4">
            <h2 className="text-lg font-mono text-primary flex items-center gap-2">
              <Users className="w-5 h-5" />
              NODE_ROSTER
            </h2>
            <CyberButton size="sm" variant="outline" onClick={() => setLocation('/tokens')}>
              MANAGE_TOKENS
            </CyberButton>
          </div>

          {tokens.length === 0 ? (
            <div className="py-12 text-center border border-dashed border-primary/20 bg-primary/5">
              <p className="font-mono text-primary/50 mb-4">NO TOKENS INJECTED INTO STORAGE</p>
              <CyberButton onClick={() => setLocation('/tokens')}>INITIALIZE TOKEN</CyberButton>
            </div>
          ) : (
            <div className="space-y-4">
              {tokens.map((token, i) => (
                <div key={token.id} className="flex items-center justify-between p-4 border border-primary/20 bg-black/40 hover:border-primary/50 transition-colors group">
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <div className={`w-2 h-2 rounded-full ${token.isValid ? 'bg-primary shadow-[0_0_5px_#00ff41]' : 'bg-destructive shadow-[0_0_5px_#ff003c]'}`}></div>
                    </div>
                    <div>
                      <div className="font-mono font-bold text-white group-hover:text-primary transition-colors">
                        {token.profile?.username || token.label} 
                        {token.profile?.discriminator && token.profile.discriminator !== '0' && <span className="text-primary/50">#{token.profile.discriminator}</span>}
                      </div>
                      <div className="font-mono text-xs text-primary/50 uppercase">ID: {token.id}</div>
                    </div>
                  </div>
                  <CyberButton 
                    size="sm" 
                    variant={activeToken?.id === token.id ? 'primary' : 'outline'}
                    onClick={() => {
                      useAppStore.getState().setActiveToken(token.id);
                      setLocation('/control');
                    }}
                  >
                    {activeToken?.id === token.id ? 'CONTROLLING' : 'CONNECT'}
                  </CyberButton>
                </div>
              ))}
            </div>
          )}
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.6 }}
          className="glass-panel p-6 neon-border-blue"
        >
          <h2 className="text-lg font-mono text-secondary flex items-center gap-2 mb-6 border-b border-secondary/30 pb-4">
            <Activity className="w-5 h-5" />
            SYSTEM_LOGS
          </h2>
          <div className="font-mono text-xs space-y-3 text-gray-400">
            <div className="flex gap-2">
              <span className="text-secondary/60">[SYS]</span>
              <span>Terminal initialized successfully.</span>
            </div>
            {tokens.map(t => (
              <div key={`log-${t.id}`} className="flex gap-2">
                <span className="text-primary/60">[AUTH]</span>
                <span>Token {t.id.substring(0,8)}... loaded from encrypted storage.</span>
              </div>
            ))}
            {tokens.length === 0 && (
              <div className="flex gap-2 text-warning animate-pulse">
                <span className="text-warning/60">[WARN]</span>
                <span>Awaiting token injection.</span>
              </div>
            )}
            <div className="flex gap-2">
              <span className="text-secondary/60">[NET]</span>
              <span>Proxy connection established.</span>
            </div>
          </div>
        </motion.div>
      </div>
    </AppLayout>
  );
}
