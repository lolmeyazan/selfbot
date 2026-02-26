class DiscordClientManager {
  private client: any = null;
  private readyPromise: Promise<void> | null = null;

  async getClient(token: string) {
    if (this.client) return this.client;

    const { Client } = await import('discord.js-selfbot-v13');
    
    // @ts-ignore - discord.js-selfbot-v13 may not have proper types
    this.client = new Client();

    this.readyPromise = new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('Login timeout')), 10000);
      
      this.client.once('ready', () => {
        clearTimeout(timeout);
        console.log(`✅ Logged in as ${this.client.user?.tag}`);
        resolve();
      });

      this.client.once('error', reject);
    });

    await this.client.login(token);
    await this.readyPromise;
    return this.client;
  }

  cleanup() {
    if (this.client) {
      this.client.destroy();
      this.client = null;
      this.readyPromise = null;
    }
  }

  isConnected() {
    return this.client !== null && this.client.isReady();
  }

  getUser() {
    return this.client?.user;
  }
}

export const discordManager = new DiscordClientManager();