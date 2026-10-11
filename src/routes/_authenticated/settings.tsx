import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { Loader2, Moon, Sun, LogOut, Trash2, FileText, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/app-shell";
import { getProfile, updateProfile } from "@/lib/profile.functions";
import { supabase } from "@/integrations/supabase/client";
import { deleteMyAccount } from "@/lib/profile.functions";
import { LEGAL_ACCEPTANCE_PENDING_KEY } from "@/lib/legal-versions";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export const Route = createFileRoute("/_authenticated/settings")({
  component: SettingsPage,
  head: () => ({
    meta: [
      { title: "Settings — AskNCERT" },
      {
        name: "description",
        content:
          "Manage your AskNCERT profile, class level, language and dark mode preferences.",
      },
      { property: "og:title", content: "Settings — AskNCERT" },
      {
        property: "og:description",
        content: "Manage your AskNCERT profile and preferences.",
      },
      { property: "og:url", content: "https://askncrt.lovable.app/settings" },
    ],
    links: [{ rel: "canonical", href: "https://askncrt.lovable.app/settings" }],
  }),
});

function SettingsPage() {
  const router = useRouter();
  const qc = useQueryClient();
  const get = useServerFn(getProfile);
  const update = useServerFn(updateProfile);
  const deleteAccount = useServerFn(deleteMyAccount);
  const [deleteConfirmed, setDeleteConfirmed] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const { data: profile, isLoading } = useQuery({ queryKey: ["profile"], queryFn: () => get() });

  const [name, setName] = useState("");
  const [classLevel, setClassLevel] = useState("");
  const [language, setLanguage] = useState<"english" | "hindi">("english");
  const [dark, setDark] = useState(false);

  useEffect(() => {
    if (profile) {
      setName(profile.display_name || "");
      setClassLevel(profile.class_level || "");
      setLanguage((profile.language as any) || "english");
    }
  }, [profile]);

  useEffect(() => {
    const stored = localStorage.getItem("ask-ncert-theme");
    const isDark = stored === "dark";
    setDark(isDark);
    document.documentElement.classList.toggle("dark", isDark);
  }, []);

  function toggleDark() {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("ask-ncert-theme", next ? "dark" : "light");
  }

  const saveMut = useMutation({
    mutationFn: () =>
      update({ data: { display_name: name, class_level: classLevel || undefined, language } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["profile"] });
      toast.success("Saved");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed"),
  });

  async function signOut() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    router.navigate({ to: "/auth", replace: true });
  }

  async function permanentlyDeleteAccount() {
    if (!deleteConfirmed || deleting) return;
    setDeleting(true);
    try {
      await qc.cancelQueries();
      const result = await deleteAccount();
      if (!result.ok) throw new Error("Account deletion could not be completed.");
      qc.clear();
      localStorage.removeItem(LEGAL_ACCEPTANCE_PENDING_KEY);
      await supabase.auth.signOut({ scope: "local" });
      router.navigate({ to: "/auth", replace: true });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Account deletion failed. Please try again.");
      setDeleting(false);
    }
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-2xl px-4 py-8 md:px-8 md:py-12">
        <header className="mb-6">
          <h1 className="font-display text-3xl font-bold tracking-tight">Settings</h1>
          <p className="mt-1 text-sm text-muted-foreground">Personalize your AskNCERT experience.</p>
        </header>

        {isLoading ? (
          <div className="flex items-center justify-center py-16 text-muted-foreground">
            <Loader2 className="mr-2 size-4 animate-spin" /> Loading…
          </div>
        ) : (
          <div className="space-y-6">
            <Card title="Profile">
              <Field label="Display name">
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </Field>
              <Field label="Class">
                <select
                  value={classLevel}
                  onChange={(e) => setClassLevel(e.target.value)}
                  className="w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm outline-none focus:border-primary"
                >
                  <option value="">Select your class</option>
                  {["5", "6", "7", "8", "9", "10", "11", "12"].map((c) => (
                    <option key={c} value={c}>
                      Class {c}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Preferred language">
                <div className="grid grid-cols-2 gap-2">
                  {(["english", "hindi"] as const).map((l) => (
                    <button
                      key={l}
                      onClick={() => setLanguage(l)}
                      className={
                        "rounded-xl border px-3 py-2.5 text-sm font-medium capitalize " +
                        (language === l
                          ? "border-primary bg-primary-soft text-primary"
                          : "border-border hover:bg-muted")
                      }
                    >
                      {l}
                    </button>
                  ))}
                </div>
              </Field>
              <div className="pt-2">
                <button
                  onClick={() => saveMut.mutate()}
                  disabled={saveMut.isPending}
                  className="inline-flex items-center gap-1.5 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-60"
                >
                  {saveMut.isPending && <Loader2 className="size-3 animate-spin" />}
                  Save changes
                </button>
              </div>
            </Card>

            <Card title="Appearance">
              <button
                onClick={toggleDark}
                className="flex w-full items-center justify-between rounded-xl border border-border bg-background px-4 py-3 text-sm font-medium hover:bg-muted"
              >
                <span className="flex items-center gap-2">
                  {dark ? <Moon className="size-4" /> : <Sun className="size-4" />}
                  Dark mode
                </span>
                <span
                  className={
                    "relative h-6 w-11 rounded-full transition-colors " +
                    (dark ? "bg-primary" : "bg-border")
                  }
                >
                  <span
                    className={
                      "absolute top-0.5 size-5 rounded-full bg-white transition-transform " +
                      (dark ? "translate-x-5" : "translate-x-0.5")
                    }
                  />
                </span>
              </button>
            </Card>

            <Card title="Privacy & Legal">
              <Link
                to="/privacy-policy"
                className="flex min-h-11 items-center gap-2 rounded-xl border border-border bg-background px-4 py-3 text-sm font-medium hover:bg-muted"
              >
                <ShieldCheck className="size-4 text-primary" /> Privacy Policy
              </Link>
              <Link
                to="/terms"
                className="flex min-h-11 items-center gap-2 rounded-xl border border-border bg-background px-4 py-3 text-sm font-medium hover:bg-muted"
              >
                <FileText className="size-4 text-primary" /> Terms &amp; Conditions
              </Link>
              <Link
                to="/delete-account"
                className="inline-flex text-xs text-muted-foreground underline underline-offset-4 hover:text-foreground"
              >
                Account deletion information
              </Link>
            </Card>

            <Card title="Account & Security">
              <AlertDialog onOpenChange={(open) => { if (!open) setDeleteConfirmed(false); }}>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" className="w-full justify-start">
                    <Trash2 className="size-4" /> Delete Account
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="max-h-[90dvh] overflow-y-auto">
                  <AlertDialogHeader>
                    <AlertDialogTitle>Permanently delete your account?</AlertDialogTitle>
                    <AlertDialogDescription className="space-y-3 text-left">
                      <span className="block">This cannot be undone. Your profile, chats, messages, notes, saved AI memory, quizzes, planner items, reminders, study records, and account-linked files and usage records will be removed.</span>
                      <span className="block">A small number of de-identified administrative audit and usage totals may remain for security or legal recordkeeping. Backups may take time to expire.</span>
                      <span className="block">You will be signed out after deletion. Your account and saved study information cannot be restored.</span>
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <label className="flex cursor-pointer items-start gap-3 text-sm leading-6">
                    <input
                      type="checkbox"
                      checked={deleteConfirmed}
                      onChange={(event) => setDeleteConfirmed(event.target.checked)}
                      disabled={deleting}
                      className="mt-1 size-4 shrink-0 accent-primary"
                    />
                    <span>I understand this permanently deletes my account and saved data.</span>
                  </label>
                  <AlertDialogFooter>
                    <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      disabled={!deleteConfirmed || deleting}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      onClick={(event) => {
                        event.preventDefault();
                        void permanentlyDeleteAccount();
                      }}
                    >
                      {deleting && <Loader2 className="size-4 animate-spin" />}
                      Delete permanently
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
              <button
                onClick={signOut}
                className="flex w-full items-center gap-2 rounded-xl border border-border bg-background px-4 py-3 text-sm font-medium text-destructive hover:bg-destructive/5"
              >
                <LogOut className="size-4" /> Sign out
              </button>
            </Card>
          </div>
        )}
      </div>
    </AppShell>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-3xl border border-border bg-card p-5 shadow-soft">
      <h2 className="mb-4 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
        {title}
      </h2>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}
