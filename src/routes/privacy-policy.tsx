import { createFileRoute, Link } from "@tanstack/react-router";
import { LegalDocument } from "@/components/legal-document";

export const Route = createFileRoute("/privacy-policy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy — AskNCERT" },
      { name: "description", content: "How AskNCERT collects, uses, stores, and deletes account and study information." },
      { property: "og:title", content: "Privacy Policy — AskNCERT" },
      { property: "og:description", content: "Understand how AskNCERT handles account information, chats, and AI requests." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: PrivacyPolicyPage,
});

function PrivacyPolicyPage() {
  return (
    <LegalDocument
      title="Privacy Policy"
      description="This policy explains what AskNCERT handles when you use the study assistant and the choices available to you."
      sections={[
        {
          title: "Information we handle",
          paragraphs: ["We handle information needed to provide AskNCERT and keep your account working. What is collected depends on how you use the app."],
          bullets: [
            "Account details: your email address, account identifier, and the display name or avatar supplied during registration or by your sign-in provider.",
            "Profile and preferences: information you choose to add, such as your class, board, language, subjects, learning preferences, and study goals.",
            "Study content: your questions, chat messages, AI replies, saved notes, memory facts, quizzes, quiz answers, planner items, reminders, exams, and study-session records when you use those features.",
            "Usage and security records: feature-use counts, AI request token/duration/success records, OCR request status, and security events where recorded. These support limits, troubleshooting, and platform security.",
            "Files and images: images or PDFs you select are sent with your request for AI processing. Chat history may retain text and attachment details, but the app removes inline file data before saving a chat message. The current project has no configured file-storage buckets.",
          ],
        },
        {
          title: "Why we use this information",
          bullets: [
            "To authenticate you, maintain your profile, and show your own saved study history.",
            "To answer questions, process images or documents you submit, personalize replies using profile details or saved memory, and provide web search results when a request calls for current information.",
            "To provide and improve app features, enforce platform settings and usage limits, troubleshoot failures, and protect the service from misuse.",
          ],
        },
        {
          title: "AI and other services",
          paragraphs: [
            "When you ask the AI assistant a question, your prompt and any selected image or PDF content are sent through the Lovable AI Gateway to the configured Google Gemini model to produce a response. If the assistant performs a web search, the search query is sent to the configured Firecrawl search service. These providers process information needed to return the requested result under their own service terms and privacy practices. Do not include information you do not want processed by these services.",
            "AskNCERT also uses Lovable Cloud for app hosting, account authentication, and database services. Google may process information when you choose Google sign-in. We do not operate the underlying infrastructure or set every provider's retention practices.",
          ],
        },
        {
          title: "How information is stored and protected",
          paragraphs: [
            "Account profiles, chats, notes, and other saved study records are stored in the app's database. Access controls restrict account records to the signed-in user, and privileged account operations run on the server. No online service can promise absolute security; avoid sending passwords or highly sensitive information in study prompts.",
            "AskNCERT does not currently use a separate third-party advertising or product-analytics tracker. The app records limited first-party usage and diagnostic information described above.",
          ],
        },
        {
          title: "Cookies and browser storage",
          paragraphs: [
            "The app uses browser storage to maintain the sign-in session and remember local preferences such as theme and the remember-me choice. Guest chat is held in session storage on that browser and is not saved to an AskNCERT account. Browser notification permission is controlled by your browser; an app preference may record whether reminders are enabled.",
          ],
        },
        {
          title: "Retention and account deletion",
          paragraphs: [
            "We keep account and study records while the account is active or as needed to provide the service. You can permanently delete your account from Settings while signed in. This removes the authentication account and the associated profile, chats and messages, notes, saved memory, quizzes and attempts, planner and study records, reminders, subscriptions, files metadata, and linked usage/security records. The account's Super Admin role cannot be removed through student settings.",
            "Some limited administrative audit entries may need to remain for security, legal compliance, or dispute handling; where a deletion request is completed, account identifiers and stored before/after values linked to the deleted account are cleared from those entries. System backups may retain copies temporarily under the infrastructure provider's backup lifecycle before they expire. Information required by law or needed to establish, exercise, or defend legal claims may be retained only for that purpose and period.",
          ],
        },
        {
          title: "Your choices and privacy rights",
          paragraphs: [
            "Depending on where you live, you may have rights to request access, correction, deletion, or a copy of personal information, or to object to certain processing. You can update supported profile details in Settings, manage browser storage through your device, and request account deletion while signed in. Contact us for other privacy requests.",
          ],
        },
        {
          title: "Guest mode",
          paragraphs: [
            "Guest chat is kept only in session storage on the device and browser session where you use it. It is not attached to a signed-in profile and is normally cleared when you start a new guest chat or when the browser session storage is cleared. Guest requests still go to the AI service to generate replies.",
          ],
        },
        {
          title: "Changes and contact",
          paragraphs: [
            "We may update this policy as AskNCERT changes. The effective and updated date at the top identifies the version currently presented. If a future version requires renewed acceptance, the app can ask signed-in users with a previously recorded acceptance to review it before continuing.",
            "For privacy questions or requests, email askncrt@gmail.com. Do not send your password or sign-in codes.",
          ],
        },
      ]}
    >
      <p className="mt-5 text-sm leading-7 text-muted-foreground">
        You can also read our <Link to="/terms" className="text-primary underline underline-offset-4">Terms &amp; Conditions</Link> or learn about the <Link to="/delete-account" className="text-primary underline underline-offset-4">account deletion process</Link>.
      </p>
    </LegalDocument>
  );
}