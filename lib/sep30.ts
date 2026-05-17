/**
 * SEP-30 Social Recovery helpers.
 *
 * In a full production deployment you would run or integrate with dedicated
 * SEP-30 recovery servers. For the MVP we store the encrypted secret server-
 * side and model the SEP-30 recovery contract around the phone number, which
 * acts as the social-recovery identity anchor.
 *
 * The pattern:
 *   1. Generate Stellar keypair for worker.
 *   2. Encrypt secret with AES-256-GCM using ENCRYPTION_KEY.
 *   3. Store encrypted secret in DB (Worker.encryptedSecret).
 *   4. On recovery: worker proves phone ownership via OTP → server decrypts
 *      and returns access.
 */

import { createCipheriv, createDecipheriv, randomBytes } from "crypto";

const ENCRYPTION_KEY_HEX = process.env.ENCRYPTION_KEY ?? "0".repeat(64);
const ENCRYPTION_KEY = Buffer.from(ENCRYPTION_KEY_HEX, "hex");
const ALGORITHM = "aes-256-gcm";

/** Encrypt a Stellar secret key for at-rest storage */
export function encryptSecret(secret: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
  const encrypted = Buffer.concat([
    cipher.update(secret, "utf8"),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();
  // Store as: iv_hex:authTag_hex:ciphertext_hex
  return `${iv.toString("hex")}:${authTag.toString("hex")}:${encrypted.toString("hex")}`;
}

/** Decrypt an at-rest Stellar secret key */
export function decryptSecret(stored: string): string {
  const [ivHex, authTagHex, encryptedHex] = stored.split(":");
  const iv = Buffer.from(ivHex, "hex");
  const authTag = Buffer.from(authTagHex, "hex");
  const encrypted = Buffer.from(encryptedHex, "hex");

  const decipher = createDecipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
  decipher.setAuthTag(authTag);
  return decipher.update(encrypted) .toString("utf8") + decipher.final("utf8");
}
