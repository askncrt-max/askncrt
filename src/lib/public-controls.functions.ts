import { createServerFn } from "@tanstack/react-start";

/** Exposes only the signup gate needed by the public signup screen. */
export const getSignupAvailability = createServerFn({ method: "GET" }).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin
    .from("emergency_settings")
    .select("registrations_disabled,message")
    .maybeSingle();

  if (error) {
    return {
      registrationsDisabled: true,
      message: "Sign-up is temporarily unavailable. Please try again later.",
    };
  }

  return {
    registrationsDisabled: data?.registrations_disabled ?? false,
    message: data?.registrations_disabled ? data.message : null,
  };
});