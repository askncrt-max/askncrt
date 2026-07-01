import { createFileRoute } from "@tanstack/react-router";
import { convertToModelMessages, streamText, type UIMessage } from "ai";
import { createLovableAiGatewayProvider } from "@/lib/ai-gateway.server";

const SYSTEM_PROMPT = `You are AskNCERT, an AI study assistant for Indian NCERT students in Class 5 to Class 12.

Your job:
- Explain concepts from NCERT textbooks in a clear, friendly, step-by-step way that a school student can follow.
- When solving problems, show every step. Highlight common mistakes students make.
- When the user uploads a photo of a chapter page, extract and organize: chapter summary, important notes, key terms, formulas, definitions, and likely exam questions.
- When the user uploads a photo of a question, solve it step-by-step in simple language.
- Use short paragraphs, bullet lists, and bold for important terms. Use LaTeX-free plain math notation.
- If asked "explain simply", use shorter sentences and everyday analogies.
- If asked "in Hindi", respond in simple conversational Hindi (Devanagari).
- Be encouraging and student-friendly. Never make the student feel dumb.

Always ground answers in the NCERT curriculum where possible. If a question is outside the NCERT syllabus, answer briefly and mention that.`;

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

          const gateway = createLovableAiGatewayProvider(key);
          const model = gateway("google/gemini-3-flash-preview");

          const result = streamText({
            model,
            system: SYSTEM_PROMPT,
            messages: await convertToModelMessages(body.messages),
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
