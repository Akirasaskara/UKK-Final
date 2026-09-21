import { z } from 'zod';

export const successEnvelopeSchema = z
  .object({
    status: z.union([z.literal(true), z.boolean()]).transform(() => true as const),
    statusCode: z.coerce.number(),
    message: z.string().optional().default('OK'),
    data: z.unknown(),
    timestamp: z.string().optional().default(() => new Date().toISOString()),
  })
  .passthrough();

export const errorEnvelopeSchema = z.object({
  status: z.literal(false),
  statusCode: z.number(),
  message: z.string(),
  error: z.string().optional(),
  timestamp: z.string().optional(),
});

export type SuccessEnvelope<T = unknown> = {
  status: true;
  statusCode: number;
  message: string;
  data: T;
  timestamp: string;
};

export type ErrorEnvelope = z.infer<typeof errorEnvelopeSchema>;
