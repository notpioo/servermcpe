import { z } from 'zod';
import { insertServerSchema, servers } from './schema';

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
  servers: {
    list: {
      method: 'GET' as const,
      path: '/api/servers',
      responses: {
        200: z.array(z.custom<typeof servers.$inferSelect>()),
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/servers',
      input: insertServerSchema,
      responses: {
        201: z.custom<typeof servers.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/servers/:id',
      responses: {
        200: z.custom<typeof servers.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
    action: {
      method: 'POST' as const,
      path: '/api/servers/:id/action',
      input: z.object({
        action: z.enum(['start', 'stop', 'restart'])
      }),
      responses: {
        200: z.custom<typeof servers.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/servers/:id',
      responses: {
        204: z.void(),
        404: errorSchemas.notFound,
      },
    }
  },
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
