import { createFileRoute, Link } from "@tanstack/react-router";
import { LegalDocument } from "@/components/legal-document";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Terms & Conditions — AskNCERT" },
      { name: "description", content: "Terms for using AskNCERT, its AI study features, and user accounts." },
      { property: "og:title", content: "Terms & Conditions — AskNCERT" },
      { property: "og:description", content: "Read the terms that apply to AskNCERT accounts, guest use, and AI study answers." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: TermsPage,
});

function TermsPage() {
  return (
    <LegalDocument
      title="Terms & Conditions"
      description="These terms apply when you access AskNCERT, whether you use an account or guest mode."
      sections={[
        {
          title: "Acceptance of these terms",
          paragraphs: ["By using AskNCERT, you agree to these Terms & Conditions and the Privacy Policy. Creating an account requires you to accept the current Terms and acknowledge the Privacy Policy before registration. If you do not agree, do not create an account or use the service."],
        },
        {
          title: "Eligibility and accounts",
          paragraphs: ["AskNCERT is an educational study assistant for NCERT learners. If you are under the age of majority where you live, use the service with permission and guidance from a parent or legal guardian. Provide accurate registration details, keep your sign-in information secure, and tell us if you believe someone else has accessed your account."],
        },
        {
          title: "Guest use",
          paragraphs: ["Guest mode provides chat without a saved account. Guest conversation history is stored temporarily in browser session storage and may be lost when that session ends or storage is cleared. Guest prompts are still sent to the AI service to generate answers."],
        },
        {
          title: "Your responsibilities and acceptable use",
          bullets: [
            "Use AskNCERT lawfully and for legitimate study and learning purposes.",
            "Do not upload or submit content you do not have permission to use, or content that violates another person's rights or privacy.",
            "Do not attempt to disrupt, overload, reverse engineer, bypass security or usage controls, or gain unauthorized access to accounts, systems, or data.",
            "Do not use the service for unlawful, harmful, deceptive, or abusive activity, or to submit malware or malicious instructions.",
          ],
        },
        {
          title: "Your content",
          paragraphs: ["You keep the rights you have in the questions, notes, files, and other content you submit. You give AskNCERT permission to process, store, and display that content as needed to provide the features you choose, maintain the service, and protect it. Content sent to AI or search services is processed as described in the Privacy Policy. You are responsible for having the rights and permissions needed to submit it."],
        },
        {
          title: "AI answers and educational verification",
          paragraphs: ["AI-generated answers can occasionally contain errors, omit context, or misunderstand a question or image. They are provided as study assistance, not as a substitute for your textbook, teacher, official curriculum, or professional advice. Verify important educational information, calculations, syllabus details, and exam requirements with appropriate sources. AskNCERT does not guarantee grades, learning outcomes, or that an answer will be complete or accurate."],
        },
        {
          title: "AskNCERT intellectual property",
          paragraphs: ["AskNCERT's name, app design, software, and service materials are owned by their respective rights holders or used with permission. These terms do not transfer those rights to you. You may use the service for its intended personal educational purpose, subject to these terms and applicable law."],
        },
        {
          title: "Third-party services",
          paragraphs: ["Sign-in, hosting, database, AI responses, and optional web search rely on third-party services. Their availability and handling of information are also governed by their own terms and policies. See the Privacy Policy for the services currently used."],
        },
        {
          title: "Availability and changes to the service",
          paragraphs: ["We may update, suspend, limit, or discontinue features as the product changes or for maintenance, security, or operational reasons. We do not promise uninterrupted availability or a particular feature remaining available."],
        },
        {
          title: "Suspension, termination, and account deletion",
          paragraphs: ["We may restrict or suspend access when reasonably necessary to protect users, the service, or comply with law, including for serious or repeated violations of these terms. You can permanently delete your account from Settings while signed in. Deletion removes associated account data as explained in the Privacy Policy and account deletion page; information may be retained where law requires or permits it."],
        },
        {
          title: "Limitation of liability",
          paragraphs: ["To the extent permitted by applicable law, AskNCERT is provided without warranties of uninterrupted service, error-free answers, or particular educational results. AskNCERT is not liable for indirect or consequential losses arising from use of the service. Nothing in these terms excludes liability that cannot legally be excluded, or limits any rights you have under applicable consumer-protection law."],
        },
        {
          title: "Changes to these terms and contact",
          paragraphs: ["We may revise these terms when the service or legal requirements change. The dates above show the current version. If a future version requires renewed acceptance, the app may ask for your acceptance before you continue using the account. Questions about these terms can be sent to askncrt@gmail.com."],
        },
      ]}
    >
      <p className="mt-5 text-sm leading-7 text-muted-foreground">
        See also the <Link to="/privacy-policy" className="text-primary underline underline-offset-4">Privacy Policy</Link> and <Link to="/delete-account" className="text-primary underline underline-offset-4">account deletion instructions</Link>.
      </p>
    </LegalDocument>
  );
}