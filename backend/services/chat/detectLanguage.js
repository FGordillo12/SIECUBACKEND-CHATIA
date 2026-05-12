/**
 * Detección ligera de idioma (es/en) para mensajes cortos de ecommerce.
 * No sustituye a un modelo; sirve para modo "auto" sin llamadas extra.
 */
export function detectLanguage(text) {
  if (!text || typeof text !== 'string') return 'es';

  const sample = text.slice(0, 280).toLowerCase();

  let scoreEs = 0;
  let scoreEn = 0;

  if (/[áéíóúñü¿¡]/.test(sample)) scoreEs += 3;

  const esHints =
    /\b(hola|qué|como|cómo|pedido|gracias|producto|productos|donde|dónde|cuándo|cuando|quiero|ayuda|precio|carrito|pago|envío|envio|comprar|tienda)\b/;
  const enHints =
    /\b(hello|hi|what|how|order|thanks|thank you|product|products|where|when|want|help|price|cart|payment|shipping|buy|store|checkout)\b/;

  if (esHints.test(sample)) scoreEs += 2;
  if (enHints.test(sample)) scoreEn += 2;

  const esWords = (sample.match(/\b(el|la|los|las|por|para|esto|esta|usted|ustedes)\b/g) || []).length;
  const enWords = (sample.match(/\b(the|and|for|you|your|this|that|please|would|could)\b/g) || []).length;

  scoreEs += esWords;
  scoreEn += enWords;

  if (scoreEn > scoreEs) return 'en';
  return 'es';
}
