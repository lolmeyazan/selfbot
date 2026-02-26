/**
 * Server Copy Handler for Cloudflare Pages
 * Copies server (guild) settings between Discord servers
 */

const DISCORD_API_BASE = 'https://discord.com/api/v9';

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
    
    const { 
      token, 
      enabled, 
      sourceGuildId, 
      targetGuildId, 
      copyEmojis, 
      copyRoles, 
      copyChannels, 
      copyName 
    } = body;

    console.log('📋 Server Copy Request:', {
      enabled,
      sourceGuildId,
      targetGuildId,
      copyEmojis,
      copyRoles,
      copyChannels,
      copyName,
      hasToken: !!token
    });

    if (!token) {
      return createResponse({ error: 'Token is required' }, 400);
    }

    if (!enabled) {
      return createResponse({ 
        success: true, 
        message: 'Server Copy disabled' 
      });
    }

    if (!sourceGuildId || !targetGuildId) {
      return createResponse({ 
        error: 'Source and Target Server IDs are required' 
      }, 400);
    }

    if (sourceGuildId === targetGuildId) {
      return createResponse({ 
        error: 'Source and Target servers must be different' 
      }, 400);
    }

    // Check if source server exists and is accessible
    const sourceRes = await fetch(`${DISCORD_API_BASE}/guilds/${sourceGuildId}`, {
      headers: {
        'Authorization': token,
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    if (!sourceRes.ok) {
      if (sourceRes.status === 404) {
        return createResponse({ error: 'Source server not found' }, 400);
      } else if (sourceRes.status === 403) {
        return createResponse({ error: 'No access to source server' }, 400);
      } else {
        return createResponse({ error: `Source server check failed (${sourceRes.status})` }, 400);
      }
    }

    const sourceGuild = await sourceRes.json();

    // Check if target server exists and is accessible
    const targetRes = await fetch(`${DISCORD_API_BASE}/guilds/${targetGuildId}`, {
      headers: {
        'Authorization': token,
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    if (!targetRes.ok) {
      if (targetRes.status === 404) {
        return createResponse({ error: 'Target server not found' }, 400);
      } else if (targetRes.status === 403) {
        return createResponse({ error: 'No access to target server' }, 400);
      } else {
        return createResponse({ error: `Target server check failed (${targetRes.status})` }, 400);
      }
    }

    const targetGuild = await targetRes.json();

    // Return the server info for the client to proceed with copying
    // Note: Actual copying is done client-side since Cloudflare Workers can't maintain
    // persistent connections needed for Discord Gateway
    return createResponse({
      success: true,
      message: 'Server copy configuration validated',
      sourceServer: {
        id: sourceGuild.id,
        name: sourceGuild.name,
        icon: sourceGuild.icon,
        features: sourceGuild.features
      },
      targetServer: {
        id: targetGuild.id,
        name: targetGuild.name,
        icon: targetGuild.icon,
        features: targetGuild.features
      },
      options: {
        copyEmojis,
        copyRoles,
        copyChannels,
        copyName
      }
    });

  } catch (error) {
    console.error('Server Copy error:', error);
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
