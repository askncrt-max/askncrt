import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { Sparkles, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/")({
  ssr: false,
  component: SplashGate,
  head: () => ({
    meta: [
      { title: "AskNCERT — AI study assistant for NCERT Class 5-12" },
      {
        name: "description",
        content:
          "AskNCERT is an AI study assistant for NCERT students from Class 5 to 12. Sign in to ask doubts, scan chapters, take quizzes and plan your study.",
      },
      { property: "og:title", content: "AskNCERT — AI study assistant for NCERT Class 5-12" },
      {
        property: "og:description",
        content:
          "Ask doubts, scan chapters, take quizzes and plan your study with the AskNCERT AI tutor.",
      },
      { property: "og:url", content: "https://askncrt.lovable.app/" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://askncrt.lovable.app/" }],
  }),
});

function SplashGate() {
  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;
    const started = Date.now();

    async function decide() {
      let target = "/auth";
      try {
        const { data } = await supabase.auth.getSession();
        if (data.session) {
          const { data: role } = await supabase
            .from("user_roles")
            .select("role")
            .eq("user_id", data.session.user.id)
            .eq("role", "super_admin")
            .maybeSingle();
          target = role ? "/admin" : "/chat";
        }
      } catch {
        target = "/auth";
      }
      const wait = Math.max(0, 1600 - (Date.now() - started));
      setTimeout(() => {
        if (!cancelled) navigate({ to: target, replace: true });
      }, wait);
    }

    void decide();
    return () => {
      cancelled = true;
    };
  }, [navigate]);

  return (
    <main className="relative grid min-h-screen place-items-center overflow-hidden bg-background px-6 text-foreground">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="animate-mesh absolute -top-[20%] -left-[10%] size-[70%] rounded-full bg-primary/20 blur-[120px]" />
        <div className="animate-mesh absolute bottom-[-10%] right-[-10%] size-[60%] rounded-full bg-emerald-300/30 blur-[100px] [animation-delay:2s]" />
      </div>

      <div className="relative flex flex-col items-center text-center">
        <div className="animate-splash-logo grid size-20 place-items-center rounded-3xl bg-primary shadow-glow">
          <Sparkles className="size-9 text-primary-foreground" />
        </div>
        <h1 className="animate-splash-title mt-6 font-display text-4xl font-extrabold tracking-tight sm:text-5xl">
          Ask<span className="text-primary">NCERT</span>
        </h1>
        <p className="animate-splash-sub mt-2 text-sm font-medium text-muted-foreground">
          AI study partner · Class 5 – 12
        </p>
        <Loader2 className="animate-splash-sub mt-10 size-5 animate-spin text-primary/70" />
      </div>
    </main>
  );
}
