import { z } from 'zod';

const envelopeSchema = z
  .object({
    status: z.union([z.literal(true), z.boolean()]).transform(() => true as const),
    statusCode: z.coerce.number(),
    message: z.string().optional().default('OK'),
    data: z.unknown(),
    timestamp: z.string().optional().default(() => new Date().toISOString()),
  })
  .passthrough();

const metaSchema = z.object({
  page: z.number(),
  limit: z.number(),
  total: z.number(),
  total_pages: z.number(),
});

const paginatedSchema = z.object({
  items: z.array(z.unknown()),
  meta: metaSchema,
}).passthrough();

export type SuccessEnvelope = z.infer<typeof envelopeSchema>;

export function parseSuccessEnvelope(body: unknown): SuccessEnvelope | null {
  const parsed = envelopeSchema.safeParse(body);
  return parsed.success ? parsed.data : null;
}

export function normalizePaginatedEnvelope(
  body: unknown,
  page: number,
  limit: number,
  normalizeItem: (item: unknown) => unknown,
): SuccessEnvelope | null {
  const envelope = parseSuccessEnvelope(body);
  if (!envelope) return null;

  const paginated = paginatedSchema.safeParse(envelope.data);
  if (paginated.success) {
    return {
      ...envelope,
      data: {
        ...paginated.data,
        items: paginated.data.items.map(normalizeItem),
      },
    };
  }

  if (!Array.isArray(envelope.data)) return null;

  const total = envelope.data.length;
  const start = (page - 1) * limit;
  const items = envelope.data.slice(start, start + limit).map(normalizeItem);
  return {
    ...envelope,
    data: {
      items,
      meta: {
        page,
        limit,
        total,
        total_pages: Math.max(1, Math.ceil(total / limit)),
      },
    },
  };
}

export function normalizeSpaceItem(item: unknown): unknown {
  if (!item || typeof item !== 'object') return item;
  const value = item as Record<string, unknown>;
  return {
    ...value,
    foto_url: typeof value.foto_url === 'string' ? value.foto_url : null,
  };
}

export function normalizeMemberItem(item: unknown): unknown {
  if (!item || typeof item !== 'object') return item;
  const value = item as Record<string, unknown>;
  return {
    ...value,
    foto_url: typeof value.foto_url === 'string' ? value.foto_url : null,
  };
}

export function normalizePromotionItem(item: unknown, now = new Date()): unknown {
  if (!item || typeof item !== 'object') return item;
  const value = item as Record<string, unknown>;
  if (value.status === 'upcoming' || value.status === 'active' || value.status === 'expired') {
    return value;
  }

  const start = new Date(String(value.tanggal_awal));
  const end = new Date(String(value.tanggal_akhir));
  const status = now < start ? 'upcoming' : now > end ? 'expired' : 'active';
  return { ...value, status };
}
