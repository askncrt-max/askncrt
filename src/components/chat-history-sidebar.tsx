import { Link, useNavigate, useParams } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { Plus, MessageSquare, Trash2, Pencil, Check, X, History } from "lucide-react";
import {
  listConversations,
  startConversation,
  renameConversation,
  deleteConversation,
} from "@/lib/conversations.functions";
import { cn } from "@/lib/utils";

export function ChatHistorySidebar({ className }: { className?: string }) {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const params = useParams({ strict: false }) as { threadId?: string };
  const activeId = params.threadId;

  const list = useServerFn(listConversations);
  const start = useServerFn(startConversation);
  const rename = useServerFn(renameConversation);
  const remove = useServerFn(deleteConversation);

  const { data: conversations = [], isLoading } = useQuery({
    queryKey: ["conversations"],
    queryFn: () => list(),
  });

  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState("");

  async function newChat() {
    try {
      const { id } = await start({});
      qc.invalidateQueries({ queryKey: ["conversations"] });
      navigate({ to: "/chat/$threadId", params: { threadId: id } });
    } catch (e: any) {
      toast.error(e?.message || "Could not start a new chat");
    }
  }

  async function commitRename(id: string) {
    const title = draft.trim();
    setEditing(null);
    if (!title) return;
    await rename({ data: { id, title } });
    qc.invalidateQueries({ queryKey: ["conversations"] });
  }

  async function onDelete(id: string) {
    await remove({ data: { id } });
    await qc.invalidateQueries({ queryKey: ["conversations"] });
    if (activeId === id) navigate({ to: "/chat" });
  }

  return (
    <aside
      className={cn(
        "flex w-64 shrink-0 flex-col border-r border-border bg-card/40 backdrop-blur-xl",
        className,
      )}
    >
      <div className="p-3">
        <button
          onClick={newChat}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-primary px-3 py-2.5 text-sm font-semibold text-primary-foreground shadow-glow transition-transform hover:scale-[1.02] active:scale-95"
        >
          <Plus className="size-4" />
          New chat
        </button>
      </div>

      <div className="flex items-center gap-1.5 px-4 pb-1 pt-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
        <History className="size-3" />
        History
      </div>

      <nav className="flex-1 space-y-0.5 overflow-y-auto px-2 pb-4">
        {isLoading && (
          <div className="space-y-1.5 px-2 py-2">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="h-8 animate-pulse rounded-lg bg-muted/60" />
            ))}
          </div>
        )}

        {!isLoading && conversations.length === 0 && (
          <p className="px-3 py-6 text-center text-xs text-muted-foreground">
            No chats yet. Start one above — every conversation is saved here.
          </p>
        )}

        {conversations.map((c: any) => {
          const active = c.id === activeId;
          if (editing === c.id) {
            return (
              <div key={c.id} className="flex items-center gap-1 px-1 py-0.5">
                <input
                  autoFocus
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") commitRename(c.id);
                    if (e.key === "Escape") setEditing(null);
                  }}
                  className="min-w-0 flex-1 rounded-lg border border-border bg-background px-2 py-1.5 text-xs outline-none"
                />
                <button
                  onClick={() => commitRename(c.id)}
                  aria-label="Save title"
                  className="rounded-md p-1 hover:bg-muted"
                >
                  <Check className="size-3.5" />
                </button>
                <button
                  onClick={() => setEditing(null)}
                  aria-label="Cancel rename"
                  className="rounded-md p-1 hover:bg-muted"
                >
                  <X className="size-3.5" />
                </button>
              </div>
            );
          }
          return (
            <div
              key={c.id}
              className={cn(
                "group flex items-center gap-1 rounded-xl pr-1 transition-colors",
                active ? "bg-primary-soft" : "hover:bg-muted/70",
              )}
            >
              <Link
                to="/chat/$threadId"
                params={{ threadId: c.id }}
                className={cn(
                  "flex min-w-0 flex-1 items-center gap-2 rounded-xl px-2.5 py-2 text-xs",
                  active ? "font-semibold text-primary" : "text-foreground/80",
                )}
              >
                <MessageSquare className="size-3.5 shrink-0 opacity-70" />
                <span className="truncate">{c.title || "New chat"}</span>
              </Link>
              <button
                onClick={() => {
                  setEditing(c.id);
                  setDraft(c.title || "");
                }}
                aria-label="Rename chat"
                className="rounded-md p-1 text-muted-foreground opacity-0 hover:bg-background hover:text-foreground group-hover:opacity-100"
              >
                <Pencil className="size-3.5" />
              </button>
              <button
                onClick={() => onDelete(c.id)}
                aria-label="Delete chat"
                className="rounded-md p-1 text-muted-foreground opacity-0 hover:bg-background hover:text-destructive group-hover:opacity-100"
              >
                <Trash2 className="size-3.5" />
              </button>
            </div>
          );
        })}
      </nav>
    </aside>
  );
}
