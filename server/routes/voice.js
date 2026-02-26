import express from "express";
import { z } from "zod";
import { nanoid } from "nanoid";

// In-memory storage for voice rooms and participants
const voiceRooms = new Map();
const voiceParticipants = new Map();

export function registerVoiceRoutes(app) {
  
  // Create a voice room
  app.post("/api/voice/rooms", async (req, res) => {
    const schema = z.object({
      guildId: z.string().min(1),
      channelId: z.string().min(1),
      name: z.string().optional(),
      userId: z.string().min(1),
    });

    try {
      const input = schema.parse(req.body);
      
      const room = {
        id: nanoid(),
        guildId: input.guildId,
        channelId: input.channelId,
        name: input.name || `Voice Room ${Math.floor(Math.random() * 1000)}`,
        createdBy: input.userId,
        maxParticipants: 25,
        isLocked: false,
        createdAt: new Date().toISOString(),
      };

      voiceRooms.set(room.id, room);
      
      // Add creator as first participant
      const participant = {
        id: nanoid(),
        roomId: room.id,
        userId: input.userId,
        joinedAt: new Date().toISOString(),
        isMuted: false,
        isDeafened: false,
        isStreaming: false,
      };
      voiceParticipants.set(`${room.id}:${input.userId}`, participant);

      res.status(201).json({ room, participant });
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      console.error("Create Voice Room Error:", err);
      res.status(500).json({ message: "Failed to create voice room" });
    }
  });

  // Get voice room by ID
  app.get("/api/voice/rooms/:roomId", async (req, res) => {
    try {
      const { roomId } = req.params;
      const room = voiceRooms.get(roomId);
 voiceRooms.get(roomId);
      
      if (!room) {
        return res.status(404).json({ message: "Voice room not found" });
      }
      
      // Get participants
      const participants = [];
      for (const [key, participant] of voiceParticipants.entries()) {
        if (key.startsWith(roomId)) {
          participants.push(participant);
        }
      }
      
      res.json({ ...room, participants });
    } catch (err) {
      console.error("Get Voice Room Error:", err);
      res.status(500).json({ message: "Failed to get voice room" });
    }
  });

  // Get all voice rooms for a channel
  app.get("/api/voice/channels/:channelId/rooms", async (req, res) => {
    try {
      const { channelId } = req.params;
      
      const rooms = [];
      for (const [roomId, room] of voiceRooms.entries()) {
        if (room.channelId === channelId) {
          // Get participant count
          let participantCount = 0;
          for (const [key] of voiceParticipants.entries()) {
            if (key.startsWith(roomId)) {
              participantCount++;
            }
          }
          rooms.push({ ...room, participantCount });
        }
      }
      
      res.json(rooms);
    } catch (err) {
      console.error("Get Voice Rooms Error:", err);
      res.status(500).json({ message: "Failed to get voice rooms" });
    }
  });

  // Join a voice room
  app.post("/api/voice/rooms/:roomId/join", async (req, res) => {
    const schema = z.object({
      userId: z.string().min(1),
    });

    try {
      const { roomId } = req.params;
      const input = schema.parse(req.body);
      
      const room = voiceRooms.get(roomId);
      if (!room) {
        return res.status(404).json({ message: "Voice room not found" });
      }
      
      if (room.isLocked) {
        return res.status(403).json({ message: "Voice room is locked" });
      }
      
      // Check max participants
      let participantCount = 0;
      for (const [key] of voiceParticipants.entries()) {
        if (key.startsWith(roomId)) {
          participantCount++;
        }
      }
      
      if (participantCount >= room.maxParticipants) {
        return res.status(403).json({ message: "Voice room is full" });
      }
      
      // Check if already in room
      const existingKey = `${roomId}:${input.userId}`;
      if (voiceParticipants.has(existingKey)) {
        const existing = voiceParticipants.get(existingKey);
        return res.json({ room, participant: existing });
      }
      
      const participant = {
        id: nanoid(),
        roomId,
        userId: input.userId,
        joinedAt: new Date().toISOString(),
        isMuted: false,
        isDeafened: false,
        isStreaming: false,
      };
      voiceParticipants.set(existingKey, participant);

      res.status(201).json({ room, participant });
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      console.error("Join Voice Room Error:", err);
      res.status(500).json({ message: "Failed to join voice room" });
    }
  });

  // Leave a voice room
  app.post("/api/voice/rooms/:roomId/leave", async (req, res) => {
    const schema = z.object({
      userId: z.string().min(1),
    });

    try {
      const { roomId } = req.params;
      const input = schema.parse(req.body);
      
      const key = `${roomId}:${input.userId}`;
      if (!voiceParticipants.has(key)) {
        return res.status(404).json({ message: "Not in voice room" });
      }
      
      voiceParticipants.delete(key);
      
      // Check if room is empty, delete it
      let hasParticipants = false;
      for (const [k] of voiceParticipants.entries()) {
        if (k.startsWith(roomId)) {
          hasParticipants = true;
          break;
        }
      }
      
      if (!hasParticipants) {
        voiceRooms.delete(roomId);
      }
      
      res.json({ success: true });
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      console.error("Leave Voice Room Error:", err);
      res.status(500).json({ message: "Failed to leave voice room" });
    }
  });

  // Update participant state (mute, deaf, stream)
  app.patch("/api/voice/participants/:roomId/:userId", async (req, res) => {
    const schema = z.object({
      isMuted: z.boolean().optional(),
      isDeafened: z.boolean().optional(),
      isStreaming: z.boolean().optional(),
    });

    try {
      const { roomId, userId } = req.params;
      const input = schema.parse(req.body);
      
      const key = `${roomId}:${userId}`;
      const participant = voiceParticipants.get(key);
      
      if (!participant) {
        return res.status(404).json({ message: "Participant not found" });
      }
      
      const updatedParticipant = {
        ...participant,
        ...input,
        updatedAt: new Date().toISOString(),
      };
      
      voiceParticipants.set(key, updatedParticipant);
      res.json(updatedParticipant);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      console.error("Update Participant Error:", err);
      res.status(500).json({ message: "Failed to update participant" });
    }
  });

  // Lock/unlock voice room
  app.patch("/api/voice/rooms/:roomId/lock", async (req, res) => {
    const schema = z.object({
      locked: z.boolean(),
    });

    try {
      const { roomId } = req.params;
      const input = schema.parse(req.body);
      
      const room = voiceRooms.get(roomId);
      if (!room) {
        return res.status(404).json({ message: "Voice room not found" });
      }
      
      room.isLocked = input.locked;
      room.updatedAt = new Date().toISOString();
      voiceRooms.set(roomId, room);
      
      res.json(room);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      console.error("Lock Voice Room Error:", err);
      res.status(500).json({ message: "Failed to lock voice room" });
    }
  });

  // Get room participants
  app.get("/api/voice/rooms/:roomId/participants", async (req, res) => {
    try {
      const { roomId } = req.params;
      
      const participants = [];
      for (const [key, participant] of voiceParticipants.entries()) {
        if (key.startsWith(roomId)) {
          participants.push(participant);
        }
      }
      
      res.json(participants);
    } catch (err) {
      console.error("Get Participants Error:", err);
      res.status(500).json({ message: "Failed to get participants" });
    }
  });

  // WebRTC signaling endpoint (exchange SDP offers/answers)
  app.post("/api/voice/signaling", async (req, res) => {
    const schema = z.object({
      roomId: z.string().min(1),
      fromUserId: z.string().min(1),
      toUserId: z.string().min(1),
      sdp: z.string().optional(), // Session Description Protocol
      iceCandidate: z.string().optional(), // ICE candidate
      type: z.enum(['offer', 'answer', 'ice-candidate']),
    });

    try {
      const input = schema.parse(req.body);
      
      // In a production app, this would use WebSockets for real-time signaling
      // For now, we store the signaling data for polling
      const signalKey = `${input.roomId}:${input.fromUserId}:${input.toUserId}`;
      
      const signalData = {
        type: input.type,
        sdp: input.sdp,
        iceCandidate: input.iceCandidate,
        timestamp: new Date().toISOString(),
      };
      
      // Store signal (would typically be sent via WebSocket in production)
      // For now, clients can poll for signals
      
      res.json({ success: true, signal: signalData });
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      console.error("Signaling Error:", err);
      res.status(500).json({ message: "Failed to process signaling" });
    }
  });
}
