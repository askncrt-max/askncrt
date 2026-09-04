import { createFileRoute } from "@tanstack/react-router";
import { CrudPage } from "@/components/admin/crud";
import { Badge } from "@/components/admin/ui";

export const Route = createFileRoute("/admin/questions")({ component: QuestionsPage });

function QuestionsPage() {
  return (
    <CrudPage
      table="admin_questions"
      title="Questions & Answers"
      subtitle="Curated question bank, popular questions and reported answers"
      searchColumn="question"
      fields={[
        { key: "question", label: "Question", type: "textarea" },
        { key: "answer", label: "Answer", type: "textarea", hideInTable: true },
        { key: "class_level", label: "Class", type: "number" },
        { key: "subject", label: "Subject" },
        { key: "chapter", label: "Chapter" },
        {
          key: "difficulty",
          label: "Difficulty",
          type: "select",
          defaultValue: "medium",
          options: [
            { value: "easy", label: "Easy" },
            { value: "medium", label: "Medium" },
            { value: "hard", label: "Hard" },
          ],
          render: (r) => (
            <Badge tone={r.difficulty === "hard" ? "bad" : r.difficulty === "easy" ? "good" : "warn"}>
              {r.difficulty}
            </Badge>
          ),
        },
        {
          key: "status",
          label: "Status",
          type: "select",
          defaultValue: "published",
          options: [
            { value: "draft", label: "Draft" },
            { value: "published", label: "Published" },
            { value: "hidden", label: "Hidden" },
          ],
        },
        { key: "ask_count", label: "Times asked", type: "number" },
        {
          key: "reported",
          label: "Reported",
          type: "boolean",
          render: (r) => (r.reported ? <Badge tone="bad">Reported</Badge> : <Badge>Clean</Badge>),
        },
        { key: "report_reason", label: "Report reason", hideInTable: true },
      ]}
    />
  );
}
