import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  amountMatchesExpectedInr,
  isVerifiedPayuSuccess,
  payuResponseHashInput,
  safePayuHashMatch,
  sha512Hex,
} from "./payu-core";

describe("PayU test payment validation", () => {
  it("accepts only the exact plan amount in INR", () => {
    assert.equal(amountMatchesExpectedInr("99.00", 99), true);
    assert.equal(amountMatchesExpectedInr("99.01", 99), false);
    assert.equal(amountMatchesExpectedInr("099.00", 99), true);
    assert.equal(amountMatchesExpectedInr("99.000", 99), false);
  });

  it("requires successful provider status, exact amount, and a provider transaction id", () => {
    assert.equal(isVerifiedPayuSuccess("success", "249.00", 249, "payu-ref"), true);
    assert.equal(isVerifiedPayuSuccess("pending", "249.00", 249, "payu-ref"), false);
    assert.equal(isVerifiedPayuSuccess("success", "99.00", 249, "payu-ref"), false);
    assert.equal(isVerifiedPayuSuccess("success", "249.00", 249, ""), false);
  });

  it("compares only valid full SHA-512 hexadecimal hashes", () => {
    const validHash = "a".repeat(128);
    assert.equal(safePayuHashMatch(validHash, validHash), true);
    assert.equal(safePayuHashMatch(validHash, "b".repeat(128)), false);
    assert.equal(safePayuHashMatch("short", "short"), false);
  });

  it("builds PayU callback hashes with reversed UDF fields and optional charges", () => {
    assert.equal(
      payuResponseHashInput(
        { status: "success", udf1: "one", udf5: "five", email: "s@example.com", firstname: "A", productinfo: "Plus", amount: "99.00", txnid: "t1", key: "merchant" },
        "salt",
      ),
      "salt|success||||||five||||one|s@example.com|A|Plus|99.00|t1|merchant",
    );
    assert.equal(
      payuResponseHashInput({ status: "success", additionalCharges: "1.00", txnid: "t1" }, "salt"),
      "1.00|salt|success|||||||||||t1|||||",
    );
  });

  it("uses SHA-512 for the server-side PayU hash", async () => {
    assert.equal(await sha512Hex(""),
      "cf83e1357eefb8bdf1542850d66d8007d620e4050b5715dc83f4a921d36ce9ce" +
        "47d0d13c5d85f2b0ff8318d2877eec2f63b931bd47417a81a538327af927da3e",
    );
  });
});