import React, { useState } from 'react';
import {
  Mic,
  MicOff,
  Headphones,
  Volume2,
  Settings,
  PhoneOff,
  Video,
  VideoOff,
  Monitor,
  MonitorOff,
} from 'lucide-react';

interface VoiceControlsProps {
  isConnected: boolean;
  isMuted: boolean;
  isDeafened: boolean;
  isVideoOn?: boolean;
  isScreenSharing?: boolean;
  channelName?: string;
  onToggleMute: () => void;
  onToggleDeafen: () => void;
  onToggleVideo?: () => void;
  onToggleScreenShare?: () => void;
  onSettings: () => void;
  onDisconnect: () => void;
}

export function VoiceControls({
  isConnected,
  isMuted,
  isDeafened,
  isVideoOn,
  isScreenSharing,
  channelName,
  onToggleMute,
  onToggleDeafen,
  onToggleVideo,
  onToggleScreenShare,
  onSettings,
  onDisconnect,
}: VoiceControlsProps) {
  if (!isConnected) {
    return (
      <div
        style={{
          height: 52,
          backgroundColor: '#232428',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <span
          style={{
            color: '#949ba4',
            fontSize: 13,
            fontFamily: 'gg sans, Noto Sans, sans-serif',
          }}
        >
          Not connected to voice
        </span>
      </div>
    );
  }

  return (
    <div
      style={{
        backgroundColor: '#232428',
        padding: '4px 8px',
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
        flexShrink: 0,
      }}
    >
      {/* Voice channel info */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '6px 4px',
          borderRadius: 4,
          cursor: 'pointer',
        }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: '#23a55a',
              fontFamily: 'gg sans, Noto Sans, sans-serif',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
            }}
          >
            <Volume2 size={14} style={{ flexShrink: 0 }} />
            Voice Connected
          </div>
          <div
            style={{
              fontSize: 12,
              color: '#b5bac1',
              fontFamily: 'gg sans, Noto Sans, sans-serif',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {channelName || 'Voice Channel'}
          </div>
        </div>

        {/* Disconnect button */}
        <VoiceBtn onClick={onDisconnect} title="Disconnect" danger>
          <PhoneOff size={16} />
        </VoiceBtn>
      </div>

      {/* Controls row */}
      <div style={{ display: 'flex', gap: 4, padding: '2px 4px 6px' }}>
        {/* Mute */}
        <VoiceBtn
          onClick={onToggleMute}
          title={isMuted ? 'Unmute' : 'Mute'}
          active={isMuted}
        >
          {isMuted ? <MicOff size={16} /> : <Mic size={16} />}
        </VoiceBtn>

        {/* Deafen */}
        <VoiceBtn
          onClick={onToggleDeafen}
          title={isDeafened ? 'Undeafen' : 'Deafen'}
          active={isDeafened}
        >
          <Headphones size={16} />
        </VoiceBtn>

        {/* Video */}
        {onToggleVideo && (
          <VoiceBtn
            onClick={onToggleVideo}
            title={isVideoOn ? 'Turn off camera' : 'Turn on camera'}
            blurple={isVideoOn}
          >
            {isVideoOn ? <Video size={16} /> : <VideoOff size={16} />}
          </VoiceBtn>
        )}

        {/* Screen share */}
        {onToggleScreenShare && (
          <VoiceBtn
            onClick={onToggleScreenShare}
            title={isScreenSharing ? 'Stop sharing' : 'Share screen'}
            blurple={isScreenSharing}
          >
            {isScreenSharing ? <Monitor size={16} /> : <MonitorOff size={16} />}
          </VoiceBtn>
        )}

        {/* Settings */}
        <VoiceBtn onClick={onSettings} title="Voice settings">
          <Settings size={16} />
        </VoiceBtn>
      </div>
    </div>
  );
}

/* ─── Button ─── */
function VoiceBtn({
  children,
  title,
  onClick,
  active,
  danger,
  blurple,
}: {
  children: React.ReactNode;
  title: string;
  onClick: () => void;
  active?: boolean;
  danger?: boolean;
  blurple?: boolean;
}) {
  const [hovered, setHovered] = useState(false);

  const bg = danger && hovered
    ? '#da373c'
    : active
    ? '#da373c'
    : blurple
    ? '#5865f2'
    : hovered
    ? '#35373c'
    : 'transparent';

  const color = active || blurple || (danger && hovered) ? '#fff' : hovered ? '#dbdee1' : '#b5bac1';

  return (
    <button
      onClick={onClick}
      title={title}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: 32,
        height: 32,
        borderRadius: 4,
        border: 'none',
        cursor: 'pointer',
        backgroundColor: bg,
        color,
        transition: 'background-color 0.1s ease, color 0.1s ease',
        flexShrink: 0,
      }}
    >
      {children}
    </button>
  );
}

/* ─── VoiceChannelItem ─── */
interface VoiceChannelItemProps {
  channel: { id: string; name: string; user_limit?: number };
  memberCount?: number;
  isSelected?: boolean;
  onClick: () => void;
}

export function VoiceChannelItem({ channel, memberCount, isSelected, onClick }: VoiceChannelItemProps) {
  const [hovered, setHovered] = useState(false);

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        width: '100%',
        padding: '6px 8px',
        borderRadius: 4,
        backgroundColor: isSelected ? '#404249' : hovered ? '#35373c' : 'transparent',
        border: 'none',
        cursor: 'pointer',
        transition: 'background-color 0.1s ease',
      }}
    >
      <Volume2
        size={16}
        color={isSelected || hovered ? '#dbdee1' : '#6d6f78'}
        style={{ flexShrink: 0 }}
      />
      <span
        style={{
          flex: 1,
          textAlign: 'left',
          fontSize: 15,
          fontWeight: 500,
          color: isSelected || hovered ? '#f2f3f5' : '#949ba4',
          fontFamily: 'gg sans, Noto Sans, sans-serif',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          transition: 'color 0.1s ease',
        }}
      >
        {channel.name}
      </span>
      {memberCount !== undefined && memberCount > 0 && (
        <span style={{ fontSize: 12, color: '#949ba4' }}>{memberCount}</span>
      )}
    </button>
  );
}

/* ─── VoiceStateIndicator ─── */
interface VoiceStateIndicatorProps {
  isMuted: boolean;
  isDeafened: boolean;
  isStreaming?: boolean;
}

export function VoiceStateIndicator({ isMuted, isDeafened, isStreaming }: VoiceStateIndicatorProps) {
  if (!isMuted && !isDeafened && !isStreaming) return null;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
      {isMuted && (
        <div
          title="Muted"
          style={{
            width: 16,
            height: 16,
            borderRadius: '50%',
            backgroundColor: '#da373c',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <MicOff size={10} color="#fff" />
        </div>
      )}
      {isDeafened && (
        <div
          title="Deafened"
          style={{
            width: 16,
            height: 16,
            borderRadius: '50%',
            backgroundColor: '#da373c',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Headphones size={10} color="#fff" />
        </div>
      )}
      {isStreaming && (
        <div
          title="Streaming"
          style={{
            width: 16,
            height: 16,
            borderRadius: '50%',
            backgroundColor: '#5865f2',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Monitor size={10} color="#fff" />
        </div>
      )}
    </div>
  );
}