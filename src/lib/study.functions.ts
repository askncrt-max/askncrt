import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const logSession = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v: unknown) =>
    z
      .object({
        duration_min: z.number().int().min(1).max(600),
        subject: z.string().max(60).optional().nullable(),
        kind: z.string().max(30).default("chat"),
      })
      .parse(v),
  )
  .handler(async ({ context, data }) => {
    const started = new Date(Date.now() - data.duration_min * 60000).toISOString();
    const { error } = await context.supabase.from("study_sessions").insert({
      user_id: context.userId,
      duration_min: data.duration_min,
      subject: data.subject ?? null,
      kind: data.kind,
      started_at: started,
      ended_at: new Date().toISOString(),
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const getDashboard = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const since = new Date();
    since.setDate(since.getDate() - 29);
    since.setHours(0, 0, 0, 0);

    const [{ data: sessions }, { data: tasks }, { data: goals }, { data: achievements }, { data: exams }] =
      await Promise.all([
        context.supabase
          .from("study_sessions")
          .select("started_at,duration_min,subject")
          .gte("started_at", since.toISOString()),
        context.supabase.from("planner_tasks").select("status,scheduled_for,subject"),
        context.supabase.from("goals").select("*"),
        context.supabase.from("achievements").select("*").order("earned_at", { ascending: false }),
        context.supabase
          .from("exams")
          .select("*")
          .gte("exam_date", new Date().toISOString().slice(0, 10))
          .order("exam_date", { ascending: true })
          .limit(5),
      ]);

    // Build daily series (last 30 days)
    const days: { date: string; minutes: number }[] = [];
    const dayMap = new Map<string, number>();
    for (let i = 0; i < 30; i++) {
      const d = new Date(since);
      d.setDate(since.getDate() + i);
      const k = d.toISOString().slice(0, 10);
      dayMap.set(k, 0);
      days.push({ date: k, minutes: 0 });
    }
    for (const s of sessions ?? []) {
      const k = new Date(s.started_at).toISOString().slice(0, 10);
      dayMap.set(k, (dayMap.get(k) ?? 0) + (s.duration_min ?? 0));
    }
    for (const d of days) d.minutes = dayMap.get(d.date) ?? 0;

    // Subject breakdown
    const subjectMap = new Map<string, number>();
    for (const s of sessions ?? []) {
      const key = s.subject || "General";
      subjectMap.set(key, (subjectMap.get(key) ?? 0) + (s.duration_min ?? 0));
    }
    const bySubject = Array.from(subjectMap.entries()).map(([subject, minutes]) => ({ subject, minutes }));

    // Streak
    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    for (let i = 0; i < 30; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const k = d.toISOString().slice(0, 10);
      if ((dayMap.get(k) ?? 0) > 0) streak++;
      else if (i > 0) break;
    }

    const totalMinutes = days.reduce((a, b) => a + b.minutes, 0);
    const weekMinutes = days.slice(-7).reduce((a, b) => a + b.minutes, 0);
    const todayMinutes = dayMap.get(today.toISOString().slice(0, 10)) ?? 0;

    const tasksDone = (tasks ?? []).filter((t) => t.status === "done").length;
    const tasksPending = (tasks ?? []).filter((t) => t.status === "pending").length;

    const xp = totalMinutes * 2 + tasksDone * 20;
    const level = Math.floor(Math.sqrt(xp / 50)) + 1;
    const xpForNext = (level * level) * 50;

    return {
      days,
      bySubject,
      streak,
      totalMinutes,
      weekMinutes,
      todayMinutes,
      tasksDone,
      tasksPending,
      xp,
      level,
      xpForNext,
      goals: goals ?? [],
      achievements: achievements ?? [],
      upcomingExams: exams ?? [],
    };
  });

export const upsertGoal = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v: unknown) =>
    z
      .object({
        id: z.string().uuid().optional(),
        kind: z.enum(["weekly", "monthly"]),
        target_min: z.number().int().min(30).max(10000),
      })
      .parse(v),
  )
  .handler(async ({ context, data }) => {
    if (data.id) {
      const { error } = await context.supabase
        .from("goals")
        .update({ target_min: data.target_min, kind: data.kind })
        .eq("id", data.id);
      if (error) throw new Error(error.message);
    } else {
      const { error } = await context.supabase.from("goals").insert({
        user_id: context.userId,
        kind: data.kind,
        target_min: data.target_min,
      });
      if (error) throw new Error(error.message);
    }
    return { ok: true };
  });
