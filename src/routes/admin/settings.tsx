import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { adminList, adminSaveSetting } from "@/lib/admin.functions";
import { Button, Card, Field, PageHeader, TableSkeleton, Toggle, inputCls } from "@/components/admin/ui";

export const Route = createFileRoute("/admin/settings")({ component: SettingsPage });

function SettingsPage() {
  const list = useServerFn(adminList);
  const settings = useQuery({
    queryKey: ["admin", "system_settings"],
    queryFn: () => list({ data: { table: "system_settings", limit: 20 } }),
  });

  const byKey = (k: string) => (settings.data ?? []).find((s: any) => s.key === k)?.value ?? {};

  return (
    <>
      <PageHeader title="System Settings" subtitle="Central configuration for AskNCERT" />
      {settings.isLoading ? (
        <TableSkeleton />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          <SettingsGroup
            settingKey="general"
            title="General"
            value={byKey("general")}
            fields={[
              { key: "app_name", label: "App name" },
              { key: "logo_url", label: "Logo URL" },
              { key: "maintenance_message", label: "Maintenance message", type: "textarea" },
            ]}
          />
          <SettingsGroup
            settingKey="user"
            title="Users"
            value={byKey("user")}
            fields={[
              { key: "registrations_enabled", label: "Allow new registrations", type: "boolean" },
              { key: "email_verification_required", label: "Require email verification", type: "boolean" },
              { key: "upload_mb_limit", label: "Upload limit (MB)", type: "number" },
              { key: "session_hours", label: "Session duration (hours)", type: "number" },
            ]}
          />
          <SettingsGroup
            settingKey="ai"
            title="AI"
            value={byKey("ai")}
            fields={[
              { key: "default_model", label: "Default model" },
              { key: "timeout_ms", label: "Timeout (ms)", type: "number" },
              { key: "max_retries", label: "Max retries", type: "number" },
              { key: "daily_request_limit", label: "Global daily request limit (0 = off)", type: "number" },
            ]}
          />
          <SettingsGroup
            settingKey="notifications"
            title="Notifications"
            value={byKey("notifications")}
            fields={[
              { key: "push_enabled", label: "Browser push notifications", type: "boolean" },
              { key: "email_enabled", label: "Email notifications", type: "boolean" },
            ]}
          />
          <Card className="lg:col-span-2 text-sm text-muted-foreground">
            Feature on/off and maintenance switches live on the AskNCERT Features page; platform-wide
            shutdown switches live in Emergency Mode.
          </Card>
        </div>
      )}
    </>
  );
}

type SettingField = { key: string; label: string; type?: "text" | "number" | "boolean" | "textarea" };

function SettingsGroup({
  settingKey,
  title,
  value,
  fields,
}: {
  settingKey: string;
  title: string;
  value: Record<string, any>;
  fields: SettingField[];
}) {
  const qc = useQueryClient();
  const saveSetting = useServerFn(adminSaveSetting);
  const [draft, setDraft] = useState<Record<string, any>>(value);

  const save = useMutation({
    mutationFn: () => saveSetting({ data: { key: settingKey, value: draft } }),
    onSuccess: () => {
      toast.success(`${title} settings saved`);
      qc.invalidateQueries({ queryKey: ["admin", "system_settings"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Card className="space-y-4">
      <h2 className="text-sm font-semibold">{title}</h2>
      <div className="grid gap-3">
        {fields.map((f) => (
          <Field key={f.key} label={f.label}>
            {f.type === "boolean" ? (
              <Toggle
                checked={!!draft[f.key]}
                label={f.label}
                onChange={(v) => setDraft((d) => ({ ...d, [f.key]: v }))}
              />
            ) : f.type === "textarea" ? (
              <textarea
                rows={3}
                className={inputCls}
                value={draft[f.key] ?? ""}
                onChange={(e) => setDraft((d) => ({ ...d, [f.key]: e.target.value }))}
              />
            ) : (
              <input
                type={f.type === "number" ? "number" : "text"}
                className={inputCls}
                value={draft[f.key] ?? ""}
                onChange={(e) =>
                  setDraft((d) => ({
                    ...d,
                    [f.key]: f.type === "number" ? Number(e.target.value) : e.target.value,
                  }))
                }
              />
            )}
          </Field>
        ))}
      </div>
      <Button loading={save.isPending} onClick={() => save.mutate()}>
        Save {title.toLowerCase()}
      </Button>
    </Card>
  );
}
