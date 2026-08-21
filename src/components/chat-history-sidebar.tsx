import { Link, useNavigate, useParams } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Plus, MessageSquare, Trash2, Pencil, History, MoreHorizontal } from "lucide-react";
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

  const [menuFor, setMenuFor] = useState<string | null>(null);
  const [renaming, setRenaming] = useState<{ id: string; title: string } | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<{ id: string; title: string } | null>(null);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!menuFor) return;
    const close = () => setMenuFor(null);
    window.addEventListener("click", close);
    return () => window.removeEventListener("click", close);
  }, [menuFor]);

  async function newChat() {
    try {
      const { id } = await start({});
      qc.invalidateQueries({ queryKey: ["conversations"] });
      navigate({ to: "/chat/$threadId", params: { threadId: id } });
    } catch (e: any) {
      toast.error(e?.message || "Could not start a new chat");
    }
  }

  async function commitRename() {
    const target = renaming;
    const title = draft.trim();
    if (!target || !title) {
      setRenaming(null);
      return;
    }
    setBusy(true);
    try {
      await rename({ data: { id: target.id, title } });
      await qc.invalidateQueries({ queryKey: ["conversations"] });
      await qc.invalidateQueries({ queryKey: ["conversation", target.id] });
      setRenaming(null);
      toast.success("Chat renamed");
    } catch (e: any) {
      toast.error(e?.message || "Couldn't rename this chat");
    } finally {
      setBusy(false);
    }
  }

  async function onDelete(id: string) {
    setBusy(true);
    try {
      await remove({ data: { id } });
      await qc.invalidateQueries({ queryKey: ["conversations"] });
      setConfirmDelete(null);
      toast.success("Chat deleted");
      if (activeId === id) navigate({ to: "/chat" });
    } catch (e: any) {
      toast.error(e?.message || "Couldn't delete this chat");
    } finally {
      setBusy(false);
    }
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
          return (
            <div
              key={c.id}
              className={cn(
                "group relative flex items-center gap-1 rounded-xl pr-1 transition-colors",
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
                onClick={(e) => {
                  e.stopPropagation();
                  setMenuFor((m) => (m === c.id ? null : c.id));
                }}
                aria-label="Chat options"
                aria-haspopup="menu"
                aria-expanded={menuFor === c.id}
                className="rounded-md p-1 text-muted-foreground hover:bg-background hover:text-foreground"
              >
                <MoreHorizontal className="size-3.5" />
              </button>
              {menuFor === c.id && (
                <div
                  role="menu"
                  onClick={(e) => e.stopPropagation()}
                  className="absolute right-1 top-9 z-30 w-36 overflow-hidden rounded-xl border border-border bg-card py-1 shadow-soft"
                >
                  <button
                    role="menuitem"
                    onClick={() => {
                      setMenuFor(null);
                      setDraft(c.title || "");
                      setRenaming({ id: c.id, title: c.title || "New chat" });
                    }}
                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs font-medium hover:bg-muted"
                  >
                    <Pencil className="size-3.5" /> Rename
                  </button>
                  <button
                    role="menuitem"
                    onClick={() => {
                      setMenuFor(null);
                      setConfirmDelete({ id: c.id, title: c.title || "New chat" });
                    }}
                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs font-medium text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="size-3.5" /> Delete
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {renaming && (
        <Modal onClose={() => setRenaming(null)} title="Rename chat">
          <input
            autoFocus
            value={draft}
            maxLength={120}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") commitRename();
              if (e.key === "Escape") setRenaming(null);
            }}
            placeholder="e.g. Science Chapter 1"
            className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary/50"
          />
          <div className="mt-4 flex justify-end gap-2">
            <button
              onClick={() => setRenaming(null)}
              className="rounded-full px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted"
            >
              Cancel
            </button>
            <button
              onClick={commitRename}
              disabled={busy || !draft.trim()}
              className="rounded-full bg-primary px-4 py-1.5 text-xs font-semibold text-primary-foreground disabled:opacity-50"
            >
              Save
            </button>
          </div>
        </Modal>
      )}

      {confirmDelete && (
        <Modal onClose={() => setConfirmDelete(null)} title="Delete chat?">
          <p className="text-xs text-muted-foreground">
            “{confirmDelete.title}” and all of its messages will be permanently deleted. This can't
            be undone.
          </p>
          <div className="mt-4 flex justify-end gap-2">
            <button
              onClick={() => setConfirmDelete(null)}
              className="rounded-full px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted"
            >
              Cancel
            </button>
            <button
              onClick={() => onDelete(confirmDelete.id)}
              disabled={busy}
              className="rounded-full bg-destructive px-4 py-1.5 text-xs font-semibold text-destructive-foreground disabled:opacity-50"
            >
              Delete
            </button>
          </div>
        </Modal>
      )}
    </aside>
  );
}

function Modal({
  title,
  children,
  onClose,
}: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center p-4">
      <button
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 bg-background/70 backdrop-blur-sm"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="animate-fade-up relative w-full max-w-sm rounded-2xl border border-border bg-card p-5 shadow-soft"
      >
        <h2 className="mb-3 text-sm font-semibold">{title}</h2>
        {children}
      </div>
    </div>
  );
}
