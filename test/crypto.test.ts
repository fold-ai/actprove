import { describe, it, expect } from "vitest";
import {
  encrypt,
  decrypt,
  sha256,
  generateApiKey,
  hmac,
} from "@/lib/crypto";

describe("crypto", () => {
  it("round-trips AES-256-GCM encryption", () => {
    const secret = "client_secret_value_123";
    const enc = encrypt(secret);
    expect(enc).not.toContain(secret);
    expect(decrypt(enc)).toBe(secret);
  });

  it("produces different ciphertext each time (random IV)", () => {
    expect(encrypt("same")).not.toBe(encrypt("same"));
  });

  it("hashes deterministically with sha256", () => {
    expect(sha256("abc")).toBe(sha256("abc"));
    expect(sha256("abc")).not.toBe(sha256("abd"));
  });

  it("generates an api key with ap_live_ prefix and matching hash", () => {
    const { token, prefix, hash } = generateApiKey();
    expect(token.startsWith("ap_live_")).toBe(true);
    expect(prefix).toBe(token.slice(0, 16));
    expect(hash).toBe(sha256(token));
  });

  it("produces stable HMAC signatures", () => {
    expect(hmac("secret", "payload")).toBe(hmac("secret", "payload"));
    expect(hmac("secret", "payload")).not.toBe(hmac("other", "payload"));
  });
});
