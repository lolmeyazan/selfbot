import React from 'react';

export function ProfileModal({ user, onClose }) {
  if (!user) return null;

  const {
    username = 'Unknown User',
    discriminator = '0000',
    avatar,
    banner,
    bio = '',
    roles = [],
    status = 'offline',
  } = user;

  // Generate avatar URL
  const avatarUrl = avatar
    ? `https://cdn.discordapp.com/avatars/${user.id}/${avatar}.png`
    : `https://cdn.discordapp.com/embed/avatars/${parseInt(discriminator) % 5}.png`;

  // Get banner URL
  const bannerUrl = banner
    ? `https://cdn.discordapp.com/banners/${user.id}/${banner}.png`
    : null;

  // Status color
  const statusColors = {
    online: 'var(--discord-green)',
    idle: 'var(--discord-yellow)',
    dnd: 'var(--discord-red)',
    offline: 'var(--discord-text-muted)',
  };

  return (
    <>
      <div className="overlay fade-in" onClick={onClose} />
      <div className="profile-modal slide-up">
        <div
          className="profile-modal-banner"
          style={{
            background: bannerUrl
              ? `url(${bannerUrl}) center/cover`
              : `linear-gradient(135deg, var(--discord-accent-blue), #9b59b6)`,
          }}
        >
          <button className="profile-modal-close" onClick={onClose}>
            ✕
          </button>
          <img
            src={avatarUrl}
            alt={username}
            className="profile-modal-avatar"
          />
        </div>

        <div className="profile-modal-content">
          <div className="profile-modal-username">
            {username}
            <span className="profile-modal-discriminator">#{discriminator}</span>
          </div>

          {bio && <div className="profile-modal-bio">{bio}</div>}

          {roles && roles.length > 0 && (
            <div className="profile-modal-roles">
              {roles.map((role) => (
                <span
                  key={role.id}
                  className="profile-modal-role"
                  style={{
                    backgroundColor: role.color || '#99aab5',
                    color: isLightColor(role.color) ? '#000' : '#fff',
                  }}
                >
                  {role.name}
                </span>
              ))}
            </div>
          )}

          <div style={{ marginTop: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <div
              style={{
                width: 12,
                height: 12,
                borderRadius: '50%',
                backgroundColor: statusColors[status] || statusColors.offline,
              }}
            />
            <span style={{ fontSize: 13, color: 'var(--discord-text-muted)' }}>
              {status === 'online'
                ? 'Online'
                : status === 'idle'
                ? 'Idle'
                : status === 'dnd'
                ? 'Do Not Disturb'
                : 'Offline'}
            </span>
          </div>

          <div style={{ marginTop: 16, display: 'flex', gap: 8 }}>
            <button className="btn-discord" style={{ flex: 1 }}>
              Send Message
            </button>
            <button className="btn-discord-secondary" style={{ flex: 1 }}>
              More Options
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

// Helper function to determine if a color is light
function isLightColor(color) {
  if (!color) return false;
  // Remove # if present
  const hex = color.replace('#', '');
  // Convert to RGB
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  // Calculate relative luminance
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5;
}

export function UserBadge({ user, size = 'normal' }) {
  if (!user) return null;

  const sizes = {
    small: { width: 24, badge: 8 },
    normal: { width: 32, badge: 10 },
    large: { width: 48, badge: 14 },
  };

  const { width, badge } = sizes[size] || sizes.normal;
  const avatarUrl = user.avatar
    ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png`
    : `https://cdn.discordapp.com/embed/avatars/${parseInt(user.discriminator || '0') % 5}.png`;

  const statusColors = {
    online: 'var(--discord-green)',
    idle: 'var(--discord-yellow)',
    dnd: 'var(--discord-red)',
    offline: 'var(--discord-text-muted)',
  };

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <img
        src={avatarUrl}
        alt={user.username}
        style={{
          width,
          height: width,
          borderRadius: '50%',
          objectFit: 'cover',
        }}
        className="avatar"
      />
      <div
        className="status-indicator"
        style={{
          width: badge,
          height: badge,
          borderWidth: Math.max(2, badge / 4),
          backgroundColor: statusColors[user.status] || statusColors.offline,
        }}
      />
    </div>
  );
}
