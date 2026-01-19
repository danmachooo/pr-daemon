import { appConfig } from "../../config/appConfig";
import { decryptAesGcm, encryptAesGcm } from "../utils/crypto";

function loadKeys(): Buffer[] {
  const raw = appConfig.secrets.key_hex;
  if (!raw) throw new Error("Missing SECRETS_KEYS_HEX env var");

  const keys = raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .map((hex) => Buffer.from(hex, "hex"));

  if (keys.length === 0) throw new Error("SECRETS_KEYS_HEX has no keys");

  for (const k of keys) {
    if (k.length !== 32) {
      throw new Error(
        "Each SECRETS_KEYS_HEX key must be 32 bytes (64 hex chars)",
      );
    }
  }

  return keys;
}

// v1 envelope: "v1:<base64(iv+tag+ciphertext)>"
export function encryptSecret(
  plain?: string | null,
  aad?: string,
): string | null {
  if (!plain) return null;

  const [activeKey] = loadKeys();
  const payloadB64 = encryptAesGcm(plain, activeKey, aad);
  return `v1:${payloadB64}`;
}

export function decryptSecret(enc?: string | null, aad?: string): string {
  if (!enc) return "";
  if (!enc.startsWith("v1:"))
    throw new Error("Unknown secret format (expected v1:...)");

  const payloadB64 = enc.slice(3);
  const keys = loadKeys();

  for (const key of keys) {
    try {
      return decryptAesGcm(payloadB64, key, aad);
    } catch {
      // try next key
    }
  }

  throw new Error("Failed to decrypt secret with provided keys");
}

export function reencryptSecret(enc: string, aad?: string): string {
  const plain = decryptSecret(enc, aad);
  const next = encryptSecret(plain, aad);
  if (!next) throw new Error("Failed to reencrypt secret");
  return next;
}
