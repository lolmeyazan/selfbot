import { useMutation } from '@tanstack/react-query';
import { api, type DiscordProxyInput } from '@shared/routes';
import { useAppStore } from '@/lib/store';

// We use the proxy endpoint to bypass CORS and securely interact with Discord
export function useDiscordProxy() {
  const addTerminalEvent = useAppStore(state => state.addTerminalEvent);

  return useMutation({
    mutationFn: async (data: DiscordProxyInput) => {
      const res = await fetch(api.discordProxy.request.path, {
        method: api.discordProxy.request.method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      
      if (!res.ok) {
        let errorMessage = 'Discord API Error';
        try {
          const errData = await res.json();
          const statusPart = errData.status ? ` [${errData.status}]` : '';
          const endpointPart = errData.endpoint ? ` ${errData.endpoint}` : '';
          errorMessage = `${errData.message || errorMessage}${statusPart}${endpointPart}`;
        } catch {
          // Ignore parse errors for raw responses
        }
        addTerminalEvent({
          level: 'error',
          source: 'discord.proxy',
          message: `${data.method} ${data.endpoint} -> ${errorMessage}`,
        });
        throw new Error(errorMessage);
      }

      addTerminalEvent({
        level: 'success',
        source: 'discord.proxy',
        message: `${data.method} ${data.endpoint} -> OK`,
      });
      return await res.json();
    }
  });
}

// Helper hook to validate a token and fetch profile
export function useValidateToken() {
  const proxy = useDiscordProxy();
  const updateToken = useAppStore(state => state.updateToken);

  return useMutation({
    mutationFn: async ({ id, tokenValue }: { id?: string, tokenValue: string }) => {
      try {
        const profile = await proxy.mutateAsync({
          method: 'GET',
          endpoint: '/users/@me',
          token: tokenValue
        });

        // Extract ID from profile if new token
        const profileId = profile.id || btoa(tokenValue).substring(0, 10);
        const actualId = id || profileId;

        updateToken(actualId, {
          isValid: true,
          lastChecked: Date.now(),
          profile: profile,
          status: 'online'
        });

        return { isValid: true, profile, id: actualId };
      } catch (error) {
        if (id) {
          updateToken(id, {
            isValid: false,
            lastChecked: Date.now(),
            status: 'offline'
          });
        }
        throw error;
      }
    }
  });
}
