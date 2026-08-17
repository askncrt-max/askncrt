import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const GenerateInput = z.object({
  topic: z.string().min(2).max(200),
  subject: z.string().max(60).optional().nullable(),
  class_level: z.string().max(20).optional().nullable(),
  difficulty: z.enum(["easy", "medium", "hard"]).default("medium"),
  count: z.number().int().min(3).max(20).default(5),
});

export const generateQuiz = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v: unknown) => GenerateInput.parse(v))
  .handler(async ({ context, data }) => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("AI is not configured");

    const { generateObject } = await import("ai");
    const { createLovableAiGatewayProvider } = await import("@/lib/ai-gateway.server");
    const gateway = createLovableAiGatewayProvider(key);

    const Schema = z.object({
      questions: z
        .array(
          z.object({
            question: z.string(),
            options: z.array(z.string()).length(4),
            correct_index: z.number().int().min(0).max(3),
            explanation: z.string(),
            sub_topic: z.string(),
          }),
        )
        .min(1),
    });

    const { object } = await generateObject({
      model: gateway("google/gemini-3-flash-preview"),
      schema: Schema,
      system:
        "You write high-quality NCERT-aligned multiple choice questions for Indian school students. Every question has exactly 4 options and exactly one correct answer. Explanations are short (1-3 sentences) and teach the concept. sub_topic is a 1-4 word label naming the specific concept tested, used later for weak-topic analysis.",
      prompt: `Create ${data.count} ${data.difficulty} multiple-choice questions on: "${data.topic}".
${data.subject ? `Subject: ${data.subject}.` : ""}
${data.class_level ? `NCERT Class: ${data.class_level}.` : ""}
Cover a spread of sub-topics. Do not repeat questions. Shuffle which option index is correct.`,
    });

    const questions = object.questions.slice(0, data.count);

    const { data: quiz, error } = await context.supabase
      .from("quizzes")
      .insert({
        user_id: context.userId,
        topic: data.topic,
        subject: data.subject ?? null,
        class_level: data.class_level ?? null,
        difficulty: data.difficulty,
        question_count: questions.length,
      })
      .select()
      .single();
    if (error) throw new Error(error.message);

    const rows = questions.map((q, i) => ({
      quiz_id: quiz.id,
      user_id: context.userId,
      idx: i,
      question: q.question,
      options: q.options,
      correct_index: q.correct_index,
      explanation: q.explanation,
      sub_topic: q.sub_topic,
    }));
    const { error: qErr } = await context.supabase.from("quiz_questions").insert(rows);
    if (qErr) throw new Error(qErr.message);

    return { quizId: quiz.id as string };
  });

export const getQuiz = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v: unknown) => z.object({ quizId: z.string().uuid() }).parse(v))
  .handler(async ({ context, data }) => {
    const [{ data: quiz, error }, { data: questions, error: qErr }] = await Promise.all([
      context.supabase.from("quizzes").select("*").eq("id", data.quizId).single(),
      context.supabase
        .from("quiz_questions")
        .select("*")
        .eq("quiz_id", data.quizId)
        .order("idx", { ascending: true }),
    ]);
    if (error) throw new Error(error.message);
    if (qErr) throw new Error(qErr.message);
    return { quiz, questions: questions ?? [] };
  });

export const submitAttempt = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v: unknown) =>
    z
      .object({
        quizId: z.string().uuid(),
        answers: z.array(z.number().int().min(-1).max(3)),
        duration_sec: z.number().int().min(0).max(86400).optional(),
      })
      .parse(v),
  )
  .handler(async ({ context, data }) => {
    const { data: questions, error } = await context.supabase
      .from("quiz_questions")
      .select("idx,correct_index,sub_topic")
      .eq("quiz_id", data.quizId)
      .order("idx", { ascending: true });
    if (error) throw new Error(error.message);

    let score = 0;
    const weak = new Set<string>();
    for (const q of questions ?? []) {
      const given = data.answers[q.idx];
      if (given === q.correct_index) score++;
      else if (q.sub_topic) weak.add(q.sub_topic);
    }
    const total = (questions ?? []).length;

    const { data: attempt, error: aErr } = await context.supabase
      .from("quiz_attempts")
      .insert({
        quiz_id: data.quizId,
        user_id: context.userId,
        answers: data.answers,
        score,
        total,
        weak_topics: Array.from(weak),
        duration_sec: data.duration_sec ?? null,
      })
      .select()
      .single();
    if (aErr) throw new Error(aErr.message);

    return { score, total, weak_topics: Array.from(weak), attemptId: attempt.id as string };
  });

export const getQuizHistory = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const [{ data: attempts }, { data: quizzes }] = await Promise.all([
      context.supabase
        .from("quiz_attempts")
        .select("*")
        .order("completed_at", { ascending: false })
        .limit(50),
      context.supabase.from("quizzes").select("id,topic,subject,difficulty,created_at"),
    ]);

    const quizMap = new Map((quizzes ?? []).map((q) => [q.id, q]));
    const rows = (attempts ?? []).map((a) => ({
      ...a,
      quiz: quizMap.get(a.quiz_id) ?? null,
    }));

    // Weak topic aggregation
    const weakCount = new Map<string, number>();
    for (const a of attempts ?? []) {
      for (const t of (a.weak_topics as string[]) ?? []) {
        weakCount.set(t, (weakCount.get(t) ?? 0) + 1);
      }
    }
    const weakTopics = Array.from(weakCount.entries())
      .map(([topic, misses]) => ({ topic, misses }))
      .sort((a, b) => b.misses - a.misses)
      .slice(0, 8);

    const totalQ = (attempts ?? []).reduce((s, a) => s + (a.total ?? 0), 0);
    const totalCorrect = (attempts ?? []).reduce((s, a) => s + (a.score ?? 0), 0);

    return {
      attempts: rows,
      weakTopics,
      accuracy: totalQ ? Math.round((totalCorrect / totalQ) * 100) : 0,
      quizzesTaken: (attempts ?? []).length,
    };
  });
