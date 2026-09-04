import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer,
  Tooltip, XAxis, YAxis,
} from "recharts";
import { adminOverview } from "@/lib/admin.functions";
import { Card, PageHeader, Stat, TableSkeleton, fmt } from "@/components/admin/ui";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin/")({ component: AdminDashboard });

const RANGES = [
  { key: "today", label: "Today" },
  { key: "7d", label: "7 Days" },
  { key: "30d", label: "30 Days" },
  { key: "90d", label: "90 Days" },
  { key: "1y", label: "1 Year" },
] as const;

const PIE_COLORS = ["#10b981", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6"];

function AdminDashboard() {
  const [range, setRange] = useState<(typeof RANGES)[number]["key"]>("30d");
  const overview = useServerFn(adminOverview);
  const { data, isLoading, error } = useQuery({
    queryKey: ["admin", "overview", range],
    queryFn: () => overview({ data: { range } }),
  });

  return (
    <>
      <PageHeader
        title="Control Center"
        subtitle="Live platform overview for AskNCERT"
        action={
          <div className="flex flex-wrap gap-1 rounded-xl border border-border bg-card p-1">
            {RANGES.map((r) => (
              <button
                key={r.key}
                onClick={() => setRange(r.key)}
                className={cn(
                  "rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
                  range === r.key ? "bg-primary text-primary-foreground" : "hover:bg-muted",
                )}
              >
                {r.label}
              </button>
            ))}
          </div>
        }
      />

      {error && <Card className="mb-4 text-sm text-destructive">{(error as Error).message}</Card>}
      {isLoading || !data ? (
        <TableSkeleton />
      ) : (
        <div className="space-y-8">
          <Section title="Users">
            <Stat label="Total users" value={fmt(data.users.total)} />
            <Stat label="New users" value={fmt(data.users.new)} tone="good" />
            <Stat label="Active users" value={fmt(data.users.active)} />
            <Stat label="Free" value={fmt(data.users.free)} />
            <Stat label="Plus" value={fmt(data.users.plus)} />
            <Stat label="Pro" value={fmt(data.users.pro)} />
          </Section>

          <Section title="AI">
            <Stat label="AI requests" value={fmt(data.ai.requests)} />
            <Stat label="Failed requests" value={fmt(data.ai.failed)} tone={data.ai.failed ? "bad" : "good"} />
            <Stat label="Input tokens" value={fmt(data.ai.inputTokens)} />
            <Stat label="Output tokens" value={fmt(data.ai.outputTokens)} />
            <Stat label="Chat messages" value={fmt(data.ai.messagesInRange)} hint={`${fmt(data.ai.messages)} all time`} />
          </Section>

          <Section title="AskNCERT usage">
            <Stat label="Questions solved" value={fmt(data.usage.questionsSolved)} />
            <Stat label="OCR requests" value={fmt(data.usage.ocr)} hint={`${fmt(data.usage.ocrFailed)} failed`} />
            <Stat label="Notes created" value={fmt(data.usage.notes)} />
            <Stat label="Quizzes generated" value={fmt(data.usage.quizzes)} />
            <Stat label="Quiz attempts" value={fmt(data.usage.attempts)} />
          </Section>

          <Section title="Business">
            <Stat label="Active subscriptions" value={fmt(data.business.activeSubs)} />
            <Stat label="New subscriptions" value={fmt(data.business.newSubs)} />
            <Stat label="Revenue (monthly)" value={`₹${fmt(data.business.revenue)}`} tone="good" />
            <Stat label="Ad impressions" value={fmt(data.business.ads.impressions)} />
            <Stat
              label="Ad CTR"
              value={`${data.business.ads.impressions ? ((data.business.ads.clicks / data.business.ads.impressions) * 100).toFixed(2) : "0.00"}%`}
            />
          </Section>

          <div className="grid gap-4 lg:grid-cols-2">
            <ChartCard title="User growth">
              <ResponsiveContainer width="100%" height={240}>
                <AreaChart data={data.charts.userGrowth}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="date" fontSize={11} />
                  <YAxis fontSize={11} allowDecimals={false} />
                  <Tooltip />
                  <Area type="monotone" dataKey="value" stroke="#10b981" fill="#10b98133" />
                </AreaChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="Daily active study sessions">
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={data.charts.dau}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="date" fontSize={11} />
                  <YAxis fontSize={11} allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="AI usage">
              <ResponsiveContainer width="100%" height={240}>
                <AreaChart data={data.charts.aiUsage}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="date" fontSize={11} />
                  <YAxis fontSize={11} allowDecimals={false} />
                  <Tooltip />
                  <Area type="monotone" dataKey="value" stroke="#8b5cf6" fill="#8b5cf633" />
                </AreaChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="Plan distribution">
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie data={data.charts.planDistribution} dataKey="value" nameKey="name" outerRadius={85} label>
                    {data.charts.planDistribution.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="Feature usage" className="lg:col-span-2">
              {data.charts.featureUsage.length === 0 ? (
                <p className="py-10 text-center text-sm text-muted-foreground">
                  No feature usage recorded in this period yet.
                </p>
              ) : (
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={data.charts.featureUsage}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="name" fontSize={11} />
                    <YAxis fontSize={11} allowDecimals={false} />
                    <Tooltip />
                    <Bar dataKey="value" fill="#10b981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </ChartCard>
          </div>
        </div>
      )}
    </>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="mb-3 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
        {title}
      </h2>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">{children}</div>
    </section>
  );
}

function ChartCard({ title, children, className }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <Card className={className}>
      <h3 className="mb-4 text-sm font-semibold">{title}</h3>
      {children}
    </Card>
  );
}
