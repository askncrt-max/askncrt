import { createFileRoute } from "@tanstack/react-router";
import { convertToModelMessages, streamText, tool, stepCountIs, type UIMessage } from "ai";
import { z } from "zod";
import { createLovableAiGatewayProvider } from "@/lib/ai-gateway.server";

const SYSTEM_PROMPT = `You are AskNCERT, an AI study assistant for Indian NCERT students in Class 5 to Class 12.

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

          const gateway = createLovableAiGatewayProvider(key);
          const model = gateway("google/gemini-3-flash-preview");

          const tools = firecrawlKey
            ? {
                web_search: tool({
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
                }),
              }
            : undefined;

          const result = streamText({
            model,
            system: SYSTEM_PROMPT,
            messages: await convertToModelMessages(body.messages),
            tools,
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
