import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import { adminOverview, adminExportCsv, adminListUsers } from "@/lib/admin.functions";
import { Button, Card, PageHeader, Stat, TableSkeleton, fmt } from "@/components/admin/ui";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin/reports")({ component: ReportsPage });

const RANGES = [
  { key: "today", label: "Today" },
  { key: "7d", label: "7 Days" },
  { key: "30d", label: "30 Days" },
  { key: "90d", label: "90 Days" },
  { key: "1y", label: "1 Year" },
] as const;

const EXPORTS = [
  { table: "audit_logs", label: "Audit logs" },
  { table: "security_events", label: "Security events" },
  { table: "ai_usage", label: "AI usage" },
  { table: "ocr_requests", label: "OCR requests" },
  { table: "admin_questions", label: "Question bank" },
  { table: "study_material", label: "Study material" },
  { table: "plans", label: "Plans" },
] as const;

function ReportsPage() {
  const [range, setRange] = useState<(typeof RANGES)[number]["key"]>("30d");
  const overview = useServerFn(adminOverview);
  const exportCsv = useServerFn(adminExportCsv);
  const listUsers = useServerFn(adminListUsers);

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "reports", range],
    queryFn: () => overview({ data: { range } }),
  });
  const users = useQuery({
    queryKey: ["admin", "users", ""],
    queryFn: () => listUsers({ data: { limit: 500 } }),
  });

  const classUsage = Object.entries(
    (users.data ?? []).reduce((acc: Record<string, number>, u: any) => {
      const key = u.class_level ? `Class ${u.class_level}` : "Not set";
      acc[key] = (acc[key] ?? 0) + 1;
      return acc;
    }, {}),
  ).map(([name, value]) => ({ name, value: value as number }));

  const subjectUsage = Object.entries(
    (users.data ?? []).reduce((acc: Record<string, number>, u: any) => {
      for (const s of u.subjects ?? []) acc[s] = (acc[s] ?? 0) + 1;
      return acc;
    }, {}),
  ).map(([name, value]) => ({ name, value: value as number }));

  async function download(table: string, label: string) {
    try {
      const { csv } = await exportCsv({ data: { table: table as any, limit: 5000 } });
      if (!csv) return toast.info(`${label}: nothing to export yet`);
      const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
      const a = document.createElement("a");
      a.href = url;
      a.download = `askncert-${table}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  return (
    <>
      <PageHeader
        title="Reports & Analytics"
        subtitle="Usage across users, classes, subjects, AI and revenue"
        action={
          <div className="flex flex-wrap gap-1 rounded-xl border border-border bg-card p-1">
            {RANGES.map((r) => (
              <button
                key={r.key}
                onClick={() => setRange(r.key)}
                className={cn(
                  "rounded-lg px-3 py-1.5 text-xs font-medium",
                  range === r.key ? "bg-primary text-primary-foreground" : "hover:bg-muted",
                )}
              >
                {r.label}
              </button>
            ))}
          </div>
        }
      />

      {isLoading || !data ? (
        <TableSkeleton />
      ) : (
        <div className="space-y-6">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Stat label="Active users" value={fmt(data.users.active)} hint="Monthly active" />
            <Stat label="New users" value={fmt(data.users.new)} />
            <Stat label="AI requests" value={fmt(data.ai.requests)} />
            <Stat label="Revenue" value={`₹${fmt(data.business.revenue)}`} tone="good" />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <h3 className="mb-4 text-sm font-semibold">User growth</h3>
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={data.charts.userGrowth}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="date" fontSize={11} />
                  <YAxis fontSize={11} allowDecimals={false} />
                  <Tooltip />
                  <Area type="monotone" dataKey="value" stroke="#10b981" fill="#10b98133" />
                </AreaChart>
              </ResponsiveContainer>
            </Card>
            <Card>
              <h3 className="mb-4 text-sm font-semibold">Class-wise usage</h3>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={classUsage}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="name" fontSize={11} />
                  <YAxis fontSize={11} allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Card>
            <Card className="lg:col-span-2">
              <h3 className="mb-4 text-sm font-semibold">Subject-wise usage</h3>
              {subjectUsage.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  No subject preferences recorded yet.
                </p>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={subjectUsage}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="name" fontSize={11} />
                    <YAxis fontSize={11} allowDecimals={false} />
                    <Tooltip />
                    <Bar dataKey="value" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </Card>
          </div>

          <Card>
            <h3 className="mb-3 text-sm font-semibold">CSV export</h3>
            <div className="flex flex-wrap gap-2">
              {EXPORTS.map((e) => (
                <Button key={e.table} variant="outline" onClick={() => download(e.table, e.label)}>
                  {e.label}
                </Button>
              ))}
            </div>
          </Card>
        </div>
      )}
    </>
  );
}
