import express from "express";
import { z } from "zod";
import { nanoid } from "nanoid";

// In-memory storage for invites and guild settings
const invites = new Map();
const guildSettings = new Map();

export function registerInvitesRoutes(app) {
  
  // Generate invite code
  app.post("/api/invites", async (req, res) => {
    const schema = z.object({
      guildId: z.string().min(1),
      channelId: z.string().min(1),
      maxAge: z.number().optional().default(86400), // 24 hours default
      maxUses: z.number().optional().default(0), // unlimited
      temporary: z.boolean().optional().default(false),
    });

    try {
      const input = schema.parse(req.body);
      
      const code = nanoid(10);
      const invite = {
        code,
        guildId: input.guildId,
        channelId: input.channelId,
        inviterId: req.headers['x-user-id'] || 'system',
        maxAge: input.maxAge,
        maxUses: input.maxUses,
        uses: 0,
        temporary: input.temporary,
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + input.maxAge * 1000).toISOString(),
      };

      // Store invite
      const guildInvites = invites.get(input.guildId) || [];
      guildInvites.push(invite);
      invites.set(input.guildId, guildInvites);

      res.status(201).json(invite);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      console.error("Create Invite Error:", err);
      res.status(500).json({ message: "Failed to create invite" });
    }
  });

  // Get all invites for a guild
  app.get("/api/invites/:guildId", async (req, res) => {
    try {
      const { guildId } = req.params;
      const guildInvites = invites.get(guildId) || [];
      
      // Filter out expired invites
      const now = new Date().toISOString();
      const validInvites = guildInvites.filter(inv => 
        inv.expiresAt > now && (inv.maxUses === 0 || inv.uses < inv.maxUses)
      );
      
      res.json(validInvites);
    } catch (err) {
      console.error("Get Invites Error:", err);
      res.status(500).json({ message: "Failed to get invites" });
    }
  });

  // Use an invite (join guild)
  app.post("/api/invites/use", async (req, res) => {
    const schema = z.object({
      code: z.string().min(1),
      userId: z.string().min(1),
    });

    try {
      const input = schema.parse(req.body);
      
      // Find the invite
      for (const [guildId, guildInvites] of invites.entries()) {
        const invite = guildInvites.find(inv => inv.code === input.code);
        
        if (!invite) {
          continue;
        }

        // Check expiration
        if (new Date(invite.expiresAt) < new Date()) {
          return res.status(400).json({ message: "Invite has expired" });
        }

        // Check max uses
        if (invite.maxUses > 0 && invite.uses >= invite.maxUses) {
          return res.status(400).json({ message: "Invite has reached max uses" });
        }

        // Increment uses
        invite.uses += 1;
        invite.lastUsedAt = new Date().toISOString();
        invite.usedBy = input.userId;

        return res.json({
          success: true,
          guildId,
          channelId: invite.channelId,
          invite,
        });
      }

      res.status(404).json({ message: "Invite not found" });
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      console.error("Use Invite Error:", err);
      res.status(500).json({ message: "Failed to use invite" });
    }
  });

  // Delete an invite
  app.delete("/api/invites/:code", async (req, res) => {
    try {
      const { code } = req.params;

      for (const [guildId, guildInvites] of invites.entries()) {
        const inviteIndex = guildInvites.findIndex(inv => inv.code === code);
        
        if (inviteIndex !== -1) {
          guildInvites.splice(inviteIndex, 1);
          return res.json({ success: true });
        }
      }

      res.status(404).json({ message: "Invite not found" });
    } catch (err) {
      console.error("Delete Invite Error:", err);
      res.status(500).json({ message: "Failed to delete invite" });
    }
  });

  // Get guild settings
  app.get("/api/guild/:guildId/settings", async (req, res) => {
    try {
      const { guildId } = req.params;
      let settings = guildSettings.get(guildId);
      
      if (!settings) {
        settings = {
          guildId,
          name: '',
          icon: null,
          description: '',
          verificationLevel: 0,
          explicitContentFilter: 0,
          defaultNotifications: 1,
          afkChannelId: null,
          afkTimeout: 300,
          systemChannelId: null,
          rulesChannelId: null,
          publicUpdatesChannelId: null,
          preferredLocale: 'en-US',
          features: [],
          createdAt: new Date().toISOString(),
        };
        guildSettings.set(guildId, settings);
      }
      
      res.json(settings);
    } catch (err) {
      console.error("Get Guild Settings Error:", err);
      res.status(500).json({ message: "Failed to get guild settings" });
    }
  });

  // Update guild settings
  app.patch("/api/guild/:guildId/settings", async (req, res) => {
    const schema = z.object({
      name: z.string().optional(),
      icon: z.string().optional(),
      description: z.string().optional(),
      verificationLevel: z.number().min(0).max(3).optional(),
      explicitContentFilter: z.number().min(0).max(2).optional(),
      defaultNotifications: z.number().min(0).max(1).optional(),
      afkChannelId: z.string().optional().nullable(true),
      afkTimeout: z.number().optional(),
      systemChannelId: z.string().optional().nullable(true),
      rulesChannelId: z.string().optional().nullable(true),
      publicUpdatesChannelId: z.string().optional().nullable(true),
      preferredLocale: z.string().optional(),
    });

    try {
      const { guildId } = req.params;
      const input = schema.parse(req.body);

      const currentSettings = guildSettings.get(guildId) || {
        guildId,
        name: '',
        icon: null,
        description: '',
        verificationLevel: 0,
        explicitContentFilter: 0,
        defaultNotifications: 1,
        afkChannelId: null,
        afkTimeout: 300,
        systemChannelId: null,
        rulesChannelId: null,
        publicUpdatesChannelId: null,
        preferredLocale: 'en-US',
        features: [],
        createdAt: new Date().toISOString(),
      };

      const updatedSettings = {
        ...currentSettings,
        ...input,
        updatedAt: new Date().toISOString(),
      };

      guildSettings.set(guildId, updatedSettings);
      res.json(updatedSettings);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      console.error("Update Guild Settings Error:", err);
      res.status(500).json({ message: "Failed to update guild settings" });
    }
  });

  // Get vanity invite (if available)
  app.get("/api/invites/:guildId/vanity", async (req, res) => {
    try {
      const { guildId } = req.params;
      const settings = guildSettings.get(guildId);
      
      if (settings && settings.vanityInviteCode) {
        const guildInvites = invites.get(guildId) || [];
        const vanity = guildInvites.find(inv => inv.code === settings.vanityInviteCode);
        return res.json(vanity || null);
      }
      
      res.json(null);
    } catch (err) {
      console.error("Get Vanity Invite Error:", err);
      res.status(500).json({ message: "Failed to get vanity invite" });
    }
  });
}
