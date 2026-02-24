import { appConfig } from "@/config/appConfig";
import crypto from "crypto";

/**
 * Encrypts a UTF-8 string using AES-256-GCM.
 *
 * This function provides:
 * - Confidentiality (AES-256)
 * - Integrity & authenticity (GCM authentication tag)
 *
 * Output format (Base64-encoded):
 *   [ IV | AUTH_TAG | CIPHERTEXT ]
 *
 * Notes:
 * - A random IV is generated per encryption.
 * - The same `aad` (Additional Authenticated Data), if provided,
 *   MUST be supplied again during decryption.
 *
 * @param plain - The plaintext string to encrypt (UTF-8).
 * @param key - 32-byte symmetric encryption key (AES-256).
 * @param aad - Optional additional authenticated data (not encrypted).
 *
 * @returns Base64-encoded payload containing IV, auth tag, and ciphertext.
 *
 * @throws {Error} If the key length is not exactly 32 bytes.
 */
export function encryptAesGcm(
  plain: string,
  key: Buffer,
  aad?: string,
): string {
  if (key.length !== 32)
    throw new Error("Key must be 32 bytes for aes-256-gcm");

  const iv = crypto.randomBytes(appConfig.encryption.iv_len);

  const cipher = crypto.createCipheriv(
    appConfig.encryption.algo,
    key,
    iv,
    { authTagLength: appConfig.encryption.tag_Len },
  );

  if (aad) {
    cipher.setAAD(Buffer.from(aad, "utf8"));
  }

  const ciphertext = Buffer.concat([
    cipher.update(plain, "utf8"),
    cipher.final(),
  ]);

  const tag = cipher.getAuthTag();

  return Buffer.concat([iv, tag, ciphertext]).toString("base64");
}

/**
 * Decrypts a Base64-encoded AES-256-GCM payload.
 *
 * Expected payload format (after Base64 decoding):
 *   [ IV | AUTH_TAG | CIPHERTEXT ]
 *
 * Security properties:
 * - Automatically verifies integrity and authenticity via GCM.
 * - Decryption fails if:
 *   - Key is incorrect
 *   - Payload is tampered
 *   - Authentication tag does not match
 *   - AAD does not match the original encryption
 *
 * Includes a basic payload-size guard to mitigate trivial DoS attempts.
 *
 * @param payloadB64 - Base64-encoded encrypted payload.
 * @param key - 32-byte symmetric encryption key (AES-256).
 * @param aad - Optional additional authenticated data (must match encryption).
 *
 * @returns Decrypted plaintext string (UTF-8).
 *
 * @throws {Error} If the key length is invalid.
 * @throws {Error} If the payload is malformed or too large.
 * @throws {Error} If authentication fails during decryption.
 */
export function decryptAesGcm(
  payloadB64: string,
  key: Buffer,
  aad?: string,
): string {
  if (key.length !== 32)
    throw new Error("Key must be 32 bytes for aes-256-gcm");

  // Basic DoS guard (adjust threshold as needed)
  if (payloadB64.length > 10_000)
    throw new Error("Payload too large");

  const payload = Buffer.from(payloadB64, "base64");

  if (
    payload.length <
    appConfig.encryption.iv_len + appConfig.encryption.tag_Len
  ) {
    throw new Error("Invalid payload length");
  }

  const iv = payload.subarray(0, appConfig.encryption.iv_len);
  const tag = payload.subarray(
    appConfig.encryption.iv_len,
    appConfig.encryption.iv_len + appConfig.encryption.tag_Len,
  );
  const ciphertext = payload.subarray(
    appConfig.encryption.iv_len + appConfig.encryption.tag_Len,
  );

  const decipher = crypto.createDecipheriv(
    appConfig.encryption.algo,
    key,
    iv,
    { authTagLength: appConfig.encryption.tag_Len },
  );

  if (aad) {
    decipher.setAAD(Buffer.from(aad, "utf8"));
  }

  decipher.setAuthTag(tag);

  const plain = Buffer.concat([
    decipher.update(ciphertext),
    decipher.final(),
  ]);

  return plain.toString("utf8");
}
