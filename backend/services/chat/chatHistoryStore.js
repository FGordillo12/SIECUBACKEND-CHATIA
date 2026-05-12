/**
 * Almacén temporal en memoria por sesión (reinicia al reiniciar el proceso).
 * Pensado para historial opcional y contexto sin tocar la base de datos de ventas.
 */

const MAX_SESSIONS = 800;
const MAX_MESSAGES_PER_SESSION = 24;

const sessions = new Map();

function touchOrder(sessionId) {
  // Mueve la sesión al final del Map para un eviction FIFO simple
  const data = sessions.get(sessionId);
  if (!data) return;
  sessions.delete(sessionId);
  sessions.set(sessionId, data);
}

export function getSessionMessages(sessionId) {
  return sessions.get(sessionId)?.messages ?? [];
}

export function appendExchange(sessionId, userContent, assistantContent) {
  if (!sessionId) return;

  let entry = sessions.get(sessionId);
  if (!entry) {
    if (sessions.size >= MAX_SESSIONS) {
      const firstKey = sessions.keys().next().value;
      sessions.delete(firstKey);
    }
    entry = { messages: [] };
    sessions.set(sessionId, entry);
  }

  entry.messages.push(
    { role: 'user', content: userContent },
    { role: 'assistant', content: assistantContent }
  );

  if (entry.messages.length > MAX_MESSAGES_PER_SESSION) {
    entry.messages = entry.messages.slice(-MAX_MESSAGES_PER_SESSION);
  }

  touchOrder(sessionId);
}

export function clearSession(sessionId) {
  sessions.delete(sessionId);
}
