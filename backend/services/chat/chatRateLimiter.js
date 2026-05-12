/**
 * Límite simple por sesión de chat (en memoria; se reinicia al reiniciar el servidor).
 * Protege costes y abuso además de los límites del proveedor gratuito.
 */

const WINDOW_MS = 60 * 60 * 1000; // 1 hora

function maxPerHour() {
  const n = parseInt(process.env.CHAT_MAX_MSG_PER_HOUR_PER_SESSION || '40', 10);
  if (Number.isNaN(n) || n < 1) return 40;
  return Math.min(n, 500);
}

const buckets = new Map();

function getBucket(sessionId) {
  const now = Date.now();
  let b = buckets.get(sessionId);
  if (!b || now - b.windowStart >= WINDOW_MS) {
    b = { count: 0, windowStart: now };
    buckets.set(sessionId, b);
  }
  return b;
}

/**
 * Lanza error con code CHAT_RATE_LIMIT si la sesión ya superó el máximo en la ventana actual.
 */
export function assertWithinRateLimit(sessionId) {
  const b = getBucket(sessionId);
  const max = maxPerHour();
  if (b.count >= max) {
    const err = new Error(
      `Has alcanzado el límite de ${max} mensajes por hora en este chat (ajustable con CHAT_MAX_MSG_PER_HOUR_PER_SESSION en el backend). Espera unos minutos o inicia un chat nuevo.`
    );
    err.code = 'CHAT_RATE_LIMIT';
    throw err;
  }
}

/** Incrementa el contador tras una respuesta exitosa del modelo. */
export function recordSuccessfulUserMessage(sessionId) {
  const b = getBucket(sessionId);
  b.count += 1;
}

/** Al borrar historial en servidor, reinicia también el contador de tasa de esa sesión. */
export function clearRateForSession(sessionId) {
  buckets.delete(sessionId);
}
