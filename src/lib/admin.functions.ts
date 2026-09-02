import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/* ------------------------------------------------------------------ */
/* Authorization                                                       */
/* ------------------------------------------------------------------ */

type Ctx = { supabase: any; userId: string; claims: Record<string, unknown> };

async function assertSuperAdmin(context: Ctx) {
  const { data, error } = await context.supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", context.userId)
    .eq("role", "super_admin")
    .maybeSingle();
  if (error || !data) throw new Error("Forbidden: super admin only");
  return {
    adminId: context.userId,
    adminEmail: (context.claims["email"] as string) ?? null,
  };
}

async function audit(
  context: Ctx,
  admin: { adminId: string; adminEmail: string | null },
  entry: {
    action: string;
    target_type?: string;
    target_id?: string;
    previous_value?: unknown;
    new_value?: unknown;
    result?: string;
  },
) {
  await context.supabase.from("audit_logs").insert({
    admin_id: admin.adminId,
    admin_email: admin.adminEmail,
    action: entry.action,
    target_type: entry.target_type ?? null,
    target_id: entry.target_id ?? null,
    previous_value: entry.previous_value ?? null,
    new_value: entry.new_value ?? null,
    result: entry.result ?? "success",
  });
}

/* ------------------------------------------------------------------ */
/* Whitelisted admin tables (generic CRUD)                             */
/* ------------------------------------------------------------------ */

const TABLES = {
  plans: { order: "sort_order", asc: true },
  feature_flags: { order: "label", asc: true },
  classes: { order: "level", asc: true },
  subjects: { order: "sort_order", asc: true },
  chapters: { order: "sort_order", asc: true },
  study_material: { order: "created_at", asc: false },
  admin_questions: { order: "created_at", asc: false },
  notifications: { order: "created_at", asc: false },
  ad_settings: { order: "placement", asc: true },
  ai_providers: { order: "priority", asc: true },
  files: { order: "created_at", asc: false },
  audit_logs: { order: "created_at", asc: false },
  security_events: { order: "created_at", asc: false },
  ocr_requests: { order: "created_at", asc: false },
  ai_usage: { order: "created_at", asc: false },
  system_settings: { order: "key", asc: true },
  emergency_settings: { order: "id", asc: true },
  user_roles: { order: "created_at", asc: false },
} as const;

type TableName = keyof typeof TABLES;
const tableEnum = z.enum(Object.keys(TABLES) as [TableName, ...TableName[]]);

export const adminList = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v: unknown) =>
    z
      .object({
        table: tableEnum,
        search: z.string().max(120).optional(),
        searchColumn: z.string().max(60).optional(),
        limit: z.number().int().min(1).max(500).default(100),
        eq: z.record(z.string(), z.union([z.string(), z.number(), z.boolean()])).optional(),
      })
      .parse(v),
  )
  .handler(async ({ context, data }) => {
    await assertSuperAdmin(context as Ctx);
    const cfg = TABLES[data.table];
    let q = (context as Ctx).supabase.from(data.table).select("*");
    if (data.eq) for (const [k, val] of Object.entries(data.eq)) q = q.eq(k, val);
    if (data.search && data.searchColumn) q = q.ilike(data.searchColumn, `%${data.search}%`);
    const { data: rows, error } = await q.order(cfg.order, { ascending: cfg.asc }).limit(data.limit);
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

export const adminSave = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v: unknown) =>
    z
      .object({
        table: tableEnum,
        id: z.string().optional(),
        idColumn: z.string().max(40).default("id"),
        values: z.record(z.string(), z.any()),
      })
      .parse(v),
  )
  .handler(async ({ context, data }) => {
    const ctx = context as Ctx;
    const admin = await assertSuperAdmin(ctx);
    let previous: unknown = null;
    if (data.id) {
      const { data: prev } = await ctx.supabase
        .from(data.table)
        .select("*")
        .eq(data.idColumn, data.id)
        .maybeSingle();
      previous = prev;
    }
    const query = data.id
      ? ctx.supabase.from(data.table).update(data.values).eq(data.idColumn, data.id)
      : ctx.supabase.from(data.table).insert(data.values);
    const { data: row, error } = await query.select().single();
    if (error) {
      await audit(ctx, admin, {
        action: data.id ? `${data.table}.update` : `${data.table}.create`,
        target_type: data.table,
        target_id: data.id,
        result: `error: ${error.message}`,
      });
      throw new Error(error.message);
    }
    await audit(ctx, admin, {
      action: data.id ? `${data.table}.update` : `${data.table}.create`,
      target_type: data.table,
      target_id: row?.id ?? data.id,
      previous_value: previous,
      new_value: data.values,
    });
    return row;
  });

export const adminDelete = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v: unknown) =>
    z
      .object({
        table: tableEnum,
        ids: z.array(z.string()).min(1).max(200),
        idColumn: z.string().max(40).default("id"),
      })
      .parse(v),
  )
  .handler(async ({ context, data }) => {
    const ctx = context as Ctx;
    const admin = await assertSuperAdmin(ctx);
    const { error } = await ctx.supabase.from(data.table).delete().in(data.idColumn, data.ids);
    if (error) throw new Error(error.message);
    await audit(ctx, admin, {
      action: `${data.table}.delete`,
      target_type: data.table,
      target_id: data.ids.join(","),
      previous_value: { ids: data.ids },
    });
    return { ok: true, deleted: data.ids.length };
  });

/* ------------------------------------------------------------------ */
/* Dashboard overview                                                  */
/* ------------------------------------------------------------------ */

function sinceDate(range: string) {
  const days = range === "today" ? 1 : range === "7d" ? 7 : range === "30d" ? 30 : range === "90d" ? 90 : 365;
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - days + (range === "today" ? 1 : 0));
  if (range === "today") d.setUTCHours(0, 0, 0, 0);
  return { iso: d.toISOString(), days };
}

export const adminOverview = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v: unknown) =>
    z.object({ range: z.enum(["today", "7d", "30d", "90d", "1y"]).default("30d") }).parse(v),
  )
  .handler(async ({ context, data }) => {
    const ctx = context as Ctx;
    await assertSuperAdmin(ctx);
    const { iso, days } = sinceDate(data.range);
    const sb = ctx.supabase;

    const count = async (table: string, build?: (q: any) => any) => {
      let q = sb.from(table).select("*", { count: "exact", head: true });
      if (build) q = build(q);
      const { count: c } = await q;
      return c ?? 0;
    };

    const [
      totalUsers,
      newUsers,
      activeUsers,
      totalMessages,
      messagesInRange,
      aiRequests,
      aiFailed,
      ocrTotal,
      ocrFailed,
      notesCount,
      quizzes,
      attempts,
    ] = await Promise.all([
      count("profiles"),
      count("profiles", (q) => q.gte("created_at", iso)),
      count("profiles", (q) => q.gte("last_active_at", iso)),
      count("messages"),
      count("messages", (q) => q.gte("created_at", iso)),
      count("ai_usage", (q) => q.gte("created_at", iso)),
      count("ai_usage", (q) => q.gte("created_at", iso).eq("success", false)),
      count("ocr_requests", (q) => q.gte("created_at", iso)),
      count("ocr_requests", (q) => q.gte("created_at", iso).eq("success", false)),
      count("notes", (q) => q.gte("created_at", iso)),
      count("quizzes", (q) => q.gte("created_at", iso)),
      count("quiz_attempts", (q) => q.gte("completed_at", iso)),
    ]);

    const [{ data: planRows }, { data: tokenRows }, { data: growthRows }, { data: dauRows }, { data: featureRows }, { data: adRows }] =
      await Promise.all([
        sb.from("profiles").select("plan"),
        sb.from("ai_usage").select("input_tokens, output_tokens, created_at").gte("created_at", iso),
        sb.from("profiles").select("created_at").gte("created_at", iso),
        sb.from("study_sessions").select("user_id, started_at").gte("started_at", iso),
        sb.from("feature_usage").select("feature_key").gte("created_at", iso),
        sb.from("ad_settings").select("impressions, clicks, revenue_inr"),
      ]);

    const planCounts: Record<string, number> = { free: 0, plus: 0, pro: 0 };
    for (const r of planRows ?? []) planCounts[r.plan] = (planCounts[r.plan] ?? 0) + 1;

    const tokens = (tokenRows ?? []).reduce(
      (acc: { input: number; output: number }, r: any) => ({
        input: acc.input + (r.input_tokens ?? 0),
        output: acc.output + (r.output_tokens ?? 0),
      }),
      { input: 0, output: 0 },
    );

    const bucket = (rows: any[], field: string) => {
      const map = new Map<string, number>();
      for (let i = days - 1; i >= 0; i--) {
        const d = new Date();
        d.setUTCDate(d.getUTCDate() - i);
        map.set(d.toISOString().slice(0, 10), 0);
      }
      for (const r of rows ?? []) {
        const key = String(r[field]).slice(0, 10);
        if (map.has(key)) map.set(key, (map.get(key) ?? 0) + 1);
      }
      return Array.from(map, ([date, value]) => ({ date: date.slice(5), value }));
    };

    const featureUsage = Object.entries(
      (featureRows ?? []).reduce((acc: Record<string, number>, r: any) => {
        acc[r.feature_key] = (acc[r.feature_key] ?? 0) + 1;
        return acc;
      }, {}),
    ).map(([name, value]) => ({ name, value: value as number }));

    const ads = (adRows ?? []).reduce(
      (acc: any, r: any) => ({
        impressions: acc.impressions + (r.impressions ?? 0),
        clicks: acc.clicks + (r.clicks ?? 0),
        revenue: acc.revenue + Number(r.revenue_inr ?? 0),
      }),
      { impressions: 0, clicks: 0, revenue: 0 },
    );

    const { data: subs } = await sb.from("subscriptions").select("plan_code, status, started_at");
    const activeSubs = (subs ?? []).filter((s: any) => s.status === "active" && s.plan_code !== "free").length;
    const newSubs = (subs ?? []).filter((s: any) => s.started_at >= iso && s.plan_code !== "free").length;
    const { data: planPrices } = await sb.from("plans").select("code, price_inr");
    const priceMap = new Map((planPrices ?? []).map((p: any) => [p.code, p.price_inr]));
    const revenue = (subs ?? [])
      .filter((s: any) => s.status === "active")
      .reduce((sum: number, s: any) => sum + Number(priceMap.get(s.plan_code) ?? 0), 0);

    return {
      users: { total: totalUsers, new: newUsers, active: activeUsers, ...planCounts },
      ai: {
        requests: aiRequests,
        failed: aiFailed,
        inputTokens: tokens.input,
        outputTokens: tokens.output,
        messages: totalMessages,
        messagesInRange,
      },
      usage: { questionsSolved: messagesInRange, ocr: ocrTotal, ocrFailed, notes: notesCount, quizzes, attempts },
      business: { activeSubs, newSubs, revenue, ads },
      charts: {
        userGrowth: bucket(growthRows ?? [], "created_at"),
        dau: bucket(dauRows ?? [], "started_at"),
        aiUsage: bucket(tokenRows ?? [], "created_at"),
        featureUsage,
        planDistribution: Object.entries(planCounts).map(([name, value]) => ({ name, value })),
      },
    };
  });

/* ------------------------------------------------------------------ */
/* User management                                                     */
/* ------------------------------------------------------------------ */

export const adminListUsers = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v: unknown) =>
    z.object({ search: z.string().max(120).optional(), limit: z.number().int().min(1).max(500).default(100) }).parse(v),
  )
  .handler(async ({ context, data }) => {
    const ctx = context as Ctx;
    await assertSuperAdmin(ctx);
    let q = ctx.supabase.from("profiles").select("*").order("created_at", { ascending: false }).limit(data.limit);
    if (data.search) q = q.or(`display_name.ilike.%${data.search}%,email.ilike.%${data.search}%`);
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

export const adminUserDetail = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v: unknown) => z.object({ userId: z.string().uuid() }).parse(v))
  .handler(async ({ context, data }) => {
    const ctx = context as Ctx;
    await assertSuperAdmin(ctx);
    const sb = ctx.supabase;
    const [profile, sub, ai, ocr, files, security, notes, quizzes, sessions] = await Promise.all([
      sb.from("profiles").select("*").eq("id", data.userId).maybeSingle(),
      sb.from("subscriptions").select("*").eq("user_id", data.userId).maybeSingle(),
      sb.from("ai_usage").select("*").eq("user_id", data.userId).order("created_at", { ascending: false }).limit(25),
      sb.from("ocr_requests").select("*").eq("user_id", data.userId).order("created_at", { ascending: false }).limit(25),
      sb.from("files").select("*").eq("user_id", data.userId).order("created_at", { ascending: false }).limit(25),
      sb.from("security_events").select("*").eq("user_id", data.userId).order("created_at", { ascending: false }).limit(25),
      sb.from("notes").select("id", { count: "exact", head: true }).eq("user_id", data.userId),
      sb.from("quizzes").select("id", { count: "exact", head: true }).eq("user_id", data.userId),
      sb.from("study_sessions").select("duration_min").eq("user_id", data.userId),
    ]);
    return {
      profile: profile.data,
      subscription: sub.data,
      aiUsage: ai.data ?? [],
      ocrUsage: ocr.data ?? [],
      files: files.data ?? [],
      securityEvents: security.data ?? [],
      counts: {
        notes: notes.count ?? 0,
        quizzes: quizzes.count ?? 0,
        studyMinutes: (sessions.data ?? []).reduce((s: number, r: any) => s + (r.duration_min ?? 0), 0),
      },
    };
  });

export const adminUpdateUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v: unknown) =>
    z
      .object({
        userId: z.string().uuid(),
        plan: z.enum(["free", "plus", "pro"]).optional(),
        status: z.enum(["active", "suspended"]).optional(),
        display_name: z.string().max(80).optional(),
        class_level: z.string().max(20).optional(),
      })
      .parse(v),
  )
  .handler(async ({ context, data }) => {
    const ctx = context as Ctx;
    const admin = await assertSuperAdmin(ctx);
    const { userId, ...values } = data;
    if (Object.keys(values).length === 0) return { ok: true };
    const { data: prev } = await ctx.supabase.from("profiles").select("*").eq("id", userId).maybeSingle();
    const { error } = await ctx.supabase.from("profiles").update(values).eq("id", userId);
    if (error) throw new Error(error.message);
    if (values.plan) {
      await ctx.supabase
        .from("subscriptions")
        .upsert({ user_id: userId, plan_code: values.plan, status: "active" }, { onConflict: "user_id" });
    }
    await audit(ctx, admin, {
      action: values.status ? `user.${values.status}` : "user.update",
      target_type: "profiles",
      target_id: userId,
      previous_value: prev,
      new_value: values,
    });
    return { ok: true };
  });

export const adminDeleteUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v: unknown) => z.object({ userId: z.string().uuid() }).parse(v))
  .handler(async ({ context, data }) => {
    const ctx = context as Ctx;
    const admin = await assertSuperAdmin(ctx);
    if (data.userId === admin.adminId) throw new Error("You cannot delete your own super admin account");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.auth.admin.deleteUser(data.userId);
    if (error) throw new Error(error.message);
    await audit(ctx, admin, { action: "user.delete", target_type: "auth.users", target_id: data.userId });
    return { ok: true };
  });

export const adminForceLogout = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v: unknown) => z.object({ userId: z.string().uuid() }).parse(v))
  .handler(async ({ context, data }) => {
    const ctx = context as Ctx;
    const admin = await assertSuperAdmin(ctx);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.auth.admin.signOut(data.userId, "global");
    if (error) throw new Error(error.message);
    await ctx.supabase.from("security_events").insert({
      user_id: data.userId,
      event_type: "force_logout",
      severity: "warning",
      detail: "All sessions revoked by super admin",
    });
    await audit(ctx, admin, { action: "user.force_logout", target_type: "auth.users", target_id: data.userId });
    return { ok: true };
  });

/* ------------------------------------------------------------------ */
/* Emergency mode / settings                                           */
/* ------------------------------------------------------------------ */

export const adminSetEmergency = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v: unknown) =>
    z
      .object({
        maintenance_mode: z.boolean().optional(),
        ai_disabled: z.boolean().optional(),
        ocr_disabled: z.boolean().optional(),
        uploads_disabled: z.boolean().optional(),
        registrations_disabled: z.boolean().optional(),
        message: z.string().max(500).optional(),
      })
      .parse(v),
  )
  .handler(async ({ context, data }) => {
    const ctx = context as Ctx;
    const admin = await assertSuperAdmin(ctx);
    const { data: prev } = await ctx.supabase.from("emergency_settings").select("*").maybeSingle();
    const { data: row, error } = await ctx.supabase
      .from("emergency_settings")
      .update(data)
      .eq("id", true)
      .select()
      .single();
    if (error) throw new Error(error.message);
    await audit(ctx, admin, {
      action: "emergency.update",
      target_type: "emergency_settings",
      target_id: "singleton",
      previous_value: prev,
      new_value: data,
    });
    return row;
  });

export const adminSaveSetting = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v: unknown) =>
    z.object({ key: z.string().max(40), value: z.record(z.string(), z.any()) }).parse(v),
  )
  .handler(async ({ context, data }) => {
    const ctx = context as Ctx;
    const admin = await assertSuperAdmin(ctx);
    const { data: prev } = await ctx.supabase
      .from("system_settings")
      .select("*")
      .eq("key", data.key)
      .maybeSingle();
    const { error } = await ctx.supabase
      .from("system_settings")
      .upsert({ key: data.key, value: data.value }, { onConflict: "key" });
    if (error) throw new Error(error.message);
    await audit(ctx, admin, {
      action: "settings.update",
      target_type: "system_settings",
      target_id: data.key,
      previous_value: prev?.value,
      new_value: data.value,
    });
    return { ok: true };
  });

export const adminTestProvider = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v: unknown) => z.object({ model: z.string().max(80) }).parse(v))
  .handler(async ({ context, data }) => {
    const ctx = context as Ctx;
    const admin = await assertSuperAdmin(ctx);
    const started = Date.now();
    try {
      const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env["LOVABLE_API_KEY"]}`,
          "content-type": "application/json",
        },
        body: JSON.stringify({
          model: data.model,
          messages: [{ role: "user", content: "Reply with the single word: ok" }],
        }),
      });
      const ok = res.ok;
      const ms = Date.now() - started;
      await audit(ctx, admin, {
        action: "ai.test",
        target_type: "ai_providers",
        target_id: data.model,
        result: ok ? "success" : `error: HTTP ${res.status}`,
      });
      return { ok, status: res.status, ms };
    } catch (e) {
      return { ok: false, status: 0, ms: Date.now() - started, error: (e as Error).message };
    }
  });

/* ------------------------------------------------------------------ */
/* Reports export                                                      */
/* ------------------------------------------------------------------ */

export const adminExportCsv = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v: unknown) => z.object({ table: tableEnum, limit: z.number().int().max(5000).default(1000) }).parse(v))
  .handler(async ({ context, data }) => {
    const ctx = context as Ctx;
    await assertSuperAdmin(ctx);
    const cfg = TABLES[data.table];
    const { data: rows, error } = await ctx.supabase
      .from(data.table)
      .select("*")
      .order(cfg.order, { ascending: cfg.asc })
      .limit(data.limit);
    if (error) throw new Error(error.message);
    const list = rows ?? [];
    if (list.length === 0) return { csv: "" };
    const cols = Object.keys(list[0]);
    const esc = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const csv = [cols.join(","), ...list.map((r: any) => cols.map((c) => esc(r[c])).join(","))].join("\n");
    return { csv };
  });
