import { createFileRoute } from "@tanstack/react-router";
import { CrudPage } from "@/components/admin/crud";
import { Badge } from "@/components/admin/ui";

export const Route = createFileRoute("/admin/material")({ component: MaterialPage });

function MaterialPage() {
  return (
    <CrudPage
      table="study_material"
      title="Notes & Study Material"
      subtitle="Chapter summaries, formulas, important points and revision material"
      searchColumn="title"
      fields={[
        { key: "title", label: "Title" },
        { key: "body", label: "Content", type: "textarea", hideInTable: true },
        {
          key: "kind",
          label: "Type",
          type: "select",
          defaultValue: "notes",
          options: [
            { value: "notes", label: "Notes" },
            { value: "summary", label: "Chapter summary" },
            { value: "important_points", label: "Important points" },
            { value: "formulas", label: "Formulas" },
            { value: "revision", label: "Revision material" },
          ],
        },
        { key: "class_level", label: "Class", type: "number" },
        { key: "subject", label: "Subject" },
        { key: "chapter", label: "Chapter" },
        {
          key: "language",
          label: "Language",
          type: "select",
          defaultValue: "english",
          options: [
            { value: "english", label: "English" },
            { value: "hindi", label: "Hindi" },
          ],
        },
        {
          key: "published",
          label: "Published",
          type: "boolean",
          render: (r) => <Badge tone={r.published ? "good" : "muted"}>{r.published ? "Published" : "Draft"}</Badge>,
        },
        { key: "updated_at", label: "Updated", type: "date", hideInForm: true },
      ]}
    />
  );
}
