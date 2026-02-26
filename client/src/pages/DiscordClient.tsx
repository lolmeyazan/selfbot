import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation } from 'wouter';
import { useDiscordClient } from '@/hooks/useDiscordClient';
import { useAppStore } from '@/lib/store';
import { DiscordSidebar} from '@/components/discord/DiscordSidebar';
import { ChannelList, DMChannelList } from '@/components/discord/ChannelList';
import { MessageArea } from '@/components/discord/MessageArea';
import { MemberList, RoleList } from '@/components/discord/MemberList';
import { VoiceControls } from '@/components/discord/VoiceControls';
import { useToast } from '@/hooks/use-toast';
import { AlertCircle, ArrowLeft, Hash, HelpCircle, Inbox, RefreshCw, Search, Settings, Users, Video, Wifi, WifiOff } from 'lucide-react';

type ViewMode = 'guild' | 'dm';
type RightPanelMode = 'members' | 'roles';
type ThemeMode = 'dark' | 'light' | 'ash' | 'onyx';
type DensityMode = 'spacious' | 'default' | 'compact';

const themeTokens: Record<ThemeMode, { appBg: string; panelBg: string; mainBg: string; border: string; topBg: string; text: string }> = {
  dark: { appBg: '#313338', panelBg: '#2b2d31', mainBg: '#313338', border: '#26272D', topBg: '#313338', text: '#ffffff' },
  light: { appBg: '#f2f3f5', panelBg: '#e3e5e8', mainBg: '#ffffff', border: '#c7ccd1', topBg: '#ffffff', text: '#1e1f22' },
  ash: { appBg: '#2a2d31', panelBg: '#24272b', mainBg: '#2f3338', border: '#3a3f45', topBg: '#2a2d31', text: '#f2f3f5' },
  onyx: { appBg: '#0f1012', panelBg: '#15171a', mainBg: '#111316', border: '#23262b', topBg: '#111316', text: '#f5f7fa' },
};

export default function DiscordClient() {
  const activeToken = useAppStore((s) => s.getActiveToken());
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const {
    isConnected,
    isLoading,
    error,
    user,
    guilds,
    selectedGuild,
    channels,
    selectedChannel,
    messages,
    isLoadingMessages,
    members,
    roles,
    dms,
    selectedDm,
    dmMessages,
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
    refreshMessages,
  } = useDiscordClient();

  const [viewMode, setViewMode] = useState<ViewMode>('guild');
  const [rightPanel, setRightPanel] = useState<RightPanelMode>('members');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isVoiceConnected, setIsVoiceConnected] = useState(false);
  const [voiceChannelName, setVoiceChannelName] = useState<string>('');
  const [isMuted, setIsMuted] = useState(false);
  const [isDeafened, setIsDeafened] = useState(false);
  const [theme, setTheme] = useState<ThemeMode>('dark');
  const [density, setDensity] = useState<DensityMode>('default');
  const [channelListWidth, setChannelListWidth] = useState(280);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const dragStateRef = useRef<{ startX: number; startWidth: number } | null>(null);
  const tokens = themeTokens[theme];

  useEffect(() => {
    const storedTheme = localStorage.getItem('dc_theme') as ThemeMode | null;
    const storedDensity = localStorage.getItem('dc_density') as DensityMode | null;
    const storedWidth = Number(localStorage.getItem('dc_channel_width') || '280');
    if (storedTheme && themeTokens[storedTheme]) setTheme(storedTheme);
    if (storedDensity && ['spacious', 'default', 'compact'].includes(storedDensity)) setDensity(storedDensity);
    if (!Number.isNaN(storedWidth) && storedWidth >= 220 && storedWidth <= 520) setChannelListWidth(storedWidth);
  }, []);

  useEffect(() => {
    localStorage.setItem('dc_theme', theme);
  }, [theme]);
  useEffect(() => {
    localStorage.setItem('dc_density', density);
  }, [density]);
  useEffect(() => {
    localStorage.setItem('dc_channel_width', String(channelListWidth));
  }, [channelListWidth]);

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (!dragStateRef.current) return;
      const delta = e.clientX - dragStateRef.current.startX;
      const next = Math.max(220, Math.min(520, dragStateRef.current.startWidth + delta));
      setChannelListWidth(next);
    };
    const onMouseUp = () => {
      dragStateRef.current = null;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, []);
  useEffect(() => {
    if (viewMode !== 'guild') return;
    if (!selectedGuild?.id) return;
    if (!channels.length) return;
    if (selectedChannel?.id) return;

    // نبحث عن أول قناة نكست (text channel)
    const firstTextChannel = channels.find((c) => c.type === 0);
    if (firstTextChannel) {
      selectChannel(firstTextChannel.id);
    }
  }, [viewMode, selectedGuild?.id, channels, selectedChannel?.id]);

  useEffect(() => {
    if (viewMode !== 'dm') return;
    if (!dms.length) return;
    if (selectedDm?.id) return;

    // نختار أول DM
    selectDm(dms[0].id);
  }, [viewMode, dms, selectedDm?.id]);

  const handleSelectGuild = async (guildId: string) => {
    setViewMode('guild');
    setRightPanel('members');
    await selectGuild(guildId);
  };

  const handleSelectDm = async (dmId: string) => {
    setViewMode('dm');
    setIsVoiceConnected(false);
    await selectDm(dmId);
  };

  const handleSelectChannel = async (channelId: string) => {
    const ch = channels.find((c) => c.id === channelId);
    if (!ch) return;

    if (ch.type === 2 || ch.type === 13) {
      setIsVoiceConnected(true);
      setVoiceChannelName(ch.name || 'Voice Channel');
      toast({
        title: 'Voice Connected',
        description: `Joined ${ch.name}. Voice UI is active.`,
      });
      return;
    }

    setIsVoiceConnected(false);
    setVoiceChannelName('');
    await selectChannel(channelId);
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refreshMessages();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  const handleNewDm = async () => {
    const raw = window.prompt('Enter one user ID for DM, or multiple IDs separated by comma for Group DM:');
    if (!raw?.trim()) return;
    const ids = raw.split(',').map((v) => v.trim()).filter(Boolean);
    if (!ids.length) return;
    try {
      const dm = ids.length > 1 ? await createGroupDM(ids) : await createDM(ids[0]);
      if (dm?.id) {
        setViewMode('dm');
        await selectDm(dm.id);
      }
    } catch (err) {
      toast({
        title: 'Failed to create DM',
        description: err instanceof Error ? err.message : 'Unknown error',
        variant: 'destructive',
      });
    }
  };

  const activeMessages = viewMode === 'guild' ? messages : dmMessages;
  const activeChatChannel = useMemo(() => {
    if (viewMode === 'guild') return selectedChannel;
    if (!selectedDm) return null;
    return {
      id: selectedDm.id,
      name: selectedDm.recipients?.[0]?.global_name || selectedDm.recipients?.[0]?.username || 'Direct Message',
      type: 1,
    } as any;
  }, [viewMode, selectedChannel, selectedDm]);
  const topTitle = useMemo(() => {
    if (viewMode === 'guild' && selectedChannel) return `# ${selectedChannel.name}`;
    if (viewMode === 'dm' && selectedDm) {
      return selectedDm.recipients?.[0]?.global_name || selectedDm.recipients?.[0]?.username || 'Direct Message';
    }
    return 'Discord Client';
  }, [viewMode, selectedChannel, selectedDm]);

  if (!activeToken?.value) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-[#313338]">
        <div className="text-center px-4">
          <AlertCircle className="w-16 h-16 text-[#DA373C] mx-auto mb-4" />
          <h2 className="text-white text-xl font-semibold mb-2">No Token Selected</h2>
          <p className="text-[#B5BAC1]">Add/select token from Tokens page first.</p>
        </div>
      </div>
    );
  }

if (isLoading) {
  return (
    <div className="h-screen w-screen flex items-center justify-center bg-[#313338]">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-[#5865f2] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-[#B5BAC1]">Connecting to Discord...</p>
      </div>
    </div>
  );
}
  if (error && !isConnected) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-[#313338]">
        <div className="text-center px-4">
          <AlertCircle className="w-16 h-16 text-[#DA373C] mx-auto mb-4" />
          <h2 className="text-white text-xl font-semibold mb-2">Connection Failed</h2>
          <p className="text-[#B5BAC1] mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-[#5865F2] text-white rounded hover:bg-[#4752C4] transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen flex overflow-hidden text-white" style={{ backgroundColor: tokens.appBg, color: tokens.text }}>
      <DiscordSidebar
        guilds={guilds}
        selectedGuildId={viewMode === 'guild' ? selectedGuild?.id || null : null}
        onSelectGuild={handleSelectGuild}
        onHomeClick={() => setViewMode('dm')}
      />

      {viewMode === 'guild' ? (
        <ChannelList
          guild={selectedGuild}
          channels={channels}
          selectedChannelId={selectedChannel?.id || null}
          onSelectChannel={handleSelectChannel}
          onSettingsClick={() => {}}
          width={channelListWidth}
          density={density}
          panelColor={tokens.panelBg}
          panelBorderColor={tokens.border}
        />
      ) : (
        <DMChannelList
          dms={dms}
          selectedDmId={selectedDm?.id || null}
          onSelectDm={handleSelectDm}
          onNewDm={handleNewDm}
          width={channelListWidth}
          density={density}
          panelColor={tokens.panelBg}
          panelBorderColor={tokens.border}
        />
      )}

      <div
        className="w-1 hover:w-1.5 bg-transparent hover:bg-[#5865F2]/60 transition-all cursor-col-resize"
        onMouseDown={(e) => {
          dragStateRef.current = { startX: e.clientX, startWidth: channelListWidth };
          document.body.style.cursor = 'col-resize';
          document.body.style.userSelect = 'none';
        }}
        title="Resize channel list"
      />

      <div className="flex-1 min-w-0 flex flex-col">
        <div className="h-12 border-b px-4 flex items-center justify-between sticky top-0 z-10" style={{ backgroundColor: tokens.topBg, borderColor: tokens.border }}>
          <div className="flex items-center gap-2 min-w-0">
            {viewMode === 'guild' ? <Hash className="w-5 h-5 text-[#949BA4]" /> : null}
            <span className="font-semibold truncate">{topTitle}</span>
          </div>

          <div className="flex items-center gap-1 text-[#B5BAC1]">
            <button
              onClick={() => setLocation('/dashboard')}
              className="p-2 rounded hover:bg-[#3F4147]"
              title="Back"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <button onClick={handleRefresh} className="p-2 rounded hover:bg-[#3F4147]" title="Refresh" disabled={isRefreshing}>
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>
            <button className="p-2 rounded hover:bg-[#3F4147]" title="Search">
              <Search className="w-4 h-4" />
            </button>
            <button className="p-2 rounded hover:bg-[#3F4147]" title="Inbox">
              <Inbox className="w-4 h-4" />
            </button>
            <button className="p-2 rounded hover:bg-[#3F4147]" title="Help">
              <HelpCircle className="w-4 h-4" />
            </button>
            <button className="p-2 rounded hover:bg-[#3F4147]" title="Start Video">
              <Video className="w-4 h-4" />
            </button>
            <div className="relative">
              <button className="p-2 rounded hover:bg-[#3F4147]" title="Client Settings" onClick={() => setSettingsOpen((v) => !v)}>
                <Settings className="w-4 h-4" />
              </button>
              {settingsOpen ? (
                <div className="absolute right-0 mt-2 w-60 p-3 rounded-lg border bg-[#1e1f22] z-30" style={{ borderColor: tokens.border }}>
                  <div className="text-xs text-[#B5BAC1] mb-1">Theme</div>
                  <select
                    className="w-full mb-3 bg-[#2b2d31] border border-[#3F4147] rounded px-2 py-1 text-sm"
                    value={theme}
                    onChange={(e) => setTheme(e.target.value as ThemeMode)}
                  >
                    <option value="dark">Dark</option>
                    <option value="light">Light</option>
                    <option value="ash">Ash</option>
                    <option value="onyx">Onyx</option>
                  </select>
                  <div className="text-xs text-[#B5BAC1] mb-1">Density</div>
                  <select
                    className="w-full mb-3 bg-[#2b2d31] border border-[#3F4147] rounded px-2 py-1 text-sm"
                    value={density}
                    onChange={(e) => setDensity(e.target.value as DensityMode)}
                  >
                    <option value="spacious">Spacious</option>
                    <option value="default">Default</option>
                    <option value="compact">Compact</option>
                  </select>
                  <div className="text-xs text-[#B5BAC1] mb-1">Channel List Width: {Math.round(channelListWidth)}px</div>
                  <input
                    type="range"
                    min={220}
                    max={520}
                    value={channelListWidth}
                    onChange={(e) => setChannelListWidth(Number(e.target.value))}
                    className="w-full"
                  />
                </div>
              ) : null}
            </div>
            {viewMode === 'guild' ? (
              <button
                onClick={() => setRightPanel((prev) => (prev === 'members' ? 'roles' : 'members'))}
                className="p-2 rounded hover:bg-[#3F4147]"
                title="Toggle Members/Roles"
              >
                <Users className="w-4 h-4" />
              </button>
            ) : null}
            <div className="ml-2 flex items-center gap-1 text-xs">
              {isConnected ? (
                <>
                  <Wifi className="w-3 h-3 text-[#23A55A]" />
                  <span className="text-[#23A55A]">Connected</span>
                </>
              ) : (
                <>
                  <WifiOff className="w-3 h-3 text-[#F23F43]" />
                  <span className="text-[#F23F43]">Disconnected</span>
                </>
              )}
            </div>
          </div>
        </div>

        <MessageArea
          channel={activeChatChannel}
          messages={activeMessages}
          isLoading={isLoadingMessages}
          currentUser={user}
          density={density}
          messageBgColor={tokens.mainBg}
          borderColor={tokens.border}
          onSendMessage={(content) => {
            if (viewMode === 'dm' && selectedDm?.id) {
              return sendMessage(content, selectedDm.id) as Promise<void>;
            }
            return sendMessage(content) as Promise<void>;
          }}
          onSendImage={(file, content) => {
            if (viewMode === 'dm' && selectedDm?.id) {
              return sendImageMessage(file, content, selectedDm.id) as Promise<void>;
            }
            return sendImageMessage(file, content) as Promise<void>;
          }}
          onDeleteMessage={(messageId) => {
            const channelId = viewMode === 'guild' ? selectedChannel?.id : selectedDm?.id;
            if (channelId) deleteMessage(channelId, messageId);
          }}
          onEditMessage={(messageId, content) => {
            const channelId = viewMode === 'guild' ? selectedChannel?.id : selectedDm?.id;
            if (channelId) editMessage(channelId, messageId, content);
          }}
          onAddReaction={(messageId, emoji) => {
            const channelId = viewMode === 'guild' ? selectedChannel?.id : selectedDm?.id;
            if (channelId) addReaction(channelId, messageId, emoji);
          }}
          onTyping={() => {
            const channelId = viewMode === 'guild' ? selectedChannel?.id : selectedDm?.id;
            if (channelId) sendTyping(channelId);
          }}
        />

        <VoiceControls
          isConnected={isVoiceConnected}
          isMuted={isMuted}
          isDeafened={isDeafened}
          channelName={voiceChannelName}
          onToggleMute={() => setIsMuted((v) => !v)}
          onToggleDeafen={() => setIsDeafened((v) => !v)}
          onDisconnect={() => setIsVoiceConnected(false)}
          onSettings={() => {}}
        />
      </div>

      {viewMode === 'guild' && selectedGuild ? (
        <div className="w-[240px] border-l border-[#26272D]" style={{ backgroundColor: tokens.panelBg, borderColor: tokens.border }}>
          {rightPanel === 'members' ? (
            <MemberList members={members} roles={roles} />
          ) : (
            <RoleList roles={roles} />
          )}
        </div>
      ) : null}
    </div>
  );
}
