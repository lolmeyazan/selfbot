import { NextApiRequest, NextApiResponse } from 'next';

const DISCORD_API_BASE = 'https://discord.com/api/v9';
const VOICE_CHANNEL_TYPES = new Set([2, 13]); // 2 = voice, 13 = stage

function asTrimmedString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

async function parseDiscordErrorBody(response: Response): Promise<string | undefined> {
  try {
    const data = await response.json();
    if (typeof data?.message === 'string' && data.message) return data.message;
    return JSON.stringify(data);
  } catch {
    try {
      const text = await response.text();
      return text || undefined;
    } catch {
      return undefined;
    }
  }
}

async function discordRequest(
  endpoint: string,
  token: string,
  init: RequestInit = {}
): Promise<Response> {
  return fetch(`${DISCORD_API_BASE}${endpoint}`, {
    ...init,
    headers: {
      Authorization: token,
      'Content-Type': 'application/json',
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
      ...(init.headers || {}),
    },
  });
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const token = asTrimmedString(req.body?.token);
    const enabled = Boolean(req.body?.enabled);
    const guildId = asTrimmedString(req.body?.guildId);
    const voiceChannelId = asTrimmedString(req.body?.voiceChannelId);

    if (!token) {
      return res.status(400).json({ error: 'Token is required' });
    }

    if (!enabled) {
      if (guildId) {
        await discordRequest(`/guilds/${guildId}/voice-states/@me`, token, {
          method: 'PATCH',
          body: JSON.stringify({ channel_id: null }),
        });
      }

      return res.status(200).json({ success: true, message: 'AFK Voice disabled' });
    }

    if (!guildId || !voiceChannelId) {
      return res.status(400).json({ error: 'Guild ID and Voice Channel ID are required' });
    }

    const channelRes = await discordRequest(`/channels/${voiceChannelId}`, token);
    if (!channelRes.ok) {
      const details = await parseDiscordErrorBody(channelRes);
      return res.status(channelRes.status).json({
        error: 'Failed to fetch channel',
        details,
        discordStatus: channelRes.status,
      });
    }
    const channel = await channelRes.json();

    if (!VOICE_CHANNEL_TYPES.has(channel.type)) {
      return res.status(400).json({
        error: `Channel type ${channel.type} is not voice/stage`,
      });
    }

    if (channel.guild_id && channel.guild_id !== guildId) {
      return res.status(400).json({ error: 'Voice channel does not belong to provided guild' });
    }

    const guildRes = await discordRequest(`/guilds/${guildId}`, token);
    if (!guildRes.ok) {
      const details = await parseDiscordErrorBody(guildRes);
      return res.status(guildRes.status).json({
        error: 'Failed to fetch guild',
        details,
        discordStatus: guildRes.status,
      });
    }
    const guild = await guildRes.json();

    const joinRes = await discordRequest(`/guilds/${guildId}/voice-states/@me`, token, {
      method: 'PATCH',
      body: JSON.stringify({
        channel_id: voiceChannelId,
        self_mute: true,
        self_deaf: true,
      }),
    });

    if (!joinRes.ok) {
      const details = await parseDiscordErrorBody(joinRes);
      return res.status(joinRes.status).json({
        error: 'Failed to join voice channel',
        details,
        discordStatus: joinRes.status,
      });
    }

    return res.status(200).json({
      success: true,
      message: `AFK enabled in #${channel.name}`,
      channel: channel.name,
      guild: guild.name,
    });
  } catch (error) {
    console.error('AFK Voice API error:', error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to enable AFK Voice',
    });
  }
}
