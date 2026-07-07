import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const Category = z.enum(["profile", "preference", "goal", "fact"]);
const Source = z.enum(["manual", "inferred"]);

export const listMemory = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("user_memory")
      .select("*")
      .eq("user_id", context.userId)
      .order("category", { ascending: true })
      .order("updated_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

const UpsertInput = z.object({
  id: z.string().uuid().optional(),
  key: z.string().min(1).max(120),
  value: z.string().min(1).max(2000),
  category: Category.default("fact"),
  source: Source.default("manual"),
});

export const upsertMemory = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v: unknown) => UpsertInput.parse(v))
  .handler(async ({ context, data }) => {
    const row = {
      user_id: context.userId,
      key: data.key,
      value: data.value,
      category: data.category,
      source: data.source,
    };
    const { data: out, error } = await context.supabase
      .from("user_memory")
      .upsert(row, { onConflict: "user_id,key" })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return out;
  });

export const deleteMemory = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v: unknown) => z.object({ id: z.string().uuid() }).parse(v))
  .handler(async ({ context, data }) => {
    const { error } = await context.supabase
      .from("user_memory")
      .delete()
      .eq("id", data.id)
      .eq("user_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
