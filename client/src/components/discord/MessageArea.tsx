import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  Edit,
  Gift,
  Hash,
  Pin,
  Plus,
  Reply,
  Search,
  Send,
  Smile,
  SmilePlus,
  Sticker,
  Trash2,
  Users,
} from 'lucide-react';
import type { Channel, DiscordUser, Message } from '@/lib/discord-types';

interface MessageAreaProps {
  channel: Channel | null;
  messages: Message[];
  isLoading: boolean;
  currentUser: DiscordUser | null;
  onSendMessage: (content: string) => Promise<void>;
  onSendImage: (file: File, content?: string) => Promise<void>;
  onDeleteMessage: (messageId: string) => void;
  onEditMessage: (messageId: string, content: string) => void;
  onAddReaction: (messageId: string, emoji: string) => void;
  onTyping?: () => void;
  density?: 'spacious' | 'default' | 'compact';
  messageBgColor?: string;
  borderColor?: string;
}

const BG = '#313338';
const BORDER = '#26272d';

export function MessageArea({
  channel,
  messages,
  isLoading,
  currentUser,
  onSendMessage,
  onSendImage,
  onDeleteMessage,
  onEditMessage,
  onAddReaction,
  onTyping,
  density = 'default',
  messageBgColor = BG,
  borderColor = BORDER,
}: MessageAreaProps) {
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<number | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Auto-resize textarea
  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = 'auto';
    ta.style.height = `${Math.min(ta.scrollHeight, 192)}px`;
  }, [message]);

  const handleSend = async () => {
    const trimmed = message.trim();
    if (!trimmed || isSending) return;
    setIsSending(true);
    try {
      await onSendMessage(trimmed);
      setMessage('');
    } finally {
      setIsSending(false);
    }
  };

  const handleSendImage = async (file: File) => {
    if (!file) return;
    setIsSending(true);
    try {
      await onSendImage(file, message.trim() || undefined);
      setMessage('');
    } finally {
      setIsSending(false);
    }
  };

  const isSameDay = (a: string, b: string) => {
    const da = new Date(a), db = new Date(b);
    return (
      da.getFullYear() === db.getFullYear() &&
      da.getMonth() === db.getMonth() &&
      da.getDate() === db.getDate()
    );
  };

  const inputPy = density === 'compact' ? 8 : density === 'spacious' ? 16 : 11;
  const messageGap = density === 'compact' ? 4 : density === 'spacious' ? 16 : 8;

  if (!channel) {
    return (
      <div
        style={{
          flex: 1,
          backgroundColor: messageBgColor,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 16,
        }}
      >
        <Hash size={64} color="#4e5058" />
        <div style={{ textAlign: 'center' }}>
          <h3
            style={{
              color: '#f2f3f5',
              fontSize: 24,
              fontWeight: 700,
              fontFamily: 'gg sans, Noto Sans, sans-serif',
              marginBottom: 8,
            }}
          >
            Welcome!
          </h3>
          <p style={{ color: '#b5bac1', fontFamily: 'gg sans, Noto Sans, sans-serif', fontSize: 16 }}>
            Select a channel or DM to start chatting
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        minHeight: 0,
        backgroundColor: messageBgColor,
      }}
    >
      {/* Top bar */}
      <div
        style={{
          height: 48,
          paddingLeft: 16,
          paddingRight: 16,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: `1px solid ${borderColor}`,
          flexShrink: 0,
          boxShadow: '0 1px 0 rgba(0,0,0,0.2)',
          gap: 12,
        }}
      >
        {/* Left: channel name */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
          {channel.type !== 1 && <Hash size={20} color="#80848e" style={{ flexShrink: 0 }} />}
          <span
            style={{
              color: '#f2f3f5',
              fontWeight: 700,
              fontSize: 16,
              fontFamily: 'gg sans, Noto Sans, sans-serif',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {channel.name}
          </span>
          {channel.topic && (
            <>
              <div style={{ width: 1, height: 24, backgroundColor: '#4e5058', flexShrink: 0 }} />
              <span
                style={{
                  color: '#b5bac1',
                  fontSize: 14,
                  fontFamily: 'gg sans, Noto Sans, sans-serif',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {channel.topic}
              </span>
            </>
          )}
        </div>

        {/* Right: actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
          {[Pin, Users].map((Icon, i) => (
            <TopBarButton key={i}>
              <Icon size={20} />
            </TopBarButton>
          ))}
          {/* Search */}
          <div
            style={{
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <input
              type="text"
              placeholder="Search"
              style={{
                backgroundColor: '#1e1f22',
                color: '#dbdee1',
                border: 'none',
                outline: 'none',
                borderRadius: 4,
                padding: '2px 30px 2px 8px',
                fontSize: 14,
                fontFamily: 'gg sans, Noto Sans, sans-serif',
                width: 144,
                height: 24,
              }}
            />
            <Search size={14} color="#949ba4" style={{ position: 'absolute', right: 6 }} />
          </div>
        </div>
      </div>

      {/* Messages */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '16px 0',
          minHeight: 0,
          scrollbarWidth: 'thin',
          scrollbarColor: '#1a1b1e transparent',
        }}
      >
        {isLoading ? (
          <div
            style={{
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#b5bac1',
              fontFamily: 'gg sans, Noto Sans, sans-serif',
            }}
          >
            Loading messages...
          </div>
        ) : messages.length === 0 ? (
          <div
            style={{
              padding: '0 16px',
              color: '#b5bac1',
              fontFamily: 'gg sans, Noto Sans, sans-serif',
            }}
          >
            <div
              style={{
                width: 64,
                height: 64,
                borderRadius: '50%',
                backgroundColor: '#5865f2',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 16,
              }}
            >
              <Hash size={32} color="#fff" />
            </div>
            <h2
              style={{
                fontSize: 24,
                fontWeight: 700,
                color: '#f2f3f5',
                fontFamily: 'gg sans, Noto Sans, sans-serif',
                marginBottom: 8,
              }}
            >
              Welcome to #{channel.name}!
            </h2>
            <p style={{ fontSize: 15, color: '#b5bac1', fontFamily: 'gg sans, Noto Sans, sans-serif' }}>
              This is the start of the #{channel.name} channel.
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: messageGap }}>
            {messages.map((msg, index) => {
              const prev = messages[index - 1];
              const showHeader =
                !prev ||
                prev.author.id !== msg.author.id ||
                new Date(msg.timestamp).getTime() - new Date(prev.timestamp).getTime() > 5 * 60 * 1000;
              const showDateSep = !prev || !isSameDay(prev.timestamp, msg.timestamp);

              return (
                <React.Fragment key={msg.id}>
                  {showDateSep && <DateSeparator date={msg.timestamp} bgColor={messageBgColor} />}
                  <MessageItem
                    message={msg}
                    showHeader={showHeader}
                    isOwn={msg.author.id === currentUser?.id}
                    onDelete={() => onDeleteMessage(msg.id)}
                    onEdit={(content) => onEditMessage(msg.id, content)}
                    onAddReaction={(emoji) => onAddReaction(msg.id, emoji)}
                  />
                </React.Fragment>
              );
            })}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input area */}
      <div
        style={{
          padding: '0 16px 24px',
          backgroundColor: messageBgColor,
          flexShrink: 0,
        }}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          style={{ display: 'none' }}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void handleSendImage(file);
            e.currentTarget.value = '';
          }}
        />

        <div
          style={{
            backgroundColor: '#383a40',
            borderRadius: 8,
            display: 'flex',
            alignItems: 'flex-end',
            padding: '0 4px',
            gap: 4,
          }}
        >
          {/* Attach */}
          <button
            onClick={() => fileInputRef.current?.click()}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: '#b5bac1',
              padding: `${inputPy}px 8px`,
              display: 'flex',
              alignItems: 'center',
              borderRadius: 4,
              flexShrink: 0,
            }}
            title="Upload a file"
          >
            <Plus size={24} />
          </button>

          {/* Textarea */}
          <textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => {
              setMessage(e.target.value);
              if (onTyping) {
                if (typingTimeoutRef.current) window.clearTimeout(typingTimeoutRef.current);
                typingTimeoutRef.current = window.setTimeout(onTyping, 300);
              }
            }}
            onPaste={(e) => {
              const items = Array.from(e.clipboardData?.items || []);
              const img = items.find((it) => it.type.startsWith('image/'));
              if (!img) return;
              const file = img.getAsFile();
              if (!file) return;
              e.preventDefault();
              void handleSendImage(file);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                void handleSend();
              }
            }}
            placeholder={
              channel.type === 1
                ? `Message ${channel.name}`
                : `Message #${channel.name}`
            }
            rows={1}
            style={{
              flex: 1,
              backgroundColor: 'transparent',
              border: 'none',
              outline: 'none',
              color: '#dbdee1',
              fontSize: 15,
              fontFamily: 'gg sans, Noto Sans, sans-serif',
              lineHeight: '22px',
              resize: 'none',
              maxHeight: 192,
              paddingTop: inputPy,
              paddingBottom: inputPy,
              overflowY: 'auto',
            }}
          />

          {/* Right controls */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              paddingBottom: inputPy - 2,
              gap: 2,
              flexShrink: 0,
            }}
          >
            {[{ Icon: Gift, title: 'Send a gift' }, { Icon: Sticker, title: 'Send a sticker' }, { Icon: SmilePlus, title: 'Add emoji' }].map(
              ({ Icon, title }) => (
                <button
                  key={title}
                  title={title}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: '#b5bac1',
                    padding: 6,
                    borderRadius: 4,
                    display: 'flex',
                    alignItems: 'center',
                  }}
                >
                  <Icon size={22} />
                </button>
              )
            )}
          </div>
        </div>

        {/* Typing hint */}
        <div style={{ height: 20, paddingLeft: 4, paddingTop: 4 }}>
          {message.trim() && (
            <span
              style={{
                fontSize: 12,
                color: '#949ba4',
                fontFamily: 'gg sans, Noto Sans, sans-serif',
              }}
            >
              <strong style={{ color: '#dbdee1' }}>You</strong> are typing...
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Top bar icon button ─── */
function TopBarButton({ children }: { children: React.ReactNode }) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        color: hovered ? '#dbdee1' : '#b5bac1',
        padding: 8,
        borderRadius: 4,
        display: 'flex',
        alignItems: 'center',
        backgroundColor: hovered ? '#35373c' : 'transparent',
        transition: 'background-color 0.1s ease, color 0.1s ease',
      }}
    >
      {children}
    </button>
  );
}

/* ─── Date separator ─── */
function DateSeparator({ date, bgColor }: { date: string; bgColor: string }) {
  const label = new Date(date).toLocaleDateString(undefined, {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div
      style={{
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        padding: '8px 16px',
      }}
    >
      <div style={{ flex: 1, height: 1, backgroundColor: '#3f4147' }} />
      <span
        style={{
          padding: '0 8px',
          fontSize: 12,
          fontWeight: 600,
          color: '#949ba4',
          backgroundColor: bgColor,
          fontFamily: 'gg sans, Noto Sans, sans-serif',
          whiteSpace: 'nowrap',
        }}
      >
        {label}
      </span>
      <div style={{ flex: 1, height: 1, backgroundColor: '#3f4147' }} />
    </div>
  );
}

/* ─── Message item ─── */
interface MessageItemProps {
  message: Message;
  showHeader: boolean;
  isOwn: boolean;
  onDelete: () => void;
  onEdit: (content: string) => void;
  onAddReaction: (emoji: string) => void;
}

const COMMON_EMOJI = ['👍', '❤️', '😂', '🔥', '👀', '🎉', '✅', '❌'];

function MessageItem({ message, showHeader, isOwn, onDelete, onEdit, onAddReaction }: MessageItemProps) {
  const [hovered, setHovered] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const avatarUrl = message.author.avatar
    ? `https://cdn.discordapp.com/avatars/${message.author.id}/${message.author.avatar}.png?size=40`
    : null;

  const timeStr = new Date(message.timestamp).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => {
        setHovered(false);
        setShowEmojiPicker(false);
      }}
      style={{
        position: 'relative',
        display: 'flex',
        gap: 16,
        padding: showHeader ? '4px 16px 2px' : '1px 16px',
        backgroundColor: hovered ? 'rgba(0,0,0,0.06)' : 'transparent',
        transition: 'background-color 0.05s ease',
      }}
    >
      {/* Avatar or time gutter */}
      <div style={{ width: 40, flexShrink: 0, paddingTop: showHeader ? 2 : 0 }}>
        {showHeader ? (
          avatarUrl ? (
            <img
              src={avatarUrl}
              alt=""
              style={{ width: 40, height: 40, borderRadius: '50%', display: 'block' }}
            />
          ) : (
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: '50%',
                backgroundColor: '#5865f2',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                fontSize: 16,
                fontWeight: 700,
                fontFamily: 'gg sans, Noto Sans, sans-serif',
              }}
            >
              {message.author.username.charAt(0).toUpperCase()}
            </div>
          )
        ) : (
          hovered && (
            <span
              style={{
                fontSize: 11,
                color: '#949ba4',
                fontFamily: 'gg sans, Noto Sans, sans-serif',
                lineHeight: '22px',
                display: 'block',
                textAlign: 'right',
                userSelect: 'none',
              }}
            >
              {timeStr}
            </span>
          )
        )}
      </div>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        {showHeader && (
          <div
            style={{
              display: 'flex',
              alignItems: 'baseline',
              gap: 8,
              marginBottom: 2,
            }}
          >
            <span
              style={{
                fontWeight: 500,
                fontSize: 15,
                color: '#f2f3f5',
                fontFamily: 'gg sans, Noto Sans, sans-serif',
                cursor: 'pointer',
              }}
            >
              {message.author.global_name || message.author.username}
            </span>
            <span
              style={{
                fontSize: 11,
                color: '#949ba4',
                fontFamily: 'gg sans, Noto Sans, sans-serif',
              }}
            >
              {timeStr}
            </span>
          </div>
        )}

        {/* Text */}
        <p
          style={{
            fontSize: 15,
            color: '#dbdee1',
            fontFamily: 'gg sans, Noto Sans, sans-serif',
            lineHeight: '22px',
            margin: 0,
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
          }}
        >
          {message.content}
        </p>

        {/* Attachments */}
        {message.attachments?.length ? (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
            {message.attachments.map((att) => {
              const isImage = att.content_type?.startsWith('image/');
              return isImage ? (
                <a key={att.id} href={att.url} target="_blank" rel="noreferrer">
                  <img
                    src={att.url}
                    alt={att.filename}
                    style={{
                      maxHeight: 350,
                      maxWidth: 520,
                      borderRadius: 4,
                      display: 'block',
                      border: '1px solid rgba(0,0,0,0.2)',
                    }}
                  />
                </a>
              ) : (
                <a
                  key={att.id}
                  href={att.url}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '10px 16px',
                    backgroundColor: '#2b2d31',
                    borderRadius: 4,
                    color: '#b5bac1',
                    textDecoration: 'none',
                    fontSize: 14,
                    fontFamily: 'gg sans, Noto Sans, sans-serif',
                    border: '1px solid #1e1f22',
                  }}
                >
                  {att.filename}
                </a>
              );
            })}
          </div>
        ) : null}

        {/* Reactions */}
        {message.reactions?.length ? (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 8 }}>
            {message.reactions.map((reaction, i) => (
              <button
                key={i}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  padding: '2px 8px',
                  borderRadius: 100,
                  backgroundColor: reaction.me ? 'rgba(88,101,242,0.15)' : 'rgba(0,0,0,0.15)',
                  border: reaction.me ? '1px solid #5865f2' : '1px solid rgba(0,0,0,0)',
                  cursor: 'pointer',
                  fontSize: 14,
                  fontFamily: 'gg sans, Noto Sans, sans-serif',
                }}
              >
                <span>{reaction.emoji.name}</span>
                <span style={{ fontSize: 13, color: '#b5bac1', fontWeight: 500 }}>
                  {reaction.count}
                </span>
              </button>
            ))}
          </div>
        ) : null}
      </div>

      {/* Hover action bar */}
      {hovered && (
        <div
          style={{
            position: 'absolute',
            top: -16,
            right: 16,
            display: 'flex',
            alignItems: 'center',
            backgroundColor: '#2b2d31',
            borderRadius: 4,
            border: '1px solid #1e1f22',
            boxShadow: '0 4px 8px rgba(0,0,0,0.3)',
            padding: 2,
            gap: 2,
            zIndex: 10,
          }}
        >
          {[
            {
              icon: <Smile size={18} />,
              title: 'Add reaction',
              onClick: () => setShowEmojiPicker((v) => !v),
              danger: false,
            },
            {
              icon: <Reply size={18} />,
              title: 'Reply',
              onClick: () => {},
              danger: false,
            },
            {
              icon: <Edit size={18} />,
              title: 'Edit message',
              onClick: () => {
                const edited = window.prompt('Edit message', message.content);
                if (edited !== null && edited.trim() && edited.trim() !== message.content) {
                  onEdit(edited.trim());
                }
              },
              danger: false,
            },
            ...(isOwn
              ? [
                  {
                    icon: <Trash2 size={18} />,
                    title: 'Delete message',
                    onClick: onDelete,
                    danger: true,
                  },
                ]
              : []),
          ].map(({ icon, title, onClick, danger }, i) => (
            <ActionBtn key={i} title={title} onClick={onClick} danger={danger}>
              {icon}
            </ActionBtn>
          ))}
        </div>
      )}

      {/* Emoji picker */}
      {showEmojiPicker && (
        <div
          style={{
            position: 'absolute',
            top: -8,
            right: 120,
            backgroundColor: '#2b2d31',
            borderRadius: 8,
            border: '1px solid #1e1f22',
            boxShadow: '0 8px 16px rgba(0,0,0,0.4)',
            padding: 8,
            zIndex: 20,
          }}
        >
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 4 }}>
            {COMMON_EMOJI.map((emoji) => (
              <button
                key={emoji}
                onClick={() => {
                  onAddReaction(emoji);
                  setShowEmojiPicker(false);
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: 20,
                  padding: 6,
                  borderRadius: 4,
                  lineHeight: 1,
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#35373c';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent';
                }}
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ActionBtn({
  children,
  title,
  onClick,
  danger,
}: {
  children: React.ReactNode;
  title: string;
  onClick: () => void;
  danger?: boolean;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <button
      title={title}
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        padding: 6,
        borderRadius: 4,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: hovered ? (danger ? '#fff' : '#dbdee1') : danger ? '#da373c' : '#b5bac1',
        backgroundColor: hovered ? (danger ? '#da373c' : '#35373c') : 'transparent',
        transition: 'background-color 0.1s ease, color 0.1s ease',
      }}
    >
      {children}
    </button>
  );
}