import { pgTable, text, serial, boolean, integer, timestamp, uuid, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// ==================== EXISTING TABLES ====================

export const messageTemplates = pgTable("message_templates", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  content: text("content").notNull(),
});

export const presencePresets = pgTable("presence_presets", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  status: text("status").notNull(),
  activityType: text("activity_type").notNull(),
  gameName: text("game_name").notNull(),
  details: text("details"),
  state: text("state"),
});

// ==================== SYSTEM 2: ROLES & PERMISSIONS ====================

export const Permissions = Object.freeze({
  SEND_MESSAGES: 'SEND_MESSAGES',
  MANAGE_CHANNELS: 'MANAGE_CHANNELS',
  MANAGE_ROLES: 'MANAGE_ROLES',
  KICK_MEMBERS: 'KICK_MEMBERS',
  BAN_MEMBERS: 'BAN_MEMBERS',
  VIEW_AUDIT_LOG: 'VIEW_AUDIT_LOG',
  MANAGE_GUILD: 'MANAGE_GUILD',
  MUTE_MEMBERS: 'MUTE_MEMBERS',
  DEAFEN_MEMBERS: 'DEAFEN_MEMBERS',
  MOVE_MEMBERS: 'MOVE_MEMBERS',
  VIEW_CHANNEL: 'VIEW_CHANNEL',
  CONNECT: 'CONNECT',
  SPEAK: 'SPEAK',
});

export const roles = pgTable("roles", {
  id: uuid("id").defaultRandom().primaryKey(),
  guildId: text("guild_id").notNull(),
  name: text("name").notNull(),
  color: text("color").default("#99aab5"),
  position: integer("position").default(0),
  permissions: jsonb("permissions").default([]),
  isEveryone: boolean("is_everyone").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const userRoles = pgTable("user_roles", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id").notNull(),
  guildId: text("guild_id").notNull(),
  roleId: uuid("role_id").references(() => roles.id),
  assignedAt: timestamp("assigned_at").defaultNow(),
});

// ==================== SYSTEM 3: USER PROFILES & STATUS ====================

export const profiles = pgTable("profiles", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id").unique().notNull(),
  avatar: text("avatar"),
  banner: text("banner"),
  bio: text("bio"),
  backgroundColor: text("background_color").default("#313338"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const presence = pgTable("presence", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id").notNull(),
  guildId: text("guild_id"),
  status: text("status").default("online"),
  customStatus: text("custom_status"),
  lastChanged: timestamp("last_changed").defaultNow(),
});

// ==================== SYSTEM 4: SERVER SETTINGS & INVITES ====================

export const guildSettings = pgTable("guild_settings", {
  guildId: text("guild_id").primaryKey(),
  name: text("name"),
  icon: text("icon"),
  banner: text("banner"),
  description: text("description"),
  verificationLevel: integer("verification_level").default(0),
  defaultNotifications: integer("default_message_notifications").default(1),
  explicitContentFilter: integer("explicit_content_filter").default(0),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const invites = pgTable("invites", {
  id: uuid("id").defaultRandom().primaryKey(),
  guildId: text("guild_id").notNull(),
  code: text("code").unique().notNull(),
  createdBy: text("created_by").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  expiresAt: timestamp("expires_at"),
  maxUses: integer("max_uses"),
  usesCount: integer("uses_count").default(0),
  isPermanent: boolean("is_permanent").default(true),
});

// ==================== SYSTEM 5: CHANNEL OVERWRITES ====================

export const channelOverwrites = pgTable("channel_overwrites", {
  id: uuid("id").defaultRandom().primaryKey(),
  channelId: text("channel_id").notNull(),
  guildId: text("guild_id").notNull(),
  overwriteType: text("overwrite_type").notNull(), // 'role' or 'member'
  overwriteId: text("overwrite_id").notNull(), // role_id or user_id
  allow: jsonb("allow").default([]),
  deny: jsonb("deny").default([]),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// ==================== SYSTEM 1: VOICE CHANNELS ====================

export const voiceRooms = pgTable("voice_rooms", {
  id: uuid("id").defaultRandom().primaryKey(),
  guildId: text("guild_id").notNull(),
  channelId: text("channel_id").notNull(),
  roomName: text("room_name").notNull(),
  maxUsers: integer("max_users").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  isActive: boolean("is_active").default(true),
});

export const voiceParticipants = pgTable("voice_participants", {
  id: uuid("id").defaultRandom().primaryKey(),
  roomId: uuid("room_id").references(() => voiceRooms.id),
  userId: text("user_id").notNull(),
  socketId: text("socket_id"),
  joinedAt: timestamp("joined_at").defaultNow(),
  isSpeaking: boolean("is_speaking").default(false),
  audioEnabled: boolean("audio_enabled").default(true),
});

// ==================== INSERT SCHEMAS ====================

export const insertMessageTemplateSchema = createInsertSchema(messageTemplates).omit({ id: true });
export const insertPresencePresetSchema = createInsertSchema(presencePresets).omit({ id: true });

export const insertRoleSchema = createInsertSchema(roles).omit({ id: true, createdAt: true });
export const insertUserRoleSchema = createInsertSchema(userRoles).omit({ id: true, assignedAt: true });

export const insertProfileSchema = createInsertSchema(profiles).omit({ id: true, createdAt: true, updatedAt: true });
export const insertPresenceSchema = createInsertSchema(presence).omit({ id: true, lastChanged: true });

export const insertGuildSettingsSchema = createInsertSchema(guildSettings).omit({ updatedAt: true });
export const insertInviteSchema = createInsertSchema(invites).omit({ id: true, createdAt: true, usesCount: true });

export const insertChannelOverwriteSchema = createInsertSchema(channelOverwrites).omit({ id: true, createdAt: true, updatedAt: true });

export const insertVoiceRoomSchema = createInsertSchema(voiceRooms).omit({ id: true, createdAt: true });
export const insertVoiceParticipantSchema = createInsertSchema(voiceParticipants).omit({ id: true, joinedAt: true });
