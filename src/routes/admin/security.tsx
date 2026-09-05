import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { adminList, adminSave, adminForceLogout, adminUpdateUser } from "@/lib/admin.functions";
import { Badge, Button, Card, DataTable, PageHeader, Stat, fmt, fmtDate } from "@/components/admin/ui";

export const Route = createFileRoute("/admin/security")({ component: SecurityPage });

function SecurityPage() {
  const qc = useQueryClient();
  const list = useServerFn(adminList);
  const save = useServerFn(adminSave);
  const forceLogout = useServerFn(adminForceLogout);
  const updateUser = useServerFn(adminUpdateUser);

  const events = useQuery({
    queryKey: ["admin", "security_events"],
    queryFn: () => list({ data: { table: "security_events", limit: 300 } }),
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ["admin", "security_events"] });

  const review = useMutation({
    mutationFn: (id: string) => save({ data: { table: "security_events", id, values: { reviewed: true } } }),
    onSuccess: () => {
      toast.success("Marked reviewed");
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });
  const logout = useMutation({
    mutationFn: (userId: string) => forceLogout({ data: { userId } }),
    onSuccess: () => toast.success("Sessions revoked"),
    onError: (e: Error) => toast.error(e.message),
  });
  const suspend = useMutation({
    mutationFn: (userId: string) => updateUser({ data: { userId, status: "suspended" } }),
    onSuccess: () => toast.success("Account suspended"),
    onError: (e: Error) => toast.error(e.message),
  });

  const rows = events.data ?? [];
  const failedLogins = rows.filter((r: any) => r.event_type === "failed_login").length;
  const critical = rows.filter((r: any) => r.severity === "critical").length;
  const unreviewed = rows.filter((r: any) => !r.reviewed).length;

  return (
    <>
      <PageHeader title="Security Center" subtitle="Sign-in failures, suspicious activity and permission violations" />

      <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Events" value={fmt(rows.length)} />
        <Stat label="Failed logins" value={fmt(failedLogins)} tone={failedLogins ? "warn" : "good"} />
        <Stat label="Critical" value={fmt(critical)} tone={critical ? "bad" : "good"} />
        <Stat label="Unreviewed" value={fmt(unreviewed)} tone={unreviewed ? "warn" : "good"} />
      </div>

      <Card className="mb-5 text-xs text-muted-foreground">
        Passwords, tokens and API secrets are never stored or shown here.
      </Card>

      <DataTable
        rows={rows}
        loading={events.isLoading}
        empty="No security events recorded."
        columns={[
          { key: "created_at", label: "When", render: (r) => fmtDate(r.created_at) },
          { key: "event_type", label: "Event" },
          {
            key: "severity",
            label: "Severity",
            render: (r) => (
              <Badge tone={r.severity === "critical" ? "bad" : r.severity === "warning" ? "warn" : "info"}>
                {r.severity}
              </Badge>
            ),
          },
          { key: "email", label: "Account", render: (r) => r.email || (r.user_id ? r.user_id.slice(0, 8) + "…" : "—") },
          { key: "detail", label: "Detail" },
          { key: "ip", label: "IP" },
          {
            key: "actions",
            label: "Actions",
            render: (r) => (
              <div className="flex flex-wrap gap-1.5">
                {!r.reviewed && (
                  <Button variant="outline" onClick={() => review.mutate(r.id)}>
                    Review
                  </Button>
                )}
                {r.user_id && (
                  <>
                    <Button variant="ghost" onClick={() => logout.mutate(r.user_id)}>
                      Force logout
                    </Button>
                    <Button
                      variant="danger"
                      onClick={() => {
                        if (confirm("Suspend this account?")) suspend.mutate(r.user_id);
                      }}
                    >
                      Suspend
                    </Button>
                  </>
                )}
              </div>
            ),
          },
        ]}
      />
    </>
  );
}
