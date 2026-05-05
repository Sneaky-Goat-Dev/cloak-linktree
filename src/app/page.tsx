import Link from "next/link";

export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col items-center justify-center gap-6 px-6 text-center">
      <div className="glass-strong animate-glass-pop flex flex-col items-center gap-5 rounded-3xl px-8 py-10 sm:px-12 sm:py-12">
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Cloak</h1>
        <p className="max-w-md text-sm text-neutral-300 sm:text-base">
          A link-in-bio that doesn&apos;t leak its destinations to bots, scrapers, or referrers.
        </p>
        <Link
          href="/demo"
          className="glass glass-hover inline-flex min-h-11 items-center gap-2 rounded-full px-5 text-sm font-medium text-emerald-200 transition"
        >
          See the demo <span aria-hidden>→</span>
        </Link>
      </div>
    </main>
  );
}
