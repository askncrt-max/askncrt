import { describe, expect, it } from "bun:test";
import {
  amountMatchesExpectedInr,
  isVerifiedPayuSuccess,
  safePayuHashMatch,
  sha512Hex,
} from "./payu-core";

describe("PayU test payment validation", () => {
  it("accepts only the exact plan amount in INR", () => {
    expect(amountMatchesExpectedInr("99.00", 99)).toBe(true);
    expect(amountMatchesExpectedInr("99.01", 99)).toBe(false);
    expect(amountMatchesExpectedInr("099.00", 99)).toBe(true);
    expect(amountMatchesExpectedInr("99.000", 99)).toBe(false);
  });

  it("requires successful provider status, exact amount, and a provider transaction id", () => {
    expect(isVerifiedPayuSuccess("success", "249.00", 249, "payu-ref")).toBe(true);
    expect(isVerifiedPayuSuccess("pending", "249.00", 249, "payu-ref")).toBe(false);
    expect(isVerifiedPayuSuccess("success", "99.00", 249, "payu-ref")).toBe(false);
    expect(isVerifiedPayuSuccess("success", "249.00", 249, "")).toBe(false);
  });

  it("compares only valid full SHA-512 hexadecimal hashes", () => {
    const validHash = "a".repeat(128);
    expect(safePayuHashMatch(validHash, validHash)).toBe(true);
    expect(safePayuHashMatch(validHash, "b".repeat(128))).toBe(false);
    expect(safePayuHashMatch("short", "short")).toBe(false);
  });

  it("uses SHA-512 for the server-side PayU hash", async () => {
    expect(await sha512Hex("")).toBe(
      "cf83e1357eefb8bdf1542850d66d8007d620e4050b5715dc83f4a921d36ce9ce" +
        "47d0d13c5d85f2b0ff8318d2877eec2f63b931bd47417a81a538327af927da3e",
    );
  });
});