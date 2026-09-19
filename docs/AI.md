# Capa de IA — NEXA AI

Estado: Fase 6. Abstracción de proveedores lista y consumida por el primer tool real (Corrector APA 7).

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

## Primer consumidor: Corrector APA 7 (Fase 6)

- `lib/ai/prompts/apa.ts` — prompt + schema Zod (`apaAiResultSchema`) para la parte de IA del análisis (redacción, coherencia, citas contextuales). La IA explícitamente **no** evalúa formato (eso lo cubren las reglas programadas, `lib/rules/apa.ts`) — ver arquitectura híbrida en `PLAN.md` sección 1.2.
- `lib/documents/analyze/apa.ts` combina reglas + IA en un solo resultado.
- Límite diario (`MAX_AI_REQUESTS_PER_DAY`) implementado en `lib/tools/apa/actions.ts`, contando filas de `ai_sessions` creadas por el usuario desde el inicio del día UTC. Cada llamada exitosa a `AIService` se registra en `ai_sessions` (tool, provider, model, tokens_used).
- Verificado con Gemini real: se observó un 503 transitorio ("modelo con alta demanda") de Google durante pruebas — `AIService` lo manejó correctamente (intentó fallback, informó el error sin exponer detalles internos al usuario). No es un bug del código; es el comportamiento esperado ante una falla real de la API upstream.
