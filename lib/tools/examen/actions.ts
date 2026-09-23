"use server";

import { createClient } from "@/lib/supabase/server";
import { LIMITS, startOfTodayIso } from "@/lib/config/limits";
import { canAccessTool } from "@/lib/config/plans";
import { generateExamFromDocument } from "@/lib/documents/analyze/examen";
import { generateStructured } from "@/lib/ai/service";
import { openAnswerGradingSchema, buildGradeOpenAnswersPrompt } from "@/lib/ai/prompts/examen";
import type { ExamQuestion } from "@/lib/ai/prompts/examen";

/** Vista pública de una pregunta — sin la respuesta correcta ni la referencia de calificación. */
export type PublicExamQuestion = {
  type: "multiple_choice" | "open";
  question: string;
  options: string[];
};

export type GenerateExamResult = {
  examId: string;
  questions: PublicExamQuestion[];
};

export type GenerateExamState = { error: string } | { result: GenerateExamResult } | undefined;

export async function runGenerarExamen(
  _prevState: GenerateExamState,
  formData: FormData,
): Promise<GenerateExamState> {
  const documentId = formData.get("documentId");
  if (typeof documentId !== "string" || !documentId) {
    return { error: "Selecciona un documento." };
  }
  const exampleExam = formData.get("exampleExam");
  const exampleExamText = typeof exampleExam === "string" ? exampleExam : "";

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: "Sesión expirada. Vuelve a iniciar sesión." };
  }

  const { data: profile } = await supabase.from("profiles").select("plan").eq("user_id", user.id).single();
  if (!canAccessTool("examen", profile?.plan)) {
    return { error: "Esta herramienta requiere el plan Pro." };
  }

  const { count } = await supabase
    .from("ai_sessions")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .gte("created_at", startOfTodayIso());

  if ((count ?? 0) >= LIMITS.MAX_AI_REQUESTS_PER_DAY) {
    return { error: "Has alcanzado el límite diario gratuito de solicitudes de IA." };
  }

  const { data: doc, error: docError } = await supabase
    .from("documents")
    .select("storage_path, file_type, name")
    .eq("id", documentId)
    .eq("user_id", user.id)
    .single();

  if (docError || !doc) {
    return { error: "Documento no encontrado." };
  }

  if (doc.file_type !== "docx") {
    return { error: "El simulador de exámenes solo admite documentos DOCX por ahora." };
  }

  const { data: fileBlob, error: downloadError } = await supabase.storage
    .from("documents")
    .download(doc.storage_path);

  if (downloadError || !fileBlob) {
    return { error: "No se pudo descargar el documento." };
  }

  let generation;
  try {
    const buffer = Buffer.from(await fileBlob.arrayBuffer());
    generation = await generateExamFromDocument(buffer, exampleExamText);
  } catch (error) {
    console.error("[Examen] Error al generar examen:", error);
    return { error: "No se pudo generar el examen. Inténtalo nuevamente." };
  }

  // Se guarda el set completo (con respuestas correctas) solo en la base de
  // datos — nunca se le envía al cliente hasta después de calificar, para
  // que no queden visibles en la respuesta de red mientras se responde.
  const { data: inserted, error: insertError } = await supabase
    .from("document_analyses")
    .insert({
      document_id: documentId,
      user_id: user.id,
      analysis_type: "examen",
      result: { questions: generation.questions, status: "pending" },
      score: null,
    })
    .select("id")
    .single();

  if (insertError || !inserted) {
    return { error: "No se pudo guardar el examen generado." };
  }

  await supabase.from("ai_sessions").insert({
    user_id: user.id,
    tool: "examen",
    input: doc.name,
    result: { questionCount: generation.questions.length },
    provider: generation.provider,
    model: generation.model,
    tokens_used: generation.tokensUsed,
  });

  const publicQuestions: PublicExamQuestion[] = generation.questions.map((q) => ({
    type: q.type,
    question: q.question,
    options: q.options,
  }));

  return { result: { examId: inserted.id, questions: publicQuestions } };
}

export type GradedQuestion = {
  type: "multiple_choice" | "open";
  question: string;
  options: string[];
  userAnswer: string;
  correct: boolean;
  correctAnswerText: string;
  feedback: string;
};

export type EvaluateExamResult = {
  score: number;
  questions: GradedQuestion[];
};

export type EvaluateExamState = { error: string } | { result: EvaluateExamResult } | undefined;

export async function runEvaluarExamen(
  _prevState: EvaluateExamState,
  formData: FormData,
): Promise<EvaluateExamState> {
  const examId = formData.get("examId");
  if (typeof examId !== "string" || !examId) {
    return { error: "Examen no encontrado." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: "Sesión expirada. Vuelve a iniciar sesión." };
  }

  const { data: examRow, error: examError } = await supabase
    .from("document_analyses")
    .select("result")
    .eq("id", examId)
    .eq("user_id", user.id)
    .eq("analysis_type", "examen")
    .single();

  if (examError || !examRow) {
    return { error: "Examen no encontrado." };
  }

  const stored = examRow.result as { questions: ExamQuestion[] };
  const questions = stored.questions;

  const userAnswers = questions.map((_, index) => {
    const raw = formData.get(`answer-${index}`);
    return typeof raw === "string" ? raw : "";
  });

  // Opción múltiple: regla determinista, sin IA — comparar el índice
  // elegido contra el correcto es un hecho verificable, no un juicio.
  const openIndices: number[] = [];
  const graded: GradedQuestion[] = questions.map((q, index) => {
    if (q.type === "multiple_choice") {
      const selected = Number.parseInt(userAnswers[index], 10);
      const correct = selected === q.correctIndex;
      return {
        type: q.type,
        question: q.question,
        options: q.options,
        userAnswer: userAnswers[index],
        correct,
        correctAnswerText: q.options[q.correctIndex] ?? "",
        feedback: q.referenceAnswer,
      };
    }
    openIndices.push(index);
    return {
      type: q.type,
      question: q.question,
      options: q.options,
      userAnswer: userAnswers[index],
      correct: false,
      correctAnswerText: q.referenceAnswer,
      feedback: "",
    };
  });

  // Preguntas abiertas: sí requieren IA — comparar una respuesta libre
  // contra la esperada exige criterio, no es verificable por texto exacto.
  if (openIndices.length > 0) {
    const { count } = await supabase
      .from("ai_sessions")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .gte("created_at", startOfTodayIso());

    if ((count ?? 0) >= LIMITS.MAX_AI_REQUESTS_PER_DAY) {
      return { error: "Has alcanzado el límite diario gratuito de solicitudes de IA." };
    }

    try {
      const items = openIndices.map((index) => ({
        question: questions[index].question,
        referenceAnswer: questions[index].referenceAnswer,
        userAnswer: userAnswers[index],
      }));

      const { data, result } = await generateStructured(
        buildGradeOpenAnswersPrompt(items),
        openAnswerGradingSchema,
        { system: "Eres un asistente experto en calificar respuestas de examen en español con criterio justo." },
      );

      openIndices.forEach((questionIndex, i) => {
        const grading = data.results[i];
        if (grading) {
          graded[questionIndex].correct = grading.correct;
          graded[questionIndex].feedback = grading.feedback;
        }
      });

      await supabase.from("ai_sessions").insert({
        user_id: user.id,
        tool: "examen",
        input: `Calificación (${openIndices.length} preguntas abiertas)`,
        result: { gradedOpen: openIndices.length },
        provider: result.provider,
        model: result.model,
        tokens_used: result.tokensUsed,
      });
    } catch (error) {
      console.error("[Examen] Error al calificar respuestas abiertas:", error);
      return { error: "No se pudo calificar el examen. Inténtalo nuevamente." };
    }
  }

  const correctCount = graded.filter((g) => g.correct).length;
  const score = Math.round((correctCount / graded.length) * 100);

  await supabase
    .from("document_analyses")
    .update({ result: { questions: stored.questions, status: "graded", graded, score }, score })
    .eq("id", examId)
    .eq("user_id", user.id);

  return { result: { score, questions: graded } };
}
