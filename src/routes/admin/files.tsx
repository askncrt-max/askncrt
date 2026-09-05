import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { adminList, adminDelete } from "@/lib/admin.functions";
import { Badge, Button, DataTable, PageHeader, fmtDate, inputCls } from "@/components/admin/ui";

export const Route = createFileRoute("/admin/files")({ component: FilesPage });

const CATEGORIES = [
  { value: "", label: "All categories" },
  { value: "user_upload", label: "User uploads" },
  { value: "question_image", label: "Question images" },
  { value: "document", label: "Documents" },
  { value: "notes_file", label: "Notes files" },
  { value: "ai_image", label: "AI-generated images" },
  { value: "app_asset", label: "Application assets" },
];

function FilesPage() {
  const qc = useQueryClient();
  const list = useServerFn(adminList);
  const del = useServerFn(adminDelete);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [selected, setSelected] = useState<string[]>([]);

  const files = useQuery({
    queryKey: ["admin", "files", search, category],
    queryFn: () =>
      list({
        data: {
          table: "files",
          limit: 500,
          search: search || undefined,
          searchColumn: "name",
          eq: category ? { category } : undefined,
        },
      }),
  });

  const remove = useMutation({
    mutationFn: (ids: string[]) => del({ data: { table: "files", ids } }),
    onSuccess: () => {
      toast.success("Deleted");
      setSelected([]);
      qc.invalidateQueries({ queryKey: ["admin", "files"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <>
      <PageHeader
        title="Files & Images"
        subtitle="Everything uploaded or generated inside AskNCERT"
        action={
          selected.length > 0 && (
            <Button
              variant="danger"
              onClick={() => {
                if (confirm(`Delete ${selected.length} file(s)?`)) remove.mutate(selected);
              }}
            >
              Delete {selected.length} selected
            </Button>
          )
        }
      />
      <div className="mb-4 flex flex-wrap gap-3">
        <input
          className={inputCls + " max-w-xs"}
          placeholder="Search file name…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select className={inputCls + " max-w-xs"} value={category} onChange={(e) => setCategory(e.target.value)}>
          {CATEGORIES.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </select>
      </div>
      <DataTable
        rows={files.data ?? []}
        loading={files.isLoading}
        empty="No files stored yet."
        columns={[
          {
            key: "select",
            label: "",
            render: (r) => (
              <input
                type="checkbox"
                aria-label={`Select ${r.name}`}
                checked={selected.includes(r.id)}
                onChange={(e) =>
                  setSelected((s) => (e.target.checked ? [...s, r.id] : s.filter((i) => i !== r.id)))
                }
              />
            ),
          },
          { key: "name", label: "File name" },
          { key: "category", label: "Category", render: (r) => <Badge tone="info">{r.category}</Badge> },
          { key: "mime_type", label: "Type" },
          { key: "size_kb", label: "Size (KB)" },
          { key: "user_id", label: "Owner", render: (r) => (r.user_id ? r.user_id.slice(0, 8) + "…" : "system") },
          { key: "created_at", label: "Uploaded", render: (r) => fmtDate(r.created_at) },
          {
            key: "actions",
            label: "Actions",
            render: (r) => (
              <div className="flex gap-1.5">
                {r.url && (
                  <a href={r.url} target="_blank" rel="noreferrer" className="text-xs font-medium text-primary hover:underline">
                    Preview
                  </a>
                )}
                <Button
                  variant="ghost"
                  onClick={() => {
                    if (confirm("Delete this file?")) remove.mutate([r.id]);
                  }}
                >
                  Delete
                </Button>
              </div>
            ),
          },
        ]}
      />
    </>
  );
}
