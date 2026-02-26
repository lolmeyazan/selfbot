import React, { useState } from 'react';
import {
  ChevronDown,
  Hash,
  Headphones,
  Lock,
  Megaphone,
  Mic,
  Plus,
  Settings,
  Volume2,
  UserPlus,
} from 'lucide-react';
import type { Channel, Guild } from '@/lib/discord-types';

interface ChannelListProps {
  guild: Guild | null;
  channels: Channel[];
  selectedChannelId: string | null;
  onSelectChannel: (channelId: string) => void;
  onSettingsClick: () => void;
  currentUser?: { id: string; username: string; discriminator?: string; avatar?: string | null };
  width?: number;
  density?: 'spacious' | 'default' | 'compact';
  panelColor?: string;
  panelBorderColor?: string;
}

const VIEW_CHANNEL_BIT = BigInt(1024);
const sortByPosition = (a: Channel, b: Channel) => (a.position ?? 0) - (b.position ?? 0);
const isVoiceLike = (type: number) => type === 2 || type === 13;

function channelIcon(channel: Channel) {
  const cls = 'flex-shrink-0';
  if (channel.type === 5) return <Megaphone size={16} className={cls} />;
  if (channel.type === 2) return <Volume2 size={16} className={cls} />;
  if (channel.type === 13) return <Mic size={16} className={cls} />;
  return <Hash size={16} className={cls} />;
}

function isChannelLocked(channel: Channel, guildId: string) {
  const ow = (channel.permission_overwrites || []).find(
    (o) => String(o.id) === String(guildId)
  );
  if (!ow?.deny) return false;
  try {
    return (BigInt(ow.deny) & VIEW_CHANNEL_BIT) !== BigInt(0);
  } catch {
    return false;
  }
}

/* ─── Single channel row ─── */
function ChannelRow({
  channel,
  isSelected,
  guildId,
  onSelect,
  density,
}: {
  channel: Channel;
  isSelected: boolean;
  guildId: string;
  onSelect: () => void;
  density: string;
}) {
  const [hovered, setHovered] = useState(false);
  const locked = isChannelLocked(channel, guildId);
  const hasUnread = Boolean(channel.last_message_id) && !isSelected;
  const rowPy = density === 'compact' ? 1 : density === 'spacious' ? 5 : 2;

  const bgColor = isSelected
    ? '#404249'
    : hovered
    ? '#35373c'
    : 'transparent';

  const textColor = isSelected || hovered ? '#f2f3f5' : hasUnread ? '#f2f3f5' : '#949ba4';
  const iconColor = isSelected || hovered ? '#dcddde' : hasUnread ? '#dcddde' : '#6d6f78';

  return (
    <button
      onClick={onSelect}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex',
        alignItems: 'center',
        width: '100%',
        paddingLeft: 8,
        paddingRight: 8,
        paddingTop: rowPy,
        paddingBottom: rowPy,
        borderRadius: 4,
        backgroundColor: bgColor,
        border: 'none',
        cursor: 'pointer',
        gap: 6,
        transition: 'background-color 0.1s ease',
        position: 'relative',
      }}
    >
      {/* Unread pill */}
      {hasUnread && !isSelected && (
        <div
          style={{
            position: 'absolute',
            left: -4,
            top: '50%',
            transform: 'translateY(-50%)',
            width: 4,
            height: 8,
            borderRadius: '0 2px 2px 0',
            backgroundColor: '#f2f3f5',
          }}
        />
      )}

      {/* Icon */}
      <span style={{ color: iconColor, display: 'flex', alignItems: 'center' }}>
        {channelIcon(channel)}
      </span>

      {/* Name */}
      <span
        style={{
          flex: 1,
          textAlign: 'left',
          fontSize: 15,
          fontWeight: hasUnread && !isSelected ? 600 : 500,
          color: textColor,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          fontFamily: 'gg sans, Noto Sans, sans-serif',
          lineHeight: '20px',
        }}
      >
        {channel.name}
      </span>

      {/* Badges */}
      {locked && <Lock size={14} color="#6d6f78" />}
      {isVoiceLike(channel.type) && channel.user_limit ? (
        <span style={{ fontSize: 12, color: '#6d6f78' }}>{channel.user_limit}</span>
      ) : null}

      {/* Action icons (visible on hover) */}
      {hovered && (
        <>
          <UserPlus size={16} color="#b5bac1" style={{ cursor: 'pointer' }} />
          <Settings size={16} color="#b5bac1" style={{ cursor: 'pointer' }} />
        </>
      )}
    </button>
  );
}

/* ─── Category header ─── */
function CategoryHeader({
  name,
  collapsed,
  onToggle,
  density,
}: {
  name: string;
  collapsed: boolean;
  onToggle: () => void;
  density: string;
}) {
  const [hovered, setHovered] = useState(false);
  const py = density === 'compact' ? 2 : 4;

  return (
    <button
      onClick={onToggle}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex',
        alignItems: 'center',
        width: '100%',
        paddingLeft: 4,
        paddingRight: 4,
        paddingTop: py,
        paddingBottom: py,
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        gap: 2,
      }}
    >
      <ChevronDown
        size={12}
        color={hovered ? '#dbdee1' : '#949ba4'}
        style={{
          transform: collapsed ? 'rotate(-90deg)' : 'rotate(0deg)',
          transition: 'transform 0.15s ease',
          flexShrink: 0,
        }}
      />
      <span
        style={{
          flex: 1,
          textAlign: 'left',
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: '0.02em',
          textTransform: 'uppercase',
          color: hovered ? '#dbdee1' : '#949ba4',
          fontFamily: 'gg sans, Noto Sans, sans-serif',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          transition: 'color 0.1s ease',
        }}
      >
        {name}
      </span>
      <Plus
        size={16}
        color={hovered ? '#dbdee1' : 'transparent'}
        style={{ flexShrink: 0, transition: 'color 0.1s ease' }}
      />
    </button>
  );
}

/* ─── User panel at the bottom ─── */
function UserPanel({
  user,
}: {
  user?: { id: string; username: string; discriminator?: string; avatar?: string | null };
}) {
  const [mutedHover, setMutedHover] = useState(false);
  const [deafHover, setDeafHover] = useState(false);
  const [settingsHover, setSettingsHover] = useState(false);

  const avatarUrl =
    user?.avatar
      ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png?size=64`
      : null;

  const initial = user?.username?.charAt(0).toUpperCase() ?? 'U';

  return (
    <div
      style={{
        height: 52,
        backgroundColor: '#232428',
        display: 'flex',
        alignItems: 'center',
        paddingLeft: 8,
        paddingRight: 8,
        gap: 8,
        flexShrink: 0,
      }}
    >
      {/* Avatar */}
      <div style={{ position: 'relative', flexShrink: 0 }}>
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt=""
            style={{ width: 32, height: 32, borderRadius: '50%', display: 'block' }}
          />
        ) : (
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              backgroundColor: '#5865f2',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              fontSize: 14,
              fontWeight: 600,
              fontFamily: 'gg sans, Noto Sans, sans-serif',
            }}
          >
            {initial}
          </div>
        )}
        {/* Online status dot */}
        <div
          style={{
            position: 'absolute',
            bottom: -1,
            right: -1,
            width: 10,
            height: 10,
            borderRadius: '50%',
            backgroundColor: '#23a55a',
            border: '2px solid #232428',
          }}
        />
      </div>

      {/* Username */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: 13,
            fontWeight: 600,
            color: '#f2f3f5',
            fontFamily: 'gg sans, Noto Sans, sans-serif',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            lineHeight: '16px',
          }}
        >
          {user?.username ?? 'Username'}
        </div>
        <div
          style={{
            fontSize: 11,
            color: '#b5bac1',
            fontFamily: 'gg sans, Noto Sans, sans-serif',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            lineHeight: '14px',
          }}
        >
          {user?.discriminator ? `#${user.discriminator}` : 'Online'}
        </div>
      </div>

      {/* Controls */}
      {[
        { icon: <Mic size={18} />, id: 'muted', hover: mutedHover, setHover: setMutedHover },
        { icon: <Headphones size={18} />, id: 'deaf', hover: deafHover, setHover: setDeafHover },
        { icon: <Settings size={18} />, id: 'settings', hover: settingsHover, setHover: setSettingsHover },
      ].map(({ icon, id, hover, setHover }) => (
        <button
          key={id}
          onMouseEnter={() => setHover(true)}
          onMouseLeave={() => setHover(false)}
          style={{
            width: 32,
            height: 32,
            borderRadius: 4,
            backgroundColor: hover ? '#35373c' : 'transparent',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: hover ? '#dbdee1' : '#b5bac1',
            transition: 'background-color 0.1s ease, color 0.1s ease',
            flexShrink: 0,
          }}
        >
          {icon}
        </button>
      ))}
    </div>
  );
}

/* ─── Main export ─── */
export function ChannelList({
  guild,
  channels,
  selectedChannelId,
  onSelectChannel,
  onSettingsClick,
  currentUser,
  width = 240,
  density = 'default',
  panelColor = '#2b2d31',
  panelBorderColor = '#1f2023',
}: ChannelListProps) {
  const [collapsedCategories, setCollapsedCategories] = useState<Record<string, boolean>>({});
  const headerHeight = density === 'compact' ? 48 : density === 'spacious' ? 64 : 56;

  if (!guild) {
    return (
      <div
        style={{
          width,
          minWidth: width,
          backgroundColor: panelColor,
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
        }}
      >
        <div
          style={{
            height: headerHeight,
            borderBottom: `1px solid ${panelBorderColor}`,
            display: 'flex',
            alignItems: 'center',
            paddingLeft: 16,
            paddingRight: 16,
          }}
        >
          <span
            style={{
              color: '#f2f3f5',
              fontWeight: 600,
              fontFamily: 'gg sans, Noto Sans, sans-serif',
              fontSize: 15,
            }}
          >
            Direct Messages
          </span>
        </div>
        <div
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#949ba4',
            fontFamily: 'gg sans, Noto Sans, sans-serif',
            fontSize: 14,
          }}
        >
          Select a server
        </div>
        <UserPanel user={currentUser} />
      </div>
    );
  }

  const categories = channels.filter((c) => c.type === 4).sort(sortByPosition);
  const nonCategory = channels.filter((c) => c.type !== 4).sort(sortByPosition);
  const uncategorized = nonCategory.filter((c) => !c.parent_id);

  return (
    <div
      style={{
        width,
        minWidth: width,
        backgroundColor: panelColor,
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
      }}
    >
      {/* Guild header */}
      <div
        style={{
          height: headerHeight,
          borderBottom: `1px solid ${panelBorderColor}`,
          display: 'flex',
          alignItems: 'center',
          paddingLeft: 16,
          paddingRight: 16,
          cursor: 'pointer',
          flexShrink: 0,
          boxShadow: '0 1px 0 rgba(0,0,0,0.2)',
        }}
      >
        <span
          style={{
            flex: 1,
            color: '#f2f3f5',
            fontWeight: 600,
            fontFamily: 'gg sans, Noto Sans, sans-serif',
            fontSize: 15,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {guild.name}
        </span>
        <ChevronDown size={18} color="#b5bac1" />
      </div>

      {/* Channel list */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          overflowX: 'hidden',
          padding: '8px 8px',
          scrollbarWidth: 'thin',
          scrollbarColor: '#1a1b1e transparent',
        }}
      >
        {/* Categories */}
        {categories.map((category) => {
          const children = nonCategory.filter((c) => c.parent_id === category.id);
          if (!children.length) return null;
          const collapsed = !!collapsedCategories[category.id];

          return (
            <div key={category.id} style={{ marginBottom: 4 }}>
              <CategoryHeader
                name={category.name}
                collapsed={collapsed}
                density={density}
                onToggle={() =>
                  setCollapsedCategories((prev) => ({
                    ...prev,
                    [category.id]: !prev[category.id],
                  }))
                }
              />
              {!collapsed &&
                children.map((ch) => (
                  <ChannelRow
                    key={ch.id}
                    channel={ch}
                    isSelected={selectedChannelId === ch.id}
                    guildId={guild.id}
                    onSelect={() => onSelectChannel(ch.id)}
                    density={density}
                  />
                ))}
            </div>
          );
        })}

        {/* Uncategorized */}
        {uncategorized.length > 0 && (
          <div>
            {uncategorized.map((ch) => (
              <ChannelRow
                key={ch.id}
                channel={ch}
                isSelected={selectedChannelId === ch.id}
                guildId={guild.id}
                onSelect={() => onSelectChannel(ch.id)}
                density={density}
              />
            ))}
          </div>
        )}
      </div>

      {/* User panel */}
      <UserPanel user={currentUser} />
    </div>
  );
}

/* ─── DMChannelList ─── */
interface DMChannelListProps {
  dms: Array<{
    id: string;
    recipients: Array<{
      id: string;
      username: string;
      avatar: string | null;
      global_name: string | null;
    }>;
    last_message_id: string | null;
  }>;
  selectedDmId: string | null;
  onSelectDm: (dmId: string) => void;
  onNewDm: () => void;
  currentUser?: { id: string; username: string; discriminator?: string; avatar?: string | null };
  width?: number;
  density?: 'spacious' | 'default' | 'compact';
  panelColor?: string;
  panelBorderColor?: string;
}

export function DMChannelList({
  dms,
  selectedDmId,
  onSelectDm,
  onNewDm,
  currentUser,
  width = 240,
  density = 'default',
  panelColor = '#2b2d31',
  panelBorderColor = '#1f2023',
}: DMChannelListProps) {
  const headerHeight = density === 'compact' ? 48 : density === 'spacious' ? 64 : 56;
  const rowPy = density === 'compact' ? 6 : density === 'spacious' ? 10 : 8;

  const sortedDms = [...dms].sort((a, b) => {
    const aId = a.last_message_id ? BigInt(a.last_message_id) : BigInt(0);
    const bId = b.last_message_id ? BigInt(b.last_message_id) : BigInt(0);
    return aId > bId ? -1 : aId < bId ? 1 : 0;
  });

  return (
    <div
      style={{
        width,
        minWidth: width,
        backgroundColor: panelColor,
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
      }}
    >
      {/* Header */}
      <div
        style={{
          height: headerHeight,
          display: 'flex',
          alignItems: 'center',
          paddingLeft: 16,
          paddingRight: 8,
          borderBottom: `1px solid ${panelBorderColor}`,
          flexShrink: 0,
          gap: 8,
          boxShadow: '0 1px 0 rgba(0,0,0,0.2)',
        }}
      >
        {/* Fake search bar like Discord */}
        <div
          style={{
            flex: 1,
            height: 24,
            backgroundColor: '#1e1f22',
            borderRadius: 4,
            display: 'flex',
            alignItems: 'center',
            paddingLeft: 8,
            cursor: 'text',
          }}
        >
          <span
            style={{
              fontSize: 13,
              color: '#949ba4',
              fontFamily: 'gg sans, Noto Sans, sans-serif',
              userSelect: 'none',
            }}
          >
            Find or start a conversation
          </span>
        </div>
      </div>

      {/* DM list */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '8px 8px',
          scrollbarWidth: 'thin',
          scrollbarColor: '#1a1b1e transparent',
        }}
      >
        {/* Friends button */}
        <DMRow
          avatarEl={
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: '50%',
                backgroundColor: '#5865f2',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <UserPlus size={18} color="#fff" />
            </div>
          }
          name="Friends"
          isSelected={false}
          onClick={() => {}}
          rowPy={rowPy}
        />

        {/* Section label */}
        <div
          style={{
            paddingLeft: 8,
            paddingTop: 12,
            paddingBottom: 4,
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: '0.02em',
            textTransform: 'uppercase',
            color: '#949ba4',
            fontFamily: 'gg sans, Noto Sans, sans-serif',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <span>Direct Messages</span>
          <button
            onClick={onNewDm}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: '#949ba4',
              display: 'flex',
              padding: 2,
            }}
            title="New DM"
          >
            <Plus size={16} />
          </button>
        </div>

        {sortedDms.map((dm) => {
          const recipient = dm.recipients[0];
          if (!recipient) return null;
          const avatarUrl = recipient.avatar
            ? `https://cdn.discordapp.com/avatars/${recipient.id}/${recipient.avatar}.png?size=64`
            : null;
          const name = recipient.global_name || recipient.username;

          return (
            <DMRow
              key={dm.id}
              avatarEl={
                <div style={{ position: 'relative' }}>
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt=""
                      style={{ width: 32, height: 32, borderRadius: '50%', display: 'block' }}
                    />
                  ) : (
                    <div
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: '50%',
                        backgroundColor: '#5865f2',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#fff',
                        fontSize: 14,
                        fontWeight: 600,
                        fontFamily: 'gg sans, Noto Sans, sans-serif',
                      }}
                    >
                      {name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  {/* Status dot */}
                  <div
                    style={{
                      position: 'absolute',
                      bottom: -1,
                      right: -1,
                      width: 10,
                      height: 10,
                      borderRadius: '50%',
                      backgroundColor: '#23a55a',
                      border: `2px solid ${panelColor}`,
                    }}
                  />
                </div>
              }
              name={name}
              isSelected={selectedDmId === dm.id}
              onClick={() => onSelectDm(dm.id)}
              rowPy={rowPy}
            />
          );
        })}
      </div>

      {/* User panel */}
      <UserPanel user={currentUser} />
    </div>
  );
}

function DMRow({
  avatarEl,
  name,
  isSelected,
  onClick,
  rowPy,
}: {
  avatarEl: React.ReactNode;
  name: string;
  isSelected: boolean;
  onClick: () => void;
  rowPy: number;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex',
        alignItems: 'center',
        width: '100%',
        padding: `${rowPy}px 8px`,
        borderRadius: 4,
        backgroundColor: isSelected ? '#404249' : hovered ? '#35373c' : 'transparent',
        border: 'none',
        cursor: 'pointer',
        gap: 12,
        transition: 'background-color 0.1s ease',
      }}
    >
      {avatarEl}
      <span
        style={{
          fontSize: 15,
          fontWeight: 500,
          color: isSelected || hovered ? '#f2f3f5' : '#949ba4',
          fontFamily: 'gg sans, Noto Sans, sans-serif',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          textAlign: 'left',
          flex: 1,
          transition: 'color 0.1s ease',
        }}
      >
        {name}
      </span>
    </button>
  );
}