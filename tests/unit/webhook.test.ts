import { describe, it, expect } from "vitest";
import { createHmac } from "crypto";
import { verifyWebhookSignature } from "@/lib/github/webhook";

// Helper: generates a valid GitHub-style signature
function generateSignature(payload: string, secret: string): string {
  return (
    "sha256=" +
    createHmac("sha256", secret).update(payload, "utf8").digest("hex")
  );
}

describe("verifyWebhookSignature", () => {
  it("returns true for a valid signature", () => {
    const payload = JSON.stringify({ action: "opened" });
    const secret = "test-secret-123";
    const signature = generateSignature(payload, secret);

    expect(verifyWebhookSignature(payload, signature, secret)).toBe(true);
  });

  it("returns false for an invalid signature", () => {
    const payload = JSON.stringify({ action: "opened" });
    const secret = "test-secret-123";
    const wrongSignature =
      "sha256=invalidsignaturevalue00000000000000000000000000000000000000000000";

    expect(verifyWebhookSignature(payload, wrongSignature, secret)).toBe(false);
  });

  it("returns false for a null signature", () => {
    const payload = JSON.stringify({ action: "opened" });
    const secret = "test-secret-123";

    expect(verifyWebhookSignature(payload, null, secret)).toBe(false);
  });

  it("returns false when signature has wrong prefix", () => {
    const payload = JSON.stringify({ action: "opened" });
    const secret = "test-secret-123";
    // sha1= instead of sha256=
    const wrongPrefix =
      "sha1=" + createHmac("sha1", secret).update(payload).digest("hex");

    expect(verifyWebhookSignature(payload, wrongPrefix, secret)).toBe(false);
  });

  it("returns false when payload is tampered with", () => {
    const originalPayload = JSON.stringify({ action: "opened" });
    const tamperedPayload = JSON.stringify({ action: "deleted" });
    const secret = "test-secret-123";
    const signature = generateSignature(originalPayload, secret);

    // Signature was for the original payload — should fail for tampered
    expect(verifyWebhookSignature(tamperedPayload, signature, secret)).toBe(
      false,
    );
  });

  it("returns false for wrong secret", () => {
    const payload = JSON.stringify({ action: "opened" });
    const correctSecret = "correct-secret";
    const wrongSecret = "wrong-secret";
    const signature = generateSignature(payload, correctSecret);

    expect(verifyWebhookSignature(payload, signature, wrongSecret)).toBe(false);
  });
});
