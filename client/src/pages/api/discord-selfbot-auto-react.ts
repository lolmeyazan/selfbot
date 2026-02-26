import { NextApiRequest, NextApiResponse } from 'next';

// Store active auto-react instances (in production, use a database)
const activeAutoReacts = new Map();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { token, enabled, guildId, channelId, emojis, ignoreBots } = req.body;

    if (!token) {
      return res.status(400).json({ error: 'Token is required' });
    }

    if (enabled && (!guildId || !channelId)) {
      return res.status(400).json({ error: 'Guild ID and Channel ID are required' });
    }

    // If disabling, remove the auto-react instance
    if (!enabled) {
      const instanceId = `${token.slice(-10)}-${guildId}-${channelId}`;
      if (activeAutoReacts.has(instanceId)) {
        // Clean up any intervals/listeners
        clearInterval(activeAutoReacts.get(instanceId));
        activeAutoReacts.delete(instanceId);
      }
      return res.status(200).json({ success: true, message: 'Auto React disabled' });
    }

    // Create a unique ID for this auto-react instance
    const instanceId = `${token.slice(-10)}-${guildId}-${channelId}`;
    
    // If already running, clean up old instance
    if (activeAutoReacts.has(instanceId)) {
      clearInterval(activeAutoReacts.get(instanceId));
    }

    // Store the config
    activeAutoReacts.set(instanceId, {
      token,
      guildId,
      channelId,
      emojis: emojis || '👍',
      ignoreBots,
      lastMessageId: null
    });

    // In a real implementation, you would:
    // 1. Connect to Discord Gateway using the token
    // 2. Listen for MESSAGE_CREATE events in the specified channel
    // 3. Auto-react to messages
    
    // For now, we'll just acknowledge the configuration
    console.log(`Auto React configured for guild ${guildId}, channel ${channelId}`);

    res.status(200).json({ 
      success: true, 
      message: 'Auto React configured successfully',
      config: { guildId, channelId, emojis, ignoreBots }
    });

  } catch (error) {
    console.error('Auto React error:', error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Failed to configure auto react' 
    });
  }
}