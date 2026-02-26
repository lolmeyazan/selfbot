import React, { useState } from 'react';
import { Home, Plus, Compass, Download } from 'lucide-react';
import type { Guild } from '@/lib/discord-types';

interface DiscordSidebarProps {
  guilds: Guild[];
  selectedGuildId: string | null;
  onSelectGuild: (guildId: string) => void;
  onHomeClick: () => void;
}

export function DiscordSidebar({ guilds, selectedGuildId, onSelectGuild, onHomeClick }: DiscordSidebarProps) {
  const [tooltip, setTooltip] = useState<{ text: string; id: string } | null>(null);

  const getGuildIcon = (guild: Guild) => {
    if (guild.icon) {
      return `https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.${guild.icon.startsWith('a_') ? 'gif' : 'png'}?size=96`;
    }
    return null;
  };

  // Abbreviate guild name like Discord does
  const abbreviateName = (name: string) => {
    const words = name.trim().split(/\s+/);
    if (words.length === 1) return name.slice(0, 2).toUpperCase();
    return words
      .filter((w) => w.length > 0)
      .slice(0, 3)
      .map((w) => w[0].toUpperCase())
      .join('');
  };

  const isHome = !selectedGuildId;

  return (
    <div
      className="flex flex-col items-center overflow-y-auto overflow-x-hidden"
      style={{
        width: 72,
        minWidth: 72,
        backgroundColor: '#1e1f22',
        paddingTop: 12,
        paddingBottom: 12,
        gap: 8,
        scrollbarWidth: 'none',
      }}
    >
      {/* HOME */}
      <SidebarPill active={isHome}>
        <button
          onClick={onHomeClick}
          onMouseEnter={() => setTooltip({ text: 'Direct Messages', id: 'home' })}
          onMouseLeave={() => setTooltip(null)}
          className="relative flex items-center justify-center"
          style={{
            width: 48,
            height: 48,
            borderRadius: isHome ? 16 : 24,
            backgroundColor: isHome ? '#5865f2' : '#313338',
            transition: 'border-radius 0.15s ease, background-color 0.15s ease',
            border: 'none',
            cursor: 'pointer',
          }}
        >
          <Home size={24} color={isHome ? '#fff' : '#dbdee1'} />
          {tooltip?.id === 'home' && <Tooltip text={tooltip.text} />}
        </button>
      </SidebarPill>

      {/* DIVIDER */}
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

      {/* GUILDS */}
      {guilds.map((guild) => {
        const iconUrl = getGuildIcon(guild);
        const isSelected = selectedGuildId === guild.id;
        const abbrev = abbreviateName(guild.name);
        const tooltipId = `guild-${guild.id}`;

        return (
          <SidebarPill key={guild.id} active={isSelected}>
            <button
              onClick={() => onSelectGuild(guild.id)}
              onMouseEnter={() => setTooltip({ text: guild.name, id: tooltipId })}
              onMouseLeave={() => setTooltip(null)}
              className="relative flex items-center justify-center overflow-hidden"
              style={{
                width: 48,
                height: 48,
                borderRadius: isSelected ? 16 : 24,
                backgroundColor: iconUrl ? 'transparent' : '#313338',
                transition: 'border-radius 0.15s ease',
                border: 'none',
                cursor: 'pointer',
                outline: isSelected ? '2px solid #5865f2' : 'none',
                outlineOffset: 2,
              }}
            >
              {iconUrl ? (
                <img
                  src={iconUrl}
                  alt={guild.name}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 'inherit' }}
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              ) : (
                <span
                  style={{
                    color: '#dbdee1',
                    fontFamily: 'gg sans, Noto Sans, sans-serif',
                    fontSize: abbrev.length > 2 ? 13 : 16,
                    fontWeight: 500,
                    userSelect: 'none',
                  }}
                >
                  {abbrev}
                </span>
              )}
              {tooltip?.id === tooltipId && <Tooltip text={tooltip.text} />}
            </button>
          </SidebarPill>
        );
      })}

      {/* ADD SERVER */}
      <SidebarPill>
        <ActionButton
          icon={<Plus size={24} color="#23a55a" />}
          hoverColor="#23a55a"
          tooltipText="Add a Server"
          tooltip={tooltip}
          setTooltip={setTooltip}
          tooltipId="add-server"
        />
      </SidebarPill>

      {/* EXPLORE */}
      <SidebarPill>
        <ActionButton
          icon={<Compass size={24} color="#23a55a" />}
          hoverColor="#23a55a"
          tooltipText="Explore Public Servers"
          tooltip={tooltip}
          setTooltip={setTooltip}
          tooltipId="explore"
        />
      </SidebarPill>

      {/* SPACER */}
      <div style={{ flex: 1 }} />

      {/* DOWNLOAD APPS */}
      <SidebarPill>
        <ActionButton
          icon={<Download size={22} color="#dbdee1" />}
          hoverColor="#5865f2"
          tooltipText="Download Apps"
          tooltip={tooltip}
          setTooltip={setTooltip}
          tooltipId="download"
        />
      </SidebarPill>
    </div>
  );
}

/* ─── Helpers ─── */

function SidebarPill({ active, children }: { active?: boolean; children: React.ReactNode }) {
  return (
    <div className="relative flex items-center" style={{ width: 72, justifyContent: 'center' }}>
      {/* Active / hover pill indicator */}
      {active && (
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
      {children}
    </div>
  );
}

function ActionButton({
  icon,
  hoverColor,
  tooltipText,
  tooltip,
  setTooltip,
  tooltipId,
}: {
  icon: React.ReactNode;
  hoverColor: string;
  tooltipText: string;
  tooltip: { text: string; id: string } | null;
  setTooltip: (v: { text: string; id: string } | null) => void;
  tooltipId: string;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <button
      onMouseEnter={() => {
        setHovered(true);
        setTooltip({ text: tooltipText, id: tooltipId });
      }}
      onMouseLeave={() => {
        setHovered(false);
        setTooltip(null);
      }}
      className="relative flex items-center justify-center"
      style={{
        width: 48,
        height: 48,
        borderRadius: hovered ? 16 : 24,
        backgroundColor: hovered ? hoverColor : '#313338',
        transition: 'border-radius 0.15s ease, background-color 0.15s ease',
        border: 'none',
        cursor: 'pointer',
      }}
    >
      {icon}
      {tooltip?.id === tooltipId && <Tooltip text={tooltip.text} />}
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
      {/* Arrow */}
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