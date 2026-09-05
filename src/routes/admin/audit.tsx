import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { adminList, adminExportCsv } from "@/lib/admin.functions";
import { Badge, Button, DataTable, PageHeader, fmtDate } from "@/components/admin/ui";

export const Route = createFileRoute("/admin/audit")({ component: AuditPage });

function AuditPage() {
  const list = useServerFn(adminList);
  const exportCsv = useServerFn(adminExportCsv);

  const logs = useQuery({
    queryKey: ["admin", "audit_logs"],
    queryFn: () => list({ data: { table: "audit_logs", limit: 500 } }),
  });

  async function download() {
    try {
      const { csv } = await exportCsv({ data: { table: "audit_logs", limit: 5000 } });
      const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
      const a = document.createElement("a");
      a.href = url;
      a.download = "askncert-audit-logs.csv";
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  return (
    <>
      <PageHeader
        title="Audit Logs"
        subtitle="Every super admin action, with before and after values"
        action={
          <Button variant="outline" onClick={download}>
            Export CSV
          </Button>
        }
      />
      <DataTable
        rows={logs.data ?? []}
        loading={logs.isLoading}
        empty="No admin actions recorded yet."
        columns={[
          { key: "created_at", label: "When", render: (r) => fmtDate(r.created_at) },
          { key: "admin_email", label: "Admin", render: (r) => r.admin_email ?? "—" },
          { key: "action", label: "Action", render: (r) => <Badge tone="info">{r.action}</Badge> },
          { key: "target_type", label: "Target" },
          { key: "target_id", label: "Target id", render: (r) => (r.target_id ? String(r.target_id).slice(0, 12) + "…" : "—") },
          {
            key: "previous_value",
            label: "Before",
            render: (r) => <Json value={r.previous_value} />,
          },
          { key: "new_value", label: "After", render: (r) => <Json value={r.new_value} /> },
          {
            key: "result",
            label: "Result",
            render: (r) => <Badge tone={r.result === "success" ? "good" : "bad"}>{r.result}</Badge>,
          },
        ]}
      />
    </>
  );
}

function Json({ value }: { value: unknown }) {
  if (!value) return <span className="text-muted-foreground">—</span>;
  const text = JSON.stringify(value);
  return (
    <code className="block max-w-[220px] truncate text-[11px] text-muted-foreground" title={text}>
      {text}
    </code>
  );
}
