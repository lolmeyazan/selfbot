import express from "express";
import { z } from "zod";
import { nanoid } from "nanoid";

// In-memory storage for roles (replace with database in production)
const roles = new Map();
const userRoles = new Map();

const PERMISSIONS = [
  'SEND_MESSAGES',
  'MANAGE_CHANNELS',
  'MANAGE_ROLES',
  'KICK_MEMBERS',
  'BAN_MEMBERS',
  'VIEW_AUDIT_LOG',
  'MANAGE_GUILD',
  'MUTE_MEMBERS',
  'DEAFEN_MEMBERS',
  'MOVE_MEMBERS',
  'VIEW_CHANNEL',
  'CONNECT',
  'SPEAK',
];

export function registerRolesRoutes(app) {
  
  // Create a new role
  app.post("/api/roles", async (req, res) => {
    const schema = z.object({
      guildId: z.string().min(1),
      name: z.string().min(1),
      color: z.string().optional().default("#99aab5"),
      permissions: z.array(z.string()).optional().default([]),
    });

    try {
      const input = schema.parse(req.body);
      
      // Get existing roles for this guild
      const guildRoles = roles.get(input.guildId) || [];
      const newPosition = guildRoles.length > 0 
        ? Math.max(...guildRoles.map(r => r.position)) + 1 
        : 0;

      const role = {
        id: nanoid(),
        guildId: input.guildId,
        name: input.name,
        color: input.color,
        position: newPosition,
        permissions: input.permissions,
        isEveryone: false,
        createdAt: new Date().toISOString(),
      };

      guildRoles.push(role);
      roles.set(input.guildId, guildRoles);

      res.status(201).json(role);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      console.error("Create Role Error:", err);
      res.status(500).json({ message: "Failed to create role" });
    }
  });

  // Get all roles for a guild
  app.get("/api/roles/:guildId", async (req, res) => {
    try {
      const { guildId } = req.params;
      const guildRoles = roles.get(guildId) || [];
      // Sort by position descending (higher position first)
      guildRoles.sort((a, b) => b.position - a.position);
      res.json(guildRoles);
    } catch (err) {
      console.error("Get Roles Error:", err);
      res.status(500).json({ message: "Failed to get roles" });
    }
  });

  // Update a role
  app.patch("/api/roles/:roleId", async (req, res) => {
    const schema = z.object({
      name: z.string().optional(),
      color: z.string().optional(),
      permissions: z.array(z.string()).optional(),
    });

    try {
      const { roleId } = req.params;
      const input = schema.parse(req.body);

      // Find and update the role
      for (const [guildId, guildRoles] of roles.entries()) {
        const roleIndex = guildRoles.findIndex(r => r.id === roleId);
        if (roleIndex !== -1) {
          const role = guildRoles[roleIndex];
          const updatedRole = { ...role, ...input };
          guildRoles[roleIndex] = updatedRole;
          roles.set(guildId, guildRoles);
          return res.json(updatedRole);
        }
      }

      res.status(404).json({ message: "Role not found" });
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      console.error("Update Role Error:", err);
      res.status(500).json({ message: "Failed to update role" });
    }
  });

  // Delete a role
  app.delete("/api/roles/:roleId", async (req, res) => {
    try {
      const { roleId } = req.params;

      for (const [guildId, guildRoles] of roles.entries()) {
        const roleIndex = guildRoles.findIndex(r => r.id === roleId);
        if (roleIndex !== -1) {
          guildRoles.splice(roleIndex, 1);
          roles.set(guildId, guildRoles);
          return res.json({ success: true });
        }
      }

      res.status(404).json({ message: "Role not found" });
    } catch (err) {
      console.error("Delete Role Error:", err);
      res.status(500).json({ message: "Failed to delete role" });
    }
  });

  // Assign role to user
  app.post("/api/roles/assign", async (req, res) => {
    const schema = z.object({
      userId: z.string().min(1),
      guildId: z.string().min(1),
      roleId: z.string().min(1),
    });

    try {
      const input = schema.parse(req.body);

      // Get user's roles for this guild
      const key = `${input.guildId}:${input.userId}`;
      const usersGuildRoles = userRoles.get(key) || [];
      
      if (!usersGuildRoles.includes(input.roleId)) {
        usersGuildRoles.push(input.roleId);
        userRoles.set(key, usersGuildRoles);
      }

      res.status(201).json({ success: true, roleId: input.roleId });
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      console.error("Assign Role Error:", err);
      res.status(500).json({ message: "Failed to assign role" });
    }
  });

  // Remove role from user
  app.delete("/api/roles/assign", async (req, res) => {
    const schema = z.object({
      userId: z.string().min(1),
      guildId: z.string().min(1),
      roleId: z.string().min(1),
    });

    try {
      const input = schema.parse(req.body);

      const key = `${input.guildId}:${input.userId}`;
      const usersGuildRoles = userRoles.get(key) || [];
      const filteredRoles = usersGuildRoles.filter(r => r !== input.roleId);
      userRoles.set(key, filteredRoles);

      res.json({ success: true });
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      console.error("Remove Role Error:", err);
      res.status(500).json({ message: "Failed to remove role" });
    }
  });

  // Get user's roles
  app.get("/api/roles/user/:guildId/:userId", async (req, res) => {
    try {
      const { guildId, userId } = req.params;
      const key = `${guildId}:${userId}`;
      const usersGuildRoles = userRoles.get(key) || [];
      
      // Get full role objects
      const guildRoles = roles.get(guildId) || [];
      const userRoleObjects = guildRoles.filter(r => usersGuildRoles.includes(r.id));
      
      res.json(userRoleObjects);
    } catch (err) {
      console.error("Get User Roles Error:", err);
      res.status(500).json({ message: "Failed to get user roles" });
    }
  });

  // Check permission
  app.post("/api/roles/check-permission", async (req, res) => {
    const schema = z.object({
      userId: z.string().min(1),
      guildId: z.string().min(1),
      permission: z.string(),
    });

    try {
      const input = schema.parse(req.body);
      
      const key = `${input.guildId}:${input.userId}`;
      const usersGuildRoles = userRoles.get(key) || [];
      
      const guildRoles = roles.get(input.guildId) || [];
      const userRolesList = guildRoles.filter(r => usersGuildRoles.includes(r.id));
      
      // Check if any of user's roles has the permission
      const hasPermission = userRolesList.some(role => 
        role.permissions.includes(input.permission)
      );

      res.json({ hasPermission });
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      console.error("Check Permission Error:", err);
      res.status(500).json({ message: "Failed to check permission" });
    }
  });

  // Get available permissions
  app.get("/api/permissions", (req, res) => {
    res.json(PERMISSIONS);
  });
}
