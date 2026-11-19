export function amountMatchesExpectedInr(amount: string, expectedInr: number): boolean {
  if (!/^\d{1,7}(?:\.\d{1,2})?$/.test(amount) || !Number.isInteger(expectedInr)) return false;
  const [whole = "", fraction = ""] = amount.split(".");
  const actualPaise = Number(whole) * 100 + Number(fraction.padEnd(2, "0"));
  return actualPaise === expectedInr * 100;
}

export function safePayuHashMatch(expected: string, received: string): boolean {
  if (!/^[a-f\d]{128}$/i.test(expected) || !/^[a-f\d]{128}$/i.test(received)) return false;
  let difference = 0;
  for (let index = 0; index < expected.length; index += 1) {
    difference |= expected.charCodeAt(index) ^ received.charCodeAt(index);
  }
  return difference === 0;
}

export function isVerifiedPayuSuccess(
  status: string,
  amount: string,
  expectedInr: number,
  payuTransactionId: string,
): boolean {
  return status.toLowerCase() === "success" &&
    amountMatchesExpectedInr(amount, expectedInr) &&
    payuTransactionId.length > 0;
}

export function payuResponseHashInput(
  response: Record<string, string>,
  salt: string,
): string {
  const fields = [
    response.status ?? "",
    "", "", "", "", "",
    response.udf5 ?? "",
    response.udf4 ?? "",
    response.udf3 ?? "",
    response.udf2 ?? "",
    response.udf1 ?? "",
    response.email ?? "",
    response.firstname ?? "",
    response.productinfo ?? "",
    response.amount ?? "",
    response.txnid ?? "",
    response.key ?? "",
  ];
  const additionalCharges = response.additionalCharges ?? response.additional_charges;
  return additionalCharges
    ? [additionalCharges, salt, ...fields].join("|")
    : [salt, ...fields].join("|");
}

export async function sha512Hex(value: string): Promise<string> {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-512", bytes);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}