import React, { useState, useEffect, useRef } from 'react';

export function ContextMenu({ x, y, items, onClose }) {
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        onClose();
      }
    };

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [onClose]);

  // Adjust position to keep menu within viewport
  useEffect(() => {
    if (menuRef.current) {
      const rect = menuRef.current.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      if (rect.right > viewportWidth) {
        menuRef.current.style.left = `${x - rect.width}px`;
      }
      if (rect.bottom > viewportHeight) {
        menuRef.current.style.top = `${y - rect.height}px`;
      }
    }
  }, [x, y]);

  const handleItemClick = (item) => {
    if (item.onClick) {
      item.onClick();
    }
    if (!item.keepOpen) {
      onClose();
    }
  };

  return (
    <div
      ref={menuRef}
      className="context-menu slide-up"
      style={{ left: x, top: y }}
    >
      {items.map((item, index) => {
        if (item.type === 'divider') {
          return <div key={index} className="context-menu-divider" />;
        }
        if (item.type === 'label') {
          return (
            <div key={index} className="context-menu-label">
              {item.label}
            </div>
          );
        }
        return (
          <div
            key={index}
            className={`context-menu-item ${item.danger ? 'danger' : ''} ${item.disabled ? 'disabled' : ''}`}
            onClick={() => !item.disabled && handleItemClick(item)}
            style={item.disabled ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
          >
            {item.icon && <span style={{ marginRight: 8 }}>{item.icon}</span>}
            <span>{item.label}</span>
            {item.sublabel && (
              <span style={{ marginLeft: 'auto', color: 'var(--discord-text-muted)', fontSize: 12 }}>
                {item.sublabel}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}

export function useContextMenu() {
  const [contextMenu, setContextMenu] = useState(null);

  const showContextMenu = (event, items) => {
    event.preventDefault();
    event.stopPropagation();
    setContextMenu({
      x: event.clientX,
      y: event.clientY,
      items,
    });
  };

  const hideContextMenu = () => {
    setContextMenu(null);
  };

  return {
    contextMenu,
    showContextMenu,
    hideContextMenu,
  };
}

// Predefined menu items for common actions
export const MenuItems = {
  user: (user, options = {}) => [
    {
      label: 'View Profile',
      icon: '👤',
      onClick: options.onViewProfile,
    },
    {
      label: 'Send Message',
      icon: '💬',
      onClick: options.onMessage,
    },
    { type: 'divider' },
    {
      label: 'Copy ID',
      icon: '📋',
      onClick: () => navigator.clipboard.writeText(user.id),
    },
    { type: 'divider' },
    {
      label: 'Kick',
      icon: '👢',
      danger: true,
      onClick: options.onKick,
    },
    {
      label: 'Ban',
      icon: '🔨',
      danger: true,
      onClick: options.onBan,
    },
  ],

  server: (server, options = {}) => [
    {
      label: 'Server Settings',
      icon: '⚙️',
      onClick: options.onSettings,
    },
    {
      label: 'Invite People',
      icon: '📨',
      onClick: options.onInvite,
    },
    { type: 'divider' },
    {
      label: 'Copy Server ID',
      icon: '📋',
      onClick: () => navigator.clipboard.writeText(server.id),
    },
    { type: 'divider' },
    {
      label: 'Leave Server',
      icon: '🚪',
      danger: true,
      onClick: options.onLeave,
    },
  ],

  channel: (channel, options = {}) => [
    {
      label: 'Edit Channel',
      icon: '✏️',
      onClick: options.onEdit,
    },
    {
      label: 'Pin Messages',
      icon: '📌',
      onClick: options.onPin,
    },
    { type: 'divider' },
    {
      label: 'Copy Channel ID',
      icon: '📋',
      onClick: () => navigator.clipboard.writeText(channel.id),
    },
    { type: 'divider' },
    {
      label: 'Delete Channel',
      icon: '🗑️',
      danger: true,
      onClick: options.onDelete,
    },
  ],

  role: (role, options = {}) => [
    {
      label: 'Edit Role',
      icon: '✏️',
      onClick: options.onEdit,
    },
    {
      label: 'Copy Role ID',
      icon: '📋',
      onClick: () => navigator.clipboard.writeText(role.id),
    },
    { type: 'divider' },
    {
      label: 'Delete Role',
      icon: '🗑️',
      danger: true,
      onClick: options.onDelete,
    },
  ],

  message: (message, options = {}) => [
    {
      label: 'Reply',
      icon: '↩️',
      onClick: options.onReply,
    },
    {
      label: 'Pin Message',
      icon: '📌',
      onClick: options.onPin,
    },
    {
      label: 'Copy Text',
      icon: '📋',
      onClick: () => navigator.clipboard.writeText(message.content),
    },
    { type: 'divider' },
    {
      label: 'Delete Message',
      icon: '🗑️',
      danger: true,
      onClick: options.onDelete,
    },
  ],
};
