import { SignJWT, jwtVerify } from "jose";

const TOKEN_TTL_SECONDS = 15 * 60;

function getKey(): Uint8Array {
  const secret = process.env.LINK_SIGNING_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("LINK_SIGNING_SECRET must be set and at least 32 chars");
  }
  return new TextEncoder().encode(secret);
}

export async function signRedirectToken(slug: string, linkId: string): Promise<string> {
  return new SignJWT({ slug, linkId })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setIssuedAt()
    .setExpirationTime(`${TOKEN_TTL_SECONDS}s`)
    .sign(getKey());
}

export async function verifyRedirectToken(
  token: string,
): Promise<{ slug: string; linkId: string } | null> {
  try {
    const { payload } = await jwtVerify(token, getKey(), { algorithms: ["HS256"] });
    if (typeof payload.slug !== "string" || typeof payload.linkId !== "string") return null;
    return { slug: payload.slug, linkId: payload.linkId };
  } catch {
    return null;
  }
}
