import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { adminList, adminSave } from "@/lib/admin.functions";
import { Card, PageHeader, Stat, TableSkeleton, Toggle, fmt, inputCls } from "@/components/admin/ui";

export const Route = createFileRoute("/admin/ads")({ component: AdsPage });

const LABELS: Record<string, string> = {
  chat_footer: "Chat — below the composer",
  dashboard_banner: "Progress dashboard — top banner",
  notes_list: "Saved notes — between cards",
  quiz_result: "Quiz — result screen",
};

function AdsPage() {
  const qc = useQueryClient();
  const list = useServerFn(adminList);
  const save = useServerFn(adminSave);

  const ads = useQuery({
    queryKey: ["admin", "ad_settings"],
    queryFn: () => list({ data: { table: "ad_settings", limit: 50 } }),
  });

  const update = useMutation({
    mutationFn: (v: { id: string; values: Record<string, any> }) =>
      save({ data: { table: "ad_settings", id: v.id, values: v.values } }),
    onSuccess: () => {
      toast.success("Advertisement settings updated");
      qc.invalidateQueries({ queryKey: ["admin", "ad_settings"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const rows = ads.data ?? [];
  const impressions = rows.reduce((s: number, r: any) => s + r.impressions, 0);
  const clicks = rows.reduce((s: number, r: any) => s + r.clicks, 0);
  const revenue = rows.reduce((s: number, r: any) => s + Number(r.revenue_inr), 0);

  return (
    <>
      <PageHeader
        title="Advertisement Management"
        subtitle="Ads stay off by default and are never placed over study content"
      />

      <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Impressions" value={fmt(impressions)} />
        <Stat label="Clicks" value={fmt(clicks)} />
        <Stat label="CTR" value={`${impressions ? ((clicks / impressions) * 100).toFixed(2) : "0.00"}%`} />
        <Stat label="Revenue" value={`₹${fmt(revenue)}`} tone="good" />
      </div>

      {ads.isLoading ? (
        <TableSkeleton />
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {rows.map((a: any) => (
            <Card key={a.id} className="space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-sm font-semibold">{LABELS[a.placement] ?? a.placement}</h3>
                  <code className="text-[10px] text-muted-foreground">{a.placement}</code>
                </div>
                <Toggle
                  checked={a.enabled}
                  label={`Enable ads at ${a.placement}`}
                  onChange={(v) => update.mutate({ id: a.id, values: { enabled: v } })}
                />
              </div>
              <div className="grid grid-cols-3 items-end gap-2 text-xs">
                <label>
                  <span className="mb-1 block text-muted-foreground">Show every N views</span>
                  <input
                    type="number"
                    className={inputCls}
                    defaultValue={a.frequency}
                    onBlur={(e) => update.mutate({ id: a.id, values: { frequency: Number(e.target.value) } })}
                  />
                </label>
                <div>
                  <span className="mb-1 block text-muted-foreground">Free users</span>
                  <Toggle
                    checked={a.show_to_free}
                    label="Show to free users"
                    onChange={(v) => update.mutate({ id: a.id, values: { show_to_free: v } })}
                  />
                </div>
                <div>
                  <span className="mb-1 block text-muted-foreground">Premium users</span>
                  <Toggle
                    checked={a.show_to_premium}
                    label="Show to premium users"
                    onChange={(v) => update.mutate({ id: a.id, values: { show_to_premium: v } })}
                  />
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                {fmt(a.impressions)} impressions · {fmt(a.clicks)} clicks · ₹{fmt(Number(a.revenue_inr))}
              </p>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
