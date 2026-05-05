import { NextResponse } from "next/server";
import { verifyRedirectToken } from "@/lib/tokens";
import { getLink, getProfile } from "@/lib/data";

export const runtime = "nodejs";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ token: string }> },
) {
  const { token } = await ctx.params;
  const payload = await verifyRedirectToken(token);
  if (!payload) {
    return new NextResponse("Link expired or invalid.", {
      status: 410,
      headers: { "Referrer-Policy": "no-referrer" },
    });
  }

  const profile = getProfile(payload.slug);
  if (!profile) {
    return new NextResponse("Not found.", {
      status: 404,
      headers: { "Referrer-Policy": "no-referrer" },
    });
  }

  const link = getLink(payload.slug, payload.linkId);
  if (!link) {
    return new NextResponse("Not found.", {
      status: 404,
      headers: { "Referrer-Policy": "no-referrer" },
    });
  }

  return NextResponse.redirect(link.url, {
    status: 302,
    headers: {
      "Referrer-Policy": "no-referrer",
      "Cache-Control": "no-store",
    },
  });
}
