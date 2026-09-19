# Capa de IA — NEXA AI

Estado: Fase 5. Abstracción de proveedores lista; ningún tool de negocio la consume todavía (eso empieza en la Fase 6).

## Arquitectura

```
lib/ai/
  provider.ts   Interfaz AIProvider, tipos GenerateOptions/GenerateResult, AIProviderError
  gemini.ts     GeminiProvider (proveedor principal por defecto)
  groq.ts       GroqProvider (fallback)
  service.ts    generateText() / generateStructured() — único punto de entrada
```

**Regla dura**: ningún módulo de negocio (server actions, route handlers, prompts) importa `GeminiProvider` ni `GroqProvider` directamente. Todo pasa por `lib/ai/service.ts`. Cambiar de proveedor principal es cambiar `AI_PROVIDER` en `.env`, no tocar código de negocio.

## Selección de proveedor y fallback

`AI_PROVIDER` (`gemini` por defecto, o `groq`) define cuál se intenta primero. Si el proveedor principal falla (red, error HTTP, respuesta sin texto), `generateText()` intenta automáticamente el otro proveedor configurado (si tiene API key). Si ambos fallan, o ninguno está configurado, lanza `AIProviderError`. Los fallos se registran con `console.error` en servidor; nunca se exponen detalles internos al cliente.

## Proveedores verificados

Verificado empíricamente contra las APIs reales (no solo por lectura de documentación) el 2026-09-19, usando la API key real del usuario:

- **Gemini**: `POST https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent`, header `x-goog-api-key`. Modelo por defecto `gemini-3.8-flash` (estable, GA desde 2026-09-02). Confirmado: texto plano y `generationConfig.responseMimeType: "application/json"` para salida estructurada.
- **Groq**: `POST https://api.groq.com/openai/v1/chat/completions` (API compatible con OpenAI), header `Authorization: Bearer`. Modelo por defecto `llama-3.3-70b-versatile`. No verificado empíricamente todavía (el usuario no ha configurado `GROQ_API_KEY`); el código sigue el contrato documentado de la API compatible con OpenAI.

Ambos modelos son overrideables vía `GEMINI_MODEL` / `GROQ_MODEL` sin tocar código, ya que los proveedores de IA retiran modelos con relativa frecuencia (ej. `gemini-2.5-flash` se retira el 16 de octubre de 2026).

## `generateText(prompt, options?)`

Devuelve `{ text, provider, model, tokensUsed }`. `tokensUsed` viene de `usageMetadata.totalTokenCount` (Gemini) o `usage.total_tokens` (Groq) — incluye tokens de "pensamiento" en modelos con razonamiento interno, no solo el texto visible.

## `generateStructured<T>(prompt, schema, options?)`

Pide salida JSON (`json: true`), la parsea, y la valida con `schema.parse()` (pensado para pasar un schema de Zod). Lanza `AIProviderError` si el modelo no devuelve JSON válido o si no cumple el schema — nunca se confía ciegamente en texto generado por IA. Devuelve `{ data, result }`.

## Pendiente para cuando exista el primer consumidor (Fase 6)

- `lib/ai/prompts/` — prompts versionados por herramienta (ej. `apa.ts`). No se crea vacío de antemano; se crea cuando la Fase 6 lo necesite.
- Control de límite diario (`MAX_AI_REQUESTS_PER_DAY`, ver `lib/config/limits.ts`) — se conecta cuando la primera herramienta llame a `AIService`. Necesitará una forma de contar solicitudes por usuario/día (candidato natural: tabla `ai_sessions`, prevista en `PLAN.md` sección 5, pero formalmente asignada a la Fase 12; puede adelantarse si la Fase 6 lo requiere — a decidir en su momento).
