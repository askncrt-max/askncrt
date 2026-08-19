import { createFileRoute, Outlet } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { ChatHistorySidebar } from "@/components/chat-history-sidebar";

export const Route = createFileRoute("/_authenticated/chat")({
  component: ChatLayout,
  head: () => ({
    meta: [
      { title: "Chat — AskNCERT" },
      {
        name: "description",
        content:
          "Chat with AskNCERT's AI tutor: ask NCERT questions, upload chapter photos or PDFs, and get instant explanations. Every conversation is saved to your history.",
      },
      { property: "og:title", content: "Chat — AskNCERT" },
      {
        property: "og:description",
        content: "Ask NCERT questions and get instant AI-powered explanations.",
      },
      { property: "og:url", content: "https://askncrt.lovable.app/chat" },
    ],
    links: [{ rel: "canonical", href: "https://askncrt.lovable.app/chat" }],
  }),
});

function ChatLayout() {
  return (
    <AppShell>
      <div className="flex h-[100dvh] md:h-screen">
        <ChatHistorySidebar className="hidden lg:flex" />
        <Outlet />
      </div>
    </AppShell>
  );
}
