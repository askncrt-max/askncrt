import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import type { UIMessage } from "ai";
import { UserPlus, Sparkles, RotateCcw } from "lucide-react";
import { ChatWindow } from "@/components/chat-window";

const KEY = "askncert-guest-chat";

export const Route = createFileRoute("/guest")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Try AskNCERT free — Guest AI study chat for NCERT students" },
      {
        name: "description",
        content:
          "Ask NCERT doubts instantly as a guest — no sign up needed. Sign in free to save chats, notes, quizzes and your study planner.",
      },
      { property: "og:title", content: "Try AskNCERT free — Guest AI study chat" },
      {
        property: "og:description",
        content: "Chat with the AskNCERT AI tutor as a guest. Sign in to save your history.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://askncrt.lovable.app/guest" }],
  }),
  component: GuestChat,
});

function loadGuestMessages(): UIMessage[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = sessionStorage.getItem(KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    return Array.isArray(parsed) ? (parsed as UIMessage[]) : [];
  } catch {
    return [];
  }
}

function GuestChat() {
  // Guest chats live only in this browser session — never in the account.
  const [sessionKey, setSessionKey] = useState(0);
  const initial = useMemo(() => loadGuestMessages(), [sessionKey]);
  const threadId = useMemo(
    () => (typeof crypto !== "undefined" ? crypto.randomUUID() : `guest-${sessionKey}`),
    [sessionKey],
  );
  const latest = useRef<UIMessage[]>(initial);

  useEffect(() => {
    const save = () => {
      try {
        sessionStorage.setItem(KEY, JSON.stringify(latest.current.slice(-40)));
      } catch {
        /* quota — guest history is disposable */
      }
    };
    const t = setInterval(save, 2000);
    window.addEventListener("beforeunload", save);
    return () => {
      clearInterval(t);
      window.removeEventListener("beforeunload", save);
      save();
    };
  }, []);

  return (
    <div className="mesh-bg flex h-dvh flex-col">
      <header className="flex flex-wrap items-center gap-2 border-b border-border/60 bg-card/60 px-4 py-2.5 backdrop-blur">
        <Link to="/" className="flex items-center gap-2 font-semibold">
          <span className="grid size-7 place-items-center rounded-xl bg-primary text-primary-foreground">
            <Sparkles className="size-4" />
          </span>
          AskNCERT
        </Link>
        <span className="rounded-full bg-amber-500/15 px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-amber-600 dark:text-amber-400">
          Guest mode
        </span>
        <span className="hidden text-xs text-muted-foreground sm:inline">
          Chats aren't saved. Sign in free to keep history, notes, quizzes & planner.
        </span>
        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={() => {
              try {
                sessionStorage.removeItem(KEY);
              } catch {
                /* ignore */
              }
              latest.current = [];
              setSessionKey((k) => k + 1);
            }}
            className="flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-medium hover:bg-muted"
          >
            <RotateCcw className="size-3.5" /> New chat
          </button>
          <Link
            to="/auth"
            className="flex items-center gap-1.5 rounded-full bg-primary px-3.5 py-1.5 text-xs font-semibold text-primary-foreground"
          >
            <UserPlus className="size-3.5" /> Sign in free
          </Link>
        </div>
      </header>

      <div className="min-h-0 flex-1">
        <ChatWindow
          key={threadId}
          guest
          threadId={threadId}
          initialMessages={initial}
          title="Guest chat"
          onMessagesChange={(m) => {
            latest.current = m;
          }}
        />
      </div>
    </div>
  );
}
