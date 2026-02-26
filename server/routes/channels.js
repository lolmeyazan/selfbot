import express from "express";
import { z } from "zod";
import { nanoid } from "nanoid";

// In-memory storage for channels and overwrites
const channels = new Map();
const overwrites = new Map();

export function registerChannelsRoutes(app) {
  
  // Create a channel
  app.post("/api/channels", async (req, res) => {
    const schema = z.object({
      guildId: z.string().min(1),
      name: z.string().min(1),
      type: z.enum(['text', 'voice', 'category', 'announcement']).default('text'),
      parentId: z.string().optional().nullable(true),
      position: z.number().optional().default(0),
      topic: z.string().optional().nullable(true),
      nsfw: z.boolean().optional().default(false),
      bitrate: z.number().optional().default(64000),
      userLimit: z.number().optional().default(0),
    });

    try {
      const input = schema.parse(req.body);
      
      const channel = {
        id: nanoid(),
        guildId: input.guildId,
        name: input.name,
        type: input.type,
        parentId: input.parentId,
        position: input.position,
        topic: input.topic,
        nsfw: input.nsfw,
        bitrate: input.bitrate,
        userLimit: input.userLimit,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Store channel
      const guildChannels = channels.get(input.guildId) || [];
      guildChannels.push(channel);
      channels.set(input.guildId, guildChannels);

      res.status(201).json(channel);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      console.error("Create Channel Error:", err);
      res.status(500).json({ message: "Failed to create channel" });
    }
  });

  // Get all channels for a guild
  app.get("/api/channels/:guildId", async (req, res) => {
    try {
      const { guildId } = req.params;
      const guildChannels = channels.get(guildId) || [];
      
      // Sort by position
      guildChannels.sort((a, b) => a.position - b.position);
      
      // Get overwrites for each channel
      const channelsWithOverwrites = guildChannels.map(channel => {
        const channelOverwrites = overwrites.get(channel.id) || [];
        return { ...channel, permissionOverwrites: channelOverwrites };
      });
      
      res.json(channelsWithOverwrites);
    } catch (err) {
      console.error("Get Channels Error:", err);
      res.status(500).json({ message: "Failed to get channels" });
    }
  });

  // Update a channel
  app.patch("/api/channels/:channelId", async (req, res) => {
    const schema = z.object({
      name: z.string().optional(),
      position: z.number().optional(),
      topic: z.string().optional().nullable(true),
      nsfw: z.boolean().optional(),
      bitrate: z.number().optional(),
      userLimit: z.number().optional(),
      parentId: z.string().optional().nullable(true),
    });

    try {
      const { channelId } = req.params;
      const input = schema.parse(req.body);

      for (const [guildId, guildChannels] of channels.entries()) {
        const channelIndex = guildChannels.findIndex(c => c.id === channelId);
        
        if (channelIndex !== -1) {
          const channel = guildChannels[channelIndex];
          const updatedChannel = {
            ...channel,
            ...input,
            updatedAt: new Date().toISOString(),
          };
          guildChannels[channelIndex] = updatedChannel;
          channels.set(guildId, guildChannels);
          
          // Return with overwrites
          const channelOverwrites = overwrites.get(channelId) || [];
          return res.json({ ...updatedChannel, permissionOverwrites: channelOverwrites });
        }
      }

      res.status(404).json({ message: "Channel not found" });
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      console.error("Update Channel Error:", err);
      res.status(500).json({ message: "Failed to update channel" });
    }
  });

  // Delete a channel
  app.delete("/api/channels/:channelId", async (req, res) => {
    try {
      const { channelId } = req.params;

      for (const [guildId, guildChannels] of channels.entries()) {
        const channelIndex = guildChannels.findIndex(c => c.id === channelId);
        
        if (channelIndex !== -1) {
          guildChannels.splice(channelIndex, 1);
          channels.set(guildId, guildChannels);
          
          // Also delete all overwrites for this channel
          overwrites.delete(channelId);
          
          return res.json({ success: true });
        }
      }

      res.status(404).json({ message: "Channel not found" });
    } catch (err) {
      console.error("Delete Channel Error:", err);
      res.status(500).json({ message: "Failed to delete channel" });
    }
  });

  // Add permission overwrite
  app.post("/api/channels/:channelId/overwrites", async (req, res) => {
    const schema = z.object({
      id: z.string().min(1), // role or user id
      type: z.enum(['role', 'member']),
      allow: z.array(z.string()).optional().default([]),
      deny: z.array(z.string()).optional().default([]),
    });

    try {
      const { channelId } = req.params;
      const input = schema.parse(req.body);

      const channelOverwrites = overwrites.get(channelId) || [];
      
      // Remove existing overwrite for this id
      const filteredOverwrites = channelOverwrites.filter(o => o.id !== input.id);
      
      // Add new overwrite
      filteredOverwrites.push({
        id: input.id,
        type: input.type,
        allow: input.allow,
        deny: input.deny,
        createdAt: new Date().toISOString(),
      });
      
      overwrites.set(channelId, filteredOverwrites);
      res.status(201).json(filteredOverwrites);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      console.error("Add Overwrite Error:", err);
      res.status(500).json({ message: "Failed to add overwrite" });
    }
  });

  // Update permission overwrite
  app.patch("/api/channels/:channelId/overwrites/:overwriteId", async (req, res) => {
    const schema = z.object({
      allow: z.array(z.string()).optional(),
      deny: z.array(z.string()).optional(),
    });

    try {
      const { channelId, overwriteId } = req.params;
      const input = schema.parse(req.body);

      const channelOverwrites = overwrites.get(channelId) || [];
      const overwriteIndex = channelOverwrites.findIndex(o => o.id === overwriteId);
      
      if (overwriteIndex === -1) {
        return res.status(404).json({ message: "Overwrite not found" });
      }

      const updatedOverwrite = {
        ...channelOverwrites[overwriteIndex],
        allow: input.allow !== undefined ? input.allow : channelOverwrites[overwriteIndex].allow,
        deny: input.deny !== undefined ? input.deny : channelOverwrites[overwriteIndex].deny,
        updatedAt: new Date().toISOString(),
      };
      
      channelOverwrites[overwriteIndex] = updatedOverwrite;
      overwrites.set(channelId, channelOverwrites);
      
      res.json(updatedOverwrite);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      console.error("Update Overwrite Error:", err);
      res.status(500).json({ message: "Failed to update overwrite" });
    }
  });

  // Delete permission overwrite
  app.delete("/api/channels/:channelId/overwrites/:overwriteId", async (req, res) => {
    try {
      const { channelId, overwriteId } = req.params;

      const channelOverwrites = overwrites.get(channelId) || [];
      const filteredOverwrites = channelOverwrites.filter(o => o.id !== overwriteId);
      
      if (filteredOverwrites.length === channelOverwrites.length) {
        return res.status(404).json({ message: "Overwrite not found" });
      }
      
      overwrites.set(channelId, filteredOverwrites);
      res.json({ success: true });
    } catch (err) {
      console.error("Delete Overwrite Error:", err);
      res.status(500).json({ message: "Failed to delete overwrite" });
    }
  });

  // Get permission overwrite for a user in a channel
  app.get("/api/channels/:channelId/permissions/:userId", async (req, res) => {
    try {
      const { channelId, userId } = req.params;
      const channelOverwrites = overwrites.get(channelId) || [];
      
      // Find user-specific overwrite first, then role overwrites
      const userOverwrite = channelOverwrites.find(o => o.id === userId && o.type === 'member');
      
      if (userOverwrite) {
        return res.json(userOverwrite);
      }
      
      // For role overwrites, we'd need the user's roles to determine applicable overwrite
      // For now, return all overwrites
      res.json(channelOverwrites);
    } catch (err) {
      console.error("Get Permissions Error:", err);
      res.status(500).json({ message: "Failed to get permissions" });
    }
  });

  // Reorder channels
  app.post("/api/channels/:guildId/reorder", async (req, res) => {
    const schema = z.object({
      channelIds: z.array(z.string()),
    });

    try {
      const { guildId } = req.params;
      const input = schema.parse(req.body);

      const guildChannels = channels.get(guildId) || [];
      
      // Update positions based on array order
      input.channelIds.forEach((id, index) => {
        const channel = guildChannels.find(c => c.id === id);
        if (channel) {
          channel.position = index;
        }
      });
      
      channels.set(guildId, guildChannels);
      
      // Return updated channels with overwrites
      const channelsWithOverwrites = guildChannels.map(channel => {
        const channelOverwrites = overwrites.get(channel.id) || [];
        return { ...channel, permissionOverwrites: channelOverwrites };
      });
      
      res.json(channelsWithOverwrites);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      console.error("Reorder Channels Error:", err);
      res.status(500).json({ message: "Failed to reorder channels" });
    }
  });
}
