import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useAppStore = create()(
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
