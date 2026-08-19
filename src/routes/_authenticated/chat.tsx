import { createFileRoute, Outlet, useLocation } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { History, X } from "lucide-react";
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
  const [open, setOpen] = useState(false);
  const location = useLocation();

  // Close the mobile history drawer whenever the thread changes.
  useEffect(() => setOpen(false), [location.pathname]);

  return (
    <AppShell>
      <div className="flex h-[100dvh] md:h-screen">
        <ChatHistorySidebar className="hidden lg:flex" />
        <Outlet />
      </div>

      {/* Mobile / tablet history trigger */}
      <button
        onClick={() => setOpen(true)}
        aria-label="Chat history"
        className="fixed bottom-24 right-4 z-20 grid size-11 place-items-center rounded-full border border-border bg-card text-foreground shadow-soft lg:hidden"
      >
        <History className="size-4" />
      </button>

      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button
            aria-label="Close history"
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-background/70 backdrop-blur-sm"
          />
          <div className="absolute inset-y-0 left-0 flex">
            <ChatHistorySidebar className="animate-fade-up flex bg-card shadow-soft" />
            <button
              onClick={() => setOpen(false)}
              aria-label="Close history"
              className="m-2 grid size-9 self-start place-items-center rounded-full border border-border bg-card"
            >
              <X className="size-4" />
            </button>
          </div>
        </div>
      )}
    </AppShell>
  );
}
