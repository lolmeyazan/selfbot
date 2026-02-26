import express from "express";
import { storage } from "./storage.js";
import { api } from "../shared/routes.js";
import { z } from "zod";
import { Client as SelfbotClient } from "discord.js-selfbot-v13";
import { registerRolesRoutes } from "./routes/roles.js";
import { registerProfilesRoutes } from "./routes/profiles.js";
import { registerInvitesRoutes } from "./routes/invites.js";
import { registerChannelsRoutes } from "./routes/channels.js";
import { registerVoiceRoutes } from "./routes/voice.js";

const activityClients = new Map();
const activityClientLogins = new Map();
const tokenByClient = new WeakMap();
const afkVoiceIntervals = new Map();
const afkVoiceFailures = new Map();
const voiceStateConfigs = new Map();
const autoDmConfigs = new Map();
const autoDmCooldown = new Map();
const autoReactConfigs = new Map();
const autoMessageConfigs = new Map();
const repeaterConfigs = new Map();

async function getActivityClient(token) {
  const trimmedToken = token.trim();
  const existing = activityClients.get(trimmedToken);
  if (existing?.user) {
    return existing;
  }
  const pending = activityClientLogins.get(trimmedToken);
  if (pending) {
    return pending;
  }

  const loginPromise = (async () => {
    const client = new SelfbotClient();
    try {
      await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error("Discord selfbot login timeout")), 15000);
        client.once("ready", () => {
          clearTimeout(timeout);
          resolve();
        });
        client.once("error", (err) => {
          clearTimeout(timeout);
          reject(err);
        });
        client.login(trimmedToken).catch((err) => {
          clearTimeout(timeout);
          reject(err);
        });
      });

      tokenByClient.set(client, trimmedToken);
      client.on("messageCreate", async (message) => {
        try {
          const ownerToken = tokenByClient.get(client);
          if (!ownerToken) return;
          if (!client.user) return;

          // Auto DM - Reply to incoming DMs
          const dmCfg = autoDmConfigs.get(ownerToken);
          if (dmCfg?.enabled && dmCfg.message?.trim() && !message.guildId) {
            const authorId = String(message.author?.id || "");
            if (!authorId) return;
            if (dmCfg.replyOnce && dmCfg.repliedUsers.has(authorId)) return;

            const cooldownKey = `${ownerToken}:${message.author.id}`;
            const now = Date.now();
            const cooldownMs = (dmCfg.cooldown || 15) * 1000;
            const last = autoDmCooldown.get(cooldownKey) ?? 0;
            if (now - last >= cooldownMs) {
              autoDmCooldown.set(cooldownKey, now);
              try {
                await message.channel.send(dmCfg.message);
                if (dmCfg.replyOnce) {
                  dmCfg.repliedUsers.add(authorId);
                }
              } catch (sendErr) {
                console.error("Auto DM send error:", sendErr);
              }
            }
          }

          // Auto Message - Channel replies based on triggers
          const msgCfg = autoMessageConfigs.get(ownerToken);
          if (msgCfg?.enabled && msgCfg.rules && msgCfg.rules.length > 0) {
            const messageContent = message.content?.toLowerCase() || "";
            const channelId = message.channelId;
            
            for (const rule of msgCfg.rules) {
              // Check if rule applies to this channel (if channel specified)
              if (rule.channelId && rule.channelId !== channelId) continue;
              
              // Check if ignore bots and message is from bot
              if (rule.ignoreBots && message.author.bot) continue;
              
              // Check trigger (simple substring match or exact match)
              const trigger = rule.trigger?.toLowerCase() || "";
              const shouldTrigger = trigger.startsWith("^") 
                ? messageContent === trigger.slice(1)
                : messageContent.includes(trigger);
              
              if (shouldTrigger && rule.response?.trim()) {
                const cooldownKey = `${ownerToken}:${message.channelId}:${rule.id}`;
                const now = Date.now();
                const cooldownMs = (rule.cooldown || 30) * 1000;
                const last = autoDmCooldown.get(cooldownKey) ?? 0;
                
                if (now - last >= cooldownMs) {
                  autoDmCooldown.set(cooldownKey, now);
                  try {
                    await message.channel.send(rule.response);
                  } catch (sendErr) {
                    console.error("Auto message send error:", sendErr);
                  }
                  break; // Only trigger first matching rule
                }
              }
            }
          }

          // Repeater - Echo messages from owner
          const repeaterCfg = repeaterConfigs.get(ownerToken);
          if (repeaterCfg?.enabled) {
            const authorId = String(message.author?.id || "");
            const content = String(message.content || "");
            if (authorId === repeaterCfg.ownerId && content.startsWith(repeaterCfg.prefix)) {
              const repeated = content.slice(repeaterCfg.prefix.length).trim();
              if (repeated.length > 0) {
                try {
                  await message.channel.send(repeated);
                } catch (repeatErr) {
                  console.error("Repeater send error:", repeatErr);
                }
              }
            }
          }

          // Auto React - React to ALL messages in the channel
          const reactCfg = autoReactConfigs.get(ownerToken);
          if (reactCfg?.enabled) {
            const incomingChannelId = String(message.channelId || message.channel?.id || "");
            const targetChannelId = String(reactCfg.channelId || "").trim();
            if (targetChannelId && incomingChannelId !== targetChannelId) return;

            // React to ALL messages including bots and own messages
            // Get emojis to react with - use default if not specified
            const emojis = reactCfg.emojis && reactCfg.emojis.length > 0 
              ? reactCfg.emojis 
              : ['👍']; // Default emoji

            try {
              for (const emoji of emojis) {
                if (!emoji) continue;
                const normalizedEmoji = emoji.replace(/[<>]/g, "");
                try {
                  await message.react(normalizedEmoji);
                } catch {
                  await message.react(emoji);
                }
                if (reactCfg.cooldown > 0) {
                  await new Promise((r) => setTimeout(r, reactCfg.cooldown));
                }
              }
            } catch (reactErr) {
              console.error("Auto react error:", reactErr);
            }
          }
        } catch (listenerError) {
          console.error("Selfbot listener error:", listenerError);
        }
      });

      activityClients.set(trimmedToken, client);
      return client;
    } catch (error) {
      try {
        client.destroy();
      } catch {
        // noop
      }
      throw error;
    } finally {
      activityClientLogins.delete(trimmedToken);
    }
  })();

  activityClientLogins.set(trimmedToken, loginPromise);
  return loginPromise;
}

export async function registerRoutes(httpServer, app) {
  await storage.ensureSchema();

  // Register new feature routes
  registerRolesRoutes(app);
  registerProfilesRoutes(app);
  registerInvitesRoutes(app);
  registerChannelsRoutes(app);
  registerVoiceRoutes(app);

  app.get(api.messageTemplates.list.path, async (req, res) => {
    try {
      const templates = await storage.getMessageTemplates();
      res.json(templates);
    } catch (e) {
      console.error(e);
      res.status(500).json({ message: "Internal error" });
    }
  });

  app.post(api.messageTemplates.create.path, async (req, res) => {
    try {
      const input = api.messageTemplates.create.input.parse(req.body);
      const template = await storage.createMessageTemplate(input);
      res.status(201).json(template);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      res.status(500).json({ message: "Internal error" });
    }
  });

  app.get(api.presencePresets.list.path, async (req, res) => {
    try {
      const presets = await storage.getPresencePresets();
      res.json(presets);
    } catch (e) {
      console.error(e);
      res.status(500).json({ message: "Internal error" });
    }
  });

  app.post(api.presencePresets.create.path, async (req, res) => {
    try {
      const input = api.presencePresets.create.input.parse(req.body);
      const preset = await storage.createPresencePreset(input);
      res.status(201).json(preset);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      res.status(500).json({ message: "Internal error" });
    }
  });

  app.post(api.discordProxy.request.path, async (req, res) => {
    try {
      const input = api.discordProxy.request.input.parse(req.body);
      const url = `https://discord.com/api/v10${input.endpoint}`;
      const authHeader = input.token.trim();
      
      const response = await fetch(url, {
        method: input.method,
        headers: {
          'Authorization': authHeader,
          'Content-Type': 'application/json',
          'User-Agent': 'DiscordBot (https://github.com/discord/discord-node-selfbot, v13)',
          'Accept': 'application/json',
        },
        body: ["GET", "HEAD"].includes(input.method.toUpperCase())
          ? undefined
          : (input.body ? JSON.stringify(input.body) : undefined),
      });

      const text = await response.text();
      let data = text;
      try {
        data = JSON.parse(text);
      } catch (e) {
        // Not JSON
      }

      if (!response.ok) {
        const message =
          typeof data === "object" && data !== null && "message" in data
            ? String(data.message)
            : "Discord API Error";

        return res.status(response.status).json({
          message,
          status: response.status,
          endpoint: input.endpoint,
          method: input.method,
          details: data,
        });
      }

      res.status(200).json(data);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      console.error("Discord Proxy Error:", err);
      res.status(500).json({ message: "Internal proxy error" });
    }
  });

  app.post("/api/discord-upload-message", async (req, res) => {
    const schema = z.object({
      token: z.string().min(1),
      channelId: z.string().min(1),
      content: z.string().optional().default(""),
      fileName: z.string().optional().default("upload.png"),
      mimeType: z.string().optional().default("image/png"),
      dataUrl: z.string().min(1),
    });

    try {
      const input = schema.parse(req.body);
      const token = input.token.trim();

      const match = input.dataUrl.match(/^data:([^;]+);base64,(.+)$/);
      if (!match) {
        return res.status(400).json({ message: "Invalid image data format" });
      }

      const detectedMime = match[1] || input.mimeType || "application/octet-stream";
      const base64Data = match[2];
      const fileBuffer = Buffer.from(base64Data, "base64");

      const formData = new FormData();
      formData.append("payload_json", JSON.stringify({ content: input.content || "" }));
      formData.append(
        "files[0]",
        new Blob([fileBuffer], { type: detectedMime }),
        input.fileName || `upload-${Date.now()}.png`
      );

      const response = await fetch(`https://discord.com/api/v10/channels/${input.channelId}/messages`, {
        method: "POST",
        headers: {
          Authorization: token,
        },
        body: formData,
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        const message = typeof data?.message === "string" ? data.message : "Failed to upload image";
        return res.status(response.status).json({ message, details: data });
      }

      return res.status(200).json(data);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join("."),
        });
      }
      console.error("Discord Upload Message Error:", err);
      return res.status(500).json({
        message: err instanceof Error ? err.message : "Failed to upload image",
      });
    }
  });

  app.post("/api/discord-activity", async (req, res) => {
    const schema = z.object({
      token: z.string().min(1),
      activity: z.object({
        type: z.enum(["Playing", "Streaming", "Listening", "Watching", "Competing", "Custom"]),
        name: z.string().min(1),
        url: z.string().optional(),
      }),
    });

    try {
      const input = schema.parse(req.body);
      const client = await getActivityClient(input.token);

      const activityTypeMap = {
        Playing: "PLAYING",
        Streaming: "STREAMING",
        Listening: "LISTENING",
        Watching: "WATCHING",
        Competing: "COMPETING",
        Custom: "CUSTOM",
      };

      if (!client.user) {
        throw new Error("Discord client user is not ready");
      }

      await client.user.setActivity(input.activity.name, {
        type: activityTypeMap[input.activity.type],
        url: input.activity.url,
      });

      return res.status(200).json({ success: true });
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join("."),
        });
      }
      console.error("Discord Activity Error:", err);
      return res.status(500).json({
        message: err instanceof Error ? err.message : "Failed to set activity",
      });
    }
  });

  app.post("/api/discord-selfbot-presence", async (req, res) => {
    const schema = z.object({
      token: z.string().min(1),
      status: z.enum(["online", "idle", "dnd", "invisible"]),
      activity: z
        .object({
          type: z.enum(["Playing", "Streaming", "Listening", "Watching", "Competing", "Custom"]),
          name: z.string().optional(),
          url: z.string().optional(),
        })
        .optional(),
      customStatus: z.string().optional(),
    });

    try {
      const input = schema.parse(req.body);
      const client = await getActivityClient(input.token);

      const activityTypeMap = {
        Playing: "PLAYING",
        Streaming: "STREAMING",
        Listening: "LISTENING",
        Watching: "WATCHING",
        Competing: "COMPETING",
        Custom: "CUSTOM",
      };

      if (!client.user) {
        throw new Error("Discord client user is not ready");
      }

      await client.user.setStatus(input.status);

      // Force refresh: clear current activity first so Discord applies the new one reliably.
      await client.user.setActivity();

      const activityName = input.activity?.name?.trim();
      if (activityName) {
        await client.user.setActivity(activityName, {
          type: activityTypeMap[input.activity.type],
          url: input.activity?.url,
        });
      }

      const customStatus = input.customStatus?.trim();
      await client.user.setCustomStatus?.(customStatus ? { text: customStatus } : undefined);

      return res.status(200).json({ success: true });
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join("."),
        });
      }
      console.error("Discord Selfbot Presence Error:", err);
      return res.status(500).json({
        message: err instanceof Error ? err.message : "Failed to set selfbot presence",
      });
    }
  });

  app.post("/api/discord-selfbot-afk-voice", async (req, res) => {
    const schema = z.object({
      token: z.string().min(1),
      guildId: z.string().optional().default(""),
      channelId: z.string().optional().default(""),
      voiceChannelId: z.string().optional().default(""),
      enabled: z.boolean(),
      mute: z.boolean().default(false),
      deaf: z.boolean().default(false),
      suppress: z.boolean().default(false),
      selfVideo: z.boolean().default(false),
      forceReconnect: z.boolean().default(false),
    });

    try {
      const input = schema.parse(req.body);
      const token = input.token.trim();
      const guildId = input.guildId.trim();
      const channelId = (input.channelId || input.voiceChannelId || "").trim();

      if (input.enabled && (!guildId || !channelId)) {
        return res.status(400).json({
          message: "Guild ID and Voice Channel ID are required",
          field: !guildId ? "guildId" : "channelId",
        });
      }

      const existingInterval = afkVoiceIntervals.get(token);
      if (existingInterval) {
        clearInterval(existingInterval);
        afkVoiceIntervals.delete(token);
      }
      afkVoiceFailures.delete(token);

      const client = await getActivityClient(token);
      if (!client.user) {
        throw new Error("Discord client user is not ready");
      }

      // Store voice configuration
      voiceStateConfigs.set(token, {
        guildId,
        channelId,
        enabled: input.enabled,
        mute: input.mute,
        deaf: input.deaf,
        suppress: input.suppress,
        selfVideo: input.selfVideo,
        forceReconnect: input.forceReconnect,
      });

      const applyVoiceState = async () => {
        try {
          const guild = await client.guilds.fetch(guildId);
          if (!guild) {
            console.error("Guild not found:", guildId);
            return;
          }
          
          const me = await guild.members.fetchMe().catch(() => null);
          if (!me) {
            console.error("Member not found in guild");
            return;
          }

          const targetChannel = await client.channels.fetch(channelId).catch(() => null);
          if (!targetChannel) {
            throw new Error(`Voice channel not found: ${channelId}`);
          }

          const currentChannelId = me.voice?.channelId;
          const shouldReconnect = input.forceReconnect || currentChannelId !== channelId;

          if (shouldReconnect) {
            await client.voice.joinChannel(targetChannel, {
              selfMute: input.mute,
              selfDeaf: input.deaf,
              selfVideo: input.selfVideo,
            });
            await new Promise(r => setTimeout(r, 500));
          }

          await me.voice.setMute(input.mute).catch(() => {});
          await me.voice.setDeaf(input.deaf).catch(() => {});
          await me.voice.setSuppressed(input.suppress).catch(() => {});

          afkVoiceFailures.set(token, 0);
        } catch (err) {
          const anyErr = err;
          const code = Number(anyErr?.code ?? 0);
          const nextFailures = (afkVoiceFailures.get(token) ?? 0) + 1;
          afkVoiceFailures.set(token, nextFailures);

          if (code === 40032 || nextFailures >= 3) {
            const interval = afkVoiceIntervals.get(token);
            if (interval) {
              clearInterval(interval);
              afkVoiceIntervals.delete(token);
            }
            const cfg = voiceStateConfigs.get(token);
            if (cfg) {
              voiceStateConfigs.set(token, { ...cfg, enabled: false });
            }
            console.error("AFK voice disabled due to repeated failures:", anyErr?.message || anyErr);
            return;
          }

          console.error("AFK voice keepalive error:", anyErr?.message || anyErr);
        }
      };

      if (input.enabled) {
        await applyVoiceState();
        
        // Set up keepalive interval
        const interval = setInterval(() => {
          const cfg = voiceStateConfigs.get(token);
          if (cfg?.enabled) {
            void applyVoiceState().catch((err) => {
              console.error("AFK voice keepalive error:", err);
            });
          } else {
            clearInterval(interval);
            afkVoiceIntervals.delete(token);
          }
        }, 20000);
        afkVoiceIntervals.set(token, interval);
      } else {
        // Disconnect from voice
        try {
          if (client.voice.connection) {
            client.voice.connection.disconnect();
          } else {
            const guild = await client.guilds.fetch(guildId);
            const me = await guild.members.fetchMe().catch(() => null);
            if (me) {
              await me.voice.setChannel(null).catch(() => {});
            }
          }
        } catch (err) {
          console.error("Error disconnecting from voice:", err);
        }
      }

      return res.status(200).json({ success: true, enabled: input.enabled });
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join("."),
        });
      }
      console.error("Discord AFK Voice Error:", err);
      return res.status(500).json({
        message: err instanceof Error ? err.message : "Failed to configure AFK voice",
      });
    }
  });

  app.post("/api/discord-selfbot-auto-dm", async (req, res) => {
    const schema = z.object({
      token: z.string().min(1),
      enabled: z.boolean(),
      message: z.string().default(""),
      cooldown: z.number().default(15),
      replyOnce: z.boolean().default(true),
      resetHistory: z.boolean().default(false),
    });

    try {
      const input = schema.parse(req.body);
      const token = input.token.trim();
      await getActivityClient(token);

      const previous = autoDmConfigs.get(token);
      const repliedUsers =
        input.resetHistory || !previous ? new Set() : previous.repliedUsers;

      autoDmConfigs.set(token, {
        enabled: input.enabled,
        message: input.message,
        cooldown: input.cooldown,
        replyOnce: input.replyOnce,
        repliedUsers,
      });

      return res.status(200).json({
        success: true,
        enabled: input.enabled,
        replyOnce: input.replyOnce,
        repliedUsers: repliedUsers.size,
      });
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join("."),
        });
      }
      console.error("Discord Auto DM Error:", err);
      return res.status(500).json({
        message: err instanceof Error ? err.message : "Failed to configure auto DM",
      });
    }
  });

  app.post("/api/discord-selfbot-dm", async (req, res) => {
    const schema = z.object({
      token: z.string().min(1),
      userId: z.string().regex(/^\d{17,20}$/),
      content: z.string().min(1),
    });

    try {
      const input = schema.parse(req.body);
      const client = await getActivityClient(input.token);
      const token = input.token.trim();
      try {
        const user = await client.users.fetch(input.userId);
        const dm = await user.createDM();
        const message = await dm.send(input.content);
        return res.status(200).json({ success: true, messageId: message.id, channelId: dm.id });
      } catch (primaryErr) {
        // Fallback to direct REST when selfbot library flow fails.
        const createDmRes = await fetch("https://discord.com/api/v10/users/@me/channels", {
          method: "POST",
          headers: {
            Authorization: token,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ recipient_id: input.userId }),
        });
        const createDmData = await createDmRes.json().catch(() => ({}));
        if (!createDmRes.ok || !createDmData?.id) {
          throw new Error(
            String(createDmData?.message || primaryErr?.message || "Failed to create DM channel")
          );
        }

        const sendRes = await fetch(`https://discord.com/api/v10/channels/${createDmData.id}/messages`, {
          method: "POST",
          headers: {
            Authorization: token,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ content: input.content }),
        });
        const sendData = await sendRes.json().catch(() => ({}));
        if (!sendRes.ok) {
          throw new Error(String(sendData?.message || primaryErr?.message || "Failed to send DM"));
        }

        return res.status(200).json({ success: true, messageId: sendData?.id, channelId: createDmData.id });
      }
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join("."),
        });
      }
      console.error("Discord Selfbot DM Error:", err);
      return res.status(500).json({
        message: err instanceof Error ? err.message : "Failed to send DM",
      });
    }
  });

  app.post("/api/discord-selfbot-auto-react", async (req, res) => {
    const schema = z.object({
      token: z.string().min(1),
      enabled: z.boolean(),
      guildId: z.string().default(""),
      channelId: z.string().default(""),
      emoji: z.string().optional(),
      emojis: z.string().default(""),
      ignoreBots: z.boolean().default(true),
      triggerWords: z.string().default(""),
      cooldown: z.number().default(0),
    });

    try {
      const input = schema.parse(req.body);
      const token = input.token.trim();
      await getActivityClient(token);

      // Parse emojis - split by comma and clean up
      const emojiSource = `${input.emojis || ""}${input.emoji ? `,${input.emoji}` : ""}`;
      const emojiList = emojiSource
        .split(',')
        .map(e => e.trim())
        .filter(e => e.length > 0);
      
      // Parse trigger words
      const words = input.triggerWords
        .split(',')
        .map(w => w.trim())
        .filter(w => w.length > 0);

      autoReactConfigs.set(token, {
        enabled: input.enabled,
        guildId: input.guildId.trim(),
        channelId: input.channelId.trim(),
        emojis: emojiList,
        ignoreBots: input.ignoreBots,
        triggerWords: words,
        cooldown: Math.max(0, Number(input.cooldown) || 0),
      });

      return res.status(200).json({ success: true, enabled: input.enabled });
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join("."),
        });
      }
      console.error("Discord Auto React Error:", err);
      return res.status(500).json({
        message: err instanceof Error ? err.message : "Failed to configure auto react",
      });
    }
  });

  // New endpoint for Auto Message (channel-based replies)
  app.post("/api/discord-selfbot-auto-message", async (req, res) => {
    const schema = z.object({
      token: z.string().min(1),
      enabled: z.boolean(),
      rules: z.array(z.object({
        id: z.string(),
        trigger: z.string(),
        response: z.string(),
        channelId: z.string().optional(),
        ignoreBots: z.boolean().default(true),
        cooldown: z.number().default(30),
      })).default([]),
    });

    try {
      const input = schema.parse(req.body);
      const token = input.token.trim();
      await getActivityClient(token);

      autoMessageConfigs.set(token, {
        enabled: input.enabled,
        rules: input.rules,
      });

      return res.status(200).json({ success: true, enabled: input.enabled });
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join("."),
        });
      }
      console.error("Discord Auto Message Error:", err);
      return res.status(500).json({
        message: err instanceof Error ? err.message : "Failed to configure auto message",
      });
    }
  });

  app.post("/api/discord-selfbot-repeater", async (req, res) => {
    const schema = z.object({
      token: z.string().min(1),
      relayToken: z.string().optional().default(""),
      enabled: z.boolean(),
      prefix: z.string().min(1),
      ownerId: z.string().regex(/^\d{17,20}$/),
    });

    try {
      const input = schema.parse(req.body);
      const runnerToken = (input.relayToken || input.token).trim();
      if (!runnerToken) {
        return res.status(400).json({ message: "Token is required" });
      }

      await getActivityClient(runnerToken);

      repeaterConfigs.set(runnerToken, {
        enabled: input.enabled,
        prefix: input.prefix,
        ownerId: input.ownerId,
      });

      return res.status(200).json({
        success: true,
        enabled: input.enabled,
        usingRelayToken: Boolean(input.relayToken?.trim()),
        message: input.enabled
          ? "Repeater enabled. Send <prefix><text> from Owner ID."
          : "Repeater disabled.",
      });
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join("."),
        });
      }
      console.error("Discord Repeater Error:", err);
      return res.status(500).json({
        message: err instanceof Error ? err.message : "Failed to configure repeater",
      });
    }
  });

  // Server Copy endpoint
  app.post("/api/discord-selfbot-server-copy", async (req, res) => {
    const schema = z.object({
      token: z.string().min(1),
      enabled: z.boolean(),
      sourceGuildId: z.string().min(1),
      targetGuildId: z.string().min(1),
      copyEmojis: z.boolean().default(true),
      copyRoles: z.boolean().default(true),
      copyChannels: z.boolean().default(true),
      copyName: z.boolean().default(true),
    });

    try {
      const input = schema.parse(req.body);
      const token = input.token.trim();
      
      // Get Discord client
      const client = await getActivityClient(token);
      
      // Get source and target guilds using discord.js methods
      const guild = await client.guilds.fetch(input.sourceGuildId);
      const guild2 = await client.guilds.fetch(input.targetGuildId);
      
      if (!guild || !guild2) {
        throw new Error("Could not find one or both servers");
      }
      
      const results = [];
      const detailedResults = {
        name: "",
        roles: [],
        channels: [],
        emojis: [],
        failed: [],
      };
      const rolesMap = new Map();
      const categoriesMap = new Map();
      
      // Copy server name if enabled
      if (input.copyName) {
        try {
          await guild2.setName(guild.name);
          detailedResults.name = guild.name;
          results.push('Server name copied');
        } catch (e) {
          results.push('Failed to copy server name');
          detailedResults.failed.push('Server name');
        }
      }
      
      // Delete existing content first if enabled
      if (input.copyChannels || input.copyRoles || input.copyEmojis) {
        try {
          // Delete all channels
          for (const [, channel] of guild2.channels.cache) {
            await channel.delete().catch(() => {});
          }
          // Delete all roles (except @everyone)
          for (const [, role] of guild2.roles.cache) {
            if (role.id !== guild2.id) {
              await role.delete().catch(() => {});
            }
          }
          // Delete all emojis
          for (const [, emoji] of guild2.emojis.cache) {
            await emoji.delete().catch(() => {});
          }
          results.push('Cleaned target server');
        } catch (e) {
          results.push('Failed to clean target server');
        }
      }
      
      // Copy roles if enabled
      if (input.copyRoles) {
        try {
          const guildRoles = [...guild.roles.cache.values()].sort((a, b) => a.rawPosition - b.rawPosition);
          
          for (const role of guildRoles) {
            try {
              if (role.id === guild.roles.everyone.id) {
                // Update @everyone role permissions
                await guild2.roles.everyone.setPermissions(role.permissions.toArray());
                rolesMap.set(role.id, guild2.roles.everyone);
                continue;
              }
              
              const createdRole = await guild2.roles.create({
                name: role.name,
                color: role.color,
                hoist: role.hoist,
                mentionable: role.mentionable,
                permissions: role.permissions.toArray(),
              });
              
              rolesMap.set(role.id, createdRole);
              detailedResults.roles.push(role.name);
            } catch (e) {
              detailedResults.failed.push(`Role: ${role.name}`);
            }
          }
          results.push(`Copied ${guildRoles.length - 1} roles`);
        } catch (e) {
          results.push('Failed to copy roles');
        }
      }
      
      // Copy channels if enabled
      if (input.copyChannels) {
        try {
          // First, create categories
          const guildCategories = [...guild.channels.cache.filter((ch) => ch.type === 'GUILD_CATEGORY').values()].sort((a, b) => a.rawPosition - b.rawPosition);
          
          for (const category of guildCategories) {
            try {
              const permissionOverwrites = [];
              
              for (const [, overwrite] of category.permissionOverwrites.cache) {
                const role = rolesMap.get(overwrite.id);
                if (role) {
                  permissionOverwrites.push({
                    id: role.id,
                    allow: overwrite.allow.toArray(),
                    deny: overwrite.deny.toArray()
                  });
                }
              }
              
              const createdCategory = await guild2.channels.create(category.name, {
                type: 'GUILD_CATEGORY',
                permissionOverwrites
              });
              
              categoriesMap.set(category.id, createdCategory);
              detailedResults.channels.push(`Category: ${category.name}`);
            } catch (e) {
              detailedResults.failed.push(`Category: ${category.name}`);
            }
          }
          
          // Then, create other channels
          const guildChannels = [...guild.channels.cache.filter((ch) => ch.type !== 'GUILD_CATEGORY').values()].sort((a, b) => a.rawPosition - b.rawPosition);
          
          for (const channel of guildChannels) {
            try {
              const permissionOverwrites = [];
              const parent = channel.parentId ? categoriesMap.get(channel.parentId) : null;
              
              for (const [, overwrite] of channel.permissionOverwrites.cache) {
                const role = rolesMap.get(overwrite.id);
                if (role) {
                  permissionOverwrites.push({
                    id: role.id,
                    allow: overwrite.allow.toArray(),
                    deny: overwrite.deny.toArray()
                  });
                }
              }
              
              const channelType = channel.type === 'GUILD_TEXT' ? 'GUILD_TEXT' : 
                                 channel.type === 'GUILD_VOICE' ? 'GUILD_VOICE' : 
                                 channel.type === 'GUILD_NEWS' ? 'GUILD_NEWS' : 'GUILD_TEXT';
              
              await guild2.channels.create(channel.name, {
                type: channelType,
                topic: channel.topic,
                bitrate: channel.bitrate,
                userLimit: channel.userLimit,
                permissionOverwrites,
                parent
              });
              detailedResults.channels.push(`Channel: ${channel.name}`);
            } catch (e) {
              detailedResults.failed.push(`Channel: ${channel.name}`);
            }
          }
          results.push('Copied channels and categories');
        } catch (e) {
          results.push('Failed to copy channels');
        }
      }
      
      // Copy emojis if enabled
      if (input.copyEmojis) {
        try {
          for (const [, emoji] of guild.emojis.cache) {
            try {
              await guild2.emojis.create(emoji.url, emoji.name);
              detailedResults.emojis.push(emoji.name);
            } catch (e) {
              detailedResults.failed.push(`Emoji: ${emoji.name}`);
            }
          }
          results.push(`Copied ${guild.emojis.cache.size} emojis`);
        } catch (e) {
          results.push('Failed to copy emojis');
        }
      }
      
      return res.status(200).json({ 
        success: true, 
        message: results.join(', '),
        results: results,
        detailedResults,
      });
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join("."),
        });
      }
      console.error("Discord Server Copy Error:", err);
      return res.status(500).json({
        message: err instanceof Error ? err.message : "Failed to copy server",
      });
    }
  });

  // ============================================
  // Account Control Endpoints (Block All, Delete DMs, Leave Servers)
  // ============================================

  // Block all users endpoint
  app.post("/api/discord-selfbot-block-all", async (req, res) => {
    const schema = z.object({
      token: z.string().min(1),
      confirm: z.boolean(),
    });

    try {
      const { token, confirm } = schema.parse(req.body);

      if (!confirm) {
        return res.status(400).json({ 
          success: false, 
          message: "Confirmation required. Set confirm: true to proceed." 
        });
      }

      // Create a temporary client to make API calls
      const tempClient = new SelfbotClient();
      await tempClient.login(token);

      // Get all relationships (friends)
      const relationships = tempClient.relationships.cache;
      let blockedCount = 0;
      let failedCount = 0;
      const results = [];

      for (const [userId, relationship] of Array.from(relationships.entries())) {
        try {
          // Block user via API
          await tempClient.api.put(`/users/@me/relationships/${userId}`, {
            type: 2 // Block type
          });
          blockedCount++;
          const username = relationship?.username || relationship?.user?.username || userId;
          results.push(`Blocked: ${username}`);
        } catch (e) {
          failedCount++;
          const username = relationship?.username || relationship?.user?.username || userId;
          results.push(`Failed: ${username}`);
        }
        // Small delay to avoid rate limiting
        await new Promise(r => setTimeout(r, 500));
      }

      tempClient.destroy();

      return res.status(200).json({ 
        success: true, 
        message: `Blocked ${blockedCount} users. Failed: ${failedCount}`,
        blockedCount,
        failedCount,
        results: results.slice(0, 50) // Return first 50 results
      });
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join("."),
        });
      }
      console.error("Block All Error:", err);
      return res.status(500).json({
        message: err instanceof Error ? err.message : "Failed to block users",
      });
    }
  });

  // Delete all DMs endpoint
  app.post("/api/discord-selfbot-delete-dms", async (req, res) => {
    const schema = z.object({
      token: z.string().min(1),
      confirm: z.boolean(),
    });

    try {
      const { token, confirm } = schema.parse(req.body);

      if (!confirm) {
        return res.status(400).json({ 
          success: false, 
          message: "Confirmation required. Set confirm: true to proceed." 
        });
      }

      // Create a temporary client
      const tempClient = new SelfbotClient();
      await tempClient.login(token);

      // Get all DM channels
      const dmChannels = tempClient.channels.cache.filter(
        (ch) => ch.type === 1 || ch.type === 3 // DM or Group DM
      );

      let deletedCount = 0;
      let failedCount = 0;
      const results = [];

      for (const [channelId, channel] of Array.from(dmChannels.entries())) {
        try {
          await channel.delete();
          deletedCount++;
          results.push(`Deleted DM: ${channelId}`);
        } catch (e) {
          failedCount++;
          results.push(`Failed: ${channelId}`);
        }
        // Small delay to avoid rate limiting
        await new Promise(r => setTimeout(r, 300));
      }

      tempClient.destroy();

      return res.status(200).json({ 
        success: true, 
        message: `Deleted ${deletedCount} DMs. Failed: ${failedCount}`,
        deletedCount,
        failedCount,
        results: results.slice(0, 50)
      });
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join("."),
        });
      }
      console.error("Delete DMs Error:", err);
      return res.status(500).json({
        message: err instanceof Error ? err.message : "Failed to delete DMs",
      });
    }
  });

  // Leave all servers endpoint
  app.post("/api/discord-selfbot-leave-servers", async (req, res) => {
    const schema = z.object({
      token: z.string().min(1),
      confirm: z.boolean(),
    });

    try {
      const { token, confirm } = schema.parse(req.body);

      if (!confirm) {
        return res.status(400).json({ 
          success: false, 
          message: "Confirmation required. Set confirm: true to proceed." 
        });
      }

      // Create a temporary client
      const tempClient = new SelfbotClient();
      await tempClient.login(token);

      // Get all guilds
      const guilds = tempClient.guilds.cache;

      let leftCount = 0;
      let failedCount = 0;
      const results = [];

      for (const [guildId, guild] of Array.from(guilds.entries())) {
        try {
          // Leave the guild
          await guild.leave();
          leftCount++;
          results.push(`Left: ${guild.name}`);
        } catch (e) {
          failedCount++;
          results.push(`Failed: ${guild.name}`);
        }
        // Small delay to avoid rate limiting
        await new Promise(r => setTimeout(r, 500));
      }

      tempClient.destroy();

      return res.status(200).json({ 
        success: true, 
        message: `Left ${leftCount} servers. Failed: ${failedCount}`,
        leftCount,
        failedCount,
        results: results.slice(0, 50)
      });
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join("."),
        });
      }
      console.error("Leave Servers Error:", err);
      return res.status(500).json({
        message: err instanceof Error ? err.message : "Failed to leave servers",
      });
    }
  });

  // Seed the database safely without blocking server start
  setTimeout(() => seedDatabase().catch(console.error), 1000);

  return httpServer;
}

async function seedDatabase() {
  const existingTemplates = await storage.getMessageTemplates();
  if (existingTemplates.length === 0) {
    await storage.createMessageTemplate({
      title: "Friendly Greeting",
      content: "Hello! This is an automated message from BOTY system.\n\nJust checking in with everyone! 👋"
    });
    await storage.createMessageTemplate({
      title: "Server Announcement",
      content: "Important update! Please check the announcements channel for more information."
    });
  }

  const existingPresets = await storage.getPresencePresets();
  if (existingPresets.length === 0) {
    await storage.createPresencePreset({
      name: "Gaming - Cyberpunk",
      status: "online",
      activityType: "Playing",
      gameName: "Cyberpunk 2077",
      details: "Exploring Night City",
      state: "Act 2"
    });
    await storage.createPresencePreset({
      name: "Streaming Setup",
      status: "dnd",
      activityType: "Streaming",
      gameName: "Software & Game Development",
      details: "Live Coding Session",
      state: "Live"
    });
  }
}
