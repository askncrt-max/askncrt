import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { acceptLegalPolicies, getProfile } from "@/lib/profile.functions";
import { PRIVACY_VERSION, TERMS_VERSION } from "@/lib/legal-versions";

export const Route = createFileRoute("/_authenticated/legal-consent")({
  head: () => ({
    meta: [
      { title: "Review Updated Terms — AskNCERT" },
      { name: "description", content: "Review and accept the current AskNCERT Terms and Privacy Policy to continue." },
      { property: "og:title", content: "Review Updated Terms — AskNCERT" },
      { property: "og:description", content: "Review current AskNCERT legal terms and privacy information." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: LegalConsentPage,
});

function LegalConsentPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const get = useServerFn(getProfile);
  const accept = useServerFn(acceptLegalPolicies);
  const [checked, setChecked] = useState(false);
  const [saving, setSaving] = useState(false);
  const { data: profile, isLoading } = useQuery({ queryKey: ["profile"], queryFn: () => get() });

  async function acceptAndContinue() {
    if (!checked || saving) return;
    setSaving(true);
    try {
      await accept({ data: { termsVersion: TERMS_VERSION, privacyVersion: PRIVACY_VERSION } });
      await queryClient.invalidateQueries({ queryKey: ["profile"] });
      await router.navigate({ to: "/chat", replace: true });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save your acceptance.");
      setSaving(false);
    }
  }

  const previouslyAccepted = Boolean(profile?.legal_terms_version || profile?.legal_privacy_version);

  return (
    <AppShell>
      <main className="mx-auto max-w-2xl px-4 py-10 md:px-8 md:py-14">
        <div className="flex items-start gap-4 border-b border-border pb-6">
          <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-primary-soft text-primary"><ShieldCheck className="size-5" /></span>
          <div>
            <h1 className="text-2xl font-bold">Review AskNCERT’s updated policies</h1>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">{previouslyAccepted ? "A newer policy version is ready. Review it before continuing." : "Please review and accept the current policies before using your account."}</p>
          </div>
        </div>
        <div className="space-y-4 py-6">
          <p className="text-sm leading-6 text-muted-foreground">Effective 8 October 2026. Your acceptance and the policy versions will be saved to your account.</p>
          <p className="text-sm leading-6 text-muted-foreground">The AI tutor can make mistakes. Verify important study information with your textbook, teacher, or official education sources.</p>
          <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-border p-4 text-sm leading-6">
            <input type="checkbox" checked={checked} onChange={(event) => setChecked(event.target.checked)} className="mt-1 size-4 shrink-0 accent-primary" />
            <span>I agree to the <Link to="/terms" className="font-medium text-primary underline underline-offset-4">Terms &amp; Conditions</Link> and acknowledge the <Link to="/privacy-policy" className="font-medium text-primary underline underline-offset-4">Privacy Policy</Link>.</span>
          </label>
          <div className="flex flex-wrap items-center gap-3">
            <Button onClick={acceptAndContinue} disabled={!checked || saving || isLoading}>
              {saving && <Loader2 className="size-4 animate-spin" />}
              Accept and continue
            </Button>
            <Link to="/auth" className="text-sm text-muted-foreground hover:text-foreground">Sign out instead</Link>
          </div>
        </div>
      </main>
    </AppShell>
  );
}