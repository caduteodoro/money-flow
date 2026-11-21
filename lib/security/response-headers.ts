export const GLOBAL_SECURITY_HEADERS = [
  { key: "Content-Security-Policy", value: "base-uri 'self'; form-action 'self'; frame-ancestors 'none'; object-src 'none'" },
  { key: "Permissions-Policy", value: "camera=(), geolocation=(), microphone=()" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-DNS-Prefetch-Control", value: "off" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Permitted-Cross-Domain-Policies", value: "none" },
] as const;

export const PROTECTED_CACHE_HEADERS = [
  { key: "Cache-Control", value: "private, no-store, max-age=0, must-revalidate" },
  { key: "Expires", value: "0" },
  { key: "Pragma", value: "no-cache" },
] as const;

export function applyHeaders(headers: Headers, entries: ReadonlyArray<{ key: string; value: string }>) {
  for (const { key, value } of entries) {
    headers.set(key, value);
  }
}
