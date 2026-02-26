import { z } from 'zod';
import { insertMessageTemplateSchema, messageTemplates, insertPresencePresetSchema, presencePresets } from "./schema.js";

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
      method: 'GET',
      path: '/api/message-templates',
      responses: {
        200: z.array(z.any()),
      },
    },
    create: {
      method: 'POST',
      path: '/api/message-templates',
      input: insertMessageTemplateSchema,
      responses: {
        201: z.any(),
        400: errorSchemas.validation,
      },
    }
  },
  presencePresets: {
    list: {
      method: 'GET',
      path: '/api/presence-presets',
      responses: {
        200: z.array(z.any()),
      },
    },
    create: {
      method: 'POST',
      path: '/api/presence-presets',
      input: insertPresencePresetSchema,
      responses: {
        201: z.any(),
        400: errorSchemas.validation,
      },
    }
  },
  discordProxy: {
    request: {
      method: 'POST',
      path: '/api/discord-proxy',
      input: z.object({
        method: z.string(),
        endpoint: z.string(),
        token: z.string(),
        body: z.any().optional(),
      }),
      responses: {
        200: z.any(),
        400: errorSchemas.validation,
        401: errorSchemas.internal,
        500: errorSchemas.internal,
      }
    }
  }
};

export function buildUrl(path, params) {
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
