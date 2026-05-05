import { NextRequest, NextResponse } from "next/server";
import { headers, cookies } from "next/headers";
import { getProfile, getDecoyProfile } from "@/lib/data";
import { signRedirectToken } from "@/lib/tokens";
import { isScraper } from "@/lib/bots";
import { CSRF_COOKIE, CSRF_HEADER } from "@/lib/csrf";

export const runtime = "nodejs";

export async function GET() {
  return new NextResponse("Method Not Allowed", {
    status: 405,
    headers: { Allow: "POST" },
  });
}

export async function POST(req: NextRequest) {
  const h = await headers();
  const ua = h.get("user-agent");

  // Same-origin enforcement: reject cross-origin POSTs.
  const origin = h.get("origin");
  const host = h.get("host");
  if (origin) {
    try {
      const u = new URL(origin);
      if (u.host !== host) {
        return NextResponse.json({ error: "bad origin" }, { status: 403 });
      }
    } catch {
      return NextResponse.json({ error: "bad origin" }, { status: 403 });
    }
  }

  // Double-submit CSRF check.
  const c = await cookies();
  const cookieToken = c.get(CSRF_COOKIE)?.value;
  const headerToken = h.get(CSRF_HEADER);
  if (!cookieToken || !headerToken || cookieToken !== headerToken) {
    return NextResponse.json({ error: "csrf" }, { status: 403 });
  }

  let body: { slug?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "bad body" }, { status: 400 });
  }
  const slug = typeof body.slug === "string" ? body.slug : null;
  if (!slug) return NextResponse.json({ error: "bad slug" }, { status: 400 });

  // Bot scrapers get decoy data with non-resolvable token IDs.
  const profile = isScraper(ua) ? getDecoyProfile(slug) : getProfile(slug);
  if (!profile) return NextResponse.json({ error: "not found" }, { status: 404 });

  const links = profile.links.map((l) => ({
    id: l.id,
    label: l.label,
    ageGated: !!l.ageGated,
  }));

  const tokens: Record<string, string> = {};
  for (const l of profile.links) {
    tokens[l.id] = await signRedirectToken(profile.slug, l.id);
  }

  return NextResponse.json(
    { links, tokens },
    {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate, private",
        "Referrer-Policy": "no-referrer",
      },
    },
  );
}
