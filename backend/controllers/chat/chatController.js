import { chatMessageBodySchema, chatSessionParamsSchema } from '../../schemaValidations/chatSchema.js';
import { detectLanguage } from '../../services/chat/detectLanguage.js';
import {
  appendExchange,
  getSessionMessages,
  clearSession,
} from '../../services/chat/chatHistoryStore.js';
import { createChatCompletion } from '../../services/chat/llmChat.js';
import {
  assertWithinRateLimit,
  recordSuccessfulUserMessage,
  clearRateForSession,
} from '../../services/chat/chatRateLimiter.js';

/**
 * POST /api/chat/message
 * Envía un mensaje del usuario, mantiene historial en memoria y devuelve la respuesta del modelo.
 */
export async function postChatMessage(req, res) {
  try {
    const parsed = chatMessageBodySchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        ok: false,
        error: 'VALIDATION_ERROR',
        details: parsed.error.flatten(),
      });
    }

    const { sessionId, message, languageMode } = parsed.data;

    assertWithinRateLimit(sessionId);

    const activeLanguage =
      languageMode === 'auto' ? detectLanguage(message) : languageMode;

    const history = getSessionMessages(sessionId);

    const reply = await createChatCompletion({
      history,
      userMessage: message,
      activeLanguage,
    });

    appendExchange(sessionId, message, reply);
    recordSuccessfulUserMessage(sessionId);

    return res.status(200).json({
      ok: true,
      reply,
      detectedLanguage: activeLanguage,
      sessionId,
    });
  } catch (error) {
    if (error?.code === 'MISSING_LLM_CONFIG') {
      return res.status(503).json({
        ok: false,
        error: 'CHAT_NOT_CONFIGURED',
        message: error.message || 'Falta configurar el proveedor de IA en el servidor.',
      });
    }

    if (error?.code === 'CHAT_RATE_LIMIT') {
      return res.status(429).json({
        ok: false,
        error: 'CHAT_RATE_LIMIT',
        message: error.message || 'Límite de mensajes alcanzado. Intenta más tarde.',
      });
    }

    if (error?.code === 'LLM_QUOTA_EXCEEDED') {
      return res.status(503).json({
        ok: false,
        error: 'LLM_QUOTA_EXCEEDED',
        message:
          error.message ||
          'El proveedor de IA no aceptó la petición por cuota o facturación.',
      });
    }

    if (error?.code === 'LLM_AUTH_ERROR') {
      return res.status(502).json({
        ok: false,
        error: 'LLM_AUTH_ERROR',
        message: error.message || 'Clave de API inválida.',
      });
    }

    if (error?.code === 'LLM_HTTP_ERROR') {
      return res.status(502).json({
        ok: false,
        error: 'UPSTREAM_AI_ERROR',
        message: error.message || 'No se pudo obtener respuesta del proveedor de IA.',
      });
    }

    if (error?.code === 'LLM_EMPTY_REPLY') {
      return res.status(502).json({
        ok: false,
        error: 'UPSTREAM_AI_ERROR',
        message: error.message || 'Respuesta vacía del proveedor de IA.',
      });
    }

    console.error('[chat] postChatMessage', error);
    return res.status(500).json({
      ok: false,
      error: 'INTERNAL_ERROR',
      message: 'Ocurrió un error al procesar el mensaje.',
    });
  }
}

/**
 * GET /api/chat/history/:sessionId
 * Devuelve el historial temporal guardado en memoria para esa sesión.
 */
export function getChatHistory(req, res) {
  const parsed = chatSessionParamsSchema.safeParse({ sessionId: req.params.sessionId });
  if (!parsed.success) {
    return res.status(400).json({
      ok: false,
      error: 'VALIDATION_ERROR',
      details: parsed.error.flatten(),
    });
  }

  const messages = getSessionMessages(parsed.data.sessionId);
  return res.status(200).json({ ok: true, messages });
}

/**
 * DELETE /api/chat/history/:sessionId
 * Limpia la conversación en el servidor (opcional para "nuevo chat").
 */
export function deleteChatHistory(req, res) {
  const parsed = chatSessionParamsSchema.safeParse({ sessionId: req.params.sessionId });
  if (!parsed.success) {
    return res.status(400).json({
      ok: false,
      error: 'VALIDATION_ERROR',
      details: parsed.error.flatten(),
    });
  }

  const sid = parsed.data.sessionId;
  clearSession(sid);
  clearRateForSession(sid);
  return res.status(200).json({ ok: true, message: 'Historial eliminado en el servidor.' });
}
