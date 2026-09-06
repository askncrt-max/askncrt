import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { AlertTriangle } from "lucide-react";
import { adminList, adminSetEmergency } from "@/lib/admin.functions";
import { Badge, Button, Card, Modal, PageHeader, TableSkeleton, inputCls } from "@/components/admin/ui";

export const Route = createFileRoute("/admin/emergency")({ component: EmergencyPage });

const SWITCHES = [
  { key: "maintenance_mode", label: "Maintenance mode", detail: "Shows the maintenance message to every student." },
  { key: "ai_disabled", label: "Disable AI", detail: "Stops all AI answering and chat." },
  { key: "ocr_disabled", label: "Disable OCR", detail: "Blocks image and PDF question input." },
  { key: "uploads_disabled", label: "Disable uploads", detail: "Blocks all file uploads." },
  { key: "registrations_disabled", label: "Disable registrations", detail: "Stops new accounts being created." },
] as const;

function EmergencyPage() {
  const qc = useQueryClient();
  const list = useServerFn(adminList);
  const setEmergency = useServerFn(adminSetEmergency);
  const [pending, setPending] = useState<{ key: string; next: boolean; label: string } | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const state = useQuery({
    queryKey: ["admin", "emergency_settings"],
    queryFn: () => list({ data: { table: "emergency_settings", limit: 1 } }),
  });
  const row = (state.data ?? [])[0];

  const apply = useMutation({
    mutationFn: (values: Record<string, any>) => setEmergency({ data: values }),
    onSuccess: () => {
      toast.success("Emergency settings updated and logged");
      setPending(null);
      qc.invalidateQueries({ queryKey: ["admin", "emergency_settings"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const anyActive =
    row && SWITCHES.some((s) => row[s.key]);

  return (
    <>
      <PageHeader title="Emergency Mode" subtitle="Platform-wide shutdown switches. Every change is confirmed and logged." />

      {state.isLoading || !row ? (
        <TableSkeleton />
      ) : (
        <div className="space-y-4">
          {anyActive && (
            <Card className="flex items-center gap-3 border-destructive/40 bg-destructive/10">
              <AlertTriangle className="size-5 text-destructive" />
              <div className="text-sm font-medium text-destructive">
                Emergency restrictions are currently active.
              </div>
            </Card>
          )}

          <div className="grid gap-3 md:grid-cols-2">
            {SWITCHES.map((s) => (
              <Card key={s.key} className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold">{s.label}</h3>
                    <Badge tone={row[s.key] ? "bad" : "good"}>{row[s.key] ? "Active" : "Off"}</Badge>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">{s.detail}</p>
                </div>
                <Button
                  variant={row[s.key] ? "outline" : "danger"}
                  onClick={() => setPending({ key: s.key, next: !row[s.key], label: s.label })}
                >
                  {row[s.key] ? "Turn off" : "Activate"}
                </Button>
              </Card>
            ))}
          </div>

          <Card className="space-y-3">
            <h3 className="text-sm font-semibold">Emergency message shown to students</h3>
            <textarea
              rows={3}
              className={inputCls}
              value={message ?? row.message ?? ""}
              onChange={(e) => setMessage(e.target.value)}
            />
            <Button onClick={() => apply.mutate({ message: message ?? row.message ?? "" })} loading={apply.isPending}>
              Save message
            </Button>
          </Card>
        </div>
      )}

      <Modal
        open={!!pending}
        onClose={() => setPending(null)}
        title="Confirm emergency action"
        footer={
          <>
            <Button variant="outline" onClick={() => setPending(null)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              loading={apply.isPending}
              onClick={() => pending && apply.mutate({ [pending.key]: pending.next })}
            >
              Yes, {pending?.next ? "activate" : "turn off"}
            </Button>
          </>
        }
      >
        <p className="text-sm text-muted-foreground">
          {pending?.next
            ? `This will immediately apply "${pending?.label}" for every AskNCERT student.`
            : `This will lift "${pending?.label}" for every AskNCERT student.`}{" "}
          The action is recorded in the audit log.
        </p>
      </Modal>
    </>
  );
}
