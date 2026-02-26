/**
 * AFK Voice Handler for Cloudflare Pages
 * Controls AFK voice state on Discord
 */

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

async function discordRequest(endpoint: string, token: string, init: RequestInit = {}): Promise<Response> {
  return fetch(`${DISCORD_API_BASE}${endpoint}`, {
    ...init,
    headers: {
      Authorization: token,
      'Content-Type': 'application/json',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
      ...(init.headers || {}),
    },
  });
}

function createResponse(data: unknown, status: number = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    }
  });
}

export async function onRequestPost(context: { request: Request }): Promise<Response> {
  try {
    const { request } = context;
    const body = await request.json();
    
    const token = asTrimmedString(body?.token);
    const enabled = Boolean(body?.enabled);
    const guildId = asTrimmedString(body?.guildId);
    const voiceChannelId = asTrimmedString(body?.voiceChannelId);

    if (!token) {
      return createResponse({ error: 'Token is required' }, 400);
    }

    if (!enabled) {
      if (guildId) {
        await discordRequest(`/guilds/${guildId}/voice-states/@me`, token, {
          method: 'PATCH',
          body: JSON.stringify({ channel_id: null }),
        });
      }

      return createResponse({ success: true, message: 'AFK Voice disabled' });
    }

    if (!guildId || !voiceChannelId) {
      return createResponse({ error: 'Guild ID and Voice Channel ID are required' }, 400);
    }

    const channelRes = await discordRequest(`/channels/${voiceChannelId}`, token);
    if (!channelRes.ok) {
      const details = await parseDiscordErrorBody(channelRes);
      return createResponse({
        error: 'Failed to fetch channel',
        details,
        discordStatus: channelRes.status,
      }, channelRes.status);
    }
    
    const channel = await channelRes.json();

    if (!VOICE_CHANNEL_TYPES.has(channel.type)) {
      return createResponse({
        error: `Channel type ${channel.type} is not voice/stage`,
      }, 400);
    }

    // Connect to the voice channel
    const voiceStateRes = await discordRequest(`/guilds/${guildId}/voice-states/@me`, token, {
      method: 'PATCH',
      body: JSON.stringify({
        channel_id: voiceChannelId,
      }),
    });

    if (!voiceStateRes.ok) {
      const details = await parseDiscordErrorBody(voiceStateRes);
      return createResponse({
        error: 'Failed to join voice channel',
        details,
        discordStatus: voiceStateRes.status,
      }, voiceStateRes.status);
    }

    return createResponse({ 
      success: true, 
      message: 'AFK Voice enabled',
      channel: {
        id: channel.id,
        name: channel.name,
        type: channel.type
      }
    });

  } catch (error) {
    console.error('AFK Voice error:', error);
    return createResponse({ 
      error: 'Internal Server Error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
}

export async function onRequestOptions(): Promise<Response> {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400'
    }
  });
}
