import crypto from "crypto";

const ALGO = "aes-256-gcm";
const IV_LEN = 12;
const TAG_LEN = 16;

export function encryptAesGcm(
  plain: string,
  key: Buffer,
  aad?: string,
): string {
  if (key.length !== 32)
    throw new Error("Key must be 32 bytes for aes-256-gcm");

  const iv = crypto.randomBytes(IV_LEN);
  const cipher = crypto.createCipheriv(ALGO, key, iv, {
    authTagLength: TAG_LEN,
  });

  if (aad) cipher.setAAD(Buffer.from(aad, "utf8"));

  const ciphertext = Buffer.concat([
    cipher.update(plain, "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();

  return Buffer.concat([iv, tag, ciphertext]).toString("base64");
}

export function decryptAesGcm(
  payloadB64: string,
  key: Buffer,
  aad?: string,
): string {
  if (key.length !== 32)
    throw new Error("Key must be 32 bytes for aes-256-gcm");

  // basic DoS guard (adjust threshold to your needs)
  if (payloadB64.length > 10_000) throw new Error("Payload too large");

  const payload = Buffer.from(payloadB64, "base64");
  if (payload.length < IV_LEN + TAG_LEN)
    throw new Error("Invalid payload length");

  const iv = payload.subarray(0, IV_LEN);
  const tag = payload.subarray(IV_LEN, IV_LEN + TAG_LEN);
  const ciphertext = payload.subarray(IV_LEN + TAG_LEN);

  const decipher = crypto.createDecipheriv(ALGO, key, iv, {
    authTagLength: TAG_LEN,
  });
  if (aad) decipher.setAAD(Buffer.from(aad, "utf8"));
  decipher.setAuthTag(tag);

  const plain = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
  return plain.toString("utf8");
}
