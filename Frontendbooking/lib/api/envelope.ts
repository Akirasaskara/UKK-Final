import { z } from 'zod';

export const successEnvelopeSchema = z.object({
  status: z.literal(true),
  statusCode: z.number(),
  message: z.string(),
  data: z.unknown(),
  timestamp: z.string(),
});

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
