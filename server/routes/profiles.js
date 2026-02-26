import express from "express";
import { z } from "zod";

// In-memory storage for profiles
const profiles = new Map();
const presence = new Map();

export function registerProfilesRoutes(app) {
  
  // Get or create user profile
  app.get("/api/profiles/:userId", async (req, res) => {
    try {
      const { userId } = req.params;
      let profile = profiles.get(userId);
      
      if (!profile) {
        profile = {
          id: userId,
          userId,
          avatar: null,
          banner: null,
          bio: '',
          backgroundColor: '#313338',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        profiles.set(userId, profile);
      }
      
      res.json(profile);
    } catch (err) {
      console.error("Get Profile Error:", err);
      res.status(500).json({ message: "Failed to get profile" });
    }
  });

  // Update profile
  app.patch("/api/profiles/:userId", async (req, res) => {
    const schema = z.object({
      avatar: z.string().optional(),
      banner: z.string().optional(),
      bio: z.string().optional(),
      backgroundColor: z.string().optional(),
    });

    try {
      const { userId } = req.params;
      const input = schema.parse(req.body);

      let profile = profiles.get(userId) || {
        id: userId,
        userId,
        avatar: null,
        banner: null,
        bio: '',
        backgroundColor: '#313338',
        createdAt: new Date().toISOString(),
      };

      profile = {
        ...profile,
        ...input,
        updatedAt: new Date().toISOString(),
      };

      profiles.set(userId, profile);
      res.json(profile);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      console.error("Update Profile Error:", err);
      res.status(500).json({ message: "Failed to update profile" });
    }
  });

  // Upload avatar (base64)
  app.post("/api/profiles/:userId/avatar", async (req, res) => {
    const schema = z.object({
      avatar: z.string().min(1), // base64 string
    });

    try {
      const { userId } = req.params;
      const input = schema.parse(req.body);

      let profile = profiles.get(userId) || {
        id: userId,
        userId,
        avatar: null,
        banner: null,
        bio: '',
        backgroundColor: '#313338',
        createdAt: new Date().toISOString(),
      };

      profile = {
        ...profile,
        avatar: input.avatar,
        updatedAt: new Date().toISOString(),
      };

      profiles.set(userId, profile);
      res.json({ success: true, avatar: profile.avatar });
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      console.error("Upload Avatar Error:", err);
      res.status(500).json({ message: "Failed to upload avatar" });
    }
  });

  // Get user presence/status
  app.get("/api/presence/:userId", async (req, res) => {
    try {
      const { userId } = req.params;
      const userPresence = presence.get(userId) || {
        userId,
        status: 'offline',
        customStatus: null,
        lastChanged: new Date().toISOString(),
      };
      res.json(userPresence);
    } catch (err) {
      console.error("Get Presence Error:", err);
      res.status(500).json({ message: "Failed to get presence" });
    }
  });

  // Update user presence/status
  app.post("/api/presence/:userId", async (req, res) => {
    const schema = z.object({
      status: z.enum(['online', 'idle', 'dnd', 'offline']).optional(),
      customStatus: z.string().optional(),
      guildId: z.string().optional(),
    });

    try {
      const { userId } = req.params;
      const input = schema.parse(req.body);

      const currentPresence = presence.get(userId) || {
        userId,
        status: 'offline',
        customStatus: null,
        lastChanged: new Date().toISOString(),
      };

      const updatedPresence = {
        ...currentPresence,
        status: input.status || currentPresence.status,
        customStatus: input.customStatus !== undefined ? input.customStatus : currentPresence.customStatus,
        guildId: input.guildId || currentPresence.guildId,
        lastChanged: new Date().toISOString(),
      };

      presence.set(userId, updatedPresence);
      res.json(updatedPresence);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      console.error("Update Presence Error:", err);
      res.status(500).json({ message: "Failed to update presence" });
    }
  });

  // Get multiple presences (for a guild)
  app.get("/api/presence/guild/:guildId", async (req, res) => {
    try {
      const { guildId } = req.params;
      
      // Get all presences for users in this guild
      const guildPresences = [];
      for (const [userId, userPresence] of presence.entries()) {
        if (userPresence.guildId === guildId) {
          guildPresences.push(userPresence);
        }
      }
      
      res.json(guildPresences);
    } catch (err) {
      console.error("Get Guild Presence Error:", err);
      res.status(500).json({ message: "Failed to get guild presence" });
    }
  });
}
