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
- **Groq**: `POST https://api.groq.com/openai/v1/chat/completions` (API compatible con OpenAI), header `Authorization: Bearer`. Modelo por defecto `openai/gpt-oss-120b` — verificado empíricamente el 2026-09-21 con la API key real del usuario (texto plano y modo JSON estructurado). El modelo original planeado (`llama-3.3-70b-versatile`) ya no existe en la cuenta del usuario (confirmado vía `GET /openai/v1/models`, no aparece en el listado); los proveedores retiran modelos con frecuencia, de ahí que sea overrideable por `GROQ_MODEL` sin tocar código.

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

## Segundo consumidor: Analizador de escritura (Fase 8)

- `lib/ai/prompts/writing.ts` — prompt + schema Zod (`writingAiResultSchema`). Contiene una regla estricta explícita: la IA nunca debe afirmar ni insinuar que un texto "fue generado por IA" ni dar un porcentaje de probabilidad de autoría — eso no es determinable de forma confiable con las técnicas disponibles y presentarlo como tal sería engañoso. Se limita a describir patrones de estilo observables (tono, profundidad argumentativa, variación estructural).
- `lib/rules/writing.ts` — heurísticas deterministas de estilo: variedad de longitud de oraciones (coeficiente de variación), diversidad léxica (type-token ratio), oraciones repetidas casi idénticas, y frecuencia de muletillas académicas genéricas. Mismo principio que APA: nunca se presentan como una certeza, solo como indicadores a revisar.
- `RuleFinding`/`RuleSeverity` viven en `lib/rules/types.ts` (compartidos entre `apa.ts` y `writing.ts` sin acoplar un tool a otro).
- Verificado con Gemini real usando un documento deliberadamente repetitivo: las reglas detectaron correctamente la uniformidad de oraciones y el exceso de muletillas; la respuesta de la IA describió el patrón de estilo sin en ningún momento afirmar autoría por IA (se inspeccionó el JSON completo de la respuesta real para confirmar cumplimiento del prompt, no se asumió). También se confirmó en vivo el límite real de cuota gratuita de Gemini (20 solicitudes/día, `RESOURCE_EXHAUSTED`), que coincide con `MAX_AI_REQUESTS_PER_DAY`; sin `GROQ_API_KEY` configurada, `AIService` lanzó el error esperado sin fallback disponible.

## Tercer consumidor: Chat con documentos (Fase 9)

- `lib/ai/prompts/document-chat.ts` — usa `generateText` (texto libre), no `generateStructured`: una respuesta conversacional no tiene una forma JSON fija que valga la pena forzar. Construye el prompt con el documento (truncado a 12k chars) + hasta 10 turnos previos de la conversación + la pregunta nueva.
- Única herramienta hasta ahora que persiste una conversación completa, no solo un resumen: tabla `document_chat_messages` (mensajes rol usuario/asistente por documento), separada de `ai_sessions` (que sigue registrando un log agregado por llamada para el límite diario y para historial futuro).
- Verificado: capa de base de datos end-to-end (insert/select con RLS, cascada de borrado) con un usuario real de prueba, eliminado después de la verificación. La llamada real a Gemini no pudo verificarse en el momento de escribir esto porque la cuota gratuita diaria (20/día) ya estaba agotada por las pruebas de la Fase 8 — quedó pendiente confirmar una respuesta exitosa real cuando la cuota se restablezca.

## Corrección de modelo Groq (2026-09-21)

`GROQ_API_KEY` se configuró por primera vez en este punto. Al probarla, `llama-3.3-70b-versatile` (default desde la Fase 5) devolvió 404 `model_not_found` — Groq lo retiró. Se confirmó vía `GET https://api.groq.com/openai/v1/models` con la key real que ya no aparece en el listado de modelos disponibles. Se reemplazó el default por `openai/gpt-oss-120b`, verificado en vivo en modo texto plano y modo JSON estructurado (`response_format: json_object`).

## Cuarto consumidor: Resumir documento (Fase 10, primera herramienta)

- `lib/ai/prompts/summarize.ts` + `lib/documents/analyze/summarize.ts` — una sola llamada `generateStructured` devuelve resumen breve, resumen detallado, hasta 10 ideas clave y conclusiones. **Sin capa de reglas deterministas**: a diferencia de APA/escritura, resumir no tiene un "formato correcto" verificable objetivamente, así que esta es la primera herramienta 100% generativa del proyecto (se documenta explícitamente en el código para que la ausencia de reglas se lea como decisión, no como omisión).
- Primera verificación end-to-end en producción real del fallback Gemini→Groq: Gemini falló por `RESOURCE_EXHAUSTED` (cuota diaria agotada, comportamiento esperado) y `AIService` pasó automáticamente a Groq (`openai/gpt-oss-120b`), que devolvió un resumen completo y coherente en español. Confirma que el fallback funciona en un flujo real, no solo aislado.

## Quinto consumidor: Corrector de redacción (Fase 10, segunda herramienta)

- `lib/ai/prompts/redaccion.ts` + `lib/documents/analyze/redaccion.ts` — arquitectura híbrida completa. Reglas mecánicas (`lib/rules/redaccion.ts`) cubren patrones que no requieren entender el idioma (espacios dobles, repeticiones, puntuación pegada, oraciones largas); la IA cubre ortografía y gramática real, citando el fragmento original y la corrección específica (no solo una descripción genérica del problema).
- Verificado con un documento de prueba con 9 errores deliberados (concordancia de género/número, artículos redundantes, tildes faltantes, "avia"/"había"): Gemini falló por cuota agotada, Groq (`openai/gpt-oss-120b`) los corrigió todos con precisión, citando fragmento original y corrección en cada caso.
