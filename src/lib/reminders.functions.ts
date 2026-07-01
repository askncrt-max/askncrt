import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const listReminders = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("reminders")
      .select("*")
      .order("due_at", { ascending: true });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

const CreateInput = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  reminder_type: z.enum(["study", "homework", "exam", "goal"]),
  due_at: z.string(),
});

export const createReminder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v: unknown) => CreateInput.parse(v))
  .handler(async ({ context, data }) => {
    const { error, data: row } = await context.supabase
      .from("reminders")
      .insert({ ...data, user_id: context.userId })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return row;
  });

export const toggleReminder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v: unknown) => z.object({ id: z.string().uuid(), completed: z.boolean() }).parse(v))
  .handler(async ({ context, data }) => {
    const { error } = await context.supabase
      .from("reminders")
      .update({ completed: data.completed })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteReminder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v: unknown) => z.object({ id: z.string().uuid() }).parse(v))
  .handler(async ({ context, data }) => {
    const { error } = await context.supabase.from("reminders").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
