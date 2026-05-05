export type Link = {
  id: string;
  label: string;
  url: string;
  ageGated?: boolean;
};

export type Profile = {
  slug: string;
  displayName: string;
  bio: string;
  avatar: string;
  theme: { accent: string };
  links: Link[];
};

const profiles: Profile[] = [
  {
    slug: "demo",
    displayName: "Ava Stone",
    bio: "Creator. Producer. Sometimes online.",
    avatar: "/avatar.jpg",
    theme: { accent: "#10b981" },
    links: [
      { id: "l1", label: "Latest single — listen on Spotify", url: "https://open.spotify.com/" },
      { id: "l2", label: "Tour dates 2026 — Songkick", url: "https://www.songkick.com/" },
      { id: "l3", label: "Merch — Bandcamp store", url: "https://bandcamp.com/" },
      { id: "l4", label: "Behind-the-scenes (18+) — Patreon", url: "https://www.patreon.com/", ageGated: true },
      { id: "l5", label: "Newsletter — Substack", url: "https://substack.com/" },
    ],
  },
];

const decoyLinks: Link[] = [
  { id: "d1", label: "About this page", url: "https://example.com/" },
  { id: "d2", label: "Contact", url: "https://example.com/" },
];

export function getProfile(slug: string): Profile | null {
  return profiles.find((p) => p.slug === slug) ?? null;
}

export function getDecoyProfile(slug: string): Profile {
  return {
    slug,
    displayName: slug,
    bio: "Personal page",
    avatar: "/avatar.jpg",
    theme: { accent: "#10b981" },
    links: decoyLinks,
  };
}

export function getLink(slug: string, id: string): Link | null {
  const p = getProfile(slug);
  if (!p) return null;
  return p.links.find((l) => l.id === id) ?? null;
}
