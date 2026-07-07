import { createFileRoute } from "@tanstack/react-router";
import { convertToModelMessages, streamText, tool, stepCountIs, type UIMessage } from "ai";
import { z } from "zod";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { createLovableAiGatewayProvider } from "@/lib/ai-gateway.server";

const BASE_SYSTEM = `You are AskNCERT, an AI study assistant for Indian NCERT students in Class 5 to Class 12.

Your job:
- Explain concepts from NCERT textbooks clearly, step-by-step, in a friendly way.
- Solve problems with every step shown. Highlight common mistakes.
- When the user uploads a photo of a chapter page, extract chapter summary, notes, key terms, formulas, definitions, and likely exam questions.
- When the user uploads a photo of a question, solve it step-by-step.
- Use rich Markdown: headings (##, ###), **bold**, *italic*, bullet/numbered lists, tables, blockquotes, \`inline code\`, and fenced \`\`\`code blocks\`\`\` with a language tag.
- Use LaTeX math with $...$ for inline and $$...$$ for display equations. Example: $E = mc^2$ or $$\\int_0^1 x^2 \\, dx = \\frac{1}{3}$$.
- If asked "explain simply", use everyday analogies. If asked "in Hindi", reply in simple Devanagari Hindi.
- Be encouraging and student-friendly.

You have a web_search tool for LATEST, up-to-date information from Google, Reddit, Wikipedia, news sites, and the wider web.
USE web_search whenever:
- The user asks about current events, latest news, recent updates, exam dates, board notifications, syllabus changes, NCERT updates.
- The question is time-sensitive ("aaj", "abhi", "latest", "2026", "current", "news", "update").
- You are unsure of a fact or it may have changed recently.
- The user asks about something outside the core textbook (a company, person, event, product, sports score, etc.).

CITATION RULES — STRICT:
- NEVER fabricate URLs, titles, or sources. Only reference URLs that were actually returned by the web_search tool.
- Do NOT add a manual "Sources" list at the end of your answer — sources from web_search are displayed automatically below your message as beautiful cards. Just write a clean answer.
- If web_search returned no useful results, say so plainly instead of inventing links.

MEMORY:
- You have a remember_fact tool. Call it silently (without announcing) when the user shares a lasting fact worth remembering: their class, board, subjects, exam date, weak topic, preferred language, learning style, goal, name, etc.
- Do NOT call remember_fact for one-off questions, moods, or trivia.
- Never mention the tool by name; if the user asks what you remember, describe it in natural language.

Always ground curriculum answers in NCERT. If a topic is outside NCERT syllabus, answer briefly and say so.`;

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const body = (await request.json()) as { messages?: UIMessage[] };
          if (!Array.isArray(body.messages)) {
            return new Response("Messages required", { status: 400 });
          }
          const key = process.env.LOVABLE_API_KEY;
          if (!key) return new Response("Missing LOVABLE_API_KEY", { status: 500 });

          const firecrawlKey = process.env.FIRECRAWL_API_KEY;

          // Load memory for the signed-in user (best-effort; no auth = anonymous mode)
          let memoryBlock = "";
          let userId: string | undefined;
          let userSb: SupabaseClient<Database> | null = null;
          try {
            const authHeader = request.headers.get("authorization");
            if (authHeader?.startsWith("Bearer ")) {
              const token = authHeader.slice(7);
              userSb = createClient<Database>(
                process.env.SUPABASE_URL!,
                process.env.SUPABASE_PUBLISHABLE_KEY!,
                {
                  auth: { persistSession: false, autoRefreshToken: false },
                  global: { headers: { Authorization: authHeader } },
                },
              );
              const { data: userRes } = await userSb.auth.getUser(token);
              userId = userRes.user?.id;
              if (userId) {
                const [{ data: profile }, { data: memories }] = await Promise.all([
                  userSb.from("profiles").select("*").eq("id", userId).maybeSingle(),
                  userSb
                    .from("user_memory")
                    .select("key,value,category")
                    .eq("user_id", userId)
                    .limit(60),
                ]);
                const lines: string[] = [];
                if (profile) {
                  const p = profile as any;
                  if (p.display_name) lines.push(`Name: ${p.display_name}`);
                  if (p.class_level) lines.push(`Class: ${p.class_level}`);
                  if (p.board) lines.push(`Board: ${p.board}`);
                  if (p.language) lines.push(`Preferred language: ${p.language}`);
                  if (Array.isArray(p.subjects) && p.subjects.length)
                    lines.push(`Subjects: ${p.subjects.join(", ")}`);
                  if (p.learning_style) lines.push(`Learning style: ${p.learning_style}`);
                  if (p.goals) lines.push(`Goals: ${p.goals}`);
                }
                if (Array.isArray(memories)) {
                  for (const m of memories as any[]) {
                    lines.push(`${m.key}: ${m.value}`);
                  }
                }
                if (lines.length) {
                  const joined = lines.join("\n").slice(0, 1500);
                  memoryBlock = `\n\nUSER MEMORY (personalize answers using these facts, do not read them back verbatim unless asked):\n${joined}`;
                }
              }
            }
          } catch (e) {
            console.warn("memory load failed", e);
          }

          const gateway = createLovableAiGatewayProvider(key);
          const model = gateway("google/gemini-3-flash-preview");

          const tools: Record<string, any> = {};

          if (firecrawlKey) {
            tools.web_search = tool({
              description:
                "Search the live web (Google, Reddit, Wikipedia, news, etc.) for up-to-date information. Use for latest news, current events, recent updates, or anything time-sensitive.",
              inputSchema: z.object({
                query: z.string().describe("Search query in English or Hindi"),
                recency: z
                  .enum(["day", "week", "month", "year", "any"])
                  .optional()
                  .describe("Restrict results to this recency window"),
              }),
              execute: async ({ query, recency }) => {
                try {
                  const { default: Firecrawl } = await import("@mendable/firecrawl-js");
                  const fc = new Firecrawl({ apiKey: firecrawlKey });
                  const tbsMap: Record<string, string> = {
                    day: "qdr:d",
                    week: "qdr:w",
                    month: "qdr:m",
                    year: "qdr:y",
                  };
                  const res: any = await fc.search(query, {
                    limit: 6,
                    ...(recency && recency !== "any" ? { tbs: tbsMap[recency] } : {}),
                  });
                  const raw = res?.web ?? res?.data ?? res?.results?.web ?? [];
                  const results = (Array.isArray(raw) ? raw : []).slice(0, 6).map((r: any) => ({
                    title: r.title ?? r.name ?? "",
                    url: r.url ?? r.link ?? "",
                    snippet: r.description ?? r.snippet ?? r.summary ?? "",
                  }));
                  return { query, results };
                } catch (e) {
                  return { query, error: e instanceof Error ? e.message : "search failed", results: [] };
                }
              },
            });
          }

          if (userId && userSb) {
            const sb = userSb;
            const uid = userId;
            tools.remember_fact = tool({
              description:
                "Silently save a lasting fact about the user (class, board, subjects, exam date, weak topic, learning style, goal, name, etc.). Do not announce that you saved it.",
              inputSchema: z.object({
                key: z.string().min(1).max(120).describe("Short label, e.g. 'Class', 'Board', 'Weak topic'"),
                value: z.string().min(1).max(1000).describe("The fact itself"),
                category: z
                  .enum(["profile", "preference", "goal", "fact"])
                  .default("fact"),
              }),
              execute: async ({ key, value, category }) => {
                try {
                  const row: any = {
                    user_id: uid,
                    key,
                    value,
                    category,
                    source: "inferred",
                  };
                  const { error } = await sb
                    .from("user_memory")
                    .upsert(row, { onConflict: "user_id,key" });
                  if (error) return { ok: false, error: error.message };
                  return { ok: true };
                } catch (e) {
                  return { ok: false, error: e instanceof Error ? e.message : "save failed" };
                }
              },
            });
          }

          const result = streamText({
            model,
            system: BASE_SYSTEM + memoryBlock,
            messages: await convertToModelMessages(body.messages),
            tools: Object.keys(tools).length ? tools : undefined,
            stopWhen: stepCountIs(50),
          });

          return result.toUIMessageStreamResponse({ originalMessages: body.messages });
        } catch (e) {
          console.error("chat error", e);
          const msg = e instanceof Error ? e.message : "Unknown error";
          return new Response(msg, { status: 500 });
        }
      },
    },
  },
});
