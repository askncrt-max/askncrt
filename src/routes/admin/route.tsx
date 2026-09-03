import { createFileRoute, Outlet, redirect, Link, useLocation, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import {
  LayoutDashboard, Users, Cpu, ToggleLeft, GraduationCap, HelpCircle, BookOpen, ScanLine,
  FolderOpen, CreditCard, Megaphone, BarChart3, Bell, ShieldCheck, ScrollText, Settings,
  AlertTriangle, LogOut, Menu, Sparkles,
} from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

const nav = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/admin/users", label: "User Management", icon: Users },
  { to: "/admin/ai", label: "AI & API Control", icon: Cpu },
  { to: "/admin/features", label: "AskNCERT Features", icon: ToggleLeft },
  { to: "/admin/curriculum", label: "Classes & Subjects", icon: GraduationCap },
  { to: "/admin/questions", label: "Questions & Answers", icon: HelpCircle },
  { to: "/admin/material", label: "Notes & Study Material", icon: BookOpen },
  { to: "/admin/ocr", label: "OCR Management", icon: ScanLine },
  { to: "/admin/files", label: "Files & Images", icon: FolderOpen },
  { to: "/admin/plans", label: "Subscription & Plans", icon: CreditCard },
  { to: "/admin/ads", label: "Advertisement", icon: Megaphone },
  { to: "/admin/reports", label: "Reports & Analytics", icon: BarChart3 },
  { to: "/admin/notifications", label: "Notifications", icon: Bell },
  { to: "/admin/security", label: "Security", icon: ShieldCheck },
  { to: "/admin/audit", label: "Audit Logs", icon: ScrollText },
  { to: "/admin/settings", label: "System Settings", icon: Settings },
  { to: "/admin/emergency", label: "Emergency Mode", icon: AlertTriangle },
];

export const Route = createFileRoute("/admin")({
  ssr: false,
  beforeLoad: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({ to: "/auth" });
    const { data: role } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", data.user.id)
      .eq("role", "super_admin")
      .maybeSingle();
    if (!role) throw redirect({ to: "/chat" });
    return { admin: { id: data.user.id, email: data.user.email ?? "" } };
  },
  component: AdminLayout,
});

function AdminLayout() {
  const { admin } = Route.useRouteContext();
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

  const isActive = (item: (typeof nav)[number]) =>
    item.exact ? location.pathname === item.to : location.pathname.startsWith(item.to);

  const Sidebar = (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2.5 px-5 py-5">
        <div className="grid size-9 place-items-center rounded-xl bg-primary shadow-glow">
          <Sparkles className="size-4 text-primary-foreground" />
        </div>
        <div>
          <div className="text-[15px] font-bold leading-none tracking-tight">AskNCERT</div>
          <div className="mt-0.5 text-[10px] font-medium uppercase tracking-widest text-primary">
            Super Admin
          </div>
        </div>
      </div>
      <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 pb-4">
        {nav.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.to}
              to={item.to}
              onClick={() => setOpen(false)}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-colors",
                isActive(item)
                  ? "bg-primary-soft text-primary"
                  : "text-sidebar-foreground hover:bg-sidebar-accent",
              )}
            >
              <Icon className="size-4 shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-sidebar-border p-3">
        <div className="px-2 pb-2">
          <div className="truncate text-xs font-semibold">{admin.email}</div>
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground">super_admin</div>
        </div>
        <Link
          to="/admin/settings"
          className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-sidebar-accent"
        >
          <Settings className="size-4" /> Settings
        </Link>
        <button
          onClick={signOut}
          className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-sidebar-accent"
        >
          <LogOut className="size-4" /> Logout
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background text-foreground">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-sidebar-border bg-sidebar/90 backdrop-blur-xl lg:block">
        {Sidebar}
      </aside>

      <header className="sticky top-0 z-20 flex items-center justify-between border-b border-border bg-background/90 px-4 py-3 backdrop-blur-xl lg:hidden">
        <span className="font-display text-sm font-bold">AskNCERT · Super Admin</span>
        <button onClick={() => setOpen((o) => !o)} aria-label="Menu" className="rounded-lg p-2 hover:bg-muted">
          <Menu className="size-5" />
        </button>
      </header>

      {open && (
        <div className="fixed inset-0 z-40 lg:hidden" onClick={() => setOpen(false)}>
          <div className="absolute inset-0 bg-black/40" />
          <div className="absolute inset-y-0 left-0 w-72 bg-sidebar shadow-2xl" onClick={(e) => e.stopPropagation()}>
            {Sidebar}
          </div>
        </div>
      )}

      <main className="px-4 py-6 lg:pl-72 lg:pr-6">
        <Outlet />
      </main>
    </div>
  );
}
