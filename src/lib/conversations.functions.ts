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
      .eq("user_id", context.userId)
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
      .eq("user_id", context.userId)
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
      .select("id,title,created_at,updated_at,title_custom")
      .eq("id", data.id)
      .eq("user_id", context.userId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!convo) return null;

    const { data: rows, error: mErr } = await context.supabase
      .from("messages")
      .select("id,client_id,role,content,parts,created_at")
      .eq("conversation_id", data.id)
      .eq("user_id", context.userId)
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

    // Ownership check — never write into someone else's conversation.
    const { data: owned } = await context.supabase
      .from("conversations")
      .select("id")
      .eq("id", data.conversationId)
      .eq("user_id", context.userId)
      .maybeSingle();
    if (!owned) throw new Error("Conversation not found");

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
      .select("title,title_custom")
      .eq("id", data.conversationId)
      .eq("user_id", context.userId)
      .maybeSingle();
    if (convo && !convo.title_custom && (convo.title === "New chat" || !convo.title)) {
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
          .eq("id", data.conversationId)
          .eq("user_id", context.userId);
      }
    }

    await context.supabase
      .from("conversations")
      .update({ updated_at: new Date().toISOString() })
      .eq("id", data.conversationId)
      .eq("user_id", context.userId);

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
      .update({ title: data.title, title_custom: true })
      .eq("id", data.id)
      .eq("user_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteConversation = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v: unknown) => z.object({ id: z.string().uuid() }).parse(v))
  .handler(async ({ context, data }) => {
    const { error } = await context.supabase.from("conversations").delete().eq("id", data.id).eq("user_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/** Ordered message rows of a conversation the caller owns. */
async function ownedMessages(
  supabase: any,
  userId: string,
  conversationId: string,
): Promise<Array<{ id: string; client_id: string | null; role: string }>> {
  const { data: convo } = await supabase
    .from("conversations")
    .select("id")
    .eq("id", conversationId)
    .eq("user_id", userId)
    .maybeSingle();
  if (!convo) throw new Error("Conversation not found");

  const { data: rows, error } = await supabase
    .from("messages")
    .select("id,client_id,role,created_at")
    .eq("conversation_id", conversationId)
    .eq("user_id", userId)
    .order("created_at", { ascending: true });
  if (error) throw new Error(error.message);
  return rows ?? [];
}

const MessageRef = z.object({
  conversationId: z.string().uuid(),
  messageId: z.string().min(1).max(200),
});

/**
 * Deletes one of the caller's own questions plus the AI answer(s) that
 * directly followed it. The rest of the conversation stays intact.
 */
export const deleteMessageTurn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v: unknown) => MessageRef.parse(v))
  .handler(async ({ context, data }) => {
    const rows = await ownedMessages(context.supabase, context.userId, data.conversationId);
    const idx = rows.findIndex((r) => r.client_id === data.messageId || r.id === data.messageId);
    if (idx === -1) return { ok: true, deleted: 0 };
    if (rows[idx]!.role !== "user") throw new Error("Only your own questions can be deleted");

    const ids = [rows[idx]!.id];
    for (let i = idx + 1; i < rows.length && rows[i]!.role === "assistant"; i++) ids.push(rows[i]!.id);

    const { error } = await context.supabase
      .from("messages")
      .delete()
      .in("id", ids)
      .eq("user_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true, deleted: ids.length };
  });

/**
 * Used when editing a question: removes that question and everything after it
 * so the edited question and its fresh answer replace the old turn.
 */
export const truncateFromMessage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v: unknown) => MessageRef.parse(v))
  .handler(async ({ context, data }) => {
    const rows = await ownedMessages(context.supabase, context.userId, data.conversationId);
    const idx = rows.findIndex((r) => r.client_id === data.messageId || r.id === data.messageId);
    if (idx === -1) return { ok: true, deleted: 0 };
    if (rows[idx]!.role !== "user") throw new Error("Only your own questions can be edited");

    const ids = rows.slice(idx).map((r) => r.id);
    const { error } = await context.supabase
      .from("messages")
      .delete()
      .in("id", ids)
      .eq("user_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true, deleted: ids.length };
  });
