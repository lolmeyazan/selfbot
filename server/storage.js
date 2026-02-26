import { messageTemplates, presencePresets } from "../shared/schema.js";
import { db } from "./db.js";
import { sql } from "drizzle-orm";

export class DatabaseStorage {
  async ensureSchema() {
    await db.execute(sql`
      create table if not exists message_templates (
        id serial primary key,
        title text not null,
        content text not null
      )
    `);

    await db.execute(sql`
      create table if not exists presence_presets (
        id serial primary key,
        name text not null,
        status text not null,
        activity_type text not null,
        game_name text not null,
        details text,
        state text
      )
    `);
  }

  async getMessageTemplates() {
    return await db.select().from(messageTemplates);
  }

  async createMessageTemplate(template) {
    const [result] = await db.insert(messageTemplates).values(template).returning();
    return result;
  }

  async getPresencePresets() {
    return await db.select().from(presencePresets);
  }

  async createPresencePreset(preset) {
    const [result] = await db.insert(presencePresets).values(preset).returning();
    return result;
  }
}

export const storage = new DatabaseStorage();
