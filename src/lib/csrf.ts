export const CSRF_COOKIE = "lt_csrf";
export const CSRF_HEADER = "x-csrf-token";

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";

export function generateCsrfToken(): string {
  const bytes = new Uint8Array(24);
  crypto.getRandomValues(bytes);
  let out = "";
  for (let i = 0; i < bytes.length; i++) out += ALPHABET[bytes[i] & 63];
  return out;
}
