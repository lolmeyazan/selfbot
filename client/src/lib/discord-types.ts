// Discord API Types for Visual Control Panel Client

// ============ User Types ============
export interface DiscordUser {
  id: string;
  username: string;
  discriminator: string;
  global_name: string | null;
  avatar: string | null;
  banner: string | null;
  accent_color: number | null;
  bot: boolean;
  system: boolean;
  mfa_enabled: boolean;
  locale: string;
  verified: boolean;
  email: string | null;
  flags: number;
  premium_type: number;
  public_flags: number;
}

export interface UserStatus {
  status: 'online' | 'idle' | 'dnd' | 'invisible';
  since: number | null;
  activities: Activity[];
  client_status: ClientStatus;
}

export interface Activity {
  name: string;
  type: ActivityType;
  url?: string;
  details?: string;
  state?: string;
  timestamps?: { start?: number; end?: number };
  assets?: { large_image?: string; large_text?: string; small_image?: string; small_text?: string };
  party?: { id?: string; size?: [number, number] };
  application_id?: string;
  flags?: number;
}

export type ActivityType = 0 | 1 | 2 | 3 | 4 | 5; // Playing, Streaming, Listening, Watching, Competing, Custom

export interface ClientStatus {
  desktop?: 'online' | 'idle' | 'dnd';
  mobile?: 'online' | 'idle' | 'dnd';
  web?: 'online' | 'idle' | 'dnd';
}

// ============ Guild (Server) Types ============
export interface Guild {
  id: string;
  name: string;
  icon: string | null;
  icon_hash?: string | null;
  splash: string | null;
  discovery_splash: string | null;
  owner_id: string;
  region: string | null;
  afk_channel_id: string | null;
  afk_timeout: number;
  widget_enabled: boolean;
  widget_channel_id: string | null;
  verification_level: VerificationLevel;
  default_message_notifications: DefaultMessageNotifications;
  explicit_content_filter: ExplicitContentFilter;
  roles: Role[];
  emojis: Emoji[];
  features: GuildFeature[];
  mfa_level: MFALevel;
  application_id: string | null;
  system_channel_id: string | null;
  system_channel_flags: number;
  rules_channel_id: string | null;
  max_presences: number | null;
  max_members: number;
  vanity_url_code: string | null;
  description: string | null;
  banner: string | null;
  premium_tier: PremiumTier;
  premium_subscription_count: number;
  preferred_locale: string;
  public_updates_channel_id: string | null;
  max_video_channel_users: number;
  approximate_member_count: number;
  approximate_presence_count: number;
  nsfw: boolean;
  nsfw_level: NSFWLevel;
}

export type VerificationLevel = 0 | 1 | 2 | 3 | 4;
export type DefaultMessageNotifications = 0 | 1;
export type ExplicitContentFilter = 0 | 1 | 2;
export type MFALevel = 0 | 1;
export type PremiumTier = 0 | 1 | 2 | 3;
export type NSFWLevel = 0 | 1 | 2 | 3;
export type GuildFeature = 
  | 'ANIMATED_ICON' | 'BANNER' | 'COMMERCE' | 'COMMUNITY' | 'DISCOVERABLE' 
  | 'ENABLED_DISCOVERABLE_BEFORE' | 'FEATURABLE' | 'INVITE_SPLASH' | 'MEMBER_VERIFICATION_GATE_ENABLED'
  | 'MORE_STICKERS' | 'NEWS' | 'PARTNERED' | 'PREVIEW_ENABLED' | 'REAL_TIME_ACTIVITIES'
  | 'ROLE_ICONS' | 'ROLE_SUBSCRIPTIONS_AVAILABLE_FOR_PURCHASE' | 'ROLE_SUBSCRIPTIONS_ENABLED'
  | 'SEVEN_DAY_THREAD_ARCHIVE' | 'THREE_DAY_THREAD_ARCHIVE' | 'TICKETED_EVENTS_ENABLED' | 'VANITY_URL'
  | 'VERIFIED' | 'VIP_REGIONS' | 'WELCOME_SCREEN_ENABLED';

// ============ Channel Types ============
export interface Channel {
  id: string;
  type: ChannelType;
  guild_id?: string;
  position?: number;
  permission_overwrites?: PermissionOverwrite[];
  name: string;
  topic?: string | null;
  nsfw?: boolean;
  last_message_id?: string | null;
  bitrate?: number;
  user_limit?: number;
  rate_limit_per_user?: number;
  recipients?: DiscordUser[];
  icon?: string | null;
  owner_id?: string;
  application_id?: string;
  parent_id?: string | null;
  last_pin_timestamp?: string | null;
  rtc_region?: string | null;
  video_quality_mode?: VideoQualityMode;
  message_count?: number;
  member_count?: number;
  thread_metadata?: ThreadMetadata;
  member?: ThreadMember;
  default_auto_archive_duration?: number;
}

export type ChannelType = 
  | 0  // GUILD_TEXT
  | 1  // DM
  | 2  // GUILD_VOICE
  | 3  // GROUP_DM
  | 4  // GUILD_CATEGORY
  | 5  // GUILD_ANNOUNCEMENT
  | 10 // ANNOUNCEMENT_THREAD
  | 11 // PUBLIC_THREAD
  | 12 // PRIVATE_THREAD
  | 13 // GUILD_STAGE_VOICE
  | 14 // GUILD_DIRECTORY
  | 15 // GUILD_FORUM
  | 16 // GUILD_MEDIA;

export type VideoQualityMode = 1 | 2; // AUTO, FULL

export interface PermissionOverwrite {
  id: string;
  type: 'role' | 'member';
  allow: string;
  deny: string;
}

export interface ThreadMetadata {
  archived: boolean;
  archive_timestamp: string;
  auto_archive_duration: number;
  locked: boolean;
  invitable?: boolean;
  create_timestamp?: string | null;
}

export interface ThreadMember {
  id: string;
  user_id: string;
  join_timestamp: string;
  flags: number;
  member?: GuildMember;
}

// ============ Message Types ============
export interface Message {
  id: string;
  channel_id: string;
  guild_id?: string;
  author: DiscordUser;
  content: string;
  timestamp: string;
  edited_timestamp: string | null;
  tts: boolean;
  mention_everyone: boolean;
  mentions: DiscordUser[];
  mention_roles: Role[];
  mention_channels?: ChannelMention[];
  attachments: Attachment[];
  embeds: Embed[];
  reactions?: Reaction[];
  nonce?: string | number;
  pinned: boolean;
  webhook_id?: string;
  type: MessageType;
  activity?: MessageActivity;
  application?: MessageApplication;
  application_id?: string;
  message_reference?: MessageReference;
  flags?: number;
  references?: Message[];
  interaction?: MessageInteraction;
  thread?: Channel;
  components?: MessageComponent[];
  sticker_items?: StickerItem[];
  position?: number;
}

export type MessageType = 
  | 0  // DEFAULT
  | 1  // RECIPIENT_ADD
  | 2  // RECIPIENT_REMOVE
  | 3  // CALL
  | 4  // CHANNEL_NAME_CHANGE
  | 5  // CHANNEL_ICON_CHANGE
  | 7  // REPLY
  | 8  // SLASH_COMMAND
  | 9  // THREAD_STARTER_MESSAGE
  | 10 // GUILD_INVITE_REMINDER
  | 12 // THREAD_MEMBER_JOIN
  | 19 // CONTEXT_MENU_COMMAND
  | 20 // AUTO_MODERATION_ACTION
  | 21 // ROLE_SUBSCRIPTION_PURCHASE
  | 22 // INTERACTION_PREMIUM_SUBSCRIPTION;

export interface Attachment {
  id: string;
  filename: string;
  description?: string;
  content_type?: string;
  size: number;
  url: string;
  proxy_url: string;
  height?: number | null;
  width?: number | null;
  ephemeral?: boolean;
  duration_secs?: number;
  waveform?: string;
}

export interface Embed {
  title?: string;
  type?: string;
  description?: string;
  url?: string;
  timestamp?: string;
  color?: number;
  footer?: EmbedFooter;
  image?: EmbedImage;
  thumbnail?: EmbedThumbnail;
  video?: EmbedVideo;
  provider?: EmbedProvider;
  author?: EmbedAuthor;
  fields?: EmbedField[];
}

export interface EmbedFooter {
  text: string;
  icon_url?: string;
  proxy_icon_url?: string;
}

export interface EmbedImage {
  url: string;
  proxy_url?: string;
  height?: number;
  width?: number;
}

export interface EmbedThumbnail {
  url: string;
  proxy_url?: string;
  height?: number;
  width?: number;
}

export interface EmbedVideo {
  url?: string;
  proxy_url?: string;
  height?: number;
  width?: number;
}

export interface EmbedProvider {
  name?: string;
  url?: string;
}

export interface EmbedAuthor {
  name: string;
  url?: string;
  icon_url?: string;
  proxy_icon_url?: string;
}

export interface EmbedField {
  name: string;
  value: string;
  inline?: boolean;
}

export interface Reaction {
  count: number;
  count_details?: { burst: number; normal: number };
  me: boolean;
  me_burst: boolean;
  emoji: Emoji;
  burst_colors?: string[];
}

export interface ChannelMention {
  id: string;
  guild_id: string;
  type: number;
  name: string;
}

export interface MessageActivity {
  type: MessageActivityType;
  party_id?: string;
}

export type MessageActivityType = 1 | 2 | 3 | 5;

export interface MessageApplication {
  id: string;
  name: string;
  description: string;
  icon: string | null;
  cover_image?: string;
}

export interface MessageReference {
  message_id?: string;
  channel_id?: string;
  guild_id?: string;
  fail_if_not_exists?: boolean;
}

export interface MessageInteraction {
  id: string;
  type: InteractionType;
  name: string;
  user: DiscordUser;
  member?: GuildMember;
}

export type InteractionType = 1 | 2 | 3 | 4 | 5;

export interface MessageComponent {
  type: ComponentType;
  custom_id?: string;
  disabled?: boolean;
  style?: ButtonStyle | TextStyle;
  label?: string;
  emoji?: Partial<Emoji>;
  url?: string;
  options?: SelectOption[];
  channel_types?: ChannelType[];
  placeholder?: string;
  min_values?: number;
  max_values?: number;
  components?: MessageComponent[];
}

export type ComponentType = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;
export type ButtonStyle = 1 | 2 | 3 | 4 | 5;
export type TextStyle = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

export interface SelectOption {
  label: string;
  value: string;
  description?: string;
  emoji?: Partial<Emoji>;
  default?: boolean;
}

export interface StickerItem {
  id: string;
  name: string;
  format_type: number;
}

// ============ Guild Member Types ============
export interface GuildMember {
  user?: DiscordUser;
  nick?: string | null;
  avatar: string | null;
  roles: string[];
  joined_at: string;
  premium_since?: string | null;
  deaf: boolean;
  mute: boolean;
  pending?: boolean;
  permissions?: string;
  communication_disabled_until?: string | null;
}

// ============ Role Types ============
export interface Role {
  id: string;
  name: string;
  color: number;
  hoist: boolean;
  icon?: string | null;
  unicode_emoji?: string | null;
  position: number;
  permissions: string;
  managed: boolean;
  mentionable: boolean;
  tags?: RoleTags;
}

export interface RoleTags {
  bot_id?: string;
  integration_id?: string;
  subscription_listing_id?: string;
  premium_subscriber?: null;
}

// ============ Emoji Types ============
export interface Emoji {
  id: string | null;
  name: string | null;
  roles?: string[];
  user?: DiscordUser;
  require_colons?: boolean;
  animated?: boolean;
  available?: boolean;
  managed?: boolean;
}

// ============ Voice Types ============
export interface VoiceState {
  channel_id: string | null;
  user_id: string;
  session_id: string;
  deaf: boolean;
  mute: boolean;
  self_deaf: boolean;
  self_mute: boolean;
  self_video: boolean;
  self_stream?: boolean;
  suppress: boolean;
  request_to_speak_timestamp: string | null;
  guild_id?: string;
  joined_at?: string;
}

export interface VoiceRegion {
  id: string;
  name: string;
  vip: boolean;
  optimal: boolean;
  deprecated: boolean;
  custom: boolean;
}

// ============ DM Types ============
export interface DMChannel {
  id: string;
  type: 1 | 3;
  recipients: DiscordUser[];
  last_message_id: string | null;
  flags: number;
}

// ============ Invite Types ============
export interface Invite {
  code: string;
  type?: string;
  expires_at?: string | null;
  guild_id?: string;
  channel_id?: string;
  channel?: Channel;
  guild?: Guild;
  inviter?: DiscordUser;
  target_type?: number;
  target_user?: DiscordUser;
  target_application?: Partial<MessageApplication>;
  approximate_member_count?: number;
  approximate_presence_count?: number;
  schedule_at?: string;
}

// ============ Discord Client State ============
export interface DiscordClientState {
  // Connection
  token: string | null;
  isConnected: boolean;
  user: DiscordUser | null;
  
  // Guilds
  guilds: Guild[];
  selectedGuildId: string | null;
  
  // Channels
  channels: Channel[];
  selectedChannelId: string | null;
  
  // Messages
  messages: Message[];
  
  // Members
  members: GuildMember[];
  
  // Voice
  voiceState: VoiceState | null;
  
  // DM
  dms: DMChannel[];
  selectedDmId: string | null;
}

// ============ Gateway Events ============
export interface GatewayEvent<T = any> {
  op: number;
  d?: T;
  s?: number;
  t?: string;
}

export interface HelloEvent {
  heartbeat_interval: number;
  _trace: string[];
}

export interface ReadyEvent {
  v: number;
  user: DiscordUser;
  guilds: Guild[];
  session_id: string;
  resume_gateway_url: string;
  shard?: [number, number];
  application: { id: string; flags: number };
}
