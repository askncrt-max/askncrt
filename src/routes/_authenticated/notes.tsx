import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Search, Trash2, BookOpen, Loader2 } from "lucide-react";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { AppShell } from "@/components/app-shell";
import { listNotes, deleteNote } from "@/lib/notes.functions";

export const Route = createFileRoute("/_authenticated/notes")({
  component: NotesPage,
  head: () => ({
    meta: [
      { title: "Notes — AskNCERT" },
      {
        name: "description",
        content:
          "Save, search and revisit your AI-generated NCERT study notes, summaries and formulas in one place.",
      },
      { property: "og:title", content: "Notes — AskNCERT" },
      {
        property: "og:description",
        content: "Your saved NCERT study notes and summaries.",
      },
      { property: "og:url", content: "https://askncrt.lovable.app/notes" },
    ],
    links: [{ rel: "canonical", href: "https://askncrt.lovable.app/notes" }],
  }),
});

function NotesPage() {
  const list = useServerFn(listNotes);
  const del = useServerFn(deleteNote);
  const qc = useQueryClient();
  const { data: notes = [], isLoading } = useQuery({
    queryKey: ["notes"],
    queryFn: () => list(),
  });
  const [q, setQ] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);

  const delMut = useMutation({
    mutationFn: async (id: string) => del({ data: { id } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["notes"] });
      toast.success("Note deleted");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed to delete"),
  });

  const filtered = notes.filter(
    (n) =>
      !q ||
      n.title.toLowerCase().includes(q.toLowerCase()) ||
      n.content.toLowerCase().includes(q.toLowerCase()),
  );

  const open = notes.find((n) => n.id === openId);

  return (
    <AppShell>
      <div className="mx-auto max-w-4xl px-4 py-8 md:px-8 md:py-12">
        <header className="mb-6">
          <h1 className="font-display text-3xl font-bold tracking-tight">Saved Notes</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Everything you saved from your AI chats, ready to revise.
          </p>
        </header>

        <div className="relative mb-6">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search notes…"
            className="w-full rounded-2xl border border-input bg-card py-3 pl-10 pr-4 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-16 text-muted-foreground">
            <Loader2 className="mr-2 size-4 animate-spin" /> Loading…
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {filtered.map((n) => (
              <button
                key={n.id}
                onClick={() => setOpenId(n.id)}
                className="group animate-fade-up rounded-2xl border border-border bg-card p-4 text-left transition-colors hover:border-primary/40"
              >
                <div className="mb-2 flex items-center gap-2">
                  <div className="grid size-8 place-items-center rounded-lg bg-primary-soft text-primary">
                    <BookOpen className="size-4" />
                  </div>
                  <div className="text-[11px] font-medium uppercase tracking-widest text-muted-foreground">
                    {new Date(n.created_at).toLocaleDateString(undefined, {
                      day: "numeric",
                      month: "short",
                    })}
                  </div>
                </div>
                <div className="line-clamp-1 font-semibold">{n.title}</div>
                <div className="mt-1 line-clamp-3 text-sm text-muted-foreground">{n.content}</div>
              </button>
            ))}
          </div>
        )}

        {open && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setOpenId(null)}>
            <div
              className="max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-card p-6 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mb-4 flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-xl font-bold">{open.title}</h2>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {new Date(open.created_at).toLocaleString()}
                  </p>
                </div>
                <button
                  onClick={() => {
                    if (confirm("Delete this note?")) {
                      delMut.mutate(open.id);
                      setOpenId(null);
                    }
                  }}
                  className="rounded-full p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                  aria-label="Delete"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
              <div className="prose-chat">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{open.content}</ReactMarkdown>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}

function EmptyState() {
  return (
    <div className="rounded-3xl border border-dashed border-border bg-card/50 p-10 text-center">
      <div className="mx-auto grid size-12 place-items-center rounded-2xl bg-primary-soft text-primary">
        <BookOpen className="size-5" />
      </div>
      <p className="mt-4 font-semibold">No notes yet</p>
      <p className="mt-1 text-sm text-muted-foreground">
        Ask the AI a question, then tap "Save note" on any answer.
      </p>
    </div>
  );
}
