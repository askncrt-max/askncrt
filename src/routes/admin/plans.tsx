import { createFileRoute } from "@tanstack/react-router";
import { CrudPage } from "@/components/admin/crud";
import { Badge, Card } from "@/components/admin/ui";

export const Route = createFileRoute("/admin/plans")({ component: PlansPage });

function PlansPage() {
  return (
    <>
      <Card className="mb-5 text-sm text-muted-foreground">
        Limits set here are read by the server at request time — nothing is hardcoded in the app.
        Payments are not integrated yet, so no billing data is shown.
      </Card>
      <CrudPage
        table="plans"
        title="Subscription & Plans"
        subtitle="Free, Plus and Pro limits"
        searchColumn="name"
        fields={[
          { key: "code", label: "Code" },
          { key: "name", label: "Name" },
          { key: "price_inr", label: "Price (₹/mo)", type: "number" },
          { key: "ai_daily_limit", label: "AI / day", type: "number" },
          { key: "ocr_daily_limit", label: "OCR / day", type: "number" },
          { key: "quiz_daily_limit", label: "Quizzes / day", type: "number" },
          { key: "upload_mb_limit", label: "Upload MB", type: "number" },
          { key: "storage_mb_limit", label: "Storage MB", type: "number" },
          {
            key: "ads_enabled",
            label: "Ads",
            type: "boolean",
            render: (r) => <Badge tone={r.ads_enabled ? "warn" : "good"}>{r.ads_enabled ? "Shown" : "Hidden"}</Badge>,
          },
          { key: "active", label: "Active", type: "boolean", defaultValue: true },
          { key: "sort_order", label: "Order", type: "number" },
        ]}
      />
    </>
  );
}
