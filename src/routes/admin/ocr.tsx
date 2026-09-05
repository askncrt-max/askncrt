import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { adminList, adminSave, adminSaveSetting } from "@/lib/admin.functions";
import {
  Badge, Card, DataTable, Field, PageHeader, Stat, Toggle, fmt, fmtDate, inputCls,
} from "@/components/admin/ui";

export const Route = createFileRoute("/admin/ocr")({ component: OcrPage });

function OcrPage() {
  const qc = useQueryClient();
  const list = useServerFn(adminList);
  const save = useServerFn(adminSave);
  const saveSetting = useServerFn(adminSaveSetting);

  const requests = useQuery({
    queryKey: ["admin", "ocr_requests"],
    queryFn: () => list({ data: { table: "ocr_requests", limit: 300 } }),
  });
  const flags = useQuery({
    queryKey: ["admin", "feature_flags"],
    queryFn: () => list({ data: { table: "feature_flags", limit: 100 } }),
  });
  const settings = useQuery({
    queryKey: ["admin", "system_settings"],
    queryFn: () => list({ data: { table: "system_settings", limit: 20 } }),
  });

  const ocrFlag = (flags.data ?? []).find((f: any) => f.key === "ocr");
  const userSettings = (settings.data ?? []).find((s: any) => s.key === "user")?.value ?? {};

  const updateFlag = useMutation({
    mutationFn: (values: Record<string, any>) =>
      save({ data: { table: "feature_flags", id: ocrFlag.id, values } }),
    onSuccess: () => {
      toast.success("OCR settings updated");
      qc.invalidateQueries({ queryKey: ["admin", "feature_flags"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const updateSetting = useMutation({
    mutationFn: (value: Record<string, any>) => saveSetting({ data: { key: "user", value } }),
    onSuccess: () => {
      toast.success("Upload settings updated");
      qc.invalidateQueries({ queryKey: ["admin", "system_settings"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const rows = requests.data ?? [];
  const ok = rows.filter((r: any) => r.success).length;
  const failed = rows.length - ok;
  const today = new Date().toISOString().slice(0, 10);
  const todayCount = rows.filter((r: any) => String(r.created_at).startsWith(today)).length;
  const avgMs = rows.length
    ? Math.round(rows.reduce((s: number, r: any) => s + (r.duration_ms ?? 0), 0) / rows.length)
    : 0;

  return (
    <>
      <PageHeader title="OCR Management" subtitle="Image and PDF question input" />

      <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <Stat label="Total requests" value={fmt(rows.length)} />
        <Stat label="Successful" value={fmt(ok)} tone="good" />
        <Stat label="Failed" value={fmt(failed)} tone={failed ? "bad" : "good"} />
        <Stat label="Today" value={fmt(todayCount)} />
        <Stat label="Avg processing" value={`${avgMs} ms`} />
      </div>

      <Card className="mb-6 space-y-4">
        <h2 className="text-sm font-semibold">Controls</h2>
        {ocrFlag && (
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <span className="mb-1.5 block text-xs font-medium text-muted-foreground">OCR enabled</span>
              <Toggle
                checked={ocrFlag.enabled}
                label="Enable OCR"
                onChange={(v) => updateFlag.mutate({ enabled: v })}
              />
            </div>
            <Field label="Daily usage limit per user">
              <input
                type="number"
                className={inputCls}
                defaultValue={ocrFlag.daily_limit ?? ""}
                placeholder="Unlimited"
                onBlur={(e) =>
                  updateFlag.mutate({ daily_limit: e.target.value === "" ? null : Number(e.target.value) })
                }
              />
            </Field>
            <Field label="Max file size (MB)">
              <input
                type="number"
                className={inputCls}
                defaultValue={userSettings.upload_mb_limit ?? 10}
                onBlur={(e) =>
                  updateSetting.mutate({ ...userSettings, upload_mb_limit: Number(e.target.value) })
                }
              />
            </Field>
          </div>
        )}
        <p className="text-xs text-muted-foreground">
          Supported formats: JPG, PNG, WEBP and PDF.
        </p>
      </Card>

      <DataTable
        rows={rows}
        loading={requests.isLoading}
        empty="No OCR requests recorded yet."
        columns={[
          { key: "created_at", label: "When", render: (r) => fmtDate(r.created_at) },
          { key: "file_name", label: "File" },
          { key: "mime_type", label: "Type" },
          { key: "file_size_kb", label: "Size (KB)" },
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
