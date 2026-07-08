import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const TaskInput = z.object({
  title: z.string().min(1).max(200),
  subject: z.string().max(60).optional().nullable(),
  priority: z.enum(["low", "med", "high"]).default("med"),
  scheduled_for: z.string(), // YYYY-MM-DD
  scheduled_time: z.string().optional().nullable(),
  duration_min: z.number().int().min(5).max(600).default(30),
  exam_id: z.string().uuid().optional().nullable(),
  is_revision: z.boolean().default(false),
  notes: z.string().max(1000).optional().nullable(),
});

export const listTasks = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v: unknown) =>
    z.object({ from: z.string().optional(), to: z.string().optional() }).parse(v ?? {}),
  )
  .handler(async ({ context, data }) => {
    let q = context.supabase.from("planner_tasks").select("*").order("scheduled_for").order("scheduled_time");
    if (data.from) q = q.gte("scheduled_for", data.from);
    if (data.to) q = q.lte("scheduled_for", data.to);
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

export const createTask = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v: unknown) => TaskInput.parse(v))
  .handler(async ({ context, data }) => {
    const { data: row, error } = await context.supabase
      .from("planner_tasks")
      .insert({ ...data, user_id: context.userId })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return row;
  });

export const updateTask = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        status: z.enum(["pending", "done", "missed"]).optional(),
        scheduled_for: z.string().optional(),
        scheduled_time: z.string().optional().nullable(),
        title: z.string().optional(),
        priority: z.enum(["low", "med", "high"]).optional(),
        duration_min: z.number().int().optional(),
      })
      .parse(v),
  )
  .handler(async ({ context, data }) => {
    const { id, ...patch } = data;
    const { error } = await context.supabase.from("planner_tasks").update(patch).eq("id", id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteTask = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v: unknown) => z.object({ id: z.string().uuid() }).parse(v))
  .handler(async ({ context, data }) => {
    const { error } = await context.supabase.from("planner_tasks").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// -------- Exams --------

const ExamInput = z.object({
  name: z.string().min(1).max(120),
  subject: z.string().max(60).optional().nullable(),
  exam_date: z.string(),
});

export const listExams = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("exams")
      .select("*")
      .order("exam_date", { ascending: true });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const createExam = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v: unknown) => ExamInput.parse(v))
  .handler(async ({ context, data }) => {
    const { data: row, error } = await context.supabase
      .from("exams")
      .insert({ ...data, user_id: context.userId })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return row;
  });

export const deleteExam = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v: unknown) => z.object({ id: z.string().uuid() }).parse(v))
  .handler(async ({ context, data }) => {
    const { error } = await context.supabase.from("exams").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// -------- AI Timetable --------

export const generateTimetable = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v: unknown) =>
    z
      .object({
        hours_per_day: z.number().min(1).max(12).default(2),
        days: z.number().int().min(1).max(14).default(7),
      })
      .parse(v),
  )
  .handler(async ({ context, data }) => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("AI unavailable");

    const [{ data: profile }, { data: exams }, { data: memory }] = await Promise.all([
      context.supabase.from("profiles").select("*").eq("id", context.userId).maybeSingle(),
      context.supabase.from("exams").select("*").gte("exam_date", new Date().toISOString().slice(0, 10)),
      context.supabase.from("user_memory").select("key,value,category").limit(30),
    ]);

    const start = new Date();
    const dates: string[] = [];
    for (let i = 0; i < data.days; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      dates.push(d.toISOString().slice(0, 10));
    }

    const prompt = `Create a study timetable in strict JSON.
Student profile: class ${profile?.class_level ?? "?"}, board ${profile?.board ?? "?"}, subjects ${(profile?.subjects ?? []).join(", ") || "general"}, goals: ${profile?.goals ?? "none"}.
Upcoming exams: ${JSON.stringify(exams ?? [])}.
Memory: ${JSON.stringify(memory ?? [])}.
Constraints: ${data.hours_per_day} hours/day across these dates: ${dates.join(", ")}.
Return JSON array only, no prose. Each item: {"title": string, "subject": string, "priority": "low"|"med"|"high", "scheduled_for": "YYYY-MM-DD", "duration_min": number, "is_revision": boolean}.`;

    const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [{ role: "user", content: prompt }],
      }),
    });
    if (!resp.ok) throw new Error("AI request failed");
    const json = (await resp.json()) as { choices?: { message?: { content?: string } }[] };
    const text = json.choices?.[0]?.message?.content ?? "[]";
    const match = text.match(/\[[\s\S]*\]/);
    if (!match) throw new Error("AI returned invalid format");
    let items: unknown;
    try {
      items = JSON.parse(match[0]);
    } catch {
      throw new Error("AI returned invalid JSON");
    }
    const ItemSchema = z.array(
      z.object({
        title: z.string(),
        subject: z.string().optional().nullable(),
        priority: z.enum(["low", "med", "high"]).default("med"),
        scheduled_for: z.string(),
        duration_min: z.number().int().default(45),
        is_revision: z.boolean().default(false),
      }),
    );
    const parsed = ItemSchema.parse(items).slice(0, 40);
    const rows = parsed.map((t) => ({ ...t, user_id: context.userId }));
    const { error } = await context.supabase.from("planner_tasks").insert(rows);
    if (error) throw new Error(error.message);
    return { inserted: rows.length };
  });
