import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Plus, Check, Trash2, Calendar, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/app-shell";
import { listReminders, createReminder, toggleReminder, deleteReminder } from "@/lib/reminders.functions";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/planner")({
  component: PlannerPage,
  head: () => ({
    meta: [
      { title: "Study planner — AskNCERT" },
      {
        name: "description",
        content:
          "Plan your NCERT study sessions, homework and exams with AskNCERT's reminders and daily goals.",
      },
      { property: "og:title", content: "Study planner — AskNCERT" },
      {
        property: "og:description",
        content: "Reminders and daily goals for NCERT Class 5-12 students.",
      },
      { property: "og:url", content: "https://askncrt.lovable.app/planner" },
    ],
    links: [{ rel: "canonical", href: "https://askncrt.lovable.app/planner" }],
  }),
});

const TYPES = [
  { value: "study", label: "Study" },
  { value: "homework", label: "Homework" },
  { value: "exam", label: "Exam" },
  { value: "goal", label: "Daily goal" },
] as const;

function PlannerPage() {
  const list = useServerFn(listReminders);
  const create = useServerFn(createReminder);
  const toggle = useServerFn(toggleReminder);
  const del = useServerFn(deleteReminder);
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);

  const { data: reminders = [], isLoading } = useQuery({
    queryKey: ["reminders"],
    queryFn: () => list(),
  });

  const createMut = useMutation({
    mutationFn: (data: any) => create({ data }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["reminders"] });
      setShowForm(false);
      toast.success("Reminder added");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed"),
  });

  const toggleMut = useMutation({
    mutationFn: (v: { id: string; completed: boolean }) => toggle({ data: v }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["reminders"] }),
  });

  const delMut = useMutation({
    mutationFn: (id: string) => del({ data: { id } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["reminders"] }),
  });

  const upcoming = reminders.filter((r) => !r.completed);
  const done = reminders.filter((r) => r.completed);

  return (
    <AppShell>
      <div className="mx-auto max-w-3xl px-4 py-8 md:px-8 md:py-12">
        <header className="mb-6 flex items-start justify-between gap-3">
          <div>
            <h1 className="font-display text-3xl font-bold tracking-tight">Study Planner</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Homework, exams, and daily goals — never miss a session.
            </p>
          </div>
          <button
            onClick={() => setShowForm((v) => !v)}
            className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-glow hover:opacity-90"
          >
            <Plus className="size-4" />
            New
          </button>
        </header>

        {showForm && <NewForm onCancel={() => setShowForm(false)} onSubmit={(d) => createMut.mutate(d)} pending={createMut.isPending} />}

        {isLoading ? (
          <div className="flex items-center justify-center py-16 text-muted-foreground">
            <Loader2 className="mr-2 size-4 animate-spin" /> Loading…
          </div>
        ) : reminders.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-border bg-card/50 p-10 text-center">
            <div className="mx-auto grid size-12 place-items-center rounded-2xl bg-primary-soft text-primary">
              <Calendar className="size-5" />
            </div>
            <p className="mt-4 font-semibold">Plan your first task</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Add homework deadlines, exam dates, or a daily study goal.
            </p>
          </div>
        ) : (
          <>
            <Section title="Upcoming">
              {upcoming.map((r) => (
                <Row
                  key={r.id}
                  r={r}
                  onToggle={() => toggleMut.mutate({ id: r.id, completed: true })}
                  onDelete={() => delMut.mutate(r.id)}
                />
              ))}
              {upcoming.length === 0 && (
                <p className="rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                  All caught up. Great work!
                </p>
              )}
            </Section>
            {done.length > 0 && (
              <Section title="Completed">
                {done.map((r) => (
                  <Row
                    key={r.id}
                    r={r}
                    onToggle={() => toggleMut.mutate({ id: r.id, completed: false })}
                    onDelete={() => delMut.mutate(r.id)}
                  />
                ))}
              </Section>
            )}
          </>
        )}
      </div>
    </AppShell>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-6">
      <h2 className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">{title}</h2>
      <div className="space-y-2">{children}</div>
    </section>
  );
}

function Row({ r, onToggle, onDelete }: { r: any; onToggle: () => void; onDelete: () => void }) {
  return (
    <div className="animate-fade-up flex items-center gap-3 rounded-2xl border border-border bg-card p-3">
      <button
        onClick={onToggle}
        aria-label={r.completed ? "Mark incomplete" : "Mark complete"}
        className={cn(
          "grid size-8 place-items-center rounded-full border-2 transition-colors",
          r.completed ? "border-primary bg-primary text-primary-foreground" : "border-border text-transparent hover:border-primary",
        )}
      >
        <Check className="size-4" />
      </button>
      <div className="min-w-0 flex-1">
        <div className={cn("text-sm font-semibold", r.completed && "text-muted-foreground line-through")}>
          {r.title}
        </div>
        <div className="mt-0.5 text-xs text-muted-foreground">
          {TYPES.find((t) => t.value === r.reminder_type)?.label} · {new Date(r.due_at).toLocaleString(undefined, { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
        </div>
        {r.description && <div className="mt-1 text-xs text-muted-foreground">{r.description}</div>}
      </div>
      <button onClick={onDelete} className="rounded-full p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive" aria-label="Delete">
        <Trash2 className="size-4" />
      </button>
    </div>
  );
}

function NewForm({ onCancel, onSubmit, pending }: { onCancel: () => void; onSubmit: (d: any) => void; pending: boolean }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<(typeof TYPES)[number]["value"]>("study");
  const [dueAt, setDueAt] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    d.setMinutes(0, 0, 0);
    return d.toISOString().slice(0, 16);
  });

  return (
    <form
      className="mb-6 space-y-3 rounded-2xl border border-border bg-card p-4"
      onSubmit={(e) => {
        e.preventDefault();
        if (!title.trim()) return;
        onSubmit({ title, description: description || undefined, reminder_type: type, due_at: new Date(dueAt).toISOString() });
      }}
    >
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Title (e.g. Physics chapter revision)"
        required
        className="w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
      />
      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Optional notes"
        rows={2}
        className="w-full resize-none rounded-xl border border-input bg-background px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
      />
      <div className="grid grid-cols-2 gap-2">
        <select
          value={type}
          onChange={(e) => setType(e.target.value as any)}
          className="rounded-xl border border-input bg-background px-3 py-2.5 text-sm outline-none focus:border-primary"
        >
          {TYPES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
        <input
          type="datetime-local"
          value={dueAt}
          onChange={(e) => setDueAt(e.target.value)}
          className="rounded-xl border border-input bg-background px-3 py-2.5 text-sm outline-none focus:border-primary"
        />
      </div>
      <div className="flex justify-end gap-2">
        <button type="button" onClick={onCancel} className="rounded-full px-4 py-2 text-sm font-medium hover:bg-muted">
          Cancel
        </button>
        <button
          disabled={pending}
          className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-60"
        >
          {pending && <Loader2 className="size-3 animate-spin" />}
          Save
        </button>
      </div>
    </form>
  );
}
