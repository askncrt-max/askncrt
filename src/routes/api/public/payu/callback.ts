import { createFileRoute } from "@tanstack/react-router";
import { isVerifiedPayuSuccess, safePayuHashMatch, sha512Hex } from "@/lib/payu-core";

const TEST_VERIFY_URL = "https://test.payu.in/merchant/postservice?form=2";
const ALLOWED_RETURN_ORIGINS = new Set([
  "https://askncrt.lovable.app",
  "https://id-preview--c0009550-8917-4c29-9502-b306183e4b54.lovable.app",
]);

function getReturnUrl(request: Request, status: string, txnid?: string): URL {
  const requestUrl = new URL(request.url);
  const origin = ALLOWED_RETURN_ORIGINS.has(requestUrl.origin)
    ? requestUrl.origin
    : "https://askncrt.lovable.app";
  const returnUrl = new URL(`/settings?payment=${encodeURIComponent(status)}`, origin);
  if (txnid) returnUrl.searchParams.set("txnid", txnid);
  return returnUrl;
}

function reverseHashInput(values: FormData, salt: string): string {
  const status = String(values.get("status") ?? "");
  const additional = String(values.get("additionalCharges") ?? values.get("additional_charges") ?? "");
  const common = [
    status,
    "", "", "", "", "",
    ...Array.from({ length: 5 }, (_, index) => String(values.get(`udf${5 - index}`) ?? "")),
    String(values.get("email") ?? ""),
    String(values.get("firstname") ?? ""),
    String(values.get("productinfo") ?? ""),
    String(values.get("amount") ?? ""),
    String(values.get("txnid") ?? ""),
    String(values.get("key") ?? ""),
  ];
  return additional ? [additional, salt, ...common].join("|") : [salt, ...common].join("|");
}

function parseVerifyDetails(payload: unknown, txnid: string): Record<string, unknown> | null {
  if (!payload || typeof payload !== "object") return null;
  const response = payload as { status?: unknown; transaction_details?: unknown };
  if (response.status !== 1 && response.status !== "1") return null;
  let details = response.transaction_details;
  if (typeof details === "string") {
    try {
      details = JSON.parse(details) as unknown;
    } catch {
      return null;
    }
  }
  if (!details || typeof details !== "object") return null;
  const transaction = (details as Record<string, unknown>)[txnid];
  return transaction && typeof transaction === "object"
    ? transaction as Record<string, unknown>
    : null;
}

export const Route = createFileRoute("/api/public/payu/callback")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const returnUrl = getReturnUrl(request, "failed");
        const key = process.env["PAYU_MERCHANT_KEY"];
        const salt = process.env["PAYU_MERCHANT_SALT"];
        if (!key || !salt) return Response.redirect(returnUrl, 303);

        let form: FormData;
        try {
          form = await request.formData();
        } catch {
          return Response.redirect(returnUrl, 303);
        }

        const text = (field: string, maxLength = 512) => {
          const value = form.get(field);
          return typeof value === "string" && value.length <= maxLength ? value : "";
        };
        const txnid = text("txnid", 25);
        const receivedHash = text("hash", 128);
        if (!txnid || !/^[A-Za-z0-9_-]{1,25}$/.test(txnid) || text("key", 128) !== key) {
          return Response.redirect(returnUrl, 303);
        }
        const transactionReturnUrl = getReturnUrl(request, "failed", txnid);

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { data: payment, error: paymentError } = await supabaseAdmin
          .from("payments")
          .select("txnid, user_id, plan_code, amount_inr, status")
          .eq("txnid", txnid)
          .eq("provider", "payu")
          .maybeSingle();
        if (paymentError || !payment) return Response.redirect(returnUrl, 303);

        if (payment.status === "success") {
          return Response.redirect(getReturnUrl(request, "success", txnid), 303);
        }
        if (payment.status !== "pending") return Response.redirect(returnUrl, 303);

        const callbackHash = await sha512Hex(reverseHashInput(form, salt));
        if (!safePayuHashMatch(callbackHash, receivedHash)) {
          return Response.redirect(transactionReturnUrl, 303);
        }

        const callbackStatus = text("status", 32).toLowerCase();
        if (callbackStatus !== "success") {
          await supabaseAdmin
            .from("payments")
            .update({ status: "failed", failure_code: callbackStatus || "failed" })
            .eq("txnid", txnid)
            .eq("status", "pending");
          return Response.redirect(transactionReturnUrl, 303);
        }

        const callbackAmount = text("amount", 32);
        if (!amountMatchesExpectedInr(callbackAmount, payment.amount_inr)) {
          return Response.redirect(transactionReturnUrl, 303);
        }

        const verifyHash = await sha512Hex(`${key}|verify_payment|${txnid}|${salt}`);
        const verifyBody = new URLSearchParams({
          key,
          command: "verify_payment",
          var1: txnid,
          hash: verifyHash,
        });

        let verifyResponse: Response;
        try {
          verifyResponse = await fetch(TEST_VERIFY_URL, {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: verifyBody,
          });
        } catch {
          return Response.redirect(transactionReturnUrl, 303);
        }
        if (!verifyResponse.ok) {
          console.error(`PayU test verification failed [${verifyResponse.status}]`);
          return Response.redirect(returnUrl, 303);
        }

        let verifyPayload: unknown;
        try {
          verifyPayload = await verifyResponse.json();
        } catch {
          return Response.redirect(returnUrl, 303);
        }
        const details = parseVerifyDetails(verifyPayload, txnid);
        const verifiedStatus = String(details?.status ?? "").toLowerCase();
        const verifiedTxnid = String(details?.txnid ?? "");
        const verifiedAmount = String(details?.amt ?? details?.amount ?? "");
        const payuTransactionId = String(details?.mihpayid ?? details?.mihpayupid ?? "");
        if (
          !details ||
          (verifiedTxnid && verifiedTxnid !== txnid) ||
          !isVerifiedPayuSuccess(verifiedStatus, verifiedAmount, payment.amount_inr, payuTransactionId)
        ) {
          await supabaseAdmin
            .from("payments")
            .update({ status: "failed", failure_code: "verification_mismatch" })
            .eq("txnid", txnid)
            .eq("status", "pending");
          return Response.redirect(returnUrl, 303);
        }

        const { data: result, error: finalizeError } = await supabaseAdmin.rpc(
          "finalize_payu_payment",
          { _txnid: txnid, _payu_transaction_id: payuTransactionId },
        );
        if (finalizeError || !["success", "already_processed"].includes(String(result))) {
          console.error("PayU payment could not be finalized atomically.");
          return Response.redirect(returnUrl, 303);
        }

        return Response.redirect(getReturnUrl(request, "success", txnid), 303);
      },
    },
  },
});