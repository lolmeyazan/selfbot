import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { Link } from 'wouter';
import { motion } from 'framer-motion';
import { Terminal, ShieldAlert } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { MatrixRain } from '@/components/effects/MatrixRain';
import { CrtOverlay } from '@/components/effects/CrtOverlay';
import { CyberButton } from '@/components/ui/CyberButton';

export default function Disclaimer() {
  const [_, setLocation] = useLocation();
  const setAcceptedDisclaimer = useAppStore(state => state.setAcceptedDisclaimer);
  
  const [checks, setChecks] = useState({
    age: false,
    ownership: false,
    risk: false,
    rulesRead: false,
  });

  const allChecked = Object.values(checks).every(Boolean);

  const handleAccept = () => {
    if (allChecked) {
      setAcceptedDisclaimer(true);
      setLocation('/dashboard');
    }
  };

  return (
    <div className="min-h-screen bg-black text-primary flex items-center justify-center relative overflow-hidden">
      <MatrixRain opacity={0.15} />
      <CrtOverlay />

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 max-w-2xl w-full mx-4"
      >
        <div className="neon-border bg-black/80 backdrop-blur-sm p-5 sm:p-8 shadow-[0_0_30px_rgba(0,255,65,0.1)]">
          <div className="flex flex-col items-center text-center mb-8">
            <Terminal className="w-16 h-16 text-primary mb-4 animate-pulse" />
            <h1 className="text-2xl sm:text-3xl text-destructive font-bold mb-2 leading-tight">
              WARNING: RESTRICTED ACCESS
            </h1>
            <p className="text-primary/70 font-mono text-sm tracking-wide leading-relaxed">
              BOTY TERMINAL INTERFACE v2.4
            </p>
          </div>

          <div className="space-y-4 font-mono text-sm text-gray-300 leading-relaxed break-words mb-8 p-4 border border-destructive/30 bg-destructive/5">
            <p>
              This tool is designed for educational purposes, testing, and managing your own authorized automation workflows.
            </p>
            <p className="text-destructive font-bold">
              Misuse of Discord tokens to manage accounts you do not own, or to violate Discord's Terms of Service, is strictly prohibited and may result in account termination by Discord.
            </p>
            <p className="text-primary/90">
              Read full policy and legal references before continuing:
              {' '}
              <Link href="/rules" className="text-secondary underline hover:text-primary">Open Rules & Liability Policy</Link>
            </p>
          </div>

          <div className="space-y-4 mb-8">
            {[
              { id: 'age', label: 'I am 18 years of age or older.' },
              { id: 'ownership', label: 'I will ONLY use this tool with tokens for accounts that I own and have authorization to use.' },
              { id: 'risk', label: 'I understand the risks involved and take full responsibility for any actions performed via this interface.' },
              { id: 'rulesRead', label: 'I confirm I have read the full Rules & Liability Policy page.' },
            ].map(({ id, label }) => (
              <label key={id} className="flex items-start gap-4 cursor-pointer group">
                <div className="relative flex items-center justify-center w-6 h-6 border border-primary mt-0.5 group-hover:shadow-[0_0_10px_rgba(0,255,65,0.5)] transition-all">
                  <input 
                    type="checkbox" 
                    className="opacity-0 absolute inset-0 cursor-pointer"
                    checked={checks[id as keyof typeof checks]}
                    onChange={(e) => setChecks(prev => ({ ...prev, [id]: e.target.checked }))}
                  />
                  {checks[id as keyof typeof checks] && (
                    <motion.div 
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="w-3 h-3 bg-primary"
                    />
                  )}
                </div>
                <span className="block flex-1 min-w-0 font-mono text-sm leading-relaxed break-words text-primary/80 group-hover:text-primary transition-colors">
                  {label}
                </span>
              </label>
            ))}
          </div>

          <div className="flex justify-end pt-4 border-t border-border">
            <CyberButton 
              variant={allChecked ? 'primary' : 'outline'}
              disabled={!allChecked}
              onClick={handleAccept}
              className="w-full sm:w-auto"
            >
              <ShieldAlert className="w-4 h-4 mr-2" />
              Initialize Session
            </CyberButton>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
