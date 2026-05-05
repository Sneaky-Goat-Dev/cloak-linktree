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
      { id: "l1", label: "Latest single — out now", url: "https://music.example.com/ava/latest" },
      { id: "l2", label: "Tour dates 2026", url: "https://tour.example.com/ava" },
      { id: "l3", label: "Merch store", url: "https://shop.example.com/ava" },
      { id: "l4", label: "Behind-the-scenes (18+)", url: "https://members.example.com/ava", ageGated: true },
      { id: "l5", label: "Newsletter", url: "https://news.example.com/ava" },
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
