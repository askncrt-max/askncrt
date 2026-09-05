import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { adminSave } from "@/lib/admin.functions";
import { CrudPage } from "@/components/admin/crud";
import { Badge, Button } from "@/components/admin/ui";

export const Route = createFileRoute("/admin/notifications")({ component: NotificationsPage });

function NotificationsPage() {
  const qc = useQueryClient();
  const save = useServerFn(adminSave);

  const setStatus = useMutation({
    mutationFn: (v: { id: string; values: Record<string, any> }) =>
      save({ data: { table: "notifications", id: v.id, values: v.values } }),
    onSuccess: () => {
      toast.success("Notification updated");
      qc.invalidateQueries({ queryKey: ["admin", "notifications"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <CrudPage
      table="notifications"
      title="Notifications"
      subtitle="Announcements, maintenance notices and messages to a single student"
      searchColumn="title"
      extraActions={(row) =>
        row.status !== "sent" ? (
          <Button
            variant="outline"
            onClick={() => setStatus.mutate({ id: row.id, values: { status: "sent", sent_at: new Date().toISOString() } })}
          >
            Send
          </Button>
        ) : (
          <Button
            variant="ghost"
            onClick={() => setStatus.mutate({ id: row.id, values: { status: "expired", expires_at: new Date().toISOString() } })}
          >
            Expire
          </Button>
        )
      }
      fields={[
        { key: "title", label: "Title" },
        { key: "body", label: "Message", type: "textarea", hideInTable: true },
        {
          key: "kind",
          label: "Type",
          type: "select",
          defaultValue: "announcement",
          options: [
            { value: "announcement", label: "Global announcement" },
            { value: "feature", label: "Feature announcement" },
            { value: "maintenance", label: "Maintenance notice" },
            { value: "important", label: "Important app notice" },
            { value: "personal", label: "Individual user" },
          ],
        },
        {
          key: "status",
          label: "Status",
          type: "select",
          defaultValue: "draft",
          options: [
            { value: "draft", label: "Draft" },
            { value: "scheduled", label: "Scheduled" },
            { value: "sent", label: "Sent" },
            { value: "expired", label: "Expired" },
          ],
          render: (r) => (
            <Badge tone={r.status === "sent" ? "good" : r.status === "expired" ? "muted" : "warn"}>{r.status}</Badge>
          ),
        },
        { key: "target_user_id", label: "Target user id (blank = everyone)", hideInTable: true },
        { key: "scheduled_at", label: "Scheduled for", type: "date" },
        { key: "expires_at", label: "Expires", type: "date" },
        { key: "created_at", label: "Created", type: "date", hideInForm: true },
      ]}
    />
  );
}
