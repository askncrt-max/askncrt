import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/reset-password")({
  ssr: false,
  component: ResetPassword,
  head: () => ({
    meta: [
      { title: "Reset your password — AskNCERT" },
      {
        name: "description",
        content:
          "Set a new password for your AskNCERT account and get back to your NCERT chats, notes, quizzes and study planner in seconds.",
      },
      { property: "og:title", content: "Reset your password — AskNCERT" },
      {
        property: "og:description",
        content:
          "Choose a new password for your AskNCERT account and return to your NCERT study space.",
      },
      { property: "og:url", content: "https://askncrt.lovable.app/reset-password" },
      { property: "og:type", content: "website" },
    ],
    links: [{ rel: "canonical", href: "https://askncrt.lovable.app/reset-password" }],
  }),
});


function ResetPassword() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Supabase parses the hash and creates a session for recovery flow
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") setReady(true);
    });
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setReady(true);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      toast.success("Password updated. Signing you in…");
      navigate({ to: "/chat", replace: true });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update password");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md rounded-3xl border border-border bg-card p-6 shadow-soft">
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="grid size-12 place-items-center rounded-2xl bg-primary">
            <Sparkles className="size-5 text-primary-foreground" />
          </div>
          <h1 className="mt-4 text-xl font-bold">Set a new password</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {ready ? "Choose a password of at least 6 characters." : "Verifying reset link…"}
          </p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="password"
            required
            minLength={6}
            disabled={!ready}
            placeholder="New password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-xl border border-input bg-background px-3.5 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:opacity-60"
          />
          <button
            disabled={!ready || loading}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground hover:opacity-95 disabled:opacity-60"
          >
            {loading && <Loader2 className="size-4 animate-spin" />}
            Update password
          </button>
        </form>
      </div>
    </div>
  );
}
