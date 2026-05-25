import "server-only";
import crypto from "crypto";

/**
 * AES-256-GCM encryption for integration credentials at rest (spec §2.5.1).
 * Key is derived from ENCRYPTION_KEY (any length) via SHA-256. Output format:
 * base64(iv).base64(authTag).base64(ciphertext).
 */
function key(): Buffer {
  const secret = process.env.ENCRYPTION_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY ?? "dev-insecure-key";
  return crypto.createHash("sha256").update(secret).digest();
}

export function encrypt(plaintext: string): string {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key(), iv);
  const enc = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${iv.toString("base64")}.${tag.toString("base64")}.${enc.toString("base64")}`;
}

export function decrypt(payload: string): string {
  const [ivB64, tagB64, dataB64] = payload.split(".");
  const decipher = crypto.createDecipheriv(
    "aes-256-gcm",
    key(),
    Buffer.from(ivB64, "base64"),
  );
  decipher.setAuthTag(Buffer.from(tagB64, "base64"));
  return Buffer.concat([
    decipher.update(Buffer.from(dataB64, "base64")),
    decipher.final(),
  ]).toString("utf8");
}

/** SHA-256 hash for API keys (we store the hash, never the token). */
export function sha256(input: string): string {
  return crypto.createHash("sha256").update(input).digest("hex");
}

/** Generate a public API key: ap_live_<32 hex>. */
export function generateApiKey(): { token: string; prefix: string; hash: string } {
  const raw = crypto.randomBytes(24).toString("hex");
  const token = `ap_live_${raw}`;
  return { token, prefix: token.slice(0, 16), hash: sha256(token) };
}

/** HMAC-SHA256 signature for webhook payloads. */
export function hmac(secret: string, payload: string): string {
  return crypto.createHmac("sha256", secret).update(payload).digest("hex");
}

export function randomToken(bytes = 24): string {
  return crypto.randomBytes(bytes).toString("hex");
}
