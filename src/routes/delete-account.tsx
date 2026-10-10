import { createFileRoute, Link } from "@tanstack/react-router";
import { LegalDocument } from "@/components/legal-document";

export const Route = createFileRoute("/delete-account")({
  head: () => ({
    meta: [
      { title: "Delete Your AskNCERT Account" },
      { name: "description", content: "How to securely and permanently delete your AskNCERT account and associated study data." },
      { property: "og:title", content: "Delete Your AskNCERT Account" },
      { property: "og:description", content: "Request permanent account deletion securely from your signed-in AskNCERT settings." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: DeleteAccountPage,
});

function DeleteAccountPage() {
  return (
    <LegalDocument
      title="Delete your account"
      description="Account deletion is permanent. Use the signed-in account controls so AskNCERT can verify that the request belongs to you."
      sections={[
        {
          title: "How to delete your account",
          paragraphs: ["Sign in to the account you want to close, open Settings, and select Delete Account under Account & Security. Review the confirmation, check the confirmation box, and confirm. AskNCERT verifies your active sign-in before deleting anything. This page does not accept deletion requests for accounts identified only by an email address."],
          bullets: [
            "If you cannot sign in, email askncrt@gmail.com from the email address associated with the account. We may need to verify that you control the account before processing a request. Never send your password or sign-in codes.",
            "The Super Admin account is protected from deletion through student settings.",
          ],
        },
        {
          title: "What is deleted",
          paragraphs: ["When completed, the account and its profile are permanently removed, along with its chats and messages, notes, saved AI memory, quizzes and attempts, study plans and records, reminders, subscription record, file metadata, and linked AI, OCR, feature-usage, and security-event records. The current app does not store chat attachments in a configured file-storage bucket."],
        },
        {
          title: "Information that may remain",
          paragraphs: ["Some administrative audit entries may be retained for security, legal compliance, or dispute handling. The account identifier and recorded before/after values linked to a completed deletion are cleared from those entries. Information required by law or needed to establish, exercise, or defend legal claims may be retained only as necessary for that purpose. Infrastructure backups may retain copies temporarily until the provider's backup lifecycle expires them."],
        },
        {
          title: "After deletion",
          paragraphs: ["You are signed out and returned to the sign-in screen. Your account cannot be restored. You may create a new account later, but the deleted account's saved study information will not return."],
        },
        {
          title: "Questions",
          paragraphs: ["For account deletion or privacy questions, contact askncrt@gmail.com. Do not include your password or verification codes."],
        },
      ]}
    >
      <div className="mt-6 flex flex-wrap gap-3">
        <Link to="/auth" className="inline-flex min-h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:opacity-90">Sign in to manage your account</Link>
        <Link to="/privacy-policy" className="inline-flex min-h-10 items-center justify-center rounded-md border border-border px-4 text-sm font-medium hover:bg-muted">Read the Privacy Policy</Link>
      </div>
    </LegalDocument>
  );
}