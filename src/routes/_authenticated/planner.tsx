import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Check,
  Trash2,
  Loader2,
  Sparkles,
  CalendarDays,
  GraduationCap,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/app-shell";
import {
  createExam,
  createTask,
  deleteExam,
  deleteTask,
  generateTimetable,
  listExams,
  listTasks,
  updateTask,
} from "@/lib/planner.functions";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/planner")({
  component: PlannerPage,
  head: () => ({
    meta: [
      { title: "Study planner — AskNCERT" },
      { name: "description", content: "Plan tasks, track exams, and get AI-generated timetables on AskNCERT." },
    ],
  }),
});

const SUBJECT_COLORS: Record<string, string> = {
  Math: "bg-indigo-500",
  Science: "bg-emerald-500",
  Physics: "bg-cyan-500",
  Chemistry: "bg-fuchsia-500",
  Biology: "bg-green-500",
  English: "bg-rose-500",
  Hindi: "bg-amber-500",
  History: "bg-orange-500",
  Geography: "bg-teal-500",
  Civics: "bg-violet-500",
};
const subjectColor = (s?: string | null) => (s && SUBJECT_COLORS[s]) || "bg-slate-500";

const PRIORITY_STYLE: Record<string, string> = {
  low: "text-slate-500",
  med: "text-primary",
  high: "text-rose-500",
};

function fmtDate(d: Date) {
  return d.toISOString().slice(0, 10);
}

function PlannerPage() {
  const qc = useQueryClient();
  const [weekOffset, setWeekOffset] = useState(0);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [showExamForm, setShowExamForm] = useState(false);

  const listT = useServerFn(listTasks);
  const createT = useServerFn(createTask);
  const updT = useServerFn(updateTask);
  const delT = useServerFn(deleteTask);
  const listE = useServerFn(listExams);
  const createE = useServerFn(createExam);
  const delE = useServerFn(deleteExam);
  const genFn = useServerFn(generateTimetable);

  const weekStart = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    const day = d.getDay(); // 0..6
    d.setDate(d.getDate() - day + weekOffset * 7);
    return d;
  }, [weekOffset]);
  const weekEnd = useMemo(() => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + 6);
    return d;
  }, [weekStart]);

  const { data: tasks = [], isLoading: tLoading } = useQuery({
    queryKey: ["tasks", fmtDate(weekStart)],
    queryFn: () => listT({ data: { from: fmtDate(weekStart), to: fmtDate(weekEnd) } }),
  });
  const { data: exams = [] } = useQuery({ queryKey: ["exams"], queryFn: () => listE() });

  const createTaskMut = useMutation({
    mutationFn: (v: any) => createT({ data: v }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tasks"] });
      setShowTaskForm(false);
      toast.success("Task added");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed"),
  });
  const updateMut = useMutation({
    mutationFn: (v: any) => updT({ data: v }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tasks"] }),
  });
  const delTaskMut = useMutation({
    mutationFn: (id: string) => delT({ data: { id } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tasks"] }),
  });
  const createExamMut = useMutation({
    mutationFn: (v: any) => createE({ data: v }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["exams"] });
      setShowExamForm(false);
      toast.success("Exam added");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed"),
  });
  const delExamMut = useMutation({
    mutationFn: (id: string) => delE({ data: { id } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["exams"] }),
  });
  const genMut = useMutation({
    mutationFn: () => genFn({ data: { hours_per_day: 2, days: 7 } }),
    onSuccess: (r: any) => {
      qc.invalidateQueries({ queryKey: ["tasks"] });
      toast.success(`AI added ${r.inserted} tasks`);
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "AI failed"),
  });

  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(weekStart.getDate() + i);
    return d;
  });
  const tasksByDay = new Map<string, any[]>();
  for (const t of tasks) {
    const list = tasksByDay.get(t.scheduled_for) ?? [];
    list.push(t);
    tasksByDay.set(t.scheduled_for, list);
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-6xl px-4 py-8 md:px-8 md:py-12">
        <header className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="font-display text-3xl font-bold tracking-tight md:text-4xl">Study Planner</h1>
            <p className="mt-1 text-sm text-muted-foreground">Tasks, exams, and AI-generated timetables.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => genMut.mutate()}
              disabled={genMut.isPending}
              className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary-soft px-4 py-2 text-sm font-semibold text-primary hover:bg-primary/10 disabled:opacity-60"
            >
              {genMut.isPending ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
              AI timetable
            </button>
            <button
              onClick={() => setShowExamForm((v) => !v)}
              className="inline-flex items-center gap-1.5 rounded-full border border-border px-4 py-2 text-sm font-semibold hover:bg-muted"
            >
              <GraduationCap className="size-4" /> Exam
            </button>
            <button
              onClick={() => setShowTaskForm((v) => !v)}
              className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-glow hover:opacity-90"
            >
              <Plus className="size-4" /> Task
            </button>
          </div>
        </header>

        <AnimatePresence>
          {showTaskForm && (
            <NewTaskForm
              defaultDate={fmtDate(new Date())}
              onCancel={() => setShowTaskForm(false)}
              onSubmit={(d) => createTaskMut.mutate(d)}
              pending={createTaskMut.isPending}
            />
          )}
          {showExamForm && (
            <NewExamForm
              onCancel={() => setShowExamForm(false)}
              onSubmit={(d) => createExamMut.mutate(d)}
              pending={createExamMut.isPending}
            />
          )}
        </AnimatePresence>

        {exams.length > 0 && (
          <section className="mb-6">
            <h2 className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
              Upcoming exams
            </h2>
            <div className="flex flex-wrap gap-2">
              {exams.map((e) => {
                const days = Math.max(
                  0,
                  Math.ceil((new Date(e.exam_date).getTime() - Date.now()) / 86400000),
                );
                return (
                  <div
                    key={e.id}
                    className="group flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-xs"
                  >
                    <span className={cn("size-2 rounded-full", subjectColor(e.subject))} />
                    <span className="font-semibold">{e.name}</span>
                    <span className="text-muted-foreground">· in {days}d</span>
                    <button
                      onClick={() => delExamMut.mutate(e.id)}
                      className="opacity-0 transition-opacity group-hover:opacity-100"
                      aria-label="Delete exam"
                    >
                      <Trash2 className="size-3 text-muted-foreground hover:text-destructive" />
                    </button>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        <div className="mb-3 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-sm font-semibold">
            <CalendarDays className="size-4 text-primary" />
            Week of {weekStart.toLocaleDateString(undefined, { day: "numeric", month: "short" })}
          </h2>
          <div className="flex items-center gap-1">
            <button onClick={() => setWeekOffset((o) => o - 1)} className="rounded-full p-2 hover:bg-muted">
              <ChevronLeft className="size-4" />
            </button>
            <button onClick={() => setWeekOffset(0)} className="rounded-full px-3 py-1 text-xs font-medium hover:bg-muted">
              Today
            </button>
            <button onClick={() => setWeekOffset((o) => o + 1)} className="rounded-full p-2 hover:bg-muted">
              <ChevronRight className="size-4" />
            </button>
          </div>
        </div>

        {tLoading ? (
          <div className="grid gap-3 md:grid-cols-7">
            {Array.from({ length: 7 }).map((_, i) => (
              <div key={i} className="h-40 animate-pulse rounded-2xl bg-muted" />
            ))}
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-7">
            {days.map((d) => {
              const key = fmtDate(d);
              const dayTasks = tasksByDay.get(key) ?? [];
              const isToday = key === fmtDate(new Date());
              return (
                <div
                  key={key}
                  className={cn(
                    "rounded-2xl border p-3",
                    isToday ? "border-primary/60 bg-primary-soft/40" : "border-border bg-card",
                  )}
                >
                  <div className="mb-2 flex items-baseline justify-between">
                    <div className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                      {d.toLocaleDateString(undefined, { weekday: "short" })}
                    </div>
                    <div className={cn("text-lg font-bold", isToday && "text-primary")}>{d.getDate()}</div>
                  </div>
                  <div className="space-y-1.5">
                    {dayTasks.length === 0 && (
                      <div className="rounded-xl border border-dashed border-border p-3 text-center text-[10px] text-muted-foreground">
                        No tasks
                      </div>
                    )}
                    {dayTasks.map((t) => (
                      <TaskCard
                        key={t.id}
                        task={t}
                        onToggle={() =>
                          updateMut.mutate({ id: t.id, status: t.status === "done" ? "pending" : "done" })
                        }
                        onDelete={() => delTaskMut.mutate(t.id)}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AppShell>
  );
}

function TaskCard({ task, onToggle, onDelete }: { task: any; onToggle: () => void; onDelete: () => void }) {
  const done = task.status === "done";
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className={cn(
        "group rounded-xl border border-border bg-background p-2 text-xs shadow-sm",
        done && "opacity-60",
      )}
    >
      <div className="flex items-start gap-2">
        <button
          onClick={onToggle}
          className={cn(
            "mt-0.5 grid size-4 shrink-0 place-items-center rounded-full border-2",
            done ? "border-primary bg-primary text-primary-foreground" : "border-border text-transparent hover:border-primary",
          )}
        >
          <Check className="size-2.5" />
        </button>
        <div className="min-w-0 flex-1">
          <div className={cn("font-semibold leading-tight", done && "line-through")}>{task.title}</div>
          <div className="mt-0.5 flex items-center gap-1.5 text-[10px] text-muted-foreground">
            <span className={cn("size-1.5 rounded-full", subjectColor(task.subject))} />
            {task.subject ?? "General"} · {task.duration_min}m
            <span className={cn("ml-auto font-semibold", PRIORITY_STYLE[task.priority])}>
              {task.priority === "high" ? "!" : ""}
            </span>
          </div>
        </div>
        <button
          onClick={onDelete}
          className="opacity-0 transition-opacity group-hover:opacity-100"
          aria-label="Delete"
        >
          <Trash2 className="size-3 text-muted-foreground hover:text-destructive" />
        </button>
      </div>
    </motion.div>
  );
}

function NewTaskForm({
  onCancel,
  onSubmit,
  pending,
  defaultDate,
}: {
  onCancel: () => void;
  onSubmit: (d: any) => void;
  pending: boolean;
  defaultDate: string;
}) {
  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("");
  const [priority, setPriority] = useState<"low" | "med" | "high">("med");
  const [scheduled_for, setDate] = useState(defaultDate);
  const [duration_min, setDuration] = useState(30);

  return (
    <motion.form
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className="mb-4 space-y-3 rounded-2xl border border-border bg-card p-4"
      onSubmit={(e) => {
        e.preventDefault();
        if (!title.trim()) return;
        onSubmit({ title, subject: subject || null, priority, scheduled_for, duration_min });
      }}
    >
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Task title (e.g. Revise Chapter 3)"
        required
        className="w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
      />
      <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
        <input
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="Subject"
          className="rounded-xl border border-input bg-background px-3 py-2.5 text-sm outline-none focus:border-primary"
        />
        <select
          value={priority}
          onChange={(e) => setPriority(e.target.value as any)}
          className="rounded-xl border border-input bg-background px-3 py-2.5 text-sm outline-none"
        >
          <option value="low">Low</option>
          <option value="med">Medium</option>
          <option value="high">High</option>
        </select>
        <input
          type="date"
          value={scheduled_for}
          onChange={(e) => setDate(e.target.value)}
          className="rounded-xl border border-input bg-background px-3 py-2.5 text-sm outline-none"
        />
        <input
          type="number"
          min={5}
          max={600}
          value={duration_min}
          onChange={(e) => setDuration(Number(e.target.value))}
          className="rounded-xl border border-input bg-background px-3 py-2.5 text-sm outline-none"
        />
      </div>
      <div className="flex justify-end gap-2">
        <button type="button" onClick={onCancel} className="rounded-full px-4 py-2 text-sm hover:bg-muted">
          Cancel
        </button>
        <button
          disabled={pending}
          className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-60"
        >
          {pending && <Loader2 className="size-3 animate-spin" />}
          Save task
        </button>
      </div>
    </motion.form>
  );
}

function NewExamForm({ onCancel, onSubmit, pending }: { onCancel: () => void; onSubmit: (d: any) => void; pending: boolean }) {
  const [name, setName] = useState("");
  const [subject, setSubject] = useState("");
  const [exam_date, setDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 14);
    return d.toISOString().slice(0, 10);
  });
  return (
    <motion.form
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className="mb-4 space-y-3 rounded-2xl border border-border bg-card p-4"
      onSubmit={(e) => {
        e.preventDefault();
        if (!name.trim()) return;
        onSubmit({ name, subject: subject || null, exam_date });
      }}
    >
      <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Exam name (e.g. Mid-term Math)"
          required
          className="rounded-xl border border-input bg-background px-3 py-2.5 text-sm outline-none focus:border-primary"
        />
        <input
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="Subject"
          className="rounded-xl border border-input bg-background px-3 py-2.5 text-sm outline-none focus:border-primary"
        />
        <input
          type="date"
          value={exam_date}
          onChange={(e) => setDate(e.target.value)}
          className="rounded-xl border border-input bg-background px-3 py-2.5 text-sm outline-none"
        />
      </div>
      <div className="flex justify-end gap-2">
        <button type="button" onClick={onCancel} className="rounded-full px-4 py-2 text-sm hover:bg-muted">
          Cancel
        </button>
        <button
          disabled={pending}
          className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-60"
        >
          {pending && <Loader2 className="size-3 animate-spin" />}
          Save exam
        </button>
      </div>
    </motion.form>
  );
}
