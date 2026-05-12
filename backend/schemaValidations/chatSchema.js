import { z } from 'zod';

const uuidLike = z
  .string()
  .min(8)
  .max(64)
  .regex(/^[a-zA-Z0-9-]+$/, 'sessionId inválido');

export const chatMessageBodySchema = z.object({
  sessionId: uuidLike,
  message: z
    .string()
    .min(1, 'El mensaje no puede estar vacío')
    .max(2000, 'El mensaje es demasiado largo'),
  languageMode: z.enum(['auto', 'es', 'en']).default('auto'),
});

export const chatSessionParamsSchema = z.object({
  sessionId: uuidLike,
});
