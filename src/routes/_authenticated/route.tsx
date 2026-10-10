import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { acceptLegalPolicies } from "@/lib/profile.functions";
import { LEGAL_ACCEPTANCE_PENDING_KEY, PRIVACY_VERSION, TERMS_VERSION } from "@/lib/legal-versions";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async ({ location }) => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({ to: "/auth" });

    // The super admin never enters the student experience.
    const { data: role } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", data.user.id)
      .eq("role", "super_admin")
      .maybeSingle();
    if (role) throw redirect({ to: "/admin" });

    const { data: profile } = await supabase
      .from("profiles")
      .select("legal_terms_version,legal_privacy_version")
      .eq("id", data.user.id)
      .maybeSingle();

    if (typeof window !== "undefined" && localStorage.getItem(LEGAL_ACCEPTANCE_PENDING_KEY) === "1") {
      await acceptLegalPolicies({ data: { termsVersion: TERMS_VERSION, privacyVersion: PRIVACY_VERSION } });
      localStorage.removeItem(LEGAL_ACCEPTANCE_PENDING_KEY);
    } else if (
      location.pathname !== "/settings/legal-consent" &&
      (profile?.legal_terms_version || profile?.legal_privacy_version) &&
      (profile.legal_terms_version !== TERMS_VERSION || profile.legal_privacy_version !== PRIVACY_VERSION)
    ) {
      throw redirect({ to: "/settings/legal-consent" });
    }

    return { user: data.user };
  },
  component: () => <Outlet />,
});
