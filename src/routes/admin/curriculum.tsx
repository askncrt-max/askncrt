import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { adminList } from "@/lib/admin.functions";
import { CrudPage } from "@/components/admin/crud";
import { PageHeader } from "@/components/admin/ui";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin/curriculum")({ component: CurriculumPage });

const TABS = [
  { key: "classes", label: "Classes" },
  { key: "subjects", label: "Subjects" },
  { key: "chapters", label: "Chapters & Topics" },
] as const;

function CurriculumPage() {
  const [tab, setTab] = useState<(typeof TABS)[number]["key"]>("classes");
  const list = useServerFn(adminList);

  const classes = useQuery({
    queryKey: ["admin", "classes-opts"],
    queryFn: () => list({ data: { table: "classes", limit: 50 } }),
  });
  const subjects = useQuery({
    queryKey: ["admin", "subjects-opts"],
    queryFn: () => list({ data: { table: "subjects", limit: 500 } }),
  });

  const classOptions = (classes.data ?? []).map((c: any) => ({ value: c.id, label: c.name }));
  const subjectOptions = (subjects.data ?? []).map((s: any) => ({ value: s.id, label: s.name }));
  const classNameById = new Map((classes.data ?? []).map((c: any) => [c.id, c.name]));
  const subjectNameById = new Map((subjects.data ?? []).map((s: any) => [s.id, s.name]));

  return (
    <>
      <PageHeader title="Classes & Subjects" subtitle="The NCERT structure students study against" />
      <div className="mb-5 flex gap-1 rounded-xl border border-border bg-card p-1">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={cn(
              "rounded-lg px-3 py-1.5 text-xs font-medium",
              tab === t.key ? "bg-primary text-primary-foreground" : "hover:bg-muted",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "classes" && (
        <CrudPage
          table="classes"
          title="Classes"
          subtitle="Class 5 to Class 12"
          searchColumn="name"
          fields={[
            { key: "name", label: "Name" },
            { key: "level", label: "Level", type: "number" },
            { key: "published", label: "Published", type: "boolean", defaultValue: true },
            { key: "sort_order", label: "Order", type: "number" },
          ]}
        />
      )}

      {tab === "subjects" && (
        <CrudPage
          table="subjects"
          title="Subjects"
          subtitle="Subjects per class, board and language"
          searchColumn="name"
          fields={[
            { key: "name", label: "Subject" },
            {
              key: "class_id",
              label: "Class",
              type: "select",
              options: classOptions,
              render: (r) => classNameById.get(r.class_id) ?? "—",
            },
            { key: "board", label: "Board", defaultValue: "NCERT" },
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
            { key: "published", label: "Published", type: "boolean", defaultValue: true },
            { key: "sort_order", label: "Order", type: "number" },
          ]}
        />
      )}

      {tab === "chapters" && (
        <CrudPage
          table="chapters"
          title="Chapters & Topics"
          subtitle="Chapters with their topic list"
          searchColumn="name"
          fields={[
            { key: "name", label: "Chapter" },
            {
              key: "subject_id",
              label: "Subject",
              type: "select",
              options: subjectOptions,
              render: (r) => subjectNameById.get(r.subject_id) ?? "—",
            },
            {
              key: "topics",
              label: "Topics (comma separated)",
              type: "textarea",
              render: (r) => (r.topics ?? []).join(", ") || "—",
            },
            { key: "published", label: "Published", type: "boolean", defaultValue: true },
            { key: "sort_order", label: "Order", type: "number" },
          ]}
        />
      )}
    </>
  );
}
