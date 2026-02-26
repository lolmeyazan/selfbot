import { useCallback, useEffect, useRef, useState } from 'react';
import { useAppStore } from '@/lib/store';
import { useDiscordProxy } from './use-discord';
import type { Channel, DiscordUser, DMChannel, Guild, GuildMember, Message, Role, VoiceState } from '@/lib/discord-types';

interface DiscordClientState {
  isConnected: boolean;
  isLoading: boolean;
  user: DiscordUser | null;
  error: string | null;
  guilds: Guild[];
  selectedGuild: Guild | null;
  channels: Channel[];
  selectedChannel: Channel | null;
  messages: Message[];
  isLoadingMessages: boolean;
  members: GuildMember[];
  roles: Role[];
  dms: DMChannel[];
  selectedDm: DMChannel | null;
  dmMessages: Message[];
  voiceState: VoiceState | null;
  mode: 'guild' | 'dm';
}

const GUILD_CACHE_TTL = 2 * 60 * 1000;
const MESSAGE_CACHE_TTL = 30 * 1000;

export function useDiscordClient() {
  const activeToken = useAppStore((s) => s.getActiveToken());
  const proxy = useDiscordProxy();
  const initForTokenRef = useRef<string | null>(null);
  const guildSeqRef = useRef(0);
  const channelSeqRef = useRef(0);
  const dmSeqRef = useRef(0);

  const guildCacheRef = useRef<Map<string, { at: number; guild: Guild; channels: Channel[]; roles: Role[]; members: GuildMember[] }>>(new Map());
  const channelMessagesCacheRef = useRef<Map<string, { at: number; messages: Message[] }>>(new Map());
  const dmMessagesCacheRef = useRef<Map<string, { at: number; messages: Message[] }>>(new Map());

  const [state, setState] = useState<DiscordClientState>({
    isConnected: false,
    isLoading: true,
    user: null,
    error: null,
    guilds: [],
    selectedGuild: null,
    channels: [],
    selectedChannel: null,
    messages: [],
    isLoadingMessages: false,
    members: [],
    roles: [],
    dms: [],
    selectedDm: null,
    dmMessages: [],
    voiceState: null,
    mode: 'guild',
  });

  const sortMessagesAsc = (list: Message[]) =>
    [...(list || [])].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

  const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

  const callDiscord = useCallback(
    async <T,>(payload: { method: string; endpoint: string; token: string; body?: any }, retries = 2): Promise<T> => {
      let lastError: unknown;
      for (let i = 0; i <= retries; i++) {
        try {
          const data = (await proxy.mutateAsync(payload as any)) as T;
          return data;
        } catch (err) {
          lastError = err;
          if (i < retries) {
            await sleep(200 * (i + 1));
          }
        }
      }
      throw lastError;
    },
    [proxy],
  );

  const fetchUser = useCallback(async () => {
    if (!activeToken?.value) return;
    try {
      const user = await callDiscord<DiscordUser>({
        method: 'GET',
        endpoint: '/users/@me',
        token: activeToken.value,
      });
      setState((s) => ({ ...s, user, isConnected: true, error: null }));
    } catch (err: any) {
      setState((s) => ({ ...s, error: err?.message || 'Failed to fetch user', isConnected: false }));
    }
  }, [activeToken?.value, callDiscord]);

  const fetchGuilds = useCallback(async () => {
    if (!activeToken?.value) return;
    try {
      const guilds = await callDiscord<Guild[]>({
        method: 'GET',
        endpoint: '/users/@me/guilds',
        token: activeToken.value,
      });
      setState((s) => ({ ...s, guilds: guilds || [] }));
    } catch (err) {
      console.error('Failed to fetch guilds:', err);
    }
  }, [activeToken?.value, callDiscord]);

  const fetchDMs = useCallback(async () => {
    if (!activeToken?.value) return;
    try {
      const dms = await callDiscord<DMChannel[]>({
        method: 'GET',
        endpoint: '/users/@me/channels',
        token: activeToken.value,
      });
      setState((s) => ({ ...s, dms: dms || [] }));
    } catch (err) {
      console.error('Failed to fetch DMs:', err);
    }
  }, [activeToken?.value, callDiscord]);

  const selectGuild = useCallback(
    async (guildId: string) => {
      if (!activeToken?.value) return;
      const seq = ++guildSeqRef.current;
      setState((s) => ({ ...s, mode: 'guild', selectedDm: null, error: null }));

      const cached = guildCacheRef.current.get(guildId);
      const now = Date.now();
      if (cached && now - cached.at < GUILD_CACHE_TTL) {
        setState((s) => ({
          ...s,
          selectedGuild: cached.guild,
          channels: cached.channels,
          roles: cached.roles,
          members: cached.members,
          selectedChannel: null,
          messages: [],
        }));
        return;
      }

      try {
        const [guildRes, channelsRes, rolesRes, membersRes] = await Promise.allSettled([
          callDiscord<Guild>({ method: 'GET', endpoint: `/guilds/${guildId}`, token: activeToken.value }),
          callDiscord<Channel[]>({ method: 'GET', endpoint: `/guilds/${guildId}/channels`, token: activeToken.value }),
          callDiscord<Role[]>({ method: 'GET', endpoint: `/guilds/${guildId}/roles`, token: activeToken.value }),
          callDiscord<GuildMember[]>({
            method: 'GET',
            endpoint: `/guilds/${guildId}/members?limit=100`,
            token: activeToken.value,
          }),
        ]);

        if (seq !== guildSeqRef.current) return;
        if (guildRes.status !== 'fulfilled' || channelsRes.status !== 'fulfilled') {
          throw new Error('Failed to open this server');
        }

        const payload = {
          at: Date.now(),
          guild: guildRes.value,
          channels: channelsRes.value || [],
          roles: rolesRes.status === 'fulfilled' ? rolesRes.value || [] : [],
          members: membersRes.status === 'fulfilled' ? membersRes.value || [] : [],
        };
        guildCacheRef.current.set(guildId, payload);

        setState((s) => ({
          ...s,
          selectedGuild: payload.guild,
          channels: payload.channels,
          roles: payload.roles,
          members: payload.members,
          selectedChannel: null,
          messages: [],
          isLoading: false,
        }));
      } catch (err: any) {
        if (seq !== guildSeqRef.current) return;
        setState((s) => ({ ...s, error: err?.message || 'Failed to fetch guild', isLoading: false }));
      }
    },
    [activeToken?.value, callDiscord],
  );

  const selectDm = useCallback(
    async (dmId: string) => {
      if (!activeToken?.value) return;
      const seq = ++dmSeqRef.current;
      const dm = state.dms.find((d) => d.id === dmId) || null;
      setState((s) => ({ ...s, mode: 'dm', selectedDm: dm, error: null }));

      const cached = dmMessagesCacheRef.current.get(dmId);
      const now = Date.now();
      if (cached && now - cached.at < MESSAGE_CACHE_TTL) {
        setState((s) => ({ ...s, dmMessages: cached.messages, isLoading: false }));
        return;
      }

      try {
        const raw = await callDiscord<Message[]>({
          method: 'GET',
          endpoint: `/channels/${dmId}/messages?limit=50`,
          token: activeToken.value,
        });
        if (seq !== dmSeqRef.current) return;
        const messages = sortMessagesAsc(raw || []);
        dmMessagesCacheRef.current.set(dmId, { at: Date.now(), messages });
        setState((s) => ({ ...s, dmMessages: messages, isLoading: false }));
      } catch (err: any) {
        if (seq !== dmSeqRef.current) return;
        setState((s) => ({ ...s, error: err?.message || 'Failed to fetch DM messages', isLoading: false }));
      }
    },
    [activeToken?.value, callDiscord, state.dms],
  );

  const selectChannel = useCallback(
    async (channelId: string) => {
      if (!activeToken?.value) return;
      const seq = ++channelSeqRef.current;
      const channel = state.channels.find((c) => c.id === channelId) || null;
      setState((s) => ({ ...s, selectedChannel: channel, isLoadingMessages: true, error: null }));

      const cached = channelMessagesCacheRef.current.get(channelId);
      const now = Date.now();
      if (cached && now - cached.at < MESSAGE_CACHE_TTL) {
        setState((s) => ({ ...s, messages: cached.messages, isLoadingMessages: false }));
        return;
      }

      try {
        const raw = await callDiscord<Message[]>({
          method: 'GET',
          endpoint: `/channels/${channelId}/messages?limit=50`,
          token: activeToken.value,
        });
        if (seq !== channelSeqRef.current) return;
        const messages = sortMessagesAsc(raw || []);
        channelMessagesCacheRef.current.set(channelId, { at: Date.now(), messages });
        setState((s) => ({ ...s, selectedChannel: channel, messages, isLoadingMessages: false }));
      } catch (err: any) {
        if (seq !== channelSeqRef.current) return;
        setState((s) => ({ ...s, isLoadingMessages: false, error: err?.message || 'Failed to fetch messages' }));
      }
    },
    [activeToken?.value, callDiscord, state.channels],
  );

  const sendMessage = useCallback(
    async (content: string, channelId?: string) => {
      const targetChannel = channelId || state.selectedChannel?.id;
      if (!activeToken?.value || !targetChannel) return;
      const message = await callDiscord<Message>({
        method: 'POST',
        endpoint: `/channels/${targetChannel}/messages`,
        token: activeToken.value,
        body: { content },
      });

      if (state.mode === 'guild') {
        setState((s) => ({ ...s, messages: [...s.messages, message] }));
        channelMessagesCacheRef.current.set(targetChannel, { at: Date.now(), messages: [...state.messages, message] });
      } else {
        setState((s) => ({ ...s, dmMessages: [...s.dmMessages, message] }));
        dmMessagesCacheRef.current.set(targetChannel, { at: Date.now(), messages: [...state.dmMessages, message] });
      }
      return message;
    },
    [activeToken?.value, callDiscord, state.selectedChannel?.id, state.mode, state.messages, state.dmMessages],
  );

  const fileToDataUrl = (file: File) =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ''));
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });

  const sendImageMessage = useCallback(
    async (file: File, content?: string, channelId?: string) => {
      const targetChannel = channelId || state.selectedChannel?.id;
      if (!activeToken?.value || !targetChannel || !file) return;
      const dataUrl = await fileToDataUrl(file);
      const res = await fetch('/api/discord-upload-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: activeToken.value,
          channelId: targetChannel,
          content: content || '',
          fileName: file.name || 'upload.png',
          mimeType: file.type || 'application/octet-stream',
          dataUrl,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message || 'Failed to send image');

      if (state.mode === 'guild') {
        setState((s) => ({ ...s, messages: [...s.messages, data as Message] }));
      } else {
        setState((s) => ({ ...s, dmMessages: [...s.dmMessages, data as Message] }));
      }
    },
    [activeToken?.value, state.selectedChannel?.id, state.mode],
  );

  const deleteMessage = useCallback(
    async (channelId: string, messageId: string) => {
      if (!activeToken?.value) return;
      await callDiscord<void>({
        method: 'DELETE',
        endpoint: `/channels/${channelId}/messages/${messageId}`,
        token: activeToken.value,
      });
      setState((s) => ({
        ...s,
        messages: s.messages.filter((m) => !(m.id === messageId && m.channel_id === channelId)),
        dmMessages: s.dmMessages.filter((m) => !(m.id === messageId && m.channel_id === channelId)),
      }));
    },
    [activeToken?.value, callDiscord],
  );

  const editMessage = useCallback(
    async (channelId: string, messageId: string, content: string) => {
      if (!activeToken?.value) return;
      const trimmed = content.trim();
      if (!trimmed) return;
      const updated = await callDiscord<Message>({
        method: 'PATCH',
        endpoint: `/channels/${channelId}/messages/${messageId}`,
        token: activeToken.value,
        body: { content: trimmed },
      });
      setState((s) => ({
        ...s,
        messages: s.messages.map((m) => (m.id === messageId && m.channel_id === channelId ? updated : m)),
        dmMessages: s.dmMessages.map((m) => (m.id === messageId && m.channel_id === channelId ? updated : m)),
      }));
    },
    [activeToken?.value, callDiscord],
  );

  const createDM = useCallback(
    async (userId: string) => {
      if (!activeToken?.value) return;
      const dm = await callDiscord<DMChannel>({
        method: 'POST',
        endpoint: '/users/@me/channels',
        token: activeToken.value,
        body: { recipients: [userId] },
      });
      setState((s) => ({ ...s, dms: [dm, ...s.dms.filter((d) => d.id !== dm.id)] }));
      return dm;
    },
    [activeToken?.value, callDiscord],
  );

  const createGroupDM = useCallback(
    async (userIds: string[]) => {
      if (!activeToken?.value) return;
      const cleaned = Array.from(new Set((userIds || []).map((id) => id.trim()).filter(Boolean)));
      if (!cleaned.length) return;
      const dm = await callDiscord<DMChannel>({
        method: 'POST',
        endpoint: '/users/@me/channels',
        token: activeToken.value,
        body: { recipients: cleaned },
      });
      setState((s) => ({ ...s, dms: [dm, ...s.dms.filter((d) => d.id !== dm.id)] }));
      return dm;
    },
    [activeToken?.value, callDiscord],
  );

  const addReaction = useCallback(
    async (channelId: string, messageId: string, emoji: string) => {
      if (!activeToken?.value) return;
      await callDiscord<void>({
        method: 'PUT',
        endpoint: `/channels/${channelId}/messages/${messageId}/reactions/${encodeURIComponent(emoji)}/@me`,
        token: activeToken.value,
      });

      const patch = (m: Message) => {
        if (!(m.id === messageId && m.channel_id === channelId)) return m;
        const reactions = [...(m.reactions || [])];
        const idx = reactions.findIndex((r) => r.emoji?.name === emoji);
        if (idx >= 0) reactions[idx] = { ...reactions[idx], count: reactions[idx].count + 1, me: true };
        else reactions.push({ count: 1, me: true, me_burst: false, emoji: { id: null, name: emoji } });
        return { ...m, reactions };
      };
      setState((s) => ({ ...s, messages: s.messages.map(patch), dmMessages: s.dmMessages.map(patch) }));
    },
    [activeToken?.value, callDiscord],
  );

  const sendTyping = useCallback(
    async (channelId: string) => {
      if (!activeToken?.value || !channelId) return;
      try {
        await callDiscord<void>({
          method: 'POST',
          endpoint: `/channels/${channelId}/typing`,
          token: activeToken.value,
        }, 0);
      } catch {
        // silent
      }
    },
    [activeToken?.value, callDiscord],
  );

  useEffect(() => {
    const init = async () => {
      if (!activeToken?.value) {
        initForTokenRef.current = null;
        setState((s) => ({ ...s, isLoading: false, error: 'No token selected' }));
        return;
      }
      if (initForTokenRef.current === activeToken.value) return;
      initForTokenRef.current = activeToken.value;
      try {
        await fetchUser();
        await fetchGuilds();
        await fetchDMs();
      } finally {
        setState((s) => ({ ...s, isLoading: false }));
      }
    };
    void init();
  }, [activeToken?.value, fetchUser, fetchGuilds, fetchDMs]);

  return {
    ...state,
    fetchUser,
    fetchGuilds,
    fetchDMs,
    selectGuild,
    selectChannel,
    selectDm,
    sendMessage,
    sendImageMessage,
    deleteMessage,
    createDM,
    createGroupDM,
    addReaction,
    editMessage,
    sendTyping,
    refreshMessages: () => {
      if (state.mode === 'guild' && state.selectedChannel) void selectChannel(state.selectedChannel.id);
      else if (state.mode === 'dm' && state.selectedDm) void selectDm(state.selectedDm.id);
    },
  };
}
