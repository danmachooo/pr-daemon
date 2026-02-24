import { decryptSecret } from "@/services/secrets.service";
import crypto from "crypto";

export async function verifyGithubWebhookSignature(opts: {
  githubWebhookSecretEnc: string | null;
  rawBody: Buffer;
  signature256?: string;
}) {
  const { githubWebhookSecretEnc, rawBody, signature256 } = opts;

  if (!signature256) throw new Error("Missing x-hub-signature-256");

  const secret = decryptSecret(githubWebhookSecretEnc);
  if (!secret) throw new Error("GitHub webhook secret not configured");

  const digest = crypto
    .createHmac("sha256", secret)
    .update(rawBody)
    .digest("hex");
  const expected = `sha256=${digest}`;

  const a = Buffer.from(expected);
  const b = Buffer.from(signature256);

  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
    throw new Error("Invalid GitHub signature");
  }
}
