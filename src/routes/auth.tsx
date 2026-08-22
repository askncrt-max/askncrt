import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Sparkles, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";

export const Route = createFileRoute("/auth")({
  ssr: false,
  component: AuthPage,
  head: () => ({
    meta: [
      { title: "Sign in — AskNCERT" },
      {
        name: "description",
        content:
          "Sign in or create an AskNCERT account to access your AI study assistant, saved notes, and study planner.",
      },
      { property: "og:title", content: "Sign in — AskNCERT" },
      {
        property: "og:description",
        content: "Access your AskNCERT AI study assistant for NCERT Class 5-12.",
      },
      { property: "og:url", content: "https://askncrt.lovable.app/auth" },
    ],
    links: [{ rel: "canonical", href: "https://askncrt.lovable.app/auth" }],
  }),
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup" | "forgot">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [remember, setRemember] = useState(() => {
    if (typeof window === "undefined") return true;
    return localStorage.getItem("askncert.remember") !== "false";
  });

  function applyRememberPreference(shouldRemember: boolean) {
    try {
      localStorage.setItem("askncert.remember", shouldRemember ? "true" : "false");
      const key = Object.keys(localStorage).find(
        (k) => k.startsWith("sb-") && k.endsWith("-auth-token"),
      );
      if (!key) return;
      if (!shouldRemember) {
        const val = localStorage.getItem(key);
        if (val) {
          sessionStorage.setItem(key, val);
          localStorage.removeItem(key);
        }
      } else {
        const val = sessionStorage.getItem(key);
        if (val) {
          localStorage.setItem(key, val);
          sessionStorage.removeItem(key);
        }
      }
    } catch {
      /* ignore storage errors */
    }
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/chat", replace: true });
    });
  }, [navigate]);

  async function handleGoogle() {
    setLoading(true);
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      toast.error(result.error.message || "Google sign-in failed");
      setLoading(false);
      return;
    }
    if (result.redirected) return;
    navigate({ to: "/chat", replace: true });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin,
            data: { full_name: name },
          },
        });
        if (error) throw error;
        applyRememberPreference(remember);
        toast.success("Welcome to AskNCERT! Check your email if verification is required.");
        navigate({ to: "/chat", replace: true });
      } else if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        applyRememberPreference(remember);
        toast.success("Welcome back!");
        navigate({ to: "/chat", replace: true });
      } else {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: window.location.origin + "/reset-password",
        });
        if (error) throw error;
        toast.success("Password reset link sent to your email.");
        setMode("signin");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="animate-mesh absolute -top-[10%] -left-[10%] size-[60%] rounded-full bg-primary/15 blur-[120px]" />
        <div className="animate-mesh absolute top-[20%] -right-[10%] size-[55%] rounded-full bg-emerald-200/40 blur-[100px] [animation-delay:3s] dark:bg-emerald-900/25" />
      </div>

      <div className="animate-fade-up w-full max-w-md">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="grid size-14 place-items-center rounded-2xl bg-primary shadow-glow">
            <Sparkles className="size-6 text-primary-foreground" />
          </div>
          <h1 className="mt-5 font-display text-3xl font-bold tracking-tight">AskNCERT — Your AI Study Partner for NCERT</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {mode === "signup"
              ? "Create your account to start studying smarter"
              : mode === "forgot"
                ? "Enter your email and we'll send a reset link"
                : "Sign in to continue your NCERT journey"}
          </p>
        </div>

        <div className="rounded-3xl border border-border bg-card p-6 shadow-soft">
          {mode !== "forgot" && (
            <>
              <button
                type="button"
                disabled={loading}
                onClick={handleGoogle}
                className="mb-4 flex w-full items-center justify-center gap-2.5 rounded-xl border border-border bg-background px-4 py-3 text-sm font-medium hover:bg-muted disabled:opacity-60"
              >
                <GoogleIcon />
                Continue with Google
              </button>
              <div className="mb-4 flex items-center gap-3">
                <div className="h-px flex-1 bg-border" />
                <span className="text-[11px] font-medium uppercase tracking-widest text-muted-foreground">
                  or
                </span>
                <div className="h-px flex-1 bg-border" />
              </div>
            </>
          )}

          <form onSubmit={handleSubmit} className="space-y-3">
            {mode === "signup" && (
              <Input
                label="Full name"
                value={name}
                onChange={(v) => setName(v)}
                type="text"
                required
                placeholder="Rahul Sharma"
              />
            )}
            <Input
              label="Email"
              value={email}
              onChange={setEmail}
              type="email"
              required
              placeholder="you@school.com"
            />
            {mode !== "forgot" && (
              <Input
                label="Password"
                value={password}
                onChange={setPassword}
                type="password"
                required
                minLength={6}
                placeholder="At least 6 characters"
              />
            )}

            {mode !== "forgot" && (
              <label className="flex cursor-pointer items-center gap-2 pt-1 text-xs text-muted-foreground select-none">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  className="size-4 rounded border-input accent-primary"
                />
                Remember me on this device
              </label>
            )}


            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground shadow-glow transition-opacity hover:opacity-95 disabled:opacity-60"
            >
              {loading && <Loader2 className="size-4 animate-spin" />}
              {mode === "signup" ? "Create account" : mode === "forgot" ? "Send reset link" : "Sign in"}
            </button>
          </form>

          <div className="mt-5 flex items-center justify-between text-xs">
            {mode === "signin" ? (
              <>
                <button
                  className="text-muted-foreground hover:text-foreground"
                  onClick={() => setMode("forgot")}
                >
                  Forgot password?
                </button>
                <button
                  className="font-medium text-primary hover:underline"
                  onClick={() => setMode("signup")}
                >
                  Create account
                </button>
              </>
            ) : (
              <button
                className="mx-auto text-muted-foreground hover:text-foreground"
                onClick={() => setMode("signin")}
              >
                ← Back to sign in
              </button>
            )}
          </div>
        </div>

        <p className="mt-5 text-center text-xs">
          <Link to="/guest" className="font-semibold text-primary hover:underline">
            Continue as guest →
          </Link>
          <span className="ml-1 text-muted-foreground">(chat only, nothing is saved)</span>
        </p>

        <p className="mt-6 text-center text-[11px] text-muted-foreground">
          Built for Indian NCERT students, built by Dhiraj
        </p>
      </div>
    </div>
  );
}

function Input({
  label,
  value,
  onChange,
  ...rest
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange" | "value">) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium text-muted-foreground">{label}</span>
      <input
        {...rest}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-input bg-background px-3.5 py-2.5 text-sm outline-none placeholder:text-muted-foreground/60 focus:border-primary focus:ring-2 focus:ring-primary/20"
      />
    </label>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden>
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.5 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.8 1.1 7.9 3l5.7-5.7C34 5.8 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.6 15.5 18.9 12 24 12c3 0 5.8 1.1 7.9 3l5.7-5.7C34 5.8 29.3 4 24 4 16.3 4 9.6 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.5-5.2l-6.2-5.2C29.3 35 26.8 36 24 36c-5.3 0-9.7-3.4-11.3-8.1l-6.5 5C9.5 39.6 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.3 4.2-4.3 5.6l6.2 5.2C41 34.6 44 29.7 44 24c0-1.3-.1-2.4-.4-3.5z" />
    </svg>
  );
}
