/**
 * Cliente de chat compatible con API estilo OpenAI (mensajes + chat/completions).
 * Soporta Groq (capa gratuita) y OpenAI (opcional, de pago).
 */

const GROQ_CHAT_URL = 'https://api.groq.com/openai/v1/chat/completions';
const OPENAI_CHAT_URL = 'https://api.openai.com/v1/chat/completions';

function buildSystemPrompt(activeLanguage) {
  const langLabel = activeLanguage === 'en' ? 'English' : 'Spanish';

  return [
    'You are "LIBRE", the warm, professional AI assistant for CDISFRUTA, a Colombian ecommerce brand from Ubaté (Cundinamarca) that sells dehydrated fruit snacks and fruit aromatics, promoting natural healthy food.',
    '',
    'Institutional ethos (reference when it fits the conversation, especially about identity or values):',
    '"Soy LIBRE, AUTÓNOMO Y RESPONSABLE a través del diálogo y la construcción, como ideal regulativo; me dirijo, controlo y dicto mis propias leyes."',
    '',
    `For every reply in this session, use ONLY ${langLabel}.`,
    'Be helpful for ecommerce: product ideas, how to browse the store, general shipping/payment guidance, basic support, and navigation hints (e.g. store at route /dashboard_main, login at /login, registration at /registro).',
    'You do not have access to private user data or live order databases. For specific order status, ask the user to log in to their account or contact CDISFRUTA support via the website contact options.',
    'Keep answers concise (roughly under 130 words) unless the user asks for more detail.',
    'Never invent legal terms, medical claims, or guaranteed delivery dates.',
  ].join('\n');
}

/**
 * @returns {{ name: 'groq'|'openai', apiKey: string, url: string, model: string }}
 */
function resolveLlmConfig() {
  const provider = (process.env.CHAT_PROVIDER || '').trim().toLowerCase();
  const groqKey = (process.env.GROQ_API_KEY || '').trim();
  const openaiKey = (process.env.OPENAI_API_KEY || '').trim();

  if (provider === 'groq') {
    if (!groqKey) {
      const err = new Error('CHAT_PROVIDER=groq pero falta GROQ_API_KEY en el .env del backend.');
      err.code = 'MISSING_LLM_CONFIG';
      throw err;
    }
    return {
      name: 'groq',
      apiKey: groqKey,
      url: GROQ_CHAT_URL,
      model: (process.env.GROQ_MODEL || 'llama-3.1-8b-instant').trim(),
    };
  }

  if (provider === 'openai') {
    if (!openaiKey) {
      const err = new Error('CHAT_PROVIDER=openai pero falta OPENAI_API_KEY en el .env del backend.');
      err.code = 'MISSING_LLM_CONFIG';
      throw err;
    }
    return {
      name: 'openai',
      apiKey: openaiKey,
      url: OPENAI_CHAT_URL,
      model: (process.env.OPENAI_CHAT_MODEL || 'gpt-4o-mini').trim(),
    };
  }

  // Sin CHAT_PROVIDER: prioriza Groq si hay clave (gratis), si no OpenAI.
  if (groqKey) {
    return {
      name: 'groq',
      apiKey: groqKey,
      url: GROQ_CHAT_URL,
      model: (process.env.GROQ_MODEL || 'llama-3.1-8b-instant').trim(),
    };
  }
  if (openaiKey) {
    return {
      name: 'openai',
      apiKey: openaiKey,
      url: OPENAI_CHAT_URL,
      model: (process.env.OPENAI_CHAT_MODEL || 'gpt-4o-mini').trim(),
    };
  }

  const err = new Error(
    'No hay proveedor de IA configurado. Añade GROQ_API_KEY (gratis: https://console.groq.com/keys ) o OPENAI_API_KEY en el .env del backend y reinicia el servidor.'
  );
  err.code = 'MISSING_LLM_CONFIG';
  throw err;
}

function classifyQuotaError(apiErr, rawMsg, providerName) {
  return (
    apiErr?.code === 'insufficient_quota' ||
    apiErr?.type === 'insufficient_quota' ||
    /exceeded your current quota|insufficient_quota|billing_hard_limit/i.test(rawMsg) ||
    (providerName === 'openai' && /rate_limit|quota/i.test(rawMsg))
  );
}

export async function createChatCompletion({ history, userMessage, activeLanguage }) {
  const cfg = resolveLlmConfig();

  const messages = [
    { role: 'system', content: buildSystemPrompt(activeLanguage) },
    ...history.map((m) => ({ role: m.role, content: m.content })),
    { role: 'user', content: userMessage },
  ];

  const response = await fetch(cfg.url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${cfg.apiKey}`,
    },
    body: JSON.stringify({
      model: cfg.model,
      messages,
      temperature: 0.65,
      max_tokens: 650,
    }),
  });

  const data = await response.json().catch(() => ({}));
  const apiErr = data?.error;
  const rawMsg = typeof apiErr?.message === 'string' ? apiErr.message : '';

  if (!response.ok) {
    if (classifyQuotaError(apiErr, rawMsg, cfg.name)) {
      const billingHint =
        cfg.name === 'groq'
          ? 'Revisa límites y estado de tu cuenta en https://console.groq.com/ (capa gratuita con topes de uso).'
          : 'Revisa facturación en https://platform.openai.com/account/billing .';
      const err = new Error(
        `El proveedor de IA (${cfg.name}) rechazó la petición por cuota o facturación. ${billingHint}`
      );
      err.code = 'LLM_QUOTA_EXCEEDED';
      err.status = response.status;
      throw err;
    }

    if (response.status === 401) {
      const label = cfg.name === 'groq' ? 'GROQ_API_KEY' : 'OPENAI_API_KEY';
      const err = new Error(
        `Clave API inválida o revocada (${label}). Genera una nueva en la consola del proveedor y actualiza el .env del backend sin espacios extra; reinicia npm start.`
      );
      err.code = 'LLM_AUTH_ERROR';
      err.status = 401;
      throw err;
    }

    const err = new Error(rawMsg || `Error al contactar el proveedor de IA (${cfg.name}).`);
    err.code = 'LLM_HTTP_ERROR';
    err.status = response.status;
    throw err;
  }

  const reply = data?.choices?.[0]?.message?.content?.trim();
  if (!reply) {
    const err = new Error('Respuesta vacía del proveedor de IA');
    err.code = 'LLM_EMPTY_REPLY';
    throw err;
  }

  return reply;
}
