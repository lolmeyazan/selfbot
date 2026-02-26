import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface DiscordProfile {
  id: string;
  username: string;
  discriminator: string;
  global_name: string | null;
  avatar: string | null;
  email?: string;
  phone?: string;
}

export interface DiscordToken {
  id: string; // Typically the user ID extracted from token or generated
  value: string;
  label: string;
  profile?: DiscordProfile;
  isValid: boolean;
  lastChecked: number;
  status: 'online' | 'idle' | 'dnd' | 'invisible' | 'offline';
  tags: string[];
}

interface AppState {
  hasAcceptedDisclaimer: boolean;
  setAcceptedDisclaimer: (val: boolean) => void;
  
  tokens: DiscordToken[];
  activeTokenId: string | null;
  
  addToken: (token: DiscordToken) => void;
  updateToken: (id: string, updates: Partial<DiscordToken>) => void;
  removeToken: (id: string) => void;
  setActiveToken: (id: string | null) => void;
  
  getActiveToken: () => DiscordToken | undefined;

  terminalEvents: Array<{
    id: string;
    ts: number;
    level: 'info' | 'success' | 'warning' | 'error';
    source: string;
    message: string;
  }>;
  addTerminalEvent: (event: Omit<AppState['terminalEvents'][number], 'id' | 'ts'>) => void;
  clearTerminalEvents: () => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      hasAcceptedDisclaimer: false,
      setAcceptedDisclaimer: (val) => set({ hasAcceptedDisclaimer: val }),
      
      tokens: [],
      activeTokenId: null,
      
      addToken: (token) => set((state) => {
        const exists = state.tokens.find(t => t.value === token.value);
        if (exists) return state;
        return { 
          tokens: [...state.tokens, token],
          activeTokenId: state.activeTokenId || token.id 
        };
      }),
      
      updateToken: (id, updates) => set((state) => ({
        tokens: state.tokens.map(t => t.id === id ? { ...t, ...updates } : t)
      })),
      
      removeToken: (id) => set((state) => ({
        tokens: state.tokens.filter(t => t.id !== id),
        activeTokenId: state.activeTokenId === id 
          ? (state.tokens.filter(t => t.id !== id)[0]?.id || null) 
          : state.activeTokenId
      })),
      
      setActiveToken: (id) => set({ activeTokenId: id }),
      
      getActiveToken: () => {
        const { tokens, activeTokenId } = get();
        return tokens.find(t => t.id === activeTokenId);
      },

      terminalEvents: [],
      addTerminalEvent: (event) => set((state) => ({
        terminalEvents: [
          {
            id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            ts: Date.now(),
            ...event
          },
          ...state.terminalEvents,
        ].slice(0, 800)
      })),
      clearTerminalEvents: () => set({ terminalEvents: [] })
    }),
    {
      name: 'boty-terminal-storage',
      partialize: (state) => ({
        hasAcceptedDisclaimer: state.hasAcceptedDisclaimer,
        tokens: state.tokens,
        activeTokenId: state.activeTokenId
      })
    }
  )
);
