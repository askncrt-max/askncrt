import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/** Conversations that actually contain at least one message. */
export const listConversations = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: convos, error } = await context.supabase
      .from("conversations")
      .select("id,title,created_at,updated_at")
      .order("updated_at", { ascending: false })
      .limit(100);
    if (error) throw new Error(error.message);

    const ids = (convos ?? []).map((c) => c.id);
    if (!ids.length) return [];

    const { data: msgs } = await context.supabase
      .from("messages")
      .select("conversation_id")
      .in("conversation_id", ids);

    const withMessages = new Set((msgs ?? []).map((m) => m.conversation_id));
    return (convos ?? []).filter((c) => withMessages.has(c.id));
  });

/**
 * Returns an empty conversation to write into — reuses the newest empty one so
 * repeatedly opening /chat does not litter the database.
 */
export const startConversation = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: recent } = await context.supabase
      .from("conversations")
      .select("id")
      .order("updated_at", { ascending: false })
      .limit(10);

    for (const c of recent ?? []) {
      const { count } = await context.supabase
        .from("messages")
        .select("id", { count: "exact", head: true })
        .eq("conversation_id", c.id);
      if (!count) return { id: c.id as string };
    }

    const { data, error } = await context.supabase
      .from("conversations")
      .insert({ user_id: context.userId, title: "New chat" })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    return { id: data.id as string };
  });

export const getConversation = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v: unknown) => z.object({ id: z.string().uuid() }).parse(v))
  .handler(async ({ context, data }) => {
    const { data: convo, error } = await context.supabase
      .from("conversations")
      .select("id,title,created_at,updated_at")
      .eq("id", data.id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!convo) return null;

    const { data: rows, error: mErr } = await context.supabase
      .from("messages")
      .select("id,client_id,role,content,parts,created_at")
      .eq("conversation_id", data.id)
      .order("created_at", { ascending: true });
    if (mErr) throw new Error(mErr.message);

    const messages = (rows ?? []).map((r) => {
      const parts = Array.isArray(r.parts) && (r.parts as any[]).length
        ? (r.parts as any[])
        : [{ type: "text", text: r.content }];
      return { id: r.client_id ?? r.id, role: r.role as "user" | "assistant", parts };
    });

    return { conversation: convo, messages };
  });

const PartsSchema = z.array(z.any());

export const saveTurn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v: unknown) =>
    z
      .object({
        conversationId: z.string().uuid(),
        messages: z
          .array(
            z.object({
              id: z.string().min(1).max(200),
              role: z.enum(["user", "assistant"]),
              parts: PartsSchema,
            }),
          )
          .max(20),
      })
      .parse(v),
  )
  .handler(async ({ context, data }) => {
    if (!data.messages.length) return { ok: true, title: null as string | null };

    const rows = data.messages.map((m) => {
      // Strip huge inline data URLs before persisting; keep a light placeholder.
      const parts = (m.parts as any[]).map((p) =>
        p?.type === "file" && typeof p.url === "string" && p.url.startsWith("data:")
          ? { ...p, url: "", persisted: false }
          : p,
      );
      const content = parts
        .map((p: any) => (p?.type === "text" ? p.text : ""))
        .join("")
        .slice(0, 100000);
      return {
        conversation_id: data.conversationId,
        user_id: context.userId,
        role: m.role,
        content,
        parts,
        client_id: m.id,
      };
    });

    const { error } = await context.supabase
      .from("messages")
      .upsert(rows, { onConflict: "conversation_id,client_id" });
    if (error) throw new Error(error.message);

    // Auto-title from the first user message
    let title: string | null = null;
    const { data: convo } = await context.supabase
      .from("conversations")
      .select("title")
      .eq("id", data.conversationId)
      .maybeSingle();
    if (convo && (convo.title === "New chat" || !convo.title)) {
      const firstUser = data.messages.find((m) => m.role === "user");
      const raw = (firstUser?.parts as any[])
        ?.map((p: any) => (p?.type === "text" ? p.text : ""))
        .join("")
        .trim();
      if (raw) {
        title = raw.replace(/\s+/g, " ").slice(0, 60) + (raw.length > 60 ? "…" : "");
        await context.supabase
          .from("conversations")
          .update({ title })
          .eq("id", data.conversationId);
      }
    }

    await context.supabase
      .from("conversations")
      .update({ updated_at: new Date().toISOString() })
      .eq("id", data.conversationId);

    return { ok: true, title };
  });

export const renameConversation = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v: unknown) =>
    z.object({ id: z.string().uuid(), title: z.string().min(1).max(120) }).parse(v),
  )
  .handler(async ({ context, data }) => {
    const { error } = await context.supabase
      .from("conversations")
      .update({ title: data.title })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteConversation = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v: unknown) => z.object({ id: z.string().uuid() }).parse(v))
  .handler(async ({ context, data }) => {
    const { error } = await context.supabase.from("conversations").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
