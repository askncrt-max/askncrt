import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { adminList, adminSave, adminTestProvider } from "@/lib/admin.functions";
import {
  Badge, Button, Card, DataTable, PageHeader, Stat, TableSkeleton, Toggle, fmt, fmtDate, inputCls,
} from "@/components/admin/ui";

export const Route = createFileRoute("/admin/ai")({ component: AiPage });

function AiPage() {
  const qc = useQueryClient();
  const list = useServerFn(adminList);
  const save = useServerFn(adminSave);
  const test = useServerFn(adminTestProvider);

  const providers = useQuery({
    queryKey: ["admin", "ai_providers"],
    queryFn: () => list({ data: { table: "ai_providers", limit: 50 } }),
  });
  const usage = useQuery({
    queryKey: ["admin", "ai_usage"],
    queryFn: () => list({ data: { table: "ai_usage", limit: 200 } }),
  });

  const update = useMutation({
    mutationFn: (v: { id: string; values: Record<string, any> }) =>
      save({ data: { table: "ai_providers", id: v.id, values: v.values } }),
    onSuccess: () => {
      toast.success("Provider updated");
      qc.invalidateQueries({ queryKey: ["admin", "ai_providers"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const testMut = useMutation({
    mutationFn: (model: string) => test({ data: { model } }),
    onSuccess: (r: any) =>
      r.ok ? toast.success(`Provider responded in ${r.ms} ms`) : toast.error(`Test failed (HTTP ${r.status})`),
    onError: (e: Error) => toast.error(e.message),
  });

  const rows = usage.data ?? [];
  const failed = rows.filter((r: any) => !r.success).length;
  const tokens = rows.reduce((s: number, r: any) => s + (r.input_tokens ?? 0) + (r.output_tokens ?? 0), 0);
  const avgMs = rows.length
    ? Math.round(rows.reduce((s: number, r: any) => s + (r.duration_ms ?? 0), 0) / rows.length)
    : 0;

  return (
    <>
      <PageHeader title="AI & API Control" subtitle="Providers, limits, health and usage. API keys never leave the server." />

      <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Recent requests" value={fmt(rows.length)} />
        <Stat label="Failed" value={fmt(failed)} tone={failed ? "bad" : "good"} />
        <Stat label="Tokens used" value={fmt(tokens)} />
        <Stat label="Avg response" value={`${avgMs} ms`} />
      </div>

      <h2 className="mb-3 text-sm font-semibold">Providers</h2>
      {providers.isLoading ? (
        <TableSkeleton />
      ) : (
        <div className="mb-8 grid gap-3 md:grid-cols-2">
          {(providers.data ?? []).map((p: any) => (
            <Card key={p.id} className="space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-sm font-semibold">{p.name}</h3>
                  <code className="text-xs text-muted-foreground">{p.model}</code>
                </div>
                <div className="flex items-center gap-2">
                  <Badge tone={p.enabled ? "good" : "bad"}>{p.enabled ? "Enabled" : "Disabled"}</Badge>
                  <Toggle
                    checked={p.enabled}
                    label={`Enable ${p.name}`}
                    onChange={(v) => update.mutate({ id: p.id, values: { enabled: v } })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
                <NumField label="Priority" value={p.priority} onSave={(n) => update.mutate({ id: p.id, values: { priority: n } })} />
                <NumField
                  label="Daily limit"
                  value={p.daily_request_limit}
                  onSave={(n) => update.mutate({ id: p.id, values: { daily_request_limit: n } })}
                />
                <NumField label="Timeout (ms)" value={p.timeout_ms} onSave={(n) => update.mutate({ id: p.id, values: { timeout_ms: n } })} />
                <NumField label="Retries" value={p.max_retries} onSave={(n) => update.mutate({ id: p.id, values: { max_retries: n } })} />
              </div>
              <Button variant="outline" loading={testMut.isPending} onClick={() => testMut.mutate(p.model)}>
                Test API
              </Button>
            </Card>
          ))}
        </div>
      )}

      <h2 className="mb-3 text-sm font-semibold">Recent AI requests</h2>
      <DataTable
        rows={rows}
        loading={usage.isLoading}
        empty="No AI requests logged yet."
        columns={[
          { key: "created_at", label: "When", render: (r) => fmtDate(r.created_at) },
          { key: "provider", label: "Provider" },
          { key: "model", label: "Model" },
          { key: "kind", label: "Kind" },
          { key: "input_tokens", label: "In" },
          { key: "output_tokens", label: "Out" },
          { key: "duration_ms", label: "ms" },
          {
            key: "success",
            label: "Result",
            render: (r) => (r.success ? <Badge tone="good">ok</Badge> : <Badge tone="bad">{r.error ?? "failed"}</Badge>),
          },
        ]}
      />
    </>
  );
}

function NumField({ label, value, onSave }: { label: string; value: number | null; onSave: (n: number | null) => void }) {
  return (
    <label>
      <span className="mb-1 block text-muted-foreground">{label}</span>
      <input
        type="number"
        className={inputCls}
        defaultValue={value ?? ""}
        onBlur={(e) => onSave(e.target.value === "" ? null : Number(e.target.value))}
      />
    </label>
  );
}
