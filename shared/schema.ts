import { pgTable, text, serial } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

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

export const insertMessageTemplateSchema = createInsertSchema(messageTemplates).omit({ id: true });
export const insertPresencePresetSchema = createInsertSchema(presencePresets).omit({ id: true });

export type MessageTemplate = typeof messageTemplates.$inferSelect;
export type InsertMessageTemplate = z.infer<typeof insertMessageTemplateSchema>;
export type PresencePreset = typeof presencePresets.$inferSelect;
export type InsertPresencePreset = z.infer<typeof insertPresencePresetSchema>;
