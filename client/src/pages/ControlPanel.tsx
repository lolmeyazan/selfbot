import React, { useState } from 'react';
import { Volume2, MicOff, VolumeX, Cpu, Gamepad2, Radio, Headphones, Film, Trophy, Smile, RefreshCw, Save, Wifi, WifiOff, Zap, User, MessageCircle, MessageSquare, Copy, Layers, AlertTriangle, Repeat2, UserMinus, Trash2, LogOut, ShieldAlert } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { AppLayout } from '@/components/layout/AppLayout';
import { GlitchText } from '@/components/effects/GlitchText';
import { CyberButton } from '@/components/ui/CyberButton';
import { CyberInput } from '@/components/ui/CyberInput';
import { useToast } from '@/hooks/use-toast';
import { terminalLogger } from '@/lib/terminalLogger';

// Account Control Action Component with double confirmation
function AccountControlAction({
  icon: Icon,
  title,
  description,
  buttonText,
  confirmText,
  actionType,
  token
}: {
  icon: React.ElementType;
  title: string;
  description: string;
  buttonText: string;
  confirmText: string;
  actionType: 'block' | 'deletedms' | 'leaveservers';
  token?: string;
}) {
  const [confirmStep, setConfirmStep] = useState<0 | 1 | 2>(0);
  const [customConfirm, setCustomConfirm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleConfirm = async () => {
    if (confirmStep === 0) {
      setConfirmStep(1);
      return;
    }

    if (confirmStep === 1) {
      if (customConfirm.toUpperCase() !== confirmText) {
        toast({
          title: 'Confirmation failed',
          description: `Please type "${confirmText}" exactly`,
          variant: 'destructive',
        });
        return;
      }
      setConfirmStep(2);
      executeAction();
    }
  };

  const executeAction = async () => {
    if (!token) {
      toast({
        title: 'No token selected',
        description: 'Please select a token first',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    try {
      let endpoint = '';
      switch (actionType) {
        case 'block':
          endpoint = '/api/discord-selfbot-block-all';
          break;
        case 'deletedms':
          endpoint = '/api/discord-selfbot-delete-dms';
          break;
        case 'leaveservers':
          endpoint = '/api/discord-selfbot-leave-servers';
          break;
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, confirm: true }),
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: 'Success',
          description: data.message || 'Action completed',
        });
        terminalLogger.success(`${title}: ${data.message}`);
      } else {
        toast({
          title: 'Error',
          description: data.message || 'Action failed',
          variant: 'destructive',
        });
        terminalLogger.error(`${title} failed: ${data.message}`);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Network error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
      setConfirmStep(0);
      setCustomConfirm('');
    }
  };

  const handleCancel = () => {
    setConfirmStep(0);
    setCustomConfirm('');
  };

  return (
    <div className="border border-red-500/30 bg-red-900/10 p-4 rounded-md">
      <div className="flex items-start gap-4">
        <div className="p-3 bg-red-500/20 rounded-lg">
          <Icon className="w-6 h-6 text-red-400" />
        </div>
        <div className="flex-1">
          <h3 className="text-white font-semibold text-lg">{title}</h3>
          <p className="text-red-300/70 text-sm mt-1">{description}</p>

          {/* Confirmation Steps */}
          {confirmStep === 0 && (
            <button
              onClick={handleConfirm}
              disabled={!token}
              className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-red-800 disabled:cursor-not-allowed text-white rounded-md transition-colors"
            >
              {buttonText}
            </button>
          )}

          {confirmStep === 1 && (
            <div className="mt-4 space-y-3">
              <div className="bg-red-900/30 p-3 rounded-md">
                <p className="text-red-300 text-sm font-mono">
                  Type <span className="text-white font-bold">{confirmText}</span> to confirm
                </p>
              </div>
              <input
                type="text"
                value={customConfirm}
                onChange={(e) => setCustomConfirm(e.target.value)}
                placeholder={`Type "${confirmText}"`}
                className="w-full bg-black/50 border border-red-500/50 text-white px-3 py-2 rounded-md focus:outline-none focus:border-red-500"
              />
              <div className="flex gap-2">
                <button
                  onClick={handleConfirm}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md transition-colors"
                >
                  Confirm
                </button>
                <button
                  onClick={handleCancel}
                  className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-md transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {confirmStep === 2 && (
            <div className="mt-4">
              <div className="flex items-center gap-2 text-yellow-400">
                <div className="animate-spin w-4 h-4 border-2 border-yellow-400 border-t-transparent rounded-full" />
                <span>Executing action...</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

type PresenceStatus = 'online' | 'idle' | 'dnd';
type ActivityType = 'Playing' | 'Streaming' | 'Listening' | 'Watching' | 'Competing';
type TabType = 'presence' | 'autodm' | 'autoreact' | 'afkvoice' | 'servercopy' | 'repeater' | 'accountcontrol';

interface PresenceConfig {
  status: PresenceStatus;
  activity: {
    type: ActivityType;
    name: string;
    url?: string;
  };
  customStatus: string;
}

interface AutoReactConfig {
  enabled: boolean;
  guildId: string;
  channelId: string;
  emoji: string;
  ignoreBots: boolean;
}

interface AutoDmConfig {
  enabled: boolean;
  message: string;
  replyOnce: boolean;
}

interface AFKVoiceConfig {
  enabled: boolean;
  guildId: string;
  voiceChannelId: string;
  reason?: string;
  autoReconnect: boolean;
}

interface ServerCopyConfig {
  enabled: boolean;
  sourceGuildId: string;
  targetGuildId: string;
  copyEmojis: boolean;
  copyRoles: boolean;
  copyChannels: boolean;
  copyName: boolean;
}

interface RepeaterConfig {
  enabled: boolean;
  relayToken: string;
  prefix: string;
  ownerId: string;
}

interface ServerCopyLogEntry {
  id: number;
  type: 'info' | 'success' | 'error';
  message: string;
  at: string;
}

export default function PresencePanel() {
  const activeToken = useAppStore((s) => s.getActiveToken());
  const updateToken = useAppStore((s) => s.updateToken);
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState<TabType>('presence');

  const [config, setConfig] = useState<PresenceConfig>({
    status: 'online',
    activity: {
      type: 'Playing',
      name: ''
    },
    customStatus: ''
  });

  const [autoReact, setAutoReact] = useState<AutoReactConfig>({
    enabled: true,
    guildId: '',
    channelId: '',
    emoji: '',
    ignoreBots: true
  });

  const [autoDm, setAutoDm] = useState<AutoDmConfig>({
    enabled: true,
    message: '',
    replyOnce: true
  });

  const [afkVoice, setAfkVoice] = useState<AFKVoiceConfig>({
    enabled: false,
    guildId: '',
    voiceChannelId: '',
    reason: 'AFK',
    autoReconnect: true
  });

  const [serverCopy, setServerCopy] = useState<ServerCopyConfig>({
    enabled: false,
    sourceGuildId: '',
    targetGuildId: '',
    copyEmojis: true,
    copyRoles: true,
    copyChannels: true,
    copyName: true
  });

  const [repeater, setRepeater] = useState<RepeaterConfig>({
    enabled: false,
    relayToken: '',
    prefix: '#',
    ownerId: ''
  });

  const [isConnected, setIsConnected] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [userTag, setUserTag] = useState('');
  const [loading, setLoading] = useState(false);
  const [testResult, setTestResult] = useState<{guild: string; channel: string; status: string} | null>(null);
  const [voiceTestResult, setVoiceTestResult] = useState<{guild: string; channel: string; status: string} | null>(null);
  const [serverCopyLogs, setServerCopyLogs] = useState<ServerCopyLogEntry[]>([]);

  const appendServerCopyLog = (type: ServerCopyLogEntry['type'], message: string) => {
    setServerCopyLogs((prev) => [
      ...prev,
      {
        id: Date.now() + Math.floor(Math.random() * 1000),
        type,
        message,
        at: new Date().toLocaleTimeString(),
      },
    ]);
  };

  const activityTypes: { type: ActivityType; icon: React.ReactNode; label: string }[] = [
    { type: 'Playing', icon: <Gamepad2 className="w-4 h-4" />, label: 'Playing' },
    { type: 'Streaming', icon: <Radio className="w-4 h-4" />, label: 'Streaming' },
    { type: 'Listening', icon: <Headphones className="w-4 h-4" />, label: 'Listening' },
    { type: 'Watching', icon: <Film className="w-4 h-4" />, label: 'Watching' },
    { type: 'Competing', icon: <Trophy className="w-4 h-4" />, label: 'Competing' },
  ];

  const statusOptions: { status: PresenceStatus; label: string; color: string }[] = [
    { status: 'online', label: 'Online', color: 'bg-green-500' },
    { status: 'idle', label: 'Idle', color: 'bg-yellow-500' },
    { status: 'dnd', label: 'Do Not Disturb', color: 'bg-red-500' },
  ];

  const connect = async () => {
    if (!activeToken) {
      toast({ title: 'Error', description: 'No active token selected', variant: 'destructive' });
      return;
    }

    try {
      setLoading(true);
      
      const res = await fetch('/api/discord-selfbot-presence', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: activeToken.value,
          status: 'online',
          activity: { type: 'Playing', name: ' ' },
          customStatus: ''
        })
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Failed to connect');
      }
      
      const userRes = await fetch('/api/discord-proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          method: 'GET',
          endpoint: '/users/@me',
          token: activeToken.value
        })
      });

      if (!userRes.ok) throw new Error('Failed to get user info');
      const user = await userRes.json();
      setUserTag(`${user.username}#${user.discriminator || user.id.slice(-4)}`);
      setIsConnected(true);
      toast({ title: 'Connected', description: `Connected as ${user.username}` });
    } catch (error) {
      toast({ title: 'Error', description: error instanceof Error ? error.message : 'Failed to connect to Discord', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const disconnect = () => {
    setIsConnected(false);
    setUserTag('');
    setAfkVoice(prev => ({ ...prev, enabled: false }));
  };

  const updatePresence = async () => {
    if (!activeToken || !isConnected) {
      toast({ title: 'Error', description: 'Not connected to Discord', variant: 'destructive' });
      return;
    }

    try {
      setIsUpdating(true);
      
      const res = await fetch('/api/discord-selfbot-presence', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: activeToken.value,
          status: config.status,
          activity: config.activity.name ? {
            type: config.activity.type,
            name: config.activity.name,
            url: config.activity.type === 'Streaming' ? config.activity.url : undefined
          } : undefined,
          customStatus: config.customStatus || undefined
        })
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Failed to update');
      }

      toast({ title: 'Success', description: 'Presence updated successfully!' });
      updateToken(activeToken.id, { status: config.status });
    } catch (error) {
      toast({ 
        title: 'Error', 
        description: error instanceof Error ? error.message : 'Failed to update presence', 
        variant: 'destructive' 
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const saveAutoReact = async () => {
    if (!activeToken || !isConnected) {
      toast({ title: 'Error', description: 'Not connected to Discord', variant: 'destructive' });
      return;
    }

    if (!autoReact.channelId) {
      toast({ title: 'Error', description: 'Please enter a channel ID', variant: 'destructive' });
      return;
    }

    if (!autoReact.guildId) {
      toast({ title: 'Error', description: 'Please enter a Guild ID', variant: 'destructive' });
      return;
    }

    try {
      setIsUpdating(true);
      
      const res = await fetch('/api/discord-selfbot-auto-react', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: activeToken.value,
          enabled: autoReact.enabled,
          guildId: autoReact.guildId,
          channelId: autoReact.channelId,
          emojis: autoReact.emoji || '👍',
          ignoreBots: autoReact.ignoreBots
        })
      });

      const data = await res.json();
      terminalLogger.success('Auto react response: ' + JSON.stringify(data));

      if (!res.ok) {
        throw new Error(data.error || 'Failed to configure');
      }

      toast({ title: 'Success', description: data.message || (autoReact.enabled ? 'Auto React enabled!' : 'Auto React disabled') });
    } catch (error) {
      terminalLogger.error('Auto react error: ' + (error instanceof Error ? error.message : 'Unknown error'));
      toast({ 
        title: 'Error', 
        description: error instanceof Error ? error.message : 'Failed to configure auto react', 
        variant: 'destructive' 
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const testAutoReact = async () => {
    if (!activeToken || !isConnected) {
      toast({ title: 'Error', description: 'Not connected to Discord', variant: 'destructive' });
      return;
    }

    if (!autoReact.guildId || !autoReact.channelId) {
      toast({ title: 'Error', description: 'Please enter Guild ID and Channel ID', variant: 'destructive' });
      return;
    }

    try {
      setIsUpdating(true);
      setTestResult(null);
      
      const guildRes = await fetch('/api/discord-proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          method: 'GET',
          endpoint: `/guilds/${autoReact.guildId}`,
          token: activeToken.value
        })
      });

      if (!guildRes.ok) {
        throw new Error('Invalid Guild ID');
      }
      const guild = await guildRes.json();

      const channelRes = await fetch('/api/discord-proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          method: 'GET',
          endpoint: `/channels/${autoReact.channelId}`,
          token: activeToken.value
        })
      });

      if (!channelRes.ok) {
        throw new Error('Invalid Channel ID');
      }
      const channel = await channelRes.json();

      setTestResult({
        guild: guild.name || 'Unknown',
        channel: channel.name || 'Unknown',
        status: 'Connected!'
      });
      toast({ title: 'Success', description: `Test successful! Monitoring #${channel.name} in ${guild.name}` });
    } catch (error) {
      setTestResult({
        guild: 'Error',
        channel: 'Error',
        status: error instanceof Error ? error.message : 'Failed'
      });
      toast({ 
        title: 'Error', 
        description: error instanceof Error ? error.message : 'Test failed', 
        variant: 'destructive' 
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const saveAutoDM = async () => {
    if (!activeToken || !isConnected) {
      toast({ title: 'Error', description: 'Not connected to Discord', variant: 'destructive' });
      return;
    }

    if (autoDm.enabled && !autoDm.message.trim()) {
      toast({ title: 'Error', description: 'Please enter auto-reply message', variant: 'destructive' });
      return;
    }

    try {
      setIsUpdating(true);
      const res = await fetch('/api/discord-selfbot-auto-dm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: activeToken.value,
          enabled: autoDm.enabled,
          message: autoDm.message.trim(),
          replyOnce: autoDm.replyOnce,
          cooldown: 1
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to configure Auto DM');
      }

      toast({
        title: 'Success',
        description: autoDm.enabled
          ? 'Auto DM enabled (one reply per user).'
          : 'Auto DM disabled.'
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to configure Auto DM',
        variant: 'destructive'
      });
    } finally {
      setIsUpdating(false);
    }
  };

const saveAFKVoice = async () => {
  if (!activeToken || !isConnected) {
    toast({ title: 'Error', description: 'Not connected to Discord', variant: 'destructive' });
    return;
  }

  if (afkVoice.enabled && (!afkVoice.guildId || !afkVoice.voiceChannelId)) {
    toast({ title: 'Error', description: 'Please enter Guild ID and Voice Channel ID', variant: 'destructive' });
    return;
  }

  try {
    setIsUpdating(true);
    setVoiceTestResult(null);
    
    const requestData = {
      token: activeToken.value,
      enabled: afkVoice.enabled,
      guildId: afkVoice.guildId,
      voiceChannelId: afkVoice.voiceChannelId,
      reason: afkVoice.reason || 'AFK',
      autoReconnect: afkVoice.autoReconnect
    };
    
    terminalLogger.info('Sending AFK voice request: ' + JSON.stringify(requestData));

    const res = await fetch('/api/discord-selfbot-afk-voice', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestData)
    });

    // Get raw response text to see the problem
    const responseText = await res.text();
    terminalLogger.info('Raw response: ' + responseText);

    // Try to parse as JSON if possible
    let data;
    try {
      data = JSON.parse(responseText);
    } catch (e) {
      terminalLogger.error('Failed to parse response: ' + responseText);
      throw new Error('Server returned invalid response');
    }

    terminalLogger.success('Parsed response: ' + JSON.stringify(data));

    if (!res.ok) {
      throw new Error(data.error || `Server error: ${res.status}`);
    }

    if (afkVoice.enabled) {
      setVoiceTestResult({
        guild: data.guild || 'Connected',
        channel: data.channel || afkVoice.voiceChannelId,
        status: '✅ AFK Mode Active'
      });
      
      toast({ 
        title: '✅ AFK Voice Enabled', 
        description: data.message || 'Joined voice channel'
      });
    } else {
      setVoiceTestResult(null);
      toast({ 
        title: 'AFK Voice Disabled', 
        description: 'Left voice channel' 
      });
    }

  } catch (error) {
    terminalLogger.error('AFK voice error: ' + (error instanceof Error ? error.message : 'Unknown error'));
    
    setVoiceTestResult({
      guild: 'Error',
      channel: 'Error',
      status: error instanceof Error ? error.message : 'Failed'
    });
    
    toast({ 
      title: '❌ Error', 
      description: error instanceof Error ? error.message : 'Failed to configure AFK Voice', 
      variant: 'destructive' 
    });
  } finally {
    setIsUpdating(false);
  }
};

  const testAFKVoice = async () => {
    if (!activeToken || !isConnected) {
      toast({ title: 'Error', description: 'Not connected to Discord', variant: 'destructive' });
      return;
    }

    if (!afkVoice.guildId || !afkVoice.voiceChannelId) {
      toast({ title: 'Error', description: 'Please enter Guild ID and Voice Channel ID', variant: 'destructive' });
      return;
    }

    try {
      setIsUpdating(true);
      setVoiceTestResult(null);
      
      const guildRes = await fetch('/api/discord-proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          method: 'GET',
          endpoint: `/guilds/${afkVoice.guildId}`,
          token: activeToken.value
        })
      });

      if (!guildRes.ok) {
        throw new Error('Invalid Guild ID');
      }
      const guild = await guildRes.json();

      const channelRes = await fetch('/api/discord-proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          method: 'GET',
          endpoint: `/channels/${afkVoice.voiceChannelId}`,
          token: activeToken.value
        })
      });

      if (!channelRes.ok) {
        throw new Error('Invalid Voice Channel ID');
      }
      const channel = await channelRes.json();

      if (channel.type !== 2) {
        throw new Error('This is not a voice channel');
      }

      setVoiceTestResult({
        guild: guild.name || 'Unknown',
        channel: channel.name || 'Unknown',
        status: '✅ Voice channel is accessible'
      });

      toast({ 
        title: 'Success', 
        description: `Found #${channel.name} in ${guild.name}` 
      });

    } catch (error) {
      setVoiceTestResult({
        guild: 'Error',
        channel: 'Error',
        status: error instanceof Error ? error.message : 'Test failed'
      });
      toast({ 
        title: 'Error', 
        description: error instanceof Error ? error.message : 'Test failed', 
        variant: 'destructive' 
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const saveRepeater = async () => {
    if (!activeToken || !isConnected) {
      toast({ title: 'Error', description: 'Not connected to Discord', variant: 'destructive' });
      return;
    }

    if (!repeater.prefix.trim()) {
      toast({ title: 'Error', description: 'Please enter a prefix', variant: 'destructive' });
      return;
    }

    if (!repeater.ownerId.trim()) {
      toast({ title: 'Error', description: 'Please enter Owner ID', variant: 'destructive' });
      return;
    }

    try {
      setIsUpdating(true);

      const res = await fetch('/api/discord-selfbot-repeater', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: activeToken.value,
          relayToken: repeater.relayToken.trim(),
          enabled: repeater.enabled,
          prefix: repeater.prefix.trim(),
          ownerId: repeater.ownerId.trim()
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || data.error || 'Failed to configure repeater');
      }

      toast({
        title: 'Success',
        description: data.message || (repeater.enabled ? 'Repeater enabled.' : 'Repeater disabled.')
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to configure repeater',
        variant: 'destructive'
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const saveServerCopy = async () => {
    if (!activeToken || !isConnected) {
      appendServerCopyLog('error', 'Not connected to Discord');
      return;
    }

    if (!serverCopy.sourceGuildId || !serverCopy.targetGuildId) {
      appendServerCopyLog('error', 'Please enter both Source and Target Server IDs');
      return;
    }

    if (serverCopy.sourceGuildId === serverCopy.targetGuildId) {
      appendServerCopyLog('error', 'Source and Target Server IDs must be different');
      return;
    }

    try {
      setIsUpdating(true);
      appendServerCopyLog('info', 'Starting copy operation...');
      
      const requestData = {
        token: activeToken.value,
        enabled: serverCopy.enabled,
        sourceGuildId: serverCopy.sourceGuildId,
        targetGuildId: serverCopy.targetGuildId,
        copyEmojis: serverCopy.copyEmojis,
        copyRoles: serverCopy.copyRoles,
        copyChannels: serverCopy.copyChannels,
        copyName: serverCopy.copyName
      };
      
      terminalLogger.info('Sending Server Copy request: ' + JSON.stringify(requestData));

      const res = await fetch('/api/discord-selfbot-server-copy', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestData)
      });

      const responseText = await res.text();
      terminalLogger.info('Server Copy response: ' + responseText);

      let data;
      try {
        data = JSON.parse(responseText);
      } catch (e) {
        terminalLogger.error('Failed to parse response: ' + responseText);
        throw new Error('Server returned invalid response');
      }

      if (!res.ok) {
        throw new Error(data.error || data.message || `Server error: ${res.status}`);
      }

      terminalLogger.success('Server Copy completed: ' + JSON.stringify(data));

      if (Array.isArray(data.results)) {
        data.results.forEach((line: string) => {
          const lineType = line.toLowerCase().includes('failed') ? 'error' : 'success';
          appendServerCopyLog(lineType, line);
        });
      }

      const detailed = data.detailedResults;
      if (detailed?.name) {
        appendServerCopyLog('success', `Name: ${detailed.name}`);
      }
      if (Array.isArray(detailed?.roles)) {
        detailed.roles.forEach((role: string) => appendServerCopyLog('success', `Role copied: ${role}`));
      }
      if (Array.isArray(detailed?.channels)) {
        detailed.channels.forEach((channel: string) => appendServerCopyLog('success', `Channel copied: ${channel}`));
      }
      if (Array.isArray(detailed?.emojis)) {
        detailed.emojis.forEach((emoji: string) => appendServerCopyLog('success', `Emoji copied: ${emoji}`));
      }
      if (Array.isArray(detailed?.failed)) {
        detailed.failed.forEach((item: string) => appendServerCopyLog('error', `Failed: ${item}`));
      }

      appendServerCopyLog('success', data.message || 'Server copy operation finished.');

    } catch (error) {
      terminalLogger.error('Server Copy error: ' + (error instanceof Error ? error.message : 'Unknown error'));
      appendServerCopyLog('error', error instanceof Error ? error.message : 'Failed to copy server');
    } finally {
      setIsUpdating(false);
    }
  };

  const testServerCopy = async () => {
    if (!activeToken || !isConnected) {
      appendServerCopyLog('error', 'Not connected to Discord');
      return;
    }

    if (!serverCopy.sourceGuildId || !serverCopy.targetGuildId) {
      appendServerCopyLog('error', 'Please enter both Source and Target Server IDs');
      return;
    }

    try {
      setIsUpdating(true);
      appendServerCopyLog('info', 'Validating source and target servers...');
      
      // Validate source server
      const sourceRes = await fetch('/api/discord-proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          method: 'GET',
          endpoint: `/guilds/${serverCopy.sourceGuildId}`,
          token: activeToken.value
        })
      });

      if (!sourceRes.ok) {
        throw new Error('Invalid Source Server ID');
      }
      const sourceGuild = await sourceRes.json();

      // Validate target server
      const targetRes = await fetch('/api/discord-proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          method: 'GET',
          endpoint: `/guilds/${serverCopy.targetGuildId}`,
          token: activeToken.value
        })
      });

      if (!targetRes.ok) {
        throw new Error('Invalid Target Server ID');
      }
      const targetGuild = await targetRes.json();

      terminalLogger.success(`Server Copy validation: ${sourceGuild.name} -> ${targetGuild.name}`);
      appendServerCopyLog('success', `Source: ${sourceGuild.name} (${serverCopy.sourceGuildId})`);
      appendServerCopyLog('success', `Target: ${targetGuild.name} (${serverCopy.targetGuildId})`);
      appendServerCopyLog('success', 'Validation passed. Ready to copy.');

    } catch (error) {
      terminalLogger.error('Server Copy validation error: ' + (error instanceof Error ? error.message : 'Unknown error'));
      appendServerCopyLog('error', error instanceof Error ? error.message : 'Validation failed');
    } finally {
      setIsUpdating(false);
    }
  };

  if (!activeToken) {
    return (
      <AppLayout>
        <div className="h-[60vh] flex flex-col items-center justify-center border border-destructive/50 glass-panel">
          <Cpu className="w-14 h-14 text-destructive mb-3 animate-pulse" />
          <GlitchText text="NO ACTIVE TOKEN" className="text-2xl font-bold text-destructive" />
          <p className="mt-2 font-mono text-primary/60">Select a token first from Tokens page.</p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <GlitchText text={`CONTROL PANEL FOR ${activeToken.profile?.username?.toUpperCase() || activeToken.label?.toUpperCase() || 'USER'}`} className="text-3xl font-bold" />
          <p className="font-mono text-primary/60 text-sm">
            Token: @{activeToken.profile?.username || activeToken.label}
            {isConnected && <span className="text-green-500 ml-2">● {userTag}</span>}
          </p>
        </div>
        <div className="flex gap-2">
          {!isConnected ? (
            <CyberButton onClick={connect} disabled={loading}>
              {loading ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Wifi className="w-4 h-4 mr-2" />}
              Connect
            </CyberButton>
          ) : (
            <CyberButton variant="destructive" onClick={disconnect}>
              <WifiOff className="w-4 h-4 mr-2" />
              Disconnect
            </CyberButton>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 flex-wrap">
        <CyberButton
          variant={activeTab === 'presence' ? 'primary' : 'outline'}
          onClick={() => setActiveTab('presence')}
          className="flex items-center gap-2"
        >
          <User className="w-4 h-4" />
          Presence
        </CyberButton>
        <CyberButton
          variant={activeTab === 'autodm' ? 'primary' : 'outline'}
          onClick={() => setActiveTab('autodm')}
          className="flex items-center gap-2"
        >
          <MessageSquare className="w-4 h-4" />
          Auto DM
        </CyberButton>
        <CyberButton
          variant={activeTab === 'autoreact' ? 'primary' : 'outline'}
          onClick={() => setActiveTab('autoreact')}
          className="flex items-center gap-2"
        >
          <MessageCircle className="w-4 h-4" />
          Auto React
        </CyberButton>
        <CyberButton
          variant={activeTab === 'afkvoice' ? 'primary' : 'outline'}
          onClick={() => setActiveTab('afkvoice')}
          className="flex items-center gap-2"
        >
          <Volume2 className="w-4 h-4" />
          AFK Voice
        </CyberButton>
        <CyberButton
          variant={activeTab === 'servercopy' ? 'primary' : 'outline'}
          onClick={() => setActiveTab('servercopy')}
          className="flex items-center gap-2"
        >
          <Copy className="w-4 h-4" />
          Server Copy
        </CyberButton>
        <CyberButton
          variant={activeTab === 'repeater' ? 'primary' : 'outline'}
          onClick={() => setActiveTab('repeater')}
          className="flex items-center gap-2"
        >
          <Repeat2 className="w-4 h-4" />
          Repeater
        </CyberButton>
        <CyberButton
          variant={activeTab === 'accountcontrol' ? 'primary' : 'outline'}
          onClick={() => setActiveTab('accountcontrol')}
          className="flex items-center gap-2"
        >
          <ShieldAlert className="w-4 h-4" />
          Account Control
        </CyberButton>
      </div>

      <div className="max-w-2xl mx-auto space-y-6">
        {/* Presence Tab */}
        {activeTab === 'presence' && (
          <>
            <section className="border border-primary/30 bg-black/50 p-5 rounded-md">
              <div className="flex items-center gap-2 font-mono text-primary text-sm mb-4">
                <Gamepad2 className="w-4 h-4" /> ACTIVITY
              </div>

              <div className="grid grid-cols-5 gap-2 mb-4">
                {activityTypes.map((item) => (
                  <button
                    key={item.type}
                    onClick={() => setConfig(prev => ({ 
                      ...prev, 
                      activity: { 
                        type: item.type as ActivityType, 
                        name: prev.activity.name,
                        url: prev.activity.url
                      } 
                    }))}
                    className={`
                      p-3 border rounded-md flex flex-col items-center gap-1 transition-all text-xs
                      ${config.activity.type === item.type 
                        ? 'border-cyan-500 bg-cyan-500/20 text-cyan-400' 
                        : 'border-primary/30 bg-black/30 hover:bg-primary/10 text-primary/70'
                      }
                    `}
                  >
                    {item.icon}
                    <span>{item.label}</span>
                  </button>
                ))}
              </div>

              <CyberInput
                label="Activity Name"
                value={config.activity.name}
                onChange={(e) => setConfig(prev => ({ ...prev, activity: { ...prev.activity, name: e.target.value } }))}
                placeholder={config.activity.type === 'Playing' ? 'Game name...' :
                            config.activity.type === 'Streaming' ? 'Stream title...' :
                            config.activity.type === 'Listening' ? 'Song / Album name...' :
                            config.activity.type === 'Watching' ? 'Movie / Show name...' :
                            'Competition name...'}
              />

              {config.activity.type === 'Streaming' && (
                <CyberInput
                  label="Stream URL"
                  value={config.activity.url || ''}
                  onChange={(e) => setConfig(prev => ({ ...prev, activity: { ...prev.activity, url: e.target.value } }))}
                  placeholder="https://twitch.tv/yourchannel"
                  className="mt-3"
                />
              )}
            </section>

            <section className="border border-primary/30 bg-black/50 p-5 rounded-md">
              <div className="flex items-center gap-2 font-mono text-primary text-sm mb-4">
                <Cpu className="w-4 h-4" /> STATUS
              </div>
              
              <div className="grid grid-cols-3 gap-3">
                {statusOptions.map((item) => (
                  <button
                    key={item.status}
                    onClick={() => setConfig(prev => ({ ...prev, status: item.status }))}
                    className={`
                      p-3 border rounded-md flex items-center gap-3 transition-all
                      ${config.status === item.status 
                        ? 'border-cyan-500 bg-cyan-500/20' 
                        : 'border-primary/30 bg-black/30 hover:bg-primary/10'
                      }
                    `}
                  >
                    <div className={`w-3 h-3 rounded-full ${item.color}`} />
                    <span className="text-sm">{item.label}</span>
                  </button>
                ))}
              </div>
            </section>

            <section className="border border-primary/30 bg-black/50 p-5 rounded-md">
              <div className="flex items-center gap-2 font-mono text-primary text-sm mb-4">
                <Smile className="w-4 h-4" /> CUSTOM STATUS
              </div>
              
              <CyberInput
                label="Custom Status Text"
                value={config.customStatus}
                onChange={(e) => setConfig(prev => ({ ...prev, customStatus: e.target.value }))}
                placeholder="e.g., Working on something cool..."
              />
            </section>

            <CyberButton
              onClick={updatePresence}
              disabled={!isConnected || isUpdating}
              className="w-full py-6 text-lg"
            >
              {isUpdating ? (
                <><RefreshCw className="w-5 h-5 mr-2 animate-spin" /> Applying...</>
              ) : (
                <><Save className="w-5 h-5 mr-2" /> Apply Changes</>
              )}
            </CyberButton>
          </>
        )}

        {/* Auto DM Tab */}
        {activeTab === 'autodm' && (
          <section className="border border-primary/30 bg-black/50 p-5 rounded-md">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 font-mono text-primary text-sm">
                <MessageSquare className="w-4 h-4" /> AUTO DM
              </div>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoDm.enabled}
                  onChange={(e) => setAutoDm(prev => ({ ...prev, enabled: e.target.checked }))}
                  className="w-4 h-4 accent-cyan-500"
                />
                <span className={autoDm.enabled ? 'text-cyan-400' : 'text-primary/50'}>Enabled</span>
              </label>
            </div>

            <CyberInput
              label="Auto Reply Message"
              value={autoDm.message}
              onChange={(e) => setAutoDm(prev => ({ ...prev, message: e.target.value }))}
              placeholder="Hi! I'll reply to each user once."
              disabled={!isConnected}
            />

            <label className="flex items-center gap-2 text-sm mt-3 cursor-pointer">
              <input
                type="checkbox"
                checked={autoDm.replyOnce}
                onChange={(e) => setAutoDm(prev => ({ ...prev, replyOnce: e.target.checked }))}
                className="w-4 h-4 accent-cyan-500"
                disabled={!isConnected}
              />
              <span className="text-primary/70">Reply only once per user</span>
            </label>

            <div className="mt-3 p-3 border border-yellow-500/30 bg-yellow-500/10 rounded-md">
              <div className="text-xs text-yellow-400 mb-1">INFO</div>
              <p className="text-xs text-primary/60">
                When enabled, it auto-replies only in DMs and stores users who already got a reply.
              </p>
            </div>

            <div className="flex gap-2 mt-4">
              <CyberButton
                onClick={saveAutoDM}
                disabled={!isConnected || isUpdating}
                variant={autoDm.enabled ? 'primary' : 'outline'}
                className="flex-1"
              >
                {isUpdating ? (
                  <><RefreshCw className="w-4 h-4 mr-2 animate-spin" /> Saving...</>
                ) : (
                  <><Save className="w-4 h-4 mr-2" /> {autoDm.enabled ? 'Save' : 'Disable'}</>
                )}
              </CyberButton>
            </div>
          </section>
        )}

        {/* Auto React Tab */}
        {activeTab === 'autoreact' && (
          <section className="border border-primary/30 bg-black/50 p-5 rounded-md">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 font-mono text-primary text-sm">
                <Zap className="w-4 h-4" /> AUTO REACT
              </div>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoReact.enabled}
                  onChange={(e) => setAutoReact(prev => ({ ...prev, enabled: e.target.checked }))}
                  className="w-4 h-4 accent-cyan-500"
                />
                <span className={autoReact.enabled ? 'text-cyan-400' : 'text-primary/50'}>Enabled</span>
              </label>
            </div>
            
            <CyberInput
              label="Guild ID"
              value={autoReact.guildId}
              onChange={(e) => setAutoReact(prev => ({ ...prev, guildId: e.target.value }))}
              placeholder="Enter Discord server ID"
              disabled={!isConnected}
            />

            <CyberInput
              label="Channel ID"
              value={autoReact.channelId}
              onChange={(e) => setAutoReact(prev => ({ ...prev, channelId: e.target.value }))}
              placeholder="Enter channel ID to monitor"
              className="mt-3"
              disabled={!isConnected}
            />

            <CyberInput
              label="Emoji(s)"
              value={autoReact.emoji}
              onChange={(e) => setAutoReact(prev => ({ ...prev, emoji: e.target.value }))}
              placeholder="👍, ❤️, 🔥 (optional - uses 👍 if empty)"
              className="mt-3"
              disabled={!isConnected}
            />

            <label className="flex items-center gap-2 text-sm mt-3 cursor-pointer">
              <input
                type="checkbox"
                checked={autoReact.ignoreBots}
                onChange={(e) => setAutoReact(prev => ({ ...prev, ignoreBots: e.target.checked }))}
                className="w-4 h-4 accent-cyan-500"
                disabled={!isConnected}
              />
              <span className="text-primary/70">Ignore bot messages</span>
            </label>

            {testResult && (
              <div className="mt-4 p-3 border border-green-500/30 bg-green-500/10 rounded-md">
                <div className="text-xs text-green-400 mb-1">TEST RESULT</div>
                <div className="text-sm">
                  <span className="text-primary/70">Server:</span> {testResult.guild}
                </div>
                <div className="text-sm">
                  <span className="text-primary/70">Channel:</span> #{testResult.channel}
                </div>
                <div className="text-sm text-green-400">
                  {testResult.status}
                </div>
              </div>
            )}

            <div className="flex gap-2 mt-4">
              <CyberButton
                onClick={testAutoReact}
                disabled={!isConnected || isUpdating}
                variant="outline"
                className="flex-1"
              >
                {isUpdating ? (
                  <><RefreshCw className="w-4 h-4 mr-2 animate-spin" /> Testing...</>
                ) : (
                  <><Zap className="w-4 h-4 mr-2" /> Test</>
                )}
              </CyberButton>
              <CyberButton
                onClick={saveAutoReact}
                disabled={!isConnected || isUpdating}
                variant={autoReact.enabled ? 'primary' : 'outline'}
                className="flex-1"
              >
                {isUpdating ? (
                  <><RefreshCw className="w-4 h-4 mr-2 animate-spin" /> Saving...</>
                ) : (
                  <><Save className="w-4 h-4 mr-2" /> {autoReact.enabled ? 'Save' : 'Enable'}</>
                )}
              </CyberButton>
            </div>
          </section>
        )}

        {/* AFK Voice Tab */}
        {activeTab === 'afkvoice' && (
          <section className="border border-primary/30 bg-black/50 p-5 rounded-md">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 font-mono text-primary text-sm">
                <VolumeX className="w-4 h-4" /> AFK VOICE
              </div>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={afkVoice.enabled}
                  onChange={(e) => setAfkVoice(prev => ({ ...prev, enabled: e.target.checked }))}
                  className="w-4 h-4 accent-cyan-500"
                />
                <span className={afkVoice.enabled ? 'text-cyan-400' : 'text-primary/50'}>Enabled</span>
              </label>
            </div>
            
            <CyberInput
              label="Guild ID"
              value={afkVoice.guildId}
              onChange={(e) => setAfkVoice(prev => ({ ...prev, guildId: e.target.value }))}
              placeholder="Enter Discord server ID"
              disabled={!isConnected}
            />

            <CyberInput
              label="Voice Channel ID"
              value={afkVoice.voiceChannelId}
              onChange={(e) => setAfkVoice(prev => ({ ...prev, voiceChannelId: e.target.value }))}
              placeholder="Enter voice channel ID"
              className="mt-3"
              disabled={!isConnected}
            />

            <CyberInput
              label="AFK Reason (optional)"
              value={afkVoice.reason || ''}
              onChange={(e) => setAfkVoice(prev => ({ ...prev, reason: e.target.value }))}
              placeholder="AFK"
              className="mt-3"
              disabled={!isConnected}
            />

            <label className="flex items-center gap-2 text-sm mt-3 cursor-pointer">
              <input
                type="checkbox"
                checked={afkVoice.autoReconnect}
                onChange={(e) => setAfkVoice(prev => ({ ...prev, autoReconnect: e.target.checked }))}
                className="w-4 h-4 accent-cyan-500"
                disabled={!isConnected}
              />
              <span className="text-primary/70">Auto reconnect if disconnected</span>
            </label>

            <div className="mt-3 p-3 border border-yellow-500/30 bg-yellow-500/10 rounded-md">
              <div className="text-xs text-yellow-400 mb-1">⚠️ INFO</div>
              <p className="text-xs text-primary/60">
                When enabled, you'll be muted in the voice channel. 
                The bot will keep you in the channel even if you're AFK.
              </p>
            </div>

            {voiceTestResult && (
              <div className="mt-4 p-3 border border-green-500/30 bg-green-500/10 rounded-md">
                <div className="text-xs text-green-400 mb-1">TEST RESULT</div>
                <div className="text-sm">
                  <span className="text-primary/70">Server:</span> {voiceTestResult.guild}
                </div>
                <div className="text-sm">
                  <span className="text-primary/70">Channel:</span> #{voiceTestResult.channel}
                </div>
                <div className="text-sm text-green-400">
                  {voiceTestResult.status}
                </div>
              </div>
            )}

            <div className="flex gap-2 mt-4">
              <CyberButton
                onClick={testAFKVoice}
                disabled={!isConnected || isUpdating}
                variant="outline"
                className="flex-1"
              >
                {isUpdating ? (
                  <><RefreshCw className="w-4 h-4 mr-2 animate-spin" /> Testing...</>
                ) : (
                  <><MicOff className="w-4 h-4 mr-2" /> Test</>
                )}
              </CyberButton>
              <CyberButton
                onClick={saveAFKVoice}
                disabled={!isConnected || isUpdating}
                variant={afkVoice.enabled ? 'primary' : 'outline'}
                className="flex-1"
              >
                {isUpdating ? (
                  <><RefreshCw className="w-4 h-4 mr-2 animate-spin" /> Saving...</>
                ) : (
                  <><Volume2 className="w-4 h-4 mr-2" /> {afkVoice.enabled ? 'Save' : 'Enable'}</>
                )}
              </CyberButton>
            </div>
          </section>
        )}

        {/* Repeater Tab */}
        {activeTab === 'repeater' && (
          <section className="border border-primary/30 bg-black/50 p-5 rounded-md">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 font-mono text-primary text-sm">
                <Repeat2 className="w-4 h-4" /> REPEATER
              </div>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={repeater.enabled}
                  onChange={(e) => setRepeater(prev => ({ ...prev, enabled: e.target.checked }))}
                  className="w-4 h-4 accent-cyan-500"
                />
                <span className={repeater.enabled ? 'text-cyan-400' : 'text-primary/50'}>Enabled</span>
              </label>
            </div>

            <CyberInput
              label="Token (optional)"
              value={repeater.relayToken}
              onChange={(e) => setRepeater(prev => ({ ...prev, relayToken: e.target.value }))}
              placeholder="Leave empty to use current connected token"
              disabled={!isConnected}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
              <CyberInput
                label="Prefix"
                value={repeater.prefix}
                onChange={(e) => setRepeater(prev => ({ ...prev, prefix: e.target.value }))}
                placeholder="#"
                disabled={!isConnected}
              />
              <CyberInput
                label="Owner ID"
                value={repeater.ownerId}
                onChange={(e) => setRepeater(prev => ({ ...prev, ownerId: e.target.value }))}
                placeholder="Your Discord user ID"
                disabled={!isConnected}
              />
            </div>

            <div className="mt-3 p-3 border border-yellow-500/30 bg-yellow-500/10 rounded-md">
              <div className="text-xs text-yellow-400 mb-1">HOW IT WORKS</div>
              <p className="text-xs text-primary/60">
                Only Owner ID can trigger it. Example: with prefix <span className="text-cyan-300">#</span>, sending <span className="text-cyan-300">#اهلا</span> makes the token send <span className="text-cyan-300">اهلا</span>.
              </p>
            </div>

            <CyberButton
              onClick={saveRepeater}
              disabled={!isConnected || isUpdating}
              variant={repeater.enabled ? 'primary' : 'outline'}
              className="w-full mt-4"
            >
              {isUpdating ? (
                <><RefreshCw className="w-4 h-4 mr-2 animate-spin" /> Saving...</>
              ) : (
                <><Save className="w-4 h-4 mr-2" /> {repeater.enabled ? 'Save Repeater' : 'Enable Repeater'}</>
              )}
            </CyberButton>
          </section>
        )}

        {/* Server Copy Tab */}
        {activeTab === 'servercopy' && (
          <section className="border border-primary/30 bg-black/50 p-5 rounded-md">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 font-mono text-primary text-sm">
                <Copy className="w-4 h-4" /> SERVER COPY
              </div>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={serverCopy.enabled}
                  onChange={(e) => setServerCopy(prev => ({ ...prev, enabled: e.target.checked }))}
                  className="w-4 h-4 accent-cyan-500"
                />
                <span className={serverCopy.enabled ? 'text-cyan-400' : 'text-primary/50'}>Enabled</span>
              </label>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <CyberInput
                label="Source Server ID (Copy From)"
                value={serverCopy.sourceGuildId}
                onChange={(e) => setServerCopy(prev => ({ ...prev, sourceGuildId: e.target.value }))}
                placeholder="Enter source server ID"
                disabled={!isConnected}
              />

              <CyberInput
                label="Target Server ID (Copy To)"
                value={serverCopy.targetGuildId}
                onChange={(e) => setServerCopy(prev => ({ ...prev, targetGuildId: e.target.value }))}
                placeholder="Enter target server ID"
                disabled={!isConnected}
              />
            </div>

            <div className="mt-4 border-t border-primary/20 pt-4">
              <div className="text-sm font-mono text-primary/70 mb-3">COPY OPTIONS</div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={serverCopy.copyEmojis}
                    onChange={(e) => setServerCopy(prev => ({ ...prev, copyEmojis: e.target.checked }))}
                    className="w-4 h-4 accent-cyan-500"
                    disabled={!isConnected}
                  />
                  <span className={serverCopy.copyEmojis ? 'text-cyan-400' : 'text-primary/50'}>Emojis</span>
                </label>
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={serverCopy.copyRoles}
                    onChange={(e) => setServerCopy(prev => ({ ...prev, copyRoles: e.target.checked }))}
                    className="w-4 h-4 accent-cyan-500"
                    disabled={!isConnected}
                  />
                  <span className={serverCopy.copyRoles ? 'text-cyan-400' : 'text-primary/50'}>Roles</span>
                </label>
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={serverCopy.copyChannels}
                    onChange={(e) => setServerCopy(prev => ({ ...prev, copyChannels: e.target.checked }))}
                    className="w-4 h-4 accent-cyan-500"
                    disabled={!isConnected}
                  />
                  <span className={serverCopy.copyChannels ? 'text-cyan-400' : 'text-primary/50'}>Channels</span>
                </label>
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={serverCopy.copyName}
                    onChange={(e) => setServerCopy(prev => ({ ...prev, copyName: e.target.checked }))}
                    className="w-4 h-4 accent-cyan-500"
                    disabled={!isConnected}
                  />
                  <span className={serverCopy.copyName ? 'text-cyan-400' : 'text-primary/50'}>Server Name</span>
                </label>
              </div>
            </div>

            <div className="mt-4 p-3 border border-red-500/40 bg-red-500/10 rounded-md">
              <div className="text-xs text-red-400 mb-1 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" /> WARNING
              </div>
              <p className="text-xs text-primary/60">
                Using selfbot automation can violate Discord rules and may get your account limited or banned.
                Use this at your own risk.
              </p>
            </div>

            <div className="flex gap-2 mt-4">
              <CyberButton
                onClick={testServerCopy}
                disabled={!isConnected || isUpdating || !serverCopy.sourceGuildId || !serverCopy.targetGuildId}
                variant="outline"
                className="flex-1"
              >
                {isUpdating ? (
                  <><RefreshCw className="w-4 h-4 mr-2 animate-spin" /> Testing...</>
                ) : (
                  <><Layers className="w-4 h-4 mr-2" /> Validate</>
                )}
              </CyberButton>
              <CyberButton
                onClick={saveServerCopy}
                disabled={!isConnected || isUpdating || !serverCopy.sourceGuildId || !serverCopy.targetGuildId}
                variant={serverCopy.enabled ? 'primary' : 'outline'}
                className="flex-1"
              >
                {isUpdating ? (
                  <><RefreshCw className="w-4 h-4 mr-2 animate-spin" /> Copying...</>
                ) : (
                  <><Copy className="w-4 h-4 mr-2" /> {serverCopy.enabled ? 'Save' : 'Start Copy'}</>
                )}
              </CyberButton>
            </div>

            <div className="mt-4 p-3 border border-primary/30 bg-black/40 rounded-md">
              <div className="flex items-center justify-between mb-2">
                <div className="text-xs font-mono text-primary/70">SERVER COPY LOG</div>
                <button
                  type="button"
                  onClick={() => setServerCopyLogs([])}
                  className="text-[11px] text-primary/60 hover:text-primary transition-colors"
                >
                  Clear
                </button>
              </div>
              <div className="max-h-52 overflow-y-auto space-y-1 text-xs font-mono">
                {serverCopyLogs.length === 0 ? (
                  <div className="text-primary/40">Validate/copy output will appear here.</div>
                ) : (
                  serverCopyLogs.map((entry) => (
                    <div
                      key={entry.id}
                      className={
                        entry.type === 'error'
                          ? 'text-red-400'
                          : entry.type === 'success'
                            ? 'text-green-400'
                            : 'text-cyan-300'
                      }
                    >
                      [{entry.at}] {entry.message}
                    </div>
                  ))
                )}
              </div>
            </div>
          </section>
        )}

        {/* Account Control Tab */}
        {activeTab === 'accountcontrol' && (
          <section className="border border-red-500/30 bg-black/50 p-5 rounded-md">
            <div className="flex items-center gap-3 mb-6">
              <ShieldAlert className="w-6 h-6 text-red-400" />
              <h2 className="text-xl font-bold text-white">Account Control</h2>
            </div>

            <div className="space-y-6">
              {/* Warning Banner */}
              <div className="bg-red-900/20 border border-red-500/50 p-4 rounded-md">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-red-400 mt-0.5" />
                  <div>
                    <h3 className="text-red-400 font-semibold">Danger Zone</h3>
                    <p className="text-red-300/70 text-sm mt-1">
                      These actions are irreversible. Please confirm twice before proceeding.
                    </p>
                  </div>
                </div>
              </div>

              {/* Block All Users */}
              <AccountControlAction
                icon={UserMinus}
                title="Block All Users"
                description="Block all users in your friends list. This cannot be undone."
                buttonText="Block All Users"
                confirmText="BLOCK ALL"
                actionType="block"
                token={activeToken?.value}
              />

              {/* Delete All DMs */}
              <AccountControlAction
                icon={Trash2}
                title="Delete All DMs"
                description="Delete all your direct messages. This cannot be undone."
                buttonText="Delete All DMs"
                confirmText="DELETE ALL DMS"
                actionType="deletedms"
                token={activeToken?.value}
              />

              {/* Leave All Servers */}
              <AccountControlAction
                icon={LogOut}
                title="Leave All Servers"
                description="Leave all servers you're in. This cannot be undone."
                buttonText="Leave All Servers"
                confirmText="LEAVE ALL"
                actionType="leaveservers"
                token={activeToken?.value}
              />
            </div>
          </section>
        )}
      </div>
    </AppLayout>
  );
}
