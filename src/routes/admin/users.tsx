import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { adminListUsers, adminUpdateUser, adminDeleteUser, adminForceLogout, adminUserDetail } from "@/lib/admin.functions";
import {
  Badge, Button, Card, DataTable, Field, Modal, PageHeader, Stat, fmt, fmtDate, inputCls,
} from "@/components/admin/ui";

export const Route = createFileRoute("/admin/users")({ component: UsersPage });

function UsersPage() {
  const qc = useQueryClient();
  const listUsers = useServerFn(adminListUsers);
  const updateUser = useServerFn(adminUpdateUser);
  const deleteUser = useServerFn(adminDeleteUser);
  const forceLogout = useServerFn(adminForceLogout);
  const [search, setSearch] = useState("");
  const [viewing, setViewing] = useState<string | null>(null);

  const users = useQuery({
    queryKey: ["admin", "users", search],
    queryFn: () => listUsers({ data: { search: search || undefined, limit: 500 } }),
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ["admin", "users"] });

  const update = useMutation({
    mutationFn: (v: any) => updateUser({ data: v }),
    onSuccess: () => {
      toast.success("User updated");
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });
  const remove = useMutation({
    mutationFn: (userId: string) => deleteUser({ data: { userId } }),
    onSuccess: () => {
      toast.success("User deleted");
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });
  const logout = useMutation({
    mutationFn: (userId: string) => forceLogout({ data: { userId } }),
    onSuccess: () => toast.success("All sessions revoked"),
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <>
      <PageHeader title="User Management" subtitle="Every AskNCERT student account" />
      <input
        className={inputCls + " mb-4 max-w-sm"}
        placeholder="Search by name or email…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />
      <DataTable
        rows={users.data ?? []}
        loading={users.isLoading}
        error={users.error ? (users.error as Error).message : null}
        empty="No user accounts yet."
        columns={[
          { key: "display_name", label: "Name", render: (r) => r.display_name || "—" },
          { key: "email", label: "Email", render: (r) => r.email || "—" },
          {
            key: "plan",
            label: "Plan",
            render: (r) => (
              <select
                className="rounded-lg border border-input bg-background px-2 py-1 text-xs"
                value={r.plan}
                onChange={(e) => update.mutate({ userId: r.id, plan: e.target.value })}
              >
                <option value="free">Free</option>
                <option value="plus">Plus</option>
                <option value="pro">Pro</option>
              </select>
            ),
          },
          {
            key: "status",
            label: "Status",
            render: (r) => (
              <Badge tone={r.status === "active" ? "good" : "bad"}>{r.status}</Badge>
            ),
          },
          { key: "created_at", label: "Joined", render: (r) => fmtDate(r.created_at) },
          { key: "last_active_at", label: "Last active", render: (r) => fmtDate(r.last_active_at) },
          {
            key: "actions",
            label: "Actions",
            render: (r) => (
              <div className="flex flex-wrap gap-1.5">
                <Button variant="outline" onClick={() => setViewing(r.id)}>
                  View
                </Button>
                <Button
                  variant="outline"
                  onClick={() =>
                    update.mutate({ userId: r.id, status: r.status === "active" ? "suspended" : "active" })
                  }
                >
                  {r.status === "active" ? "Suspend" : "Unsuspend"}
                </Button>
                <Button variant="ghost" onClick={() => logout.mutate(r.id)}>
                  Force logout
                </Button>
                <Button
                  variant="danger"
                  onClick={() => {
                    if (confirm(`Permanently delete ${r.email ?? r.display_name}? This cannot be undone.`))
                      remove.mutate(r.id);
                  }}
                >
                  Delete
                </Button>
              </div>
            ),
          },
        ]}
      />
      {viewing && <UserDetail userId={viewing} onClose={() => setViewing(null)} />}
    </>
  );
}

function UserDetail({ userId, onClose }: { userId: string; onClose: () => void }) {
  const detailFn = useServerFn(adminUserDetail);
  const { data, isLoading } = useQuery({
    queryKey: ["admin", "user", userId],
    queryFn: () => detailFn({ data: { userId } }),
  });

  return (
    <Modal open onClose={onClose} title="User details">
      {isLoading || !data ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : (
        <div className="space-y-5">
          <div className="grid gap-3 sm:grid-cols-3">
            <Stat label="Notes" value={fmt(data.counts.notes)} />
            <Stat label="Quizzes" value={fmt(data.counts.quizzes)} />
            <Stat label="Study minutes" value={fmt(data.counts.studyMinutes)} />
          </div>

          <Card>
            <h3 className="mb-2 text-sm font-semibold">Profile</h3>
            <dl className="grid gap-2 text-sm sm:grid-cols-2">
              <Row label="Name" value={data.profile?.display_name} />
              <Row label="Email" value={data.profile?.email} />
              <Row label="Class" value={data.profile?.class_level} />
              <Row label="Board" value={data.profile?.board} />
              <Row label="Language" value={data.profile?.language} />
              <Row label="Status" value={data.profile?.status} />
              <Row label="Plan" value={data.profile?.plan} />
              <Row label="Joined" value={fmtDate(data.profile?.created_at)} />
            </dl>
          </Card>

          <Card>
            <h3 className="mb-2 text-sm font-semibold">Subscription</h3>
            {data.subscription ? (
              <dl className="grid gap-2 text-sm sm:grid-cols-2">
                <Row label="Plan" value={data.subscription.plan_code} />
                <Row label="Status" value={data.subscription.status} />
                <Row label="Started" value={fmtDate(data.subscription.started_at)} />
                <Row label="Expires" value={fmtDate(data.subscription.expires_at)} />
              </dl>
            ) : (
              <p className="text-sm text-muted-foreground">On the free plan — no paid subscription.</p>
            )}
          </Card>

          <MiniList title="Recent AI usage" rows={data.aiUsage} render={(r: any) => `${fmtDate(r.created_at)} · ${r.model} · ${r.success ? "ok" : "failed"}`} />
          <MiniList title="OCR usage" rows={data.ocrUsage} render={(r: any) => `${fmtDate(r.created_at)} · ${r.file_name ?? "file"} · ${r.success ? "ok" : "failed"}`} />
          <MiniList title="Uploaded files" rows={data.files} render={(r: any) => `${r.name} · ${r.size_kb} KB · ${fmtDate(r.created_at)}`} />
          <MiniList title="Security events" rows={data.securityEvents} render={(r: any) => `${fmtDate(r.created_at)} · ${r.event_type} · ${r.detail ?? ""}`} />
        </div>
      )}
    </Modal>
  );
}

function Row({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <dt className="text-[11px] uppercase tracking-widest text-muted-foreground">{label}</dt>
      <dd className="font-medium">{value || "—"}</dd>
    </div>
  );
}

function MiniList({ title, rows, render }: { title: string; rows: any[]; render: (r: any) => string }) {
  return (
    <Card>
      <h3 className="mb-2 text-sm font-semibold">{title}</h3>
      {rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nothing recorded.</p>
      ) : (
        <ul className="space-y-1 text-xs text-muted-foreground">
          {rows.map((r) => (
            <li key={r.id}>{render(r)}</li>
          ))}
        </ul>
      )}
    </Card>
  );
}
