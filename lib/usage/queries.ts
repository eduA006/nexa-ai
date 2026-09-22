import "server-only";
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { LIMITS, startOfTodayIso } from "@/lib/config/limits";
import type { Tables } from "@/lib/types/database";

export type AiSession = Tables<"ai_sessions">;

export type UsageSummary = {
  aiRequestsToday: number;
  aiRequestsLimit: number;
  documentsToday: number;
  documentsLimit: number;
};

/** Solicitudes de IA y documentos subidos hoy (UTC) por el usuario autenticado. */
export const getUsageSummary = cache(async (): Promise<UsageSummary> => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      aiRequestsToday: 0,
      aiRequestsLimit: LIMITS.MAX_AI_REQUESTS_PER_DAY,
      documentsToday: 0,
      documentsLimit: LIMITS.MAX_DOCUMENTS_PER_DAY,
    };
  }

  const today = startOfTodayIso();

  const [{ count: aiCount }, { count: docCount }] = await Promise.all([
    supabase
      .from("ai_sessions")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .gte("created_at", today),
    supabase
      .from("documents")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .gte("created_at", today),
  ]);

  return {
    aiRequestsToday: aiCount ?? 0,
    aiRequestsLimit: LIMITS.MAX_AI_REQUESTS_PER_DAY,
    documentsToday: docCount ?? 0,
    documentsLimit: LIMITS.MAX_DOCUMENTS_PER_DAY,
  };
});

/** Últimas llamadas a IA del usuario, más recientes primero. */
export const getRecentAiSessions = cache(async (limit = 30): Promise<AiSession[]> => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase
    .from("ai_sessions")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(limit);

  return data ?? [];
});

export type ToolUsageCount = { tool: string; count: number };

/** Conteo de uso por herramienta, ordenado de más a menos usada. */
export const getToolUsageCounts = cache(async (): Promise<ToolUsageCount[]> => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase
    .from("ai_sessions")
    .select("tool")
    .eq("user_id", user.id);

  if (!data) return [];

  const counts = new Map<string, number>();
  for (const row of data) {
    counts.set(row.tool, (counts.get(row.tool) ?? 0) + 1);
  }

  return [...counts.entries()]
    .map(([tool, count]) => ({ tool, count }))
    .sort((a, b) => b.count - a.count);
});
