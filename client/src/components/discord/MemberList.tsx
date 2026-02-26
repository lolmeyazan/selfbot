import React, { useState, useMemo } from 'react';
import { ChevronDown, Shield } from 'lucide-react';
import type { GuildMember, Role } from '@/lib/discord-types';

interface MemberListProps {
  members: GuildMember[];
  roles: Role[];
  onMemberClick?: (member: GuildMember) => void;
}

export function MemberList({ members, roles, onMemberClick }: MemberListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(['online', 'offline'])
  );

  const roleMap = useMemo(() => {
    const m: Record<string, Role> = {};
    roles.forEach((r) => (m[r.id] = r));
    return m;
  }, [roles]);

  const getMemberTopRole = (member: GuildMember): Role | null => {
    if (!member.roles?.length) return null;
    const memberRoles = member.roles
      .map((id) => roleMap[id])
      .filter(Boolean)
      .sort((a, b) => b.position - a.position);
    return memberRoles[0] ?? null;
  };

  const getRoleColor = (role: Role | null): string => {
    if (!role || !role.color) return '#949ba4';
    return `#${role.color.toString(16).padStart(6, '0')}`;
  };

  const filtered = useMemo(
    () =>
      members.filter((m) => {
        const name = (m.nick || m.user?.username || '').toLowerCase();
        return name.includes(searchQuery.toLowerCase());
      }),
    [members, searchQuery]
  );

  // For demo: all online
  const onlineMembers = filtered;
  const offlineMembers: GuildMember[] = [];

  const toggle = (id: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  return (
    <div
      style={{
        width: 240,
        minWidth: 240,
        backgroundColor: '#2b2d31',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
      }}
    >
      {/* Members list */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '16px 8px',
          scrollbarWidth: 'thin',
          scrollbarColor: '#1a1b1e transparent',
        }}
      >
        {/* Online section */}
        {onlineMembers.length > 0 && (
          <MemberSection
            label={`Online — ${onlineMembers.length}`}
            expanded={expandedSections.has('online')}
            onToggle={() => toggle('online')}
          >
            {onlineMembers.map((member) => {
              const role = getMemberTopRole(member);
              const avatarUrl = member.user?.avatar
                ? `https://cdn.discordapp.com/avatars/${member.user.id}/${member.user.avatar}.png?size=40`
                : null;
              return (
                <MemberRow
                  key={member.user?.id ?? Math.random()}
                  member={member}
                  avatarUrl={avatarUrl}
                  roleColor={getRoleColor(role)}
                  status="online"
                  onClick={() => onMemberClick?.(member)}
                />
              );
            })}
          </MemberSection>
        )}

        {/* Offline section */}
        {offlineMembers.length > 0 && (
          <MemberSection
            label={`Offline — ${offlineMembers.length}`}
            expanded={expandedSections.has('offline')}
            onToggle={() => toggle('offline')}
          >
            {offlineMembers.map((member) => {
              const role = getMemberTopRole(member);
              const avatarUrl = member.user?.avatar
                ? `https://cdn.discordapp.com/avatars/${member.user.id}/${member.user.avatar}.png?size=40`
                : null;
              return (
                <MemberRow
                  key={member.user?.id ?? Math.random()}
                  member={member}
                  avatarUrl={avatarUrl}
                  roleColor={getRoleColor(role)}
                  status="offline"
                  onClick={() => onMemberClick?.(member)}
                />
              );
            })}
          </MemberSection>
        )}

        {filtered.length === 0 && (
          <div
            style={{
              textAlign: 'center',
              color: '#949ba4',
              fontSize: 14,
              fontFamily: 'gg sans, Noto Sans, sans-serif',
              marginTop: 32,
            }}
          >
            No members found
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Section ─── */
function MemberSection({
  label,
  expanded,
  onToggle,
  children,
}: {
  label: string;
  expanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <div style={{ marginBottom: 8 }}>
      <button
        onClick={onToggle}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          display: 'flex',
          alignItems: 'center',
          width: '100%',
          padding: '4px 6px',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          gap: 2,
          marginBottom: 4,
        }}
      >
        <ChevronDown
          size={12}
          color={hovered ? '#dbdee1' : '#949ba4'}
          style={{
            transform: expanded ? 'rotate(0deg)' : 'rotate(-90deg)',
            transition: 'transform 0.15s ease',
            flexShrink: 0,
          }}
        />
        <span
          style={{
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: '0.02em',
            textTransform: 'uppercase',
            color: hovered ? '#dbdee1' : '#949ba4',
            fontFamily: 'gg sans, Noto Sans, sans-serif',
            transition: 'color 0.1s ease',
          }}
        >
          {label}
        </span>
      </button>

      {expanded && <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>{children}</div>}
    </div>
  );
}

/* ─── Member row ─── */
function MemberRow({
  member,
  avatarUrl,
  roleColor,
  status,
  onClick,
}: {
  member: GuildMember;
  avatarUrl: string | null;
  roleColor: string;
  status: 'online' | 'idle' | 'dnd' | 'offline';
  onClick: () => void;
}) {
  const [hovered, setHovered] = useState(false);
  const username = member.nick || member.user?.username || 'Unknown';
  const initial = username.charAt(0).toUpperCase();

  const statusColors: Record<string, string> = {
    online: '#23a55a',
    idle: '#f0b132',
    dnd: '#f23f43',
    offline: '#80848e',
  };

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex',
        alignItems: 'center',
        width: '100%',
        padding: '6px 8px',
        borderRadius: 4,
        backgroundColor: hovered ? '#35373c' : 'transparent',
        border: 'none',
        cursor: 'pointer',
        gap: 10,
        transition: 'background-color 0.1s ease',
        opacity: status === 'offline' ? 0.4 : 1,
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
              backgroundColor: roleColor === '#949ba4' ? '#5865f2' : roleColor,
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
        {/* Status dot */}
        <div
          style={{
            position: 'absolute',
            bottom: -1,
            right: -1,
            width: 12,
            height: 12,
            borderRadius: '50%',
            backgroundColor: statusColors[status],
            border: '2px solid #2b2d31',
          }}
        />
      </div>

      {/* Name */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: 15,
            fontWeight: 500,
            color: hovered ? '#f2f3f5' : roleColor,
            fontFamily: 'gg sans, Noto Sans, sans-serif',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            lineHeight: '18px',
            transition: 'color 0.1s ease',
          }}
        >
          {username}
        </div>
        {member.roles && member.roles.length > 0 && (
          <div
            style={{
              fontSize: 12,
              color: '#949ba4',
              fontFamily: 'gg sans, Noto Sans, sans-serif',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              lineHeight: '15px',
            }}
          >
            {member.roles.length} role{member.roles.length > 1 ? 's' : ''}
          </div>
        )}
      </div>
    </button>
  );
}

/* ─── RoleList ─── */
interface RoleListProps {
  roles: Role[];
  onRoleClick?: (role: Role) => void;
}

export function RoleList({ roles, onRoleClick }: RoleListProps) {
  const sorted = [...roles]
    .sort((a, b) => b.position - a.position)
    .filter((r) => r.name !== '@everyone');

  if (!sorted.length) {
    return (
      <div
        style={{
          padding: 16,
          textAlign: 'center',
          color: '#949ba4',
          fontFamily: 'gg sans, Noto Sans, sans-serif',
          fontSize: 14,
        }}
      >
        No roles found
      </div>
    );
  }

  return (
    <div style={{ padding: 8, display: 'flex', flexDirection: 'column', gap: 4 }}>
      {sorted.map((role) => {
        const color = role.color
          ? `#${role.color.toString(16).padStart(6, '0')}`
          : '#949ba4';
        return (
          <RoleRow key={role.id} role={role} color={color} onClick={() => onRoleClick?.(role)} />
        );
      })}
    </div>
  );
}

function RoleRow({
  role,
  color,
  onClick,
}: {
  role: Role;
  color: string;
  onClick: () => void;
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
        padding: '8px 10px',
        borderRadius: 4,
        backgroundColor: hovered ? '#35373c' : 'transparent',
        border: 'none',
        cursor: 'pointer',
        gap: 10,
        transition: 'background-color 0.1s ease',
      }}
    >
      {role.color ? (
        <div
          style={{
            width: 16,
            height: 16,
            borderRadius: '50%',
            backgroundColor: color,
            flexShrink: 0,
          }}
        />
      ) : (
        <Shield size={16} color="#949ba4" style={{ flexShrink: 0 }} />
      )}
      <span
        style={{
          flex: 1,
          textAlign: 'left',
          fontSize: 15,
          fontWeight: 500,
          color,
          fontFamily: 'gg sans, Noto Sans, sans-serif',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {role.name}
      </span>
    </button>
  );
}