/**
 * Generates Additional Authenticated Data (AAD) for AES-GCM encryption.
 *
 * The returned value is used to bind encrypted secrets
 * (e.g. Slack or GitHub credentials) to a specific team
 * and usage context.
 *
 * Security properties:
 * - AAD is NOT encrypted, but IS authenticated
 * - Any change to the AAD will cause decryption to fail
 * - Prevents ciphertext reuse across teams or secret types
 *
 * Typical usage:
 * ```ts
 * const aad = aadFor(teamId, "slack");
 * encryptAesGcm(secret, key, aad);
 * ```
 *
 * @param teamId - Unique identifier of the team that owns the secret.
 * @param field - Logical namespace for the secret
 *                (e.g. "slack" or "github").
 *
 * @returns A deterministic AAD string scoped to a team and secret type.
 */
export function aadFor(teamId: number, field: "slack" | "github") {
  return `team:${teamId}:secret:${field}`;
}
