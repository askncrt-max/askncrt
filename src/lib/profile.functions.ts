import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { PRIVACY_VERSION, TERMS_VERSION } from "@/lib/legal-versions";

export const getProfile = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("profiles")
      .select("*")
      .eq("id", context.userId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return data;
  });

const UpdateInput = z.object({
  display_name: z.string().max(80).optional(),
  class_level: z.string().max(20).optional(),
  language: z.enum(["english", "hindi"]).optional(),
});

export const updateProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v: unknown) => UpdateInput.parse(v))
  .handler(async ({ context, data }) => {
    const { error, data: row } = await context.supabase
      .from("profiles")
      .update(data)
      .eq("id", context.userId)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return row;
  });

export const acceptLegalPolicies = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v: unknown) =>
    z
      .object({
        termsVersion: z.literal(TERMS_VERSION),
        privacyVersion: z.literal(PRIVACY_VERSION),
      })
      .parse(v),
  )
  .handler(async ({ context, data }) => {
    const { data: row, error } = await context.supabase
      .from("profiles")
      .update({
        legal_terms_version: data.termsVersion,
        legal_privacy_version: data.privacyVersion,
        legal_accepted_at: new Date().toISOString(),
      })
      .eq("id", context.userId)
      .select("id")
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!row) throw new Error("Your profile could not be updated. Please try again.");
    return { ok: true };
  });

export const deleteMyAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const userId = context.userId;
    const { data: role, error: roleError } = await context.supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .maybeSingle();

    if (roleError) throw new Error("We couldn't verify this account. Please try again.");
    if (role?.role === "super_admin") {
      throw new Error("The Super Admin account cannot be deleted from student settings.");
    }

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const admin = supabaseAdmin as any;
    const ownedTables = [
      "achievements",
      "ai_usage",
      "feature_usage",
      "files",
      "goals",
      "messages",
      "notes",
      "ocr_requests",
      "planner_tasks",
      "quiz_attempts",
      "quiz_questions",
      "quizzes",
      "reminders",
      "security_events",
      "study_sessions",
      "subscriptions",
      "user_memory",
    ];

    for (const table of ownedTables) {
      const { error } = await admin.from(table).delete().eq("user_id", userId);
      if (error) throw new Error("We couldn't finish removing your saved data. Please retry.");
    }

    const { error: targetedNotificationsError } = await admin
      .from("notifications")
      .delete()
      .eq("target_user_id", userId);
    if (targetedNotificationsError) {
      throw new Error("We couldn't finish removing your saved data. Please retry.");
    }

    // Keep the platform's administrative audit event, but remove data that identifies this target.
    const { error: auditError } = await admin
      .from("audit_logs")
      .update({ target_id: null, previous_value: null, new_value: null })
      .eq("target_id", userId);
    if (auditError) throw new Error("We couldn't finish removing account references. Please retry.");

    const { error: authError } = await admin.auth.admin.deleteUser(userId);
    if (authError) throw new Error("Your saved data was removed, but account closure did not finish. Please retry.");

    return { ok: true };
  });
