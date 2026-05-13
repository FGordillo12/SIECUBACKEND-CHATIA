# CDISFRUTA — Backend (API)

API REST del e-commerce **CDISFRUTA** construida con **Node.js** y **Express 5**. Persistencia con **MongoDB** (Mongoose), autenticación con **JWT** (cookies httpOnly), carga de imágenes con **Cloudinary**, validación con **Zod** e integración del **asistente LIBRE** (chatbot) vía **Groq** u **OpenAI**.

---

## Descripción del proyecto

Servidor que centraliza:

- Registro, login, validación de cuenta y login con **Google**.
- CRUD de **productos** (con subida de imágenes).
- **Notificaciones** (lectura masiva / individual).
- **Chat** bilingüe con historial en memoria y límite de mensajes por sesión.

Pensado para ejecutarse en local (`node --watch`) o desplegarse en **Vercel** (`vercel.json` apunta a `app.js`).

---

## Tecnologías utilizadas

| Área | Tecnología |
|------|------------|
| Runtime | Node.js (ESM: `"type": "module"`) |
| Framework HTTP | Express 5 |
| Base de datos | MongoDB + Mongoose 9 |
| Validación | Zod 4 |
| Auth | jsonwebtoken, bcrypt, google-auth-library |
| Archivos / CDN | multer, cloudinary, multer-storage-cloudinary |
| Email | nodemailer |
| CORS / cookies | cors, cookie-parser |
| Config | dotenv |
| IA (chat) | HTTP `fetch` a **Groq** (OpenAI-compatible) u **OpenAI** |

---

## Arquitectura del sistema

```
                    ┌──────────────────┐
                    │   React (Vite)   │
                    │    Frontend      │
                    └────────┬─────────┘
                             │ REST + cookies (CORS)
                             ▼
┌────────────────────────────────────────────────────────────┐
│                    Express (app.js)                        │
│  /api  → usuarios | productos | notificaciones | chat      │
└─────┬──────────────────────────────┬─────────────────────┘
      │                              │
      ▼                              ▼
 MongoDB                         Groq / OpenAI
 (Mongoose)                    (solo rutas /chat)
```

- **Seguridad de IA:** las claves `GROQ_API_KEY` / `OPENAI_API_KEY` solo existen en el servidor.
- **Chat:** historial y rate limit en **memoria** (se pierden al reiniciar el proceso).

---

## Rol del backend

| Módulo | Responsabilidad |
|--------|-----------------|
| `app.js` | Middleware global, CORS, registro de routers, health `/`. |
| `db/connection.js` | Conexión Mongoose (`DB_CONNECTION_STRING`). |
| `backend/router/*` | Definición de rutas HTTP. |
| `backend/controllers/*` | Lógica de negocio y respuestas JSON. |
| `backend/middleware/*` | JWT, subida de imágenes, validaciones. |
| `backend/services/chat/*` | LLM, detección de idioma, historial, rate limit. |

---

## Instalación

Requisitos: **Node.js** LTS (18+), **MongoDB** accesible (Atlas o local), cuenta **Cloudinary** (si usas subida de imágenes), claves según `.env`.

```bash
git clone <url-del-repositorio-backend>
cd SIECUBACK
npm install
```

Copia variables de entorno (no subas `.env` al repositorio):

```bash
cp .env.example .env
# Edita .env con tus valores reales
```

---

## Variables de entorno

Resumen (el detalle está en `.env.example`):

| Variable | Uso |
|----------|-----|
| `DB_CONNECTION_STRING` | URI de MongoDB (Mongoose). |
| `PORT` | Puerto HTTP (default `5000`). |
| `GROQ_API_KEY` | Clave **Groq** (recomendada; capa gratuita). |
| `GROQ_MODEL` | Modelo Groq (default `llama-3.1-8b-instant`). |
| `OPENAI_API_KEY` | Opcional: OpenAI si no usas Groq. |
| `OPENAI_CHAT_MODEL` | Modelo OpenAI (default `gpt-4o-mini`). |
| `CHAT_PROVIDER` | `groq` \| `openai` — si está vacío: Groq si hay `GROQ_API_KEY`, si no OpenAI. |
| `CHAT_MAX_MSG_PER_HOUR_PER_SESSION` | Tope de mensajes de usuario por sesión y hora (default `40`). |
| *(resto del proyecto)* | JWT, Cloudinary, correo, etc. según tus controladores actuales. |

---

## Cómo ejecutar el proyecto

```bash
npm start
```

Equivale a `node --watch app.js` (reinicia el proceso al guardar cambios).

Comprueba en navegador o con `curl`:

```bash
curl http://localhost:5000/
```

---

## Endpoints de la API

Prefijo base: **`/api`** (excepto `GET /`).

### Usuarios

| Método | Ruta | Descripción |
|--------|------|-------------|
| `POST` | `/api/registro` | Registro de usuario. |
| `POST` | `/api/login` | Login (credenciales). |
| `POST` | `/api/validacion` | Verificación de cuenta. |
| `GET` | `/api/verify-token` | Validación de JWT. |
| `POST` | `/api/auth/google` | Login / registro con Google. |

### Productos

| Método | Ruta | Descripción |
|--------|------|-------------|
| `GET` | `/api/get-productos` | Listar productos. |
| `POST` | `/api/registro-productos` | Crear producto (multipart + Cloudinary). |
| `PUT` | `/api/productos/:id` | Actualizar producto. |
| `DELETE` | `/api/productos/:id` | Eliminar producto. |

### Notificaciones

| Método | Ruta | Descripción |
|--------|------|-------------|
| `GET` | `/api/get-notificaciones` | Obtener notificaciones. |
| `PATCH` | `/api/notificaciones/:id` | Marcar como leída. |
| `DELETE` | `/api/notificaciones-todas` | Borrar todas. |

### Chat (LIBRE)

| Método | Ruta | Descripción |
|--------|------|-------------|
| `POST` | `/api/chat/message` | Enviar mensaje; respuesta del modelo. |
| `GET` | `/api/chat/history/:sessionId` | Historial en memoria del servidor. |
| `DELETE` | `/api/chat/history/:sessionId` | Borrar historial y contador de rate limit. |

### Sesión

| Método | Ruta | Descripción |
|--------|------|-------------|
| `POST` | `/api/logout` | Limpia cookie `access_token`. |

#### Ejemplo: enviar mensaje al chat

```bash
curl -X POST http://localhost:5000/api/chat/message \
  -H "Content-Type: application/json" \
  -d "{\"sessionId\":\"mi-sesion-123\",\"message\":\"Hola\",\"languageMode\":\"auto\"}"
```

Respuesta exitosa (200):

```json
{
  "ok": true,
  "reply": "...",
  "detectedLanguage": "es",
  "sessionId": "mi-sesion-123"
}
```

---

## Integración del chatbot (backend)

| Archivo | Función |
|---------|---------|
| `backend/router/chatRoutes.js` | Rutas `/chat/*`. |
| `backend/controllers/chat/chatController.js` | Orquestación: validación Zod, rate limit, LLM, persistencia en memoria. |
| `backend/schemaValidations/chatSchema.js` | Esquema del body (`sessionId`, `message`, `languageMode`). |
| `backend/services/chat/llmChat.js` | Selección Groq/OpenAI y llamada `fetch` a `chat/completions`. |
| `backend/services/chat/detectLanguage.js` | Heurística `es`/`en` para modo `auto`. |
| `backend/services/chat/chatHistoryStore.js` | Cola de mensajes por `sessionId` (RAM). |
| `backend/services/chat/chatRateLimiter.js` | Límite configurable de mensajes por sesión y hora. |

Flujo: **validar** → **rate limit** → **armar mensajes (system + historial + usuario)** → **proveedor LLM** → **guardar intercambio** → **JSON**.

---

## Soporte bilingüe (español e inglés)

1. El cliente envía `languageMode`: `auto`, `es` o `en`.
2. Si es `auto`, `detectLanguage.js` infiere idioma a partir del texto del usuario.
3. `llmChat.js` inyecta en el *system prompt* la instrucción de responder **solo** en español o inglés según ese resultado (o forzado en `es`/`en`).

---

## Proveedor de IA (Groq / OpenAI)

- **Groq:** endpoint compatible OpenAI (`https://api.groq.com/openai/v1/chat/completions`). Suele usarse con **capa gratuita** (sujeta a límites del proveedor).
- **OpenAI:** endpoint oficial (`https://api.openai.com/v1/chat/completions`), uso típicamente de pago.

**Selección automática** (si `CHAT_PROVIDER` está vacío):

1. Si existe `GROQ_API_KEY` → **Groq**.
2. Si no, pero existe `OPENAI_API_KEY` → **OpenAI**.
3. Si no hay ninguna → error `503` con mensaje de configuración.

Con `CHAT_PROVIDER=groq` o `openai` se fuerza el proveedor correspondiente.

---

## CORS

Orígenes permitidos en `app.js` (ajusta si despliegas otro dominio):

- `http://localhost:5173`
- `https://cdisfruta.vercel.app`

---

## Estructura de carpetas (principal)

```
SIECUBACK/
├── app.js                      # Entrada Express, middleware, rutas
├── vercel.json                 # Despliegue serverless
├── db/
│   └── connection.js           # Mongoose
├── backend/
│   ├── controllers/            # Lógica HTTP (usuarios, productos, notif., chat)
│   ├── middleware/             # JWT, multer/Cloudinary, validaciones
│   ├── router/                 # Routers Express
│   ├── schema/                 # Esquemas Mongoose
│   ├── schemaValidations/      # Zod (incl. chat)
│   └── services/
│       └── chat/               # LLM, idioma, historial, rate limit
├── package.json
├── .env.example
└── README.md
```

---

## Capturas de pantalla

> Añade capturas de herramientas tipo Postman/Thunder Client, logs de Vercel o respuestas JSON del chat.

| Tema | Descripción |
|------|-------------|
| Health check | `_Captura: GET /_` |
| Chat 200 OK | `_Captura: POST /api/chat/message_` |
| Rate limit 429 | `_Captura opcional_` |

---

## Autor

Repositorio referenciado en `package.json`: [Gaus8/Cdisfruta-back](https://github.com/Gaus8/Cdisfruta-back). Actualiza esta sección con el equipo o mantenedor real del proyecto CDISFRUTA.

---

## Licencia

Según `package.json`: **ISC**.

Si tu organización usa otra licencia, sustituye este apartado y añade el archivo `LICENSE` correspondiente en la raíz del repositorio.
