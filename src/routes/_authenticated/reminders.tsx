import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { format } from "date-fns";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Bell, BellRing, Trash2, Check, Repeat } from "lucide-react";
import {
  listReminders,
  createReminder,
  toggleReminder,
  deleteReminder,
} from "@/lib/reminders.functions";

export const Route = createFileRoute("/_authenticated/reminders")({
  head: () => ({
    meta: [
      { title: "Homework Reminders — AskNCERT" },
      {
        name: "description",
        content:
          "Set homework, study, exam and goal reminders with optional browser push notifications.",
      },
    ],
  }),
  component: RemindersPage,
});

const PUSH_KEY = "askncert:push_enabled";

function RemindersPage() {
  const qc = useQueryClient();
  const list = useServerFn(listReminders);
  const create = useServerFn(createReminder);
  const toggle = useServerFn(toggleReminder);
  const remove = useServerFn(deleteReminder);

  const { data: reminders = [] } = useQuery({
    queryKey: ["reminders"],
    queryFn: () => list(),
  });

  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [type, setType] = useState<"study" | "homework" | "exam" | "goal">("homework");
  const [due, setDue] = useState(() => {
    const d = new Date(Date.now() + 60 * 60 * 1000);
    d.setSeconds(0, 0);
    return d.toISOString().slice(0, 16);
  });
  const [repeat, setRepeat] = useState<"none" | "daily" | "weekly">("none");
  const [pushEnabled, setPushEnabled] = useState(false);

  const [permission, setPermission] = useState<NotificationPermission>(
    typeof Notification !== "undefined" ? Notification.permission : "default",
  );
  const [pushOn, setPushOn] = useState<boolean>(() =>
    typeof window !== "undefined" ? localStorage.getItem(PUSH_KEY) === "1" : false,
  );

  async function enablePush() {
    if (typeof Notification === "undefined") {
      toast.error("This browser doesn't support notifications.");
      return;
    }
    const p = await Notification.requestPermission();
    setPermission(p);
    if (p === "granted") {
      localStorage.setItem(PUSH_KEY, "1");
      setPushOn(true);
      new Notification("AskNCERT reminders enabled ✅", {
        body: "You'll be notified when a reminder is due.",
      });
    } else {
      toast.error("Notifications were blocked. Enable them in browser settings.");
    }
  }

  function disablePush() {
    localStorage.setItem(PUSH_KEY, "0");
    setPushOn(false);
    toast.success("Browser reminders turned off.");
  }

  // Browser-local scheduler: while the tab is open, fire notifications for due reminders.
  useEffect(() => {
    if (!pushOn || permission !== "granted") return;
    const fired = new Set<string>();
    const tick = () => {
      const now = Date.now();
      for (const r of reminders as any[]) {
        if (r.completed) continue;
        if (!r.push_enabled) continue;
        const t = new Date(r.notify_at ?? r.due_at).getTime();
        if (t <= now && t > now - 60_000 && !fired.has(r.id)) {
          fired.add(r.id);
          try {
            new Notification(r.title, {
              body: r.description ?? `Due ${format(new Date(r.due_at), "PPp")}`,
              tag: r.id,
            });
          } catch {}
        }
      }
    };
    tick();
    const id = setInterval(tick, 30_000);
    return () => clearInterval(id);
  }, [reminders, pushOn, permission]);

  async function onCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    try {
      await create({
        data: {
          title: title.trim(),
          description: desc.trim() || null,
          reminder_type: type,
          due_at: new Date(due).toISOString(),
          repeat,
          push_enabled: pushEnabled,
          notify_at: pushEnabled ? new Date(due).toISOString() : null,
        },
      });
      setTitle("");
      setDesc("");
      qc.invalidateQueries({ queryKey: ["reminders"] });
      toast.success("Reminder saved");
    } catch (err: any) {
      toast.error(err?.message || "Could not save");
    }
  }

  const { upcoming, done } = useMemo(() => {
    const u: any[] = [];
    const d: any[] = [];
    for (const r of reminders as any[]) (r.completed ? d : u).push(r);
    return { upcoming: u, done: d };
  }, [reminders]);

  return (
    <AppShell>
      <div className="mx-auto max-w-4xl space-y-6 px-4 py-6">
        <header className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Reminders</h1>
            <p className="text-sm text-muted-foreground">
              Homework, study, exams and goals — with browser push.
            </p>
          </div>
          {pushOn && permission === "granted" ? (
            <Button variant="outline" size="sm" onClick={disablePush}>
              <BellRing className="mr-2 h-4 w-4 text-primary" />
              Push on
            </Button>
          ) : (
            <Button size="sm" onClick={enablePush}>
              <Bell className="mr-2 h-4 w-4" />
              Enable push
            </Button>
          )}
        </header>

        <Card className="rounded-2xl p-4">
          <form onSubmit={onCreate} className="grid gap-3 md:grid-cols-2">
            <Input
              placeholder="Title (e.g. Physics homework Ch 3)"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="md:col-span-2"
              required
            />
            <Textarea
              placeholder="Notes (optional)"
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              className="md:col-span-2"
              rows={2}
            />
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-muted-foreground">Type</span>
              <select
                className="rounded-md border bg-background px-3 py-2"
                value={type}
                onChange={(e) => setType(e.target.value as any)}
              >
                <option value="homework">Homework</option>
                <option value="study">Study</option>
                <option value="exam">Exam</option>
                <option value="goal">Goal</option>
              </select>
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-muted-foreground">Due</span>
              <input
                type="datetime-local"
                className="rounded-md border bg-background px-3 py-2"
                value={due}
                onChange={(e) => setDue(e.target.value)}
                required
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-muted-foreground">Repeat</span>
              <select
                className="rounded-md border bg-background px-3 py-2"
                value={repeat}
                onChange={(e) => setRepeat(e.target.value as any)}
              >
                <option value="none">One-time</option>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
              </select>
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={pushEnabled}
                onChange={(e) => setPushEnabled(e.target.checked)}
              />
              Notify me on this device
            </label>
            <div className="md:col-span-2 flex justify-end">
              <Button type="submit">Add reminder</Button>
            </div>
          </form>
        </Card>

        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground">
            Upcoming ({upcoming.length})
          </h2>
          {upcoming.length === 0 && (
            <p className="text-sm text-muted-foreground">Nothing scheduled — you're all caught up.</p>
          )}
          <div className="space-y-2">
            {upcoming.map((r) => (
              <ReminderCard
                key={r.id}
                r={r}
                onToggle={async () => {
                  await toggle({ data: { id: r.id, completed: true } });
                  qc.invalidateQueries({ queryKey: ["reminders"] });
                }}
                onDelete={async () => {
                  await remove({ data: { id: r.id } });
                  qc.invalidateQueries({ queryKey: ["reminders"] });
                }}
              />
            ))}
          </div>
        </section>

        {done.length > 0 && (
          <section className="space-y-3">
            <h2 className="text-sm font-semibold text-muted-foreground">Done ({done.length})</h2>
            <div className="space-y-2 opacity-70">
              {done.map((r) => (
                <ReminderCard
                  key={r.id}
                  r={r}
                  onToggle={async () => {
                    await toggle({ data: { id: r.id, completed: false } });
                    qc.invalidateQueries({ queryKey: ["reminders"] });
                  }}
                  onDelete={async () => {
                    await remove({ data: { id: r.id } });
                    qc.invalidateQueries({ queryKey: ["reminders"] });
                  }}
                />
              ))}
            </div>
          </section>
        )}
      </div>
    </AppShell>
  );
}

function ReminderCard({
  r,
  onToggle,
  onDelete,
}: {
  r: any;
  onToggle: () => void;
  onDelete: () => void;
}) {
  const due = new Date(r.due_at);
  const diff = due.getTime() - Date.now();
  const past = diff < 0 && !r.completed;
  return (
    <Card className="flex items-center justify-between gap-3 rounded-xl p-3">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate font-medium">{r.title}</p>
          <Badge variant="secondary" className="text-[10px] uppercase">
            {r.reminder_type}
          </Badge>
          {r.repeat && r.repeat !== "none" && (
            <Badge variant="outline" className="gap-1 text-[10px]">
              <Repeat className="h-3 w-3" /> {r.repeat}
            </Badge>
          )}
          {r.push_enabled && <BellRing className="h-3.5 w-3.5 text-primary" />}
        </div>
        {r.description && (
          <p className="mt-0.5 truncate text-xs text-muted-foreground">{r.description}</p>
        )}
        <p className={`mt-0.5 text-xs ${past ? "text-destructive" : "text-muted-foreground"}`}>
          {past ? "Overdue · " : "Due "}
          {format(due, "PPp")}
        </p>
      </div>
      <div className="flex shrink-0 gap-1">
        <Button size="icon" variant="ghost" onClick={onToggle} aria-label="Toggle done">
          <Check className="h-4 w-4" />
        </Button>
        <Button size="icon" variant="ghost" onClick={onDelete} aria-label="Delete reminder">
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </Card>
  );
}
