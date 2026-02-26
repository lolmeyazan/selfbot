import { z } from 'zod';
import { insertMessageTemplateSchema, messageTemplates, insertPresencePresetSchema, presencePresets } from './schema';

export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  internal: z.object({
    message: z.string(),
  }),
};

export const api = {
  messageTemplates: {
    list: {
      method: 'GET' as const,
      path: '/api/message-templates' as const,
      responses: {
        200: z.array(z.custom<typeof messageTemplates.$inferSelect>()),
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/message-templates' as const,
      input: insertMessageTemplateSchema,
      responses: {
        201: z.custom<typeof messageTemplates.$inferSelect>(),
        400: errorSchemas.validation,
      },
    }
  },
  presencePresets: {
    list: {
      method: 'GET' as const,
      path: '/api/presence-presets' as const,
      responses: {
        200: z.array(z.custom<typeof presencePresets.$inferSelect>()),
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/presence-presets' as const,
      input: insertPresencePresetSchema,
      responses: {
        201: z.custom<typeof presencePresets.$inferSelect>(),
        400: errorSchemas.validation,
      },
    }
  },
  discordProxy: {
    request: {
      method: 'POST' as const,
      path: '/api/discord-proxy' as const,
      input: z.object({
        method: z.string(),
        endpoint: z.string(),
        token: z.string(),
        body: z.any().optional(),
      }),
      responses: {
        200: z.any(),
        400: errorSchemas.validation,
        401: errorSchemas.internal, // mock auth failure
        500: errorSchemas.internal,
      }
    }
  }
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}

export type MessageTemplateInput = z.infer<typeof api.messageTemplates.create.input>;
export type PresencePresetInput = z.infer<typeof api.presencePresets.create.input>;
export type DiscordProxyInput = z.infer<typeof api.discordProxy.request.input>;
