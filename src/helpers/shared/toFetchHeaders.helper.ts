import type { IncomingHttpHeaders } from "http";

/**
 * Converts Node.js `IncomingHttpHeaders` into a Fetch API `Headers` object.
 *
 * This helper is useful when bridging between:
 * - Node.js HTTP / Express request handlers
 * - Fetch-based APIs or libraries (e.g. Better Auth, undici, Web Fetch)
 *
 * Behavior:
 * - Skips `null` and `undefined` header values
 * - Preserves multiple header values by appending them
 * - Overwrites single-value headers using `set`
 *
 * Notes:
 * - Header names are passed through as-is (Node already normalizes them)
 * - Array values result in multiple entries for the same header name
 *
 * Example:
 * ```ts
 * const headers = toFetchHeaders(req.headers);
 * await fetch(url, { headers });
 * ```
 *
 * @param h - Node.js incoming HTTP headers.
 * @returns A Fetch API `Headers` instance.
 */
export function toFetchHeaders(h: IncomingHttpHeaders): Headers {
  const out = new Headers();

  for (const [key, value] of Object.entries(h)) {
    if (value == null) continue;

    if (Array.isArray(value)) {
      // Multiple headers with the same name
      for (const v of value) out.append(key, v);
    } else {
      out.set(key, value);
    }
  }

  return out;
}
