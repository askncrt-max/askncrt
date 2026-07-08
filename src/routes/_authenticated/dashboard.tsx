import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { motion } from "framer-motion";
import { Flame, Trophy, Target, Clock, TrendingUp, BookOpen, CheckCircle2, Calendar } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { getDashboard } from "@/lib/study.functions";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: DashboardPage,
  head: () => ({
    meta: [
      { title: "Progress dashboard — AskNCERT" },
      { name: "description", content: "Track study time, streaks, goals and achievements on AskNCERT." },
    ],
  }),
});

const COLORS = ["#6366f1", "#10b981", "#f59e0b", "#ec4899", "#06b6d4", "#8b5cf6", "#ef4444"];

function DashboardPage() {
  const fetchDashboard = useServerFn(getDashboard);
  const { data, isLoading } = useQuery({ queryKey: ["dashboard"], queryFn: () => fetchDashboard() });

  return (
    <AppShell>
      <div className="mx-auto max-w-6xl px-4 py-8 md:px-8 md:py-12">
        <header className="mb-8">
          <h1 className="font-display text-3xl font-bold tracking-tight md:text-4xl">Your progress</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Study time, streaks, and goals — see how far you've come.
          </p>
        </header>

        {isLoading || !data ? (
          <div className="grid gap-4 md:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-28 animate-pulse rounded-2xl bg-muted" />
            ))}
          </div>
        ) : (
          <>
            <div className="grid gap-4 md:grid-cols-4">
              <StatCard icon={<Clock className="size-4" />} label="Today" value={`${data.todayMinutes} min`} tint="from-primary/20 to-primary/5" />
              <StatCard icon={<TrendingUp className="size-4" />} label="This week" value={`${data.weekMinutes} min`} tint="from-emerald-400/20 to-emerald-400/5" />
              <StatCard icon={<Flame className="size-4" />} label="Streak" value={`${data.streak} day${data.streak === 1 ? "" : "s"}`} tint="from-orange-400/20 to-orange-400/5" />
              <StatCard icon={<Trophy className="size-4" />} label={`Level ${data.level}`} value={`${data.xp} XP`} tint="from-amber-400/20 to-amber-400/5" sub={`Next: ${data.xpForNext} XP`} />
            </div>

            <div className="mt-6 grid gap-4 lg:grid-cols-3">
              <Card className="lg:col-span-2">
                <CardHeader title="Study minutes (last 30 days)" icon={<TrendingUp className="size-4" />} />
                <div className="h-64">
                  <ResponsiveContainer>
                    <AreaChart data={data.days}>
                      <defs>
                        <linearGradient id="fillStudy" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.4} />
                          <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={(v) => v.slice(5)} />
                      <YAxis tick={{ fontSize: 10 }} />
                      <Tooltip
                        contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 12 }}
                        labelStyle={{ fontSize: 12 }}
                      />
                      <Area dataKey="minutes" stroke="hsl(var(--primary))" fill="url(#fillStudy)" strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </Card>

              <Card>
                <CardHeader title="By subject" icon={<BookOpen className="size-4" />} />
                {data.bySubject.length === 0 ? (
                  <EmptyMini text="Log a session to see breakdown" />
                ) : (
                  <div className="h-64">
                    <ResponsiveContainer>
                      <PieChart>
                        <Pie data={data.bySubject} dataKey="minutes" nameKey="subject" innerRadius={45} outerRadius={80} paddingAngle={2}>
                          {data.bySubject.map((_, i) => (
                            <Cell key={i} fill={COLORS[i % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 12 }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </Card>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader title="Tasks" icon={<CheckCircle2 className="size-4" />} />
                <div className="grid grid-cols-2 gap-3">
                  <MiniStat label="Completed" value={data.tasksDone} accent="text-emerald-500" />
                  <MiniStat label="Pending" value={data.tasksPending} accent="text-primary" />
                </div>
              </Card>

              <Card>
                <CardHeader title="Upcoming exams" icon={<Calendar className="size-4" />} />
                {data.upcomingExams.length === 0 ? (
                  <EmptyMini text="Add exams in the planner" />
                ) : (
                  <ul className="space-y-2">
                    {data.upcomingExams.map((e) => {
                      const days = Math.max(
                        0,
                        Math.ceil((new Date(e.exam_date).getTime() - Date.now()) / 86400000),
                      );
                      return (
                        <li key={e.id} className="flex items-center justify-between rounded-xl bg-muted/50 px-3 py-2">
                          <div>
                            <div className="text-sm font-semibold">{e.name}</div>
                            <div className="text-xs text-muted-foreground">
                              {e.subject ?? "General"} · {new Date(e.exam_date).toLocaleDateString(undefined, { day: "numeric", month: "short" })}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-bold text-primary">{days}</div>
                            <div className="text-[10px] uppercase tracking-widest text-muted-foreground">days</div>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </Card>
            </div>

            <div className="mt-6">
              <Card>
                <CardHeader title="Weekly goal" icon={<Target className="size-4" />} />
                <WeeklyGoal weekMinutes={data.weekMinutes} target={data.goals.find((g) => g.kind === "weekly")?.target_min ?? 300} />
              </Card>
            </div>
          </>
        )}
      </div>
    </AppShell>
  );
}

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-3xl border border-border bg-card p-5 shadow-sm ${className}`}
    >
      {children}
    </motion.div>
  );
}

function CardHeader({ title, icon }: { title: string; icon: React.ReactNode }) {
  return (
    <div className="mb-4 flex items-center gap-2 text-sm font-semibold">
      <span className="grid size-7 place-items-center rounded-lg bg-primary-soft text-primary">{icon}</span>
      {title}
    </div>
  );
}

function StatCard({ icon, label, value, tint, sub }: { icon: React.ReactNode; label: string; value: string; tint: string; sub?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      className={`relative overflow-hidden rounded-2xl border border-border bg-gradient-to-br ${tint} p-4`}
    >
      <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
        {icon}
        {label}
      </div>
      <div className="mt-2 text-2xl font-bold">{value}</div>
      {sub && <div className="mt-0.5 text-[11px] text-muted-foreground">{sub}</div>}
    </motion.div>
  );
}

function MiniStat({ label, value, accent }: { label: string; value: number; accent: string }) {
  return (
    <div className="rounded-xl bg-muted/50 p-3">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className={`mt-1 text-2xl font-bold ${accent}`}>{value}</div>
    </div>
  );
}

function EmptyMini({ text }: { text: string }) {
  return <div className="grid h-32 place-items-center text-xs text-muted-foreground">{text}</div>;
}

function WeeklyGoal({ weekMinutes, target }: { weekMinutes: number; target: number }) {
  const pct = Math.min(100, Math.round((weekMinutes / target) * 100));
  return (
    <div>
      <div className="mb-2 flex justify-between text-sm">
        <span className="text-muted-foreground">{weekMinutes} / {target} min</span>
        <span className="font-semibold">{pct}%</span>
      </div>
      <div className="h-3 overflow-hidden rounded-full bg-muted">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="h-full rounded-full bg-gradient-to-r from-primary to-emerald-400"
        />
      </div>
    </div>
  );
}
