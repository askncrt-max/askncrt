import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { sha512Hex } from "@/lib/payu-core";

const CheckoutInput = z.object({
  planCode: z.enum(["plus", "pro"]),
  phone: z.string().regex(/^\d{10,15}$/),
});

const TEST_CHECKOUT_URL = "https://test.payu.in/_payment";
const ALLOWED_CALLBACK_ORIGINS = new Set([
  "https://askncrt.lovable.app",
  "https://id-preview--c0009550-8917-4c29-9502-b306183e4b54.lovable.app",
]);

export const beginPayuCheckout = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => CheckoutInput.parse(input))
  .handler(async ({ context, data }) => {
    const { data: userResult, error: userError } = await context.supabase.auth.getUser();
    const user = userResult.user;
    if (userError || !user || user.id !== context.userId || !user.email) {
      throw new Error("Please sign in again before starting checkout.");
    }

    const { data: role, error: roleError } = await context.supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "super_admin")
      .maybeSingle();
    if (roleError) throw new Error("Your account could not be verified for checkout.");
    if (role) throw new Error("This account cannot start a student subscription checkout.");

    const [{ data: plan, error: planError }, { data: profile, error: profileError }] = await Promise.all([
      context.supabase
        .from("plans")
        .select("code, name, price_inr, active")
        .eq("code", data.planCode)
        .eq("active", true)
        .maybeSingle(),
      context.supabase
        .from("profiles")
        .select("display_name")
        .eq("id", user.id)
        .maybeSingle(),
    ]);
    if (planError || profileError || !plan || !profile) {
      throw new Error("The selected plan is not available right now.");
    }
    if (plan.price_inr < 1) throw new Error("This plan cannot be purchased.");

    const key = process.env["PAYU_MERCHANT_KEY"];
    const salt = process.env["PAYU_MERCHANT_SALT"];
    if (!key || !salt) throw new Error("PayU test checkout is not configured yet.");

    const displayName = profile.display_name?.trim() || user.email.split("@")[0] || "Student";
    const firstname = displayName.slice(0, 60);
    const email = user.email;
    const amount = `${plan.price_inr.toFixed(2)}`;
    const productinfo = `AskNCERT ${plan.name} monthly subscription`;
    const txnid = `txn_${crypto.randomUUID().replaceAll("-", "").slice(0, 21)}`;
    const fieldsForHash = [key, txnid, amount, productinfo, firstname, email, ...Array(10).fill("")];
    const hash = await sha512Hex(`${fieldsForHash.join("|")}|${salt}`);
    const requestUrl = new URL(getRequest().url);
    const callbackOrigin = ALLOWED_CALLBACK_ORIGINS.has(requestUrl.origin)
      ? requestUrl.origin
      : "https://askncrt.lovable.app";
    const callbackUrl = new URL("/api/public/payu/callback", callbackOrigin).toString();

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error: insertError } = await supabaseAdmin.from("payments").insert({
      user_id: user.id,
      plan_code: plan.code,
      provider: "payu",
      txnid,
      amount_inr: plan.price_inr,
      currency: "INR",
      status: "pending",
    });
    if (insertError) throw new Error("A payment could not be started. Please try again.");

    const fields: Record<string, string> = {
      key,
      txnid,
      amount,
      productinfo,
      firstname,
      email,
      phone: data.phone,
      surl: callbackUrl,
      furl: callbackUrl,
      hash,
    };
    return { checkoutUrl: TEST_CHECKOUT_URL, fields };
  });

export const getMyPayuPaymentStatus = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ txnid: z.string().regex(/^txn_[A-Za-z0-9]{21}$/) }).parse(input),
  )
  .handler(async ({ context, data }) => {
    const { data: payment, error } = await context.supabase
      .from("payments")
      .select("plan_code, amount_inr, status, paid_at")
      .eq("user_id", context.userId)
      .eq("txnid", data.txnid)
      .eq("provider", "payu")
      .maybeSingle();
    if (error) throw new Error("Payment status could not be checked.");
    return payment;
  });