import React, { useState } from 'react';
import { Plus, Users } from 'lucide-react';
import type { DiscordUser } from '@/lib/discord-types';

interface DM {
  id: string;
  recipients?: DiscordUser[];
}

interface DMSidebarProps {
  dms: DM[];
  selectedDmId: string | null;
  onSelectDm: (dmId: string) => void;
  onNewDm: () => void;
}

export function DMSidebar({ dms, selectedDmId, onSelectDm, onNewDm }: DMSidebarProps) {
  const [tooltip, setTooltip] = useState<{ text: string; id: string } | null>(null);

  const getUserAvatar = (user: DiscordUser) => {
    if (!user.avatar) return null;
    const ext = user.avatar.startsWith('a_') ? 'gif' : 'png';
    return `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.${ext}?size=96`;
  };

  return (
    <div
      style={{
        width: 72,
        minWidth: 72,
        backgroundColor: '#1e1f22',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        paddingTop: 12,
        paddingBottom: 12,
        gap: 8,
        overflowY: 'auto',
        overflowX: 'hidden',
        scrollbarWidth: 'none',
      }}
    >
      {/* Friends / DMs home button */}
      <div style={{ position: 'relative', width: 72, display: 'flex', justifyContent: 'center' }}>
        {!selectedDmId && (
          <div
            style={{
              position: 'absolute',
              left: 0,
              top: '50%',
              transform: 'translateY(-50%)',
              width: 4,
              height: 40,
              borderRadius: '0 4px 4px 0',
              backgroundColor: '#fff',
            }}
          />
        )}
        <button
          onClick={() => onSelectDm('')}
          onMouseEnter={() => setTooltip({ text: 'Direct Messages', id: 'home' })}
          onMouseLeave={() => setTooltip(null)}
          style={{
            width: 48,
            height: 48,
            borderRadius: !selectedDmId ? 16 : 24,
            backgroundColor: !selectedDmId ? '#5865f2' : '#313338',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'border-radius 0.15s ease, background-color 0.15s ease',
            position: 'relative',
          }}
        >
          <Users size={22} color="#fff" />
          {tooltip?.id === 'home' && <Tooltip text={tooltip.text} />}
        </button>
      </div>

      {/* Divider */}
      <div
        style={{
          width: 32,
          height: 2,
          borderRadius: 1,
          backgroundColor: '#35373c',
          flexShrink: 0,
          margin: '4px 0',
        }}
      />

      {/* DM avatars */}
      {dms.map((dm) => {
        const user = dm.recipients?.[0];
        if (!user) return null;

        const avatarUrl = getUserAvatar(user);
        const isSelected = selectedDmId === dm.id;
        const displayName = user.global_name || user.username;
        const initial = displayName.charAt(0).toUpperCase();
        const tooltipId = `dm-${dm.id}`;

        return (
          <div
            key={dm.id}
            style={{ position: 'relative', width: 72, display: 'flex', justifyContent: 'center' }}
          >
            {/* Active pill */}
            {isSelected && (
              <div
                style={{
                  position: 'absolute',
                  left: 0,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  width: 4,
                  height: 32,
                  borderRadius: '0 4px 4px 0',
                  backgroundColor: '#fff',
                }}
              />
            )}

            <button
              onClick={() => onSelectDm(dm.id)}
              onMouseEnter={() => setTooltip({ text: displayName, id: tooltipId })}
              onMouseLeave={() => setTooltip(null)}
              style={{
                width: 48,
                height: 48,
                borderRadius: isSelected ? 16 : 24,
                backgroundColor: avatarUrl ? 'transparent' : '#5865f2',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
                transition: 'border-radius 0.15s ease',
                position: 'relative',
                outline: isSelected ? '2px solid rgba(88,101,242,0.3)' : 'none',
                outlineOffset: 2,
              }}
            >
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={displayName}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              ) : (
                <span
                  style={{
                    color: '#fff',
                    fontSize: 18,
                    fontWeight: 600,
                    fontFamily: 'gg sans, Noto Sans, sans-serif',
                    userSelect: 'none',
                  }}
                >
                  {initial}
                </span>
              )}

              {/* Status dot */}
              <div
                style={{
                  position: 'absolute',
                  bottom: 0,
                  right: 0,
                  width: 14,
                  height: 14,
                  borderRadius: '50%',
                  backgroundColor: '#23a55a',
                  border: '3px solid #1e1f22',
                }}
              />

              {tooltip?.id === tooltipId && <Tooltip text={tooltip.text} />}
            </button>
          </div>
        );
      })}

      {/* New DM button */}
      <div style={{ position: 'relative', width: 72, display: 'flex', justifyContent: 'center' }}>
        <NewDmButton onNewDm={onNewDm} tooltip={tooltip} setTooltip={setTooltip} />
      </div>
    </div>
  );
}

function NewDmButton({
  onNewDm,
  tooltip,
  setTooltip,
}: {
  onNewDm: () => void;
  tooltip: { text: string; id: string } | null;
  setTooltip: (v: { text: string; id: string } | null) => void;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <button
      onClick={onNewDm}
      onMouseEnter={() => {
        setHovered(true);
        setTooltip({ text: 'New Direct Message', id: 'new-dm' });
      }}
      onMouseLeave={() => {
        setHovered(false);
        setTooltip(null);
      }}
      style={{
        width: 48,
        height: 48,
        borderRadius: hovered ? 16 : 24,
        backgroundColor: hovered ? '#23a55a' : '#313338',
        border: 'none',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'border-radius 0.15s ease, background-color 0.15s ease',
        position: 'relative',
      }}
    >
      <Plus size={22} color={hovered ? '#fff' : '#23a55a'} style={{ transition: 'color 0.1s ease' }} />
      {tooltip?.id === 'new-dm' && <Tooltip text={tooltip.text} />}
    </button>
  );
}

function Tooltip({ text }: { text: string }) {
  return (
    <div
      style={{
        position: 'absolute',
        left: 'calc(100% + 16px)',
        top: '50%',
        transform: 'translateY(-50%)',
        backgroundColor: '#111214',
        color: '#dbdee1',
        fontFamily: 'gg sans, Noto Sans, sans-serif',
        fontSize: 14,
        fontWeight: 600,
        padding: '8px 12px',
        borderRadius: 8,
        whiteSpace: 'nowrap',
        pointerEvents: 'none',
        zIndex: 9999,
        boxShadow: '0 8px 16px rgba(0,0,0,0.5)',
      }}
    >
      <div
        style={{
          position: 'absolute',
          right: '100%',
          top: '50%',
          transform: 'translateY(-50%)',
          borderTop: '6px solid transparent',
          borderBottom: '6px solid transparent',
          borderRight: '6px solid #111214',
        }}
      />
      {text}
    </div>
  );
}