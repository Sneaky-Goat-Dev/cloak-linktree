import { notFound } from "next/navigation";
import { headers } from "next/headers";
import type { Metadata } from "next";
import { getProfile, getDecoyProfile, type Profile } from "@/lib/data";
import { isScraper } from "@/lib/bots";
import ProfileClient, { type ClientProfile } from "./profile-client";

type Params = { slug: string };

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { slug } = await params;
  const profile = getProfile(slug);
  if (!profile) return { title: "Not found" };
  return {
    title: profile.displayName,
    description: profile.bio,
    robots: { index: false, follow: false },
    referrer: "no-referrer",
    openGraph: {
      title: profile.displayName,
      description: profile.bio,
      images: ["/og.jpg"],
    },
  };
}

function toClientProfile(p: Profile): ClientProfile {
  // Strip destination URLs before crossing the server/client boundary so they
  // never appear in the rendered HTML or the RSC payload.
  return {
    slug: p.slug,
    displayName: p.displayName,
    bio: p.bio,
    avatar: p.avatar,
    links: p.links.map((l) => ({
      id: l.id,
      label: l.label,
      ageGated: !!l.ageGated,
    })),
  };
}

export default async function ProfilePage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { slug } = await params;
  const ua = (await headers()).get("user-agent");

  const real = getProfile(slug);
  if (!real) notFound();

  const profile: Profile = isScraper(ua) ? getDecoyProfile(slug) : real;
  return <ProfileClient profile={toClientProfile(profile)} />;
}
