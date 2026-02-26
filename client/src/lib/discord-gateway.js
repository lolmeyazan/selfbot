// lib/discord-gateway.js
import WebSocket from 'ws';

class DiscordGatewayManager {
  constructor() {
    this.connections = new Map();
  }

  async createAutoReact(config) {
    const connectionId = `${config.token.slice(-10)}-${config.guildId}-${config.channelId}`;
    
    // Get gateway URL
    const gatewayRes = await fetch('https://discord.com/api/gateway');
    const { url } = await gatewayRes.json();
    
    const ws = new WebSocket(`${url}?v=9&encoding=json`);
    
    ws.on('open', () => {
      // Identify with Discord
      ws.send(JSON.stringify({
        op: 2,
        d: {
          token: config.token,
          properties: {
            $os: 'linux',
            $browser: 'chrome',
            $device: 'chrome'
          },
          intents: 513 // GUILD_MESSAGES intent
        }
      }));
    });

    ws.on('message', (data) => {
      const packet = JSON.parse(data);
      
      switch (packet.op) {
        case 10: // Hello
          // Start heartbeat
          const heartbeatInterval = setInterval(() => {
            ws.send(JSON.stringify({ op: 1, d: null }));
          }, packet.d.heartbeat_interval);
          
          this.connections.set(connectionId, {
            ws,
            heartbeatInterval,
            token: config.token,
            guildId: config.guildId,
            channelId: config.channelId,
            emojis: config.emojis.split(',').map(e => e.trim()),
            ignoreBots: config.ignoreBots
          });
          break;

        case 0: // Dispatch
          if (packet.t === 'MESSAGE_CREATE') {
            this.handleMessage(connectionId, packet.d);
          }
          break;

        case 11: // Heartbeat ACK
          // Heartbeat acknowledged
          break;
      }
    });

    ws.on('error', (error) => {
      console.error('Gateway error:', error);
      this.disconnect(connectionId);
    });

    ws.on('close', () => {
      this.disconnect(connectionId);
    });
  }

  async handleMessage(connectionId, message) {
    const connection = this.connections.get(connectionId);
    if (!connection) return;

    // Check if message is in the correct channel
    if (message.channel_id !== connection.channelId) return;

    // Check if we should ignore bots
    if (connection.ignoreBots && message.author.bot) return;

    // Add reactions
    for (const emoji of connection.emojis) {
      try {
        await fetch(`https://discord.com/api/v9/channels/${message.channel_id}/messages/${message.id}/reactions/${encodeURIComponent(emoji)}/@me`, {
          method: 'PUT',
          headers: {
            Authorization: connection.token
          }
        });
      } catch (error) {
        console.error('Failed to add reaction:', error);
      }
    }
  }

  disconnect(connectionId) {
    const connection = this.connections.get(connectionId);
    if (connection) {
      clearInterval(connection.heartbeatInterval);
      connection.ws.close();
      this.connections.delete(connectionId);
    }
  }
}

export const gatewayManager = new DiscordGatewayManager();
