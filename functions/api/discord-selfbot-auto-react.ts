/**
 * Auto React Handler for Cloudflare Pages
 * Configures auto-react settings (actual reaction happens client-side)
 */

// In-memory storage for auto-react configs (Note: Workers have ephemeral storage)
// For production, use KV or D1 database
const autoReactConfigs = new Map<string, {
  token: string;
  guildId: string;
  channelId: string;
  emojis: string;
  ignoreBots: boolean;
}>();

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

export async function onRequestPost(context: { request: Request; env: Record<string, string> }): Promise<Response> {
  try {
    const { request } = context;
    const body = await request.json();
    
    const { token, enabled, guildId, channelId, emojis, ignoreBots } = body;

    if (!token) {
      return createResponse({ error: 'Token is required' }, 400);
    }

    if (enabled && (!guildId || !channelId)) {
      return createResponse({ error: 'Guild ID and Channel ID are required' }, 400);
    }

    // If disabling, remove the auto-react config
    if (!enabled) {
      const instanceId = `${token.slice(-10)}-${guildId}-${channelId}`;
      if (autoReactConfigs.has(instanceId)) {
        autoReactConfigs.delete(instanceId);
      }
      return createResponse({ success: true, message: 'Auto React disabled' });
    }

    // Create a unique ID for this auto-react instance
    const instanceId = `${token.slice(-10)}-${guildId}-${channelId}`;
    
    // Store the config
    autoReactConfigs.set(instanceId, {
      token,
      guildId,
      channelId,
      emojis: emojis || '👍',
      ignoreBots: ignoreBots ?? true
    });

    console.log(`Auto React configured for guild ${guildId}, channel ${channelId}`);

    return createResponse({ 
      success: true, 
      message: 'Auto React configured successfully',
      config: { guildId, channelId, emojis, ignoreBots }
    });

  } catch (error) {
    console.error('Auto React error:', error);
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
