export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { 
      token, 
      enabled, 
      sourceGuildId, 
      targetGuildId, 
      copyEmojis, 
      copyRoles, 
      copyChannels, 
      copyName 
    } = req.body;

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
      return res.status(400).json({ error: 'Token is required' });
    }

    if (!enabled) {
      return res.status(200).json({ 
        success: true, 
        message: 'Server Copy disabled' 
      });
    }

    if (!sourceGuildId || !targetGuildId) {
      return res.status(400).json({ 
        error: 'Source and Target Server IDs are required' 
      });
    }

    if (sourceGuildId === targetGuildId) {
      return res.status(400).json({ 
        error: 'Source and Target servers must be different' 
      });
    }

    // التحقق من وجود السيرفر المصدر
    const sourceRes = await fetch(`https://discord.com/api/v9/guilds/${sourceGuildId}`, {
      headers: {
        'Authorization': token,
        'Content-Type': 'application/json'
      }
    });

    if (!sourceRes.ok) {
      if (sourceRes.status === 404) {
        return res.status(400).json({ error: 'Source server not found' });
      } else if (sourceRes.status === 403) {
        return res.status(400).json({ error: 'No access to source server' });
      } else {
        return res.status(400).json({ error: `Source server check failed (${sourceRes.status})` });
      }
    }

    const sourceGuild = await sourceRes.json();

    // التحقق من وجود السيرفر الهدف
    const targetRes = await fetch(`https://discord.com/api/v9/guilds/${targetGuildId}`, {
      headers: {
        'Authorization': token,
        'Content-Type': 'application/json'
      }
    });

    if (!targetRes.ok) {
      if (targetRes.status === 404) {
        return res.status(400).json({ error: 'Target server not found' });
      } else if (targetRes.status === 403) {
        return res.status(400).json({ error: 'No access to target server' });
      } else {
        return res.status(400).json({ error: `Target server check failed (${targetRes.status})` });
      }
    }

    const targetGuild = await targetRes.json();

    console.log(`📋 Copying from ${sourceGuild.name} to ${targetGuild.name}`);

    const results = {
      name: false,
      emojis: [],
      roles: [],
      channels: []
    };

    // 1. نسخ اسم السيرفر
    if (copyName && sourceGuild.name !== targetGuild.name) {
      try {
        await fetch(`https://discord.com/api/v9/guilds/${targetGuildId}`, {
          method: 'PATCH',
          headers: {
            'Authorization': token,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ name: sourceGuild.name })
        });
        results.name = true;
      } catch (error) {
        console.error('Failed to copy server name:', error);
      }
    }

    // 2. نسخ الرموز (emojis)
    if (copyEmojis && sourceGuild.emojis?.length > 0) {
      for (const emoji of sourceGuild.emojis) {
        try {
          // نسخ الرمز إذا كان مخصص ومو animated
          await fetch(`https://discord.com/api/v9/guilds/${targetGuildId}/emojis`, {
            method: 'POST',
            headers: {
              'Authorization': token,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              name: emoji.name,
              image: `data:image/${emoji.animated ? 'gif' : 'png'};base64,${emoji.image || ''}`
            })
          });
          results.emojis.push(emoji.name);
        } catch (error) {
          console.error(`Failed to copy emoji ${emoji.name}:`, error);
        }
      }
    }

    // 3. نسخ الرتب
    if (copyRoles && sourceGuild.roles?.length > 0) {
      // نرتب الرتب عشان ننسخها بالترتيب الصحيح
      const sortedRoles = sourceGuild.roles
        .filter((r) => r.name !== '@everyone')
        .sort((a, b) => b.position - a.position);

      for (const role of sortedRoles) {
        try {
          await fetch(`https://discord.com/api/v9/guilds/${targetGuildId}/roles`, {
            method: 'POST',
            headers: {
              'Authorization': token,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              name: role.name,
              color: role.color,
              hoist: role.hoist,
              mentionable: role.mentionable,
              permissions: role.permissions
            })
          });
          results.roles.push(role.name);
        } catch (error) {
          console.error(`Failed to copy role ${role.name}:`, error);
        }
      }
    }

    // 4. نسخ القنوات
    if (copyChannels && sourceGuild.channels?.length > 0) {
      // ننسخ الكاتيجوريات أولاً
      const categories = sourceGuild.channels
        .filter((c) => c.type === 4)
        .sort((a, b) => a.position - b.position);

      // ثم القنوات العادية
      const otherChannels = sourceGuild.channels
        .filter((c) => c.type !== 4)
        .sort((a, b) => a.position - b.position);

      const createdCategories = new Map();

      // نسخ الكاتيجوريات
      for (const category of categories) {
        try {
          const res = await fetch(`https://discord.com/api/v9/guilds/${targetGuildId}/channels`, {
            method: 'POST',
            headers: {
              'Authorization': token,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              name: category.name,
              type: 4,
              permission_overwrites: category.permission_overwrites
            })
          });
          const data = await res.json();
          createdCategories.set(category.id, data.id);
          results.channels.push(category.name);
        } catch (error) {
          console.error(`Failed to copy category ${category.name}:`, error);
        }
      }

      // نسخ القنوات
      for (const channel of otherChannels) {
        try {
          const channelData = {
            name: channel.name,
            type: channel.type,
            permission_overwrites: channel.permission_overwrites,
            parent_id: createdCategories.get(channel.parent_id) || null
          };

          if (channel.type === 2) { // Voice channel
            channelData.bitrate = channel.bitrate;
            channelData.user_limit = channel.user_limit;
          } else if (channel.type === 0) { // Text channel
            channelData.topic = channel.topic || '';
            channelData.nsfw = channel.nsfw || false;
            channelData.rate_limit_per_user = channel.rate_limit_per_user || 0;
          }

          await fetch(`https://discord.com/api/v9/guilds/${targetGuildId}/channels`, {
            method: 'POST',
            headers: {
              'Authorization': token,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(channelData)
          });
          results.channels.push(channel.name);
        } catch (error) {
          console.error(`Failed to copy channel ${channel.name}:`, error);
        }
      }
    }

    return res.status(200).json({
      success: true,
      message: `✅ Server copy completed from ${sourceGuild.name} to ${targetGuild.name}`,
      source: sourceGuild.name,
      target: targetGuild.name,
      results: {
        nameCopied: results.name,
        emojisCopied: results.emojis.length,
        rolesCopied: results.roles.length,
        channelsCopied: results.channels.length
      }
    });

  } catch (error) {
    console.error('Server Copy error:', error);
    return res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Failed to copy server' 
    });
  }
}