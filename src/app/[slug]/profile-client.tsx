"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { CSRF_COOKIE, CSRF_HEADER } from "@/lib/csrf";

type LinkRow = { id: string; label: string; ageGated: boolean };
type ApiResponse = { links: LinkRow[]; tokens: Record<string, string> };

export type ClientProfile = {
  slug: string;
  displayName: string;
  bio: string;
  avatar: string;
  links: LinkRow[];
};

function readCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

function isInAppBrowserClient(): boolean {
  if (typeof navigator === "undefined") return false;
  return /(Instagram|FBAN|FBAV|FB_IAB|FBIOS|Threads|TikTok|musical_ly|BytedanceWebview|Snapchat|Line|MicroMessenger|XiaoHongShu)/i.test(
    navigator.userAgent,
  );
}

export default function ProfileClient({ profile }: { profile: ClientProfile }) {
  const [data, setData] = useState<ApiResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pendingAdult, setPendingAdult] = useState<LinkRow | null>(null);
  const [showInApp, setShowInApp] = useState<boolean>(false);

  // Wipe query string on load (utm_*, refs, etc).
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.location.search) {
      window.history.replaceState({}, "", window.location.pathname);
    }
    setShowInApp(isInAppBrowserClient());
  }, []);

  // Fetch link tokens via POST + CSRF echo.
  useEffect(() => {
    const csrf = readCookie(CSRF_COOKIE);
    if (!csrf) {
      setError("Missing session token. Refresh the page.");
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/links", {
          method: "POST",
          headers: { "content-type": "application/json", [CSRF_HEADER]: csrf },
          body: JSON.stringify({ slug: profile.slug }),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const body = (await res.json()) as ApiResponse;
        if (!cancelled) setData(body);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [profile.slug]);

  const linkMap = useMemo(() => {
    const m: Record<string, LinkRow> = {};
    if (data) for (const l of data.links) m[l.id] = l;
    return m;
  }, [data]);

  function go(linkId: string) {
    const meta = linkMap[linkId];
    if (!meta || !data) return;
    if (meta.ageGated) {
      // Always re-prompt — no session memory.
      setPendingAdult(meta);
      return;
    }
    redeem(linkId);
  }

  function redeem(linkId: string) {
    if (!data) return;
    const token = data.tokens[linkId];
    if (!token) return;
    const w = window.open(`/r/${encodeURIComponent(token)}`, "_blank", "noopener,noreferrer");
    if (!w) window.location.href = `/r/${encodeURIComponent(token)}`;
  }

  function confirmAdult() {
    if (!pendingAdult) return;
    const id = pendingAdult.id;
    setPendingAdult(null);
    // Defer to next tick so popup-blocker sees a fresh user gesture chain.
    setTimeout(() => redeem(id), 0);
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col items-center px-5 py-10 sm:py-14">
      {showInApp && <InAppBanner />}

      <div className="animate-glass-pop mb-5 size-28 rounded-full p-[3px] ring-1 ring-white/30 shadow-[0_8px_30px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.45)]">
        <div className="size-full overflow-hidden rounded-full ring-1 ring-white/15">
          <Image
            src={profile.avatar}
            alt=""
            width={224}
            height={224}
            className="size-full object-cover"
            priority
          />
        </div>
      </div>

      <h1 className="animate-glass-pop text-xl font-semibold">{profile.displayName}</h1>
      <p className="animate-glass-pop mt-1 max-w-xs text-center text-sm text-neutral-300">
        {profile.bio}
      </p>

      <div className="mt-8 flex w-full flex-col gap-3">
        {profile.links.map((l, i) => {
          const ready = !!data && !!data.tokens[l.id];
          return (
            <button
              key={l.id}
              type="button"
              onClick={() => go(l.id)}
              disabled={!ready}
              data-link-id={l.id}
              style={{ animationDelay: `${i * 40}ms` }}
              className="glass glass-hover animate-glass-pop group flex w-full items-center justify-between rounded-2xl px-5 py-4 text-left text-[15px] font-medium transition-[background,border-color,transform] active:scale-[0.99] disabled:opacity-60"
            >
              <span className="flex items-center gap-2">
                {l.ageGated && (
                  <span className="rounded-full border border-amber-300/30 bg-amber-300/15 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-200">
                    18+
                  </span>
                )}
                <span>{l.label}</span>
              </span>
              <span className="text-neutral-400 group-hover:text-emerald-300">
                {ready ? "→" : "…"}
              </span>
            </button>
          );
        })}
      </div>

      {error && <p className="mt-6 text-xs text-red-300">{error}</p>}

      <p className="mt-12 text-[11px] text-neutral-500">
        Protected by Cloak · destinations are signed and short-lived
      </p>

      {pendingAdult && (
        <AgeGate
          label={pendingAdult.label}
          onConfirm={confirmAdult}
          onCancel={() => setPendingAdult(null)}
        />
      )}
    </main>
  );
}

function InAppBanner() {
  const [dismissed, setDismissed] = useState(false);
  if (dismissed) return null;
  const here = typeof window !== "undefined" ? window.location.href : "";
  const intent =
    typeof window !== "undefined"
      ? `intent://${window.location.host}${window.location.pathname}#Intent;scheme=https;package=com.android.chrome;end`
      : "#";
  return (
    <div className="glass animate-glass-pop mb-6 w-full rounded-2xl p-4 text-xs text-amber-100">
      <div className="text-sm font-medium">You&apos;re in an in-app browser</div>
      <p className="mt-1 text-neutral-300">
        Some links may not work properly. Open this page in your real browser:
      </p>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <a
          href={intent}
          className="glass glass-hover inline-flex min-h-9 items-center rounded-full px-3 text-[12px] font-medium text-amber-100 transition"
        >
          Open in Chrome (Android)
        </a>
        <button
          type="button"
          onClick={() => navigator.clipboard?.writeText(here)}
          className="glass glass-hover inline-flex min-h-9 items-center rounded-full px-3 text-[12px] font-medium text-neutral-100 transition"
        >
          Copy link
        </button>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          className="ml-auto text-neutral-400 hover:text-neutral-100"
          aria-label="Dismiss"
        >
          ✕
        </button>
      </div>
      <p className="mt-2 text-[11px] text-neutral-400">
        On iOS: tap the ••• menu, then &quot;Open in Browser&quot;.
      </p>
    </div>
  );
}

function AgeGate({
  label,
  onConfirm,
  onCancel,
}: {
  label: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const confirmRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    confirmRef.current?.focus();

    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onCancel();
    }
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [onCancel]);

  return (
    <div
      className="animate-overlay-fade fixed inset-0 z-50 flex items-end justify-center bg-black/55 backdrop-blur-sm sm:items-center"
      onClick={onCancel}
      aria-hidden
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="age-gate-title"
        aria-describedby="age-gate-desc"
        onClick={(e) => e.stopPropagation()}
        className="glass-strong animate-sheet-up sm:animate-glass-pop w-full rounded-t-3xl px-6 pt-7 pb-[max(1.5rem,env(safe-area-inset-bottom))] sm:mx-4 sm:max-w-sm sm:rounded-3xl sm:p-7"
      >
        <div className="mx-auto mb-3 hidden h-1 w-10 rounded-full bg-white/20 sm:block" />
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-white/20 sm:hidden" />

        <div className="flex items-start gap-3">
          <div className="grid size-11 shrink-0 place-items-center rounded-2xl border border-amber-300/30 bg-amber-300/15 text-amber-200">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="size-5"
              aria-hidden
            >
              <rect x="3" y="11" width="18" height="11" rx="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          </div>
          <div className="min-w-0 flex-1">
            <h2 id="age-gate-title" className="text-base font-semibold sm:text-lg">
              Adults only
            </h2>
            <p id="age-gate-desc" className="mt-1 text-sm text-neutral-300">
              The destination{" "}
              <span className="font-medium text-neutral-100">&ldquo;{label}&rdquo;</span> is
              intended for adults. By continuing you confirm you are 18 or older.
            </p>
          </div>
        </div>

        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onCancel}
            className="glass glass-hover inline-flex min-h-12 items-center justify-center rounded-2xl px-4 text-sm font-medium text-neutral-200 transition sm:min-h-11"
          >
            Cancel
          </button>
          <button
            ref={confirmRef}
            type="button"
            onClick={onConfirm}
            className="inline-flex min-h-12 items-center justify-center rounded-2xl bg-emerald-400 px-4 text-sm font-semibold text-emerald-950 shadow-[inset_0_1px_0_rgba(255,255,255,0.45),0_8px_24px_rgba(16,185,129,0.35)] transition hover:bg-emerald-300 active:scale-[0.99] sm:min-h-11"
          >
            I&apos;m 18 or older — continue
          </button>
        </div>

        <p className="mt-4 text-[11px] leading-relaxed text-neutral-500">
          You&apos;ll be asked again next time. We don&apos;t store your confirmation.
        </p>
      </div>
    </div>
  );
}
