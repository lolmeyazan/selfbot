import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Hash, Plus, RefreshCw, Trash2, ShieldCheck, AlertTriangle } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { useValidateToken } from '@/hooks/use-discord';
import { AppLayout } from '@/components/layout/AppLayout';
import { GlitchText } from '@/components/effects/GlitchText';
import { CyberButton } from '@/components/ui/CyberButton';
import { CyberInput } from '@/components/ui/CyberInput';
import { useToast } from '@/hooks/use-toast';

export default function Tokens() {
  const tokens = useAppStore(state => state.tokens);
  const addToken = useAppStore(state => state.addToken);
  const removeToken = useAppStore(state => state.removeToken);
  const setActiveToken = useAppStore(state => state.setActiveToken);
  const activeTokenId = useAppStore(state => state.activeTokenId);
  
  const validateToken = useValidateToken();
  const { toast } = useToast();

  const [newToken, setNewToken] = useState('');
  const [newLabel, setNewLabel] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  const handleAddToken = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newToken.trim()) return;

    setIsAdding(true);
    try {
      // First try to validate it
      const res = await validateToken.mutateAsync({ tokenValue: newToken });
      
      // If successful, add to store
      addToken({
        id: res.id,
        value: newToken,
        label: newLabel || res.profile.username,
        isValid: true,
        lastChecked: Date.now(),
        profile: res.profile,
        status: 'online',
        tags: ['main']
      });

      setNewToken('');
      setNewLabel('');
      toast({
        title: "TOKEN VERIFIED",
        description: `Successfully authenticated as ${res.profile.username}`,
      });
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "AUTH FAILURE",
        description: err.message || "Invalid token provided.",
      });
    } finally {
      setIsAdding(false);
    }
  };

  const handleRecheck = async (id: string, value: string) => {
    try {
      await validateToken.mutateAsync({ id, tokenValue: value });
      toast({ title: "TOKEN OK", description: "Authentication verified." });
    } catch {
      toast({ variant: "destructive", title: "TOKEN DEAD", description: "Token is no longer valid." });
    }
  };

  return (
    <AppLayout>
      <div className="mb-8">
        <GlitchText text="TOKEN_MANAGEMENT" className="text-3xl font-bold mb-2" />
        <p className="font-mono text-primary/60 text-sm">Inject and manage Discord authentication tokens locally.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Add Token Form */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-panel p-6 neon-border h-fit"
        >
          <h2 className="text-lg font-mono text-primary flex items-center gap-2 mb-6 border-b border-border/50 pb-4">
            <Plus className="w-5 h-5" />
            INJECT_NEW_TOKEN
          </h2>
          
          <form onSubmit={handleAddToken} className="space-y-4">
            <CyberInput 
              label="Token String" 
              placeholder="Paste token here..." 
              type="password"
              value={newToken}
              onChange={(e) => setNewToken(e.target.value)}
              required
            />
            <CyberInput 
              label="Label (Optional)" 
              placeholder="e.g. Main Account" 
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
            />
            
            <div className="pt-4">
              <CyberButton 
                type="submit" 
                className="w-full" 
                isLoading={isAdding}
              >
                VALIDATE & SAVE
              </CyberButton>
            </div>
            
            <div className="mt-4 p-3 border border-warning/30 bg-warning/5 text-xs font-mono text-warning/80 flex items-start gap-2">
              <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5" />
              <p>Tokens are stored securely in your browser's LocalStorage and are NEVER sent to our servers. They are only sent directly to Discord via proxy.</p>
            </div>
          </form>
        </motion.div>

        {/* Token List */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="lg:col-span-2 space-y-4"
        >
          {tokens.length === 0 ? (
             <div className="glass-panel p-12 text-center border-dashed border-primary/30">
               <Hash className="w-12 h-12 mx-auto text-primary/30 mb-4" />
               <p className="font-mono text-primary/50 text-lg">TOKEN REGISTRY EMPTY</p>
             </div>
          ) : (
            tokens.map((token, i) => (
              <motion.div 
                key={token.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                className={`glass-panel p-5 border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all
                  ${token.isValid ? 'border-primary/30 hover:border-primary' : 'border-destructive hover:border-destructive shadow-[0_0_10px_rgba(255,0,60,0.1)]'}
                  ${activeTokenId === token.id ? 'shadow-[0_0_15px_rgba(0,255,65,0.2)] bg-primary/5' : ''}
                `}
              >
                <div className="flex items-center gap-4">
                  {token.profile?.avatar ? (
                    <img 
                      src={`https://cdn.discordapp.com/avatars/${token.profile.id}/${token.profile.avatar}.png`} 
                      className="w-12 h-12 border border-border"
                      alt=""
                    />
                  ) : (
                    <div className="w-12 h-12 border border-border bg-black flex items-center justify-center">
                      <Hash className="w-6 h-6 text-primary/50" />
                    </div>
                  )}
                  
                  <div>
                    <div className="font-mono font-bold text-white flex items-center gap-2">
                      {token.label}
                      {!token.isValid && <AlertTriangle className="w-4 h-4 text-destructive" />}
                    </div>
                    <div className="font-mono text-xs text-primary/60 mt-1">
                      {token.profile?.username ? `@${token.profile.username}` : 'Unknown User'}
                    </div>
                    <div className="flex gap-2 mt-2">
                      <span className={`text-[10px] px-2 py-0.5 border ${token.isValid ? 'border-primary/50 text-primary' : 'border-destructive/50 text-destructive'}`}>
                        {token.isValid ? '● VALID' : '× INVALID'}
                      </span>
                      {activeTokenId === token.id && (
                        <span className="text-[10px] px-2 py-0.5 border border-secondary/50 text-secondary bg-secondary/10">
                          ACTIVE NODE
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <CyberButton 
                    size="sm" 
                    variant="outline" 
                    onClick={() => setActiveToken(token.id)}
                    disabled={!token.isValid || activeTokenId === token.id}
                  >
                    SELECT
                  </CyberButton>
                  <CyberButton 
                    size="icon" 
                    variant="outline" 
                    title="Re-validate Token"
                    onClick={() => handleRecheck(token.id, token.value)}
                  >
                    <RefreshCw className="w-4 h-4" />
                  </CyberButton>
                  <CyberButton 
                    size="icon" 
                    variant="destructive" 
                    title="Remove Token"
                    onClick={() => removeToken(token.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </CyberButton>
                </div>
              </motion.div>
            ))
          )}
        </motion.div>
      </div>
    </AppLayout>
  );
}
