/**
 * Discord Selfbot Presence Handler for Cloudflare Pages
 * Sets user status, activity, and custom status on Discord
 */

const DISCORD_API_BASE = 'https://discord.com/api/v9';

function asTrimmedString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

const VALID_STATUSES = new Set(['online', 'idle', 'dnd', 'invisible']);
const VALID_ACTIVITY_TYPES = new Set(['Playing', 'Streaming', 'Listening', 'Watching', 'Competing', 'Custom']);

const activityTypeMap: Record<string, string> = {
  Playing: 'PLAYING',
  Streaming: 'STREAMING',
  Listening: 'LISTENING',
  Watching: 'WATCHING',
  Competing: 'COMPETING',
  Custom: 'CUSTOM_STATUS'
};

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

// Handle OPTIONS preflight requests
export async function onRequestOptions(): Promise<Response> {
  return createResponse({}, 204);
}

export async function onRequestPost(context: { request: Request }): Promise<Response> {
  try {
    const { request } = context;
    const body = await request.json();
    
    const token = asTrimmedString(body?.token);
    const status = asTrimmedString(body?.status);
    const activity = body?.activity;
    const customStatus = asTrimmedString(body?.customStatus);

    // Validate token
    if (!token) {
      return createResponse({ error: 'Token is required' }, 400);
    }

    // Validate status
    if (status && !VALID_STATUSES.has(status)) {
      return createResponse({ error: 'Invalid status. Must be: online, idle, dnd, or invisible' }, 400);
    }

    // Validate activity type if provided
    if (activity && typeof activity === 'object') {
      const activityType = (activity as Record<string, unknown>)?.type as string | undefined;
      if (activityType && !VALID_ACTIVITY_TYPES.has(activityType)) {
        return createResponse({ error: 'Invalid activity type. Must be: Playing, Streaming, Listening, Watching, Competing, or Custom' }, 400);
      }
    }

    // Set user status
    if (status) {
      const statusResponse = await discordRequest('/users/@me/settings', token, {
        method: 'PATCH',
        body: JSON.stringify({ status: status })
      });

      if (!statusResponse.ok) {
        const errorText = await statusResponse.text();
        console.error('Failed to set status:', statusResponse.status, errorText);
        return createResponse({ error: 'Failed to set status', details: errorText }, statusResponse.status);
      }
    }

    // Set activity
    const activities: Array<{
      type: number;
      name?: string;
      url?: string;
    }> = [];

    if (activity && typeof activity === 'object') {
      const activityName = asTrimmedString((activity as Record<string, unknown>)?.name);
      const activityType = (activity as Record<string, unknown>)?.type as string | undefined;
      
      if (activityName && activityType) {
        const discordActivityType = activityTypeMap[activityType] || 'PLAYING';
        const typeNumber: Record<string, number> = {
          PLAYING: 0,
          STREAMING: 1,
          LISTENING: 2,
          WATCHING: 3,
          COMPETING: 5,
          CUSTOM_STATUS: 4
        };

        const activityObj: {
          type: number;
          name: string;
          url?: string;
        } = {
          type: typeNumber[discordActivityType] ?? 0,
          name: activityName
        };

        // Add URL for streaming
        if (activityType === 'Streaming') {
          const url = asTrimmedString((activity as Record<string, unknown>)?.url);
          if (url) {
            activityObj.url = url;
          }
        }

        activities.push(activityObj);
      }
    }

    // Set custom status
    if (customStatus) {
      // Custom status is set via the activities array with emoji
      activities.push({
        type: 4, // Custom status
        name: customStatus
      });
    }

    // Update presence
    const presenceResponse = await discordRequest('/users/@me/presence', token, {
      method: 'PATCH',
      body: JSON.stringify({
        status: status || 'online',
        activities: activities.length > 0 ? activities : undefined
      })
    });

    if (!presenceResponse.ok) {
      const errorText = await presenceResponse.text();
      console.error('Failed to set presence:', presenceResponse.status, errorText);
      return createResponse({ error: 'Failed to set presence', details: errorText }, presenceResponse.status);
    }

    return createResponse({ success: true, message: 'Presence updated successfully' });
  } catch (err) {
    console.error('Discord Selfbot Presence Error:', err);
    return createResponse({ 
      error: err instanceof Error ? err.message : 'Failed to set presence' 
    }, 500);
  }
}
