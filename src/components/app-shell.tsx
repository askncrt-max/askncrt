import { Link, useLocation, useRouter } from "@tanstack/react-router";
import { MessageSquare, BookOpen, Calendar, Settings, LogOut, Sparkles, Menu, Brain, LayoutDashboard, Bell, GraduationCap } from "lucide-react";
import { useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";

const nav = [
  { to: "/chat", label: "Chat", icon: MessageSquare },
  { to: "/dashboard", label: "Progress", icon: LayoutDashboard },
  { to: "/quiz", label: "Quiz", icon: GraduationCap },
  { to: "/notes", label: "Saved Notes", icon: BookOpen },
  { to: "/planner", label: "Study Planner", icon: Calendar },
  { to: "/reminders", label: "Reminders", icon: Bell },
  { to: "/settings/memory", label: "AI Memory", icon: Brain },
  { to: "/settings", label: "Settings", icon: Settings },
];

export function AppShell({ children }: { children: ReactNode }) {
  const location = useLocation();
  const router = useRouter();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);

  async function signOut() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    router.navigate({ to: "/auth", replace: true });
  }

  function isActive(to: string) {
    if (to === "/settings") return location.pathname === "/settings";
    return location.pathname === to || location.pathname.startsWith(to + "/");
  }

  return (
    <div className="relative min-h-screen bg-background text-foreground">
      {/* Ambient mesh */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="animate-mesh absolute -top-[20%] -left-[10%] size-[70%] rounded-full bg-primary/10 blur-[120px]" />
        <div className="animate-mesh absolute top-[10%] -right-[10%] size-[60%] rounded-full bg-emerald-200/40 blur-[100px] [animation-delay:3s] dark:bg-emerald-900/20" />
      </div>

      {/* Sidebar (desktop) */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-sidebar-border bg-sidebar/80 backdrop-blur-xl md:flex">
        <Brand className="px-5 py-5" />
        <nav className="flex-1 space-y-1 px-3">
          {nav.map((item) => {
            const active = isActive(item.to);
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                  active
                    ? "bg-primary-soft text-primary"
                    : "text-sidebar-foreground hover:bg-sidebar-accent",
                )}
              >
                <Icon className="size-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <button
          onClick={signOut}
          className="mx-3 mb-4 flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-sidebar-accent"
        >
          <LogOut className="size-4" />
          Sign out
        </button>
      </aside>

      {/* Mobile top bar */}
      <header className="sticky top-0 z-20 flex items-center justify-between border-b border-border bg-background/80 px-4 py-3 backdrop-blur-xl md:hidden">
        <Brand />
        <button
          onClick={() => setOpen((o) => !o)}
          className="rounded-lg p-2 hover:bg-muted"
          aria-label="Menu"
        >
          <Menu className="size-5" />
        </button>
      </header>

      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-40 md:hidden" onClick={() => setOpen(false)}>
          <div className="absolute inset-0 bg-black/30" />
          <div
            className="absolute right-0 top-0 h-full w-72 bg-sidebar shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <Brand className="px-5 py-5" />
            <nav className="space-y-1 px-3">
              {nav.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium hover:bg-sidebar-accent"
                  >
                    <Icon className="size-4" />
                    {item.label}
                  </Link>
                );
              })}
              <button
                onClick={signOut}
                className="mt-2 flex w-full items-center gap-2 rounded-xl px-3 py-3 text-sm font-medium text-muted-foreground hover:bg-sidebar-accent"
              >
                <LogOut className="size-4" />
                Sign out
              </button>
            </nav>
          </div>
        </div>
      )}

      <main className="md:pl-64">{children}</main>
    </div>
  );
}

function Brand({ className }: { className?: string }) {
  return (
    <Link to="/chat" className={cn("flex items-center gap-2.5", className)}>
      <div className="grid size-9 place-items-center rounded-xl bg-primary shadow-glow">
        <Sparkles className="size-4 text-primary-foreground" />
      </div>
      <div>
        <div className="text-[15px] font-bold leading-none tracking-tight">AskNCERT</div>
        <div className="mt-0.5 text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
          Class 5 – 12
        </div>
      </div>
    </Link>
  );
}
