import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Loader2, Plus, Trash2, Sparkles, ArrowLeft } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { AppShell } from "@/components/app-shell";
import { listMemory, upsertMemory, deleteMemory } from "@/lib/user-memory.functions";

export const Route = createFileRoute("/_authenticated/settings/memory")({
  component: MemoryPage,
  head: () => ({
    meta: [
      { title: "Manage Memory — AskNCERT" },
      {
        name: "description",
        content:
          "View, edit and delete the things AskNCERT remembers about you to personalize answers.",
      },
    ],
  }),
});

const CATEGORIES = [
  { key: "profile", label: "Profile" },
  { key: "preference", label: "Preferences" },
  { key: "goal", label: "Goals" },
  { key: "fact", label: "Facts" },
] as const;

function MemoryPage() {
  const qc = useQueryClient();
  const list = useServerFn(listMemory);
  const upsert = useServerFn(upsertMemory);
  const del = useServerFn(deleteMemory);

  const { data: items = [], isLoading } = useQuery({
    queryKey: ["user_memory"],
    queryFn: () => list(),
  });

  const [newKey, setNewKey] = useState("");
  const [newValue, setNewValue] = useState("");
  const [newCat, setNewCat] = useState<(typeof CATEGORIES)[number]["key"]>("fact");

  const addMut = useMutation({
    mutationFn: () =>
      upsert({ data: { key: newKey.trim(), value: newValue.trim(), category: newCat, source: "manual" } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["user_memory"] });
      setNewKey("");
      setNewValue("");
      toast.success("Memory saved");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed"),
  });

  const delMut = useMutation({
    mutationFn: (id: string) => del({ data: { id } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["user_memory"] });
      toast.success("Deleted");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed"),
  });

  const editMut = useMutation({
    mutationFn: (row: { key: string; value: string; category: any; source: any }) =>
      upsert({ data: row }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["user_memory"] }),
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed"),
  });

  const grouped = CATEGORIES.map((c) => ({
    ...c,
    rows: items.filter((i: any) => i.category === c.key),
  }));

  return (
    <AppShell>
      <div className="mx-auto max-w-2xl px-4 py-8 md:px-8 md:py-12">
        <Link
          to="/settings"
          className="mb-4 inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-3.5" /> Settings
        </Link>
        <header className="mb-6">
          <div className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-primary-soft px-2.5 py-1 text-[11px] font-semibold uppercase tracking-widest text-primary">
            <Sparkles className="size-3" /> AI Memory
          </div>
          <h1 className="font-display text-3xl font-bold tracking-tight">Manage memory</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            AskNCERT uses these facts to personalize answers. You are always in control — edit or
            delete anything.
          </p>
        </header>

        <section className="mb-6 rounded-3xl border border-border bg-card p-5 shadow-soft">
          <h2 className="mb-3 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
            Add a memory
          </h2>
          <div className="space-y-2.5">
            <input
              value={newKey}
              onChange={(e) => setNewKey(e.target.value)}
              placeholder="Label — e.g. Favourite subject"
              className="w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm outline-none focus:border-primary"
            />
            <textarea
              value={newValue}
              onChange={(e) => setNewValue(e.target.value)}
              placeholder="Value — e.g. Physics, especially mechanics"
              rows={2}
              className="w-full resize-none rounded-xl border border-input bg-background px-3 py-2.5 text-sm outline-none focus:border-primary"
            />
            <div className="flex flex-wrap items-center gap-2">
              <select
                value={newCat}
                onChange={(e) => setNewCat(e.target.value as any)}
                className="rounded-xl border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary"
              >
                {CATEGORIES.map((c) => (
                  <option key={c.key} value={c.key}>
                    {c.label}
                  </option>
                ))}
              </select>
              <button
                onClick={() => addMut.mutate()}
                disabled={!newKey.trim() || !newValue.trim() || addMut.isPending}
                className="ml-auto inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50"
              >
                {addMut.isPending ? <Loader2 className="size-3 animate-spin" /> : <Plus className="size-3.5" />}
                Save
              </button>
            </div>
          </div>
        </section>

        {isLoading ? (
          <div className="flex items-center justify-center py-12 text-muted-foreground">
            <Loader2 className="mr-2 size-4 animate-spin" /> Loading…
          </div>
        ) : items.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-border p-10 text-center">
            <Sparkles className="mx-auto size-6 text-muted-foreground" />
            <p className="mt-3 text-sm font-medium">No memories yet</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Add one above, or tell the AI things like "remember I'm in Class 10 CBSE".
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {grouped.map((g) =>
              g.rows.length === 0 ? null : (
                <section key={g.key}>
                  <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                    {g.label}
                  </h3>
                  <div className="space-y-2">
                    {g.rows.map((row: any) => (
                      <MemoryRow
                        key={row.id}
                        row={row}
                        onDelete={() => delMut.mutate(row.id)}
                        onSave={(value) =>
                          editMut.mutate({
                            key: row.key,
                            value,
                            category: row.category,
                            source: row.source,
                          })
                        }
                      />
                    ))}
                  </div>
                </section>
              ),
            )}
          </div>
        )}
      </div>
    </AppShell>
  );
}

function MemoryRow({
  row,
  onSave,
  onDelete,
}: {
  row: any;
  onSave: (v: string) => void;
  onDelete: () => void;
}) {
  const [value, setValue] = useState(row.value);
  const dirty = value !== row.value;
  return (
    <div className="rounded-2xl border border-border bg-card p-3">
      <div className="mb-1.5 flex items-center gap-2">
        <span className="text-xs font-semibold">{row.key}</span>
        {row.source === "inferred" && (
          <span className="rounded-full bg-primary-soft px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-primary">
            AI
          </span>
        )}
        <button
          onClick={onDelete}
          className="ml-auto rounded-lg p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
          aria-label="Delete"
        >
          <Trash2 className="size-3.5" />
        </button>
      </div>
      <textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        rows={2}
        className="w-full resize-none rounded-lg border border-transparent bg-transparent px-1 py-1 text-sm outline-none focus:border-input focus:bg-background"
      />
      {dirty && (
        <div className="mt-1 flex justify-end gap-1.5">
          <button
            onClick={() => setValue(row.value)}
            className="rounded-full px-2.5 py-1 text-[11px] font-medium text-muted-foreground hover:bg-muted"
          >
            Cancel
          </button>
          <button
            onClick={() => onSave(value)}
            className="rounded-full bg-primary px-2.5 py-1 text-[11px] font-semibold text-primary-foreground hover:opacity-90"
          >
            Save
          </button>
        </div>
      )}
    </div>
  );
}
