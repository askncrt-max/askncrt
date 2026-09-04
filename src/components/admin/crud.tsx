import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { adminList, adminSave, adminDelete } from "@/lib/admin.functions";
import {
  Badge, Button, DataTable, Field, Modal, PageHeader, Toggle, fmtDate, inputCls,
} from "@/components/admin/ui";

export type FieldSpec = {
  key: string;
  label: string;
  type?: "text" | "textarea" | "number" | "boolean" | "select" | "date" | "readonly";
  options?: { value: string; label: string }[];
  defaultValue?: any;
  hideInTable?: boolean;
  hideInForm?: boolean;
  render?: (row: any) => React.ReactNode;
};

export function CrudPage({
  table,
  title,
  subtitle,
  fields,
  idColumn = "id",
  searchColumn,
  readOnly,
  extraActions,
}: {
  table: any;
  title: string;
  subtitle?: string;
  fields: FieldSpec[];
  idColumn?: string;
  searchColumn?: string;
  readOnly?: boolean;
  extraActions?: (row: any) => React.ReactNode;
}) {
  const qc = useQueryClient();
  const list = useServerFn(adminList);
  const save = useServerFn(adminSave);
  const del = useServerFn(adminDelete);
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<any | null>(null);

  const query = useQuery({
    queryKey: ["admin", table, search],
    queryFn: () => list({ data: { table, limit: 500, search: search || undefined, searchColumn } }),
  });

  const saveMut = useMutation({
    mutationFn: (vars: { id?: string; values: Record<string, any> }) =>
      save({ data: { table, id: vars.id, idColumn, values: vars.values } }),
    onSuccess: () => {
      toast.success("Saved");
      setEditing(null);
      qc.invalidateQueries({ queryKey: ["admin", table] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const delMut = useMutation({
    mutationFn: (id: string) => del({ data: { table, ids: [id], idColumn } }),
    onSuccess: () => {
      toast.success("Deleted");
      qc.invalidateQueries({ queryKey: ["admin", table] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const columns = useMemo(() => {
    const cols = fields
      .filter((f) => !f.hideInTable)
      .map((f) => ({
        key: f.key,
        label: f.label,
        render: (row: any) => {
          if (f.render) return f.render(row);
          const v = row[f.key];
          if (f.type === "boolean")
            return <Badge tone={v ? "good" : "muted"}>{v ? "Yes" : "No"}</Badge>;
          if (f.type === "date") return fmtDate(v);
          if (v === null || v === undefined || v === "") return "—";
          if (typeof v === "object") return <code className="text-xs">{JSON.stringify(v)}</code>;
          return String(v);
        },
      }));
    if (!readOnly || extraActions) {
      cols.push({
        key: "__actions",
        label: "Actions",
        render: (row: any) => (
          <div className="flex items-center gap-1.5">
            {extraActions?.(row)}
            {!readOnly && (
              <>
                <Button variant="ghost" onClick={() => setEditing(row)} aria-label="Edit">
                  <Pencil className="size-4" />
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => {
                    if (confirm("Delete this record permanently?")) delMut.mutate(row[idColumn]);
                  }}
                  aria-label="Delete"
                >
                  <Trash2 className="size-4 text-destructive" />
                </Button>
              </>
            )}
          </div>
        ),
      });
    }
    return cols;
  }, [fields, readOnly, extraActions, delMut, idColumn]);

  return (
    <>
      <PageHeader
        title={title}
        subtitle={subtitle}
        action={
          !readOnly && (
            <Button onClick={() => setEditing({})}>
              <Plus className="size-4" /> New
            </Button>
          )
        }
      />
      {searchColumn && (
        <input
          className={inputCls + " mb-4 max-w-sm"}
          placeholder="Search…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      )}
      <DataTable
        rows={query.data ?? []}
        columns={columns}
        loading={query.isLoading}
        error={query.error ? (query.error as Error).message : null}
      />
      {editing && (
        <RecordModal
          fields={fields.filter((f) => !f.hideInForm)}
          row={editing}
          idColumn={idColumn}
          saving={saveMut.isPending}
          onClose={() => setEditing(null)}
          onSave={(values) => saveMut.mutate({ id: editing[idColumn], values })}
        />
      )}
    </>
  );
}

export function RecordModal({
  fields,
  row,
  idColumn,
  onClose,
  onSave,
  saving,
}: {
  fields: FieldSpec[];
  row: any;
  idColumn: string;
  onClose: () => void;
  onSave: (values: Record<string, any>) => void;
  saving?: boolean;
}) {
  const [values, setValues] = useState<Record<string, any>>(() => {
    const init: Record<string, any> = {};
    for (const f of fields) {
      if (f.type === "readonly") continue;
      init[f.key] = row[f.key] ?? f.defaultValue ?? (f.type === "boolean" ? false : f.type === "number" ? 0 : "");
    }
    return init;
  });

  function set(key: string, v: any) {
    setValues((prev) => ({ ...prev, [key]: v }));
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={row[idColumn] ? "Edit record" : "New record"}
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button loading={saving} onClick={() => onSave(values)}>
            Save
          </Button>
        </>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2">
        {fields
          .filter((f) => f.type !== "readonly")
          .map((f) => (
            <Field
              key={f.key}
              label={f.label}
              className={f.type === "textarea" ? "sm:col-span-2" : undefined}
            >
              {f.type === "boolean" ? (
                <Toggle checked={!!values[f.key]} onChange={(v) => set(f.key, v)} label={f.label} />
              ) : f.type === "textarea" ? (
                <textarea
                  rows={8}
                  className={inputCls}
                  value={values[f.key] ?? ""}
                  onChange={(e) => set(f.key, e.target.value)}
                />
              ) : f.type === "select" ? (
                <select
                  className={inputCls}
                  value={values[f.key] ?? ""}
                  onChange={(e) => set(f.key, e.target.value)}
                >
                  <option value="">—</option>
                  {f.options?.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type={f.type === "number" ? "number" : "text"}
                  className={inputCls}
                  value={values[f.key] ?? ""}
                  onChange={(e) =>
                    set(f.key, f.type === "number" ? Number(e.target.value) : e.target.value)
                  }
                />
              )}
            </Field>
          ))}
      </div>
    </Modal>
  );
}
