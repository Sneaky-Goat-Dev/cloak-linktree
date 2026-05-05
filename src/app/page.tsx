import Link from "next/link";

export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col items-center justify-center gap-6 px-6 text-center">
      <h1 className="text-3xl font-semibold tracking-tight">Cloak</h1>
      <p className="text-neutral-400">
        A link-in-bio platform that doesn&apos;t leak its destinations to bots, scrapers, or referrers.
      </p>
      <Link
        href="/demo"
        className="rounded-full bg-emerald-500 px-5 py-2 text-sm font-medium text-neutral-950 hover:bg-emerald-400"
      >
        See the demo →
      </Link>
    </main>
  );
}
