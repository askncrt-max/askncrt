import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { adminList, adminSave } from "@/lib/admin.functions";
import { Badge, Card, PageHeader, TableSkeleton, Toggle, inputCls } from "@/components/admin/ui";

export const Route = createFileRoute("/admin/features")({ component: FeaturesPage });

function FeaturesPage() {
  const qc = useQueryClient();
  const list = useServerFn(adminList);
  const save = useServerFn(adminSave);

  const flags = useQuery({
    queryKey: ["admin", "feature_flags"],
    queryFn: () => list({ data: { table: "feature_flags", limit: 100 } }),
  });
  const usage = useQuery({
    queryKey: ["admin", "feature_usage_stats"],
    queryFn: () => list({ data: { table: "audit_logs", limit: 1 } }).then(() => null),
    enabled: false,
  });
  void usage;

  const update = useMutation({
    mutationFn: (v: { id: string; values: Record<string, any> }) =>
      save({ data: { table: "feature_flags", id: v.id, values: v.values } }),
    onSuccess: () => {
      toast.success("Feature updated");
      qc.invalidateQueries({ queryKey: ["admin", "feature_flags"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <>
      <PageHeader
        title="AskNCERT Features"
        subtitle="Turn features on or off, put them in maintenance, and set daily limits and plan access"
      />
      {flags.isLoading ? (
        <TableSkeleton />
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {(flags.data ?? []).map((f: any) => (
            <Card key={f.id} className="space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold">{f.label}</h3>
                    {f.maintenance && <Badge tone="warn">Maintenance</Badge>}
                    <Badge tone={f.enabled ? "good" : "bad"}>{f.enabled ? "Live" : "Disabled"}</Badge>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">{f.description}</p>
                  <code className="text-[10px] text-muted-foreground">{f.key}</code>
                </div>
                <Toggle
                  checked={f.enabled}
                  label={`Enable ${f.label}`}
                  onChange={(v) => update.mutate({ id: f.id, values: { enabled: v } })}
                />
              </div>
              <div className="grid grid-cols-3 gap-2">
                <label className="text-xs">
                  <span className="mb-1 block text-muted-foreground">Daily limit</span>
                  <input
                    type="number"
                    className={inputCls}
                    defaultValue={f.daily_limit ?? ""}
                    placeholder="Unlimited"
                    onBlur={(e) =>
                      update.mutate({
                        id: f.id,
                        values: { daily_limit: e.target.value === "" ? null : Number(e.target.value) },
                      })
                    }
                  />
                </label>
                <label className="text-xs">
                  <span className="mb-1 block text-muted-foreground">Min plan</span>
                  <select
                    className={inputCls}
                    defaultValue={f.min_plan}
                    onChange={(e) => update.mutate({ id: f.id, values: { min_plan: e.target.value } })}
                  >
                    <option value="free">Free</option>
                    <option value="plus">Plus</option>
                    <option value="pro">Pro</option>
                  </select>
                </label>
                <div className="text-xs">
                  <span className="mb-1 block text-muted-foreground">Maintenance</span>
                  <Toggle
                    checked={f.maintenance}
                    label={`Maintenance for ${f.label}`}
                    onChange={(v) => update.mutate({ id: f.id, values: { maintenance: v } })}
                  />
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
