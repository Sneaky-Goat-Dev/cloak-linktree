"use client";

import { useEffect, useMemo, useState } from "react";
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
  const [adult, setAdult] = useState<boolean>(false);
  const [pendingAdult, setPendingAdult] = useState<LinkRow | null>(null);
  const [showInApp, setShowInApp] = useState<boolean>(false);

  // Wipe query string on load (utm_*, refs, etc).
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.location.search) {
      window.history.replaceState({}, "", window.location.pathname);
    }
    setAdult(sessionStorage.getItem("cloak:adult") === "1");
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
    if (meta.ageGated && !adult) {
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
    sessionStorage.setItem("cloak:adult", "1");
    setAdult(true);
    if (pendingAdult) {
      const id = pendingAdult.id;
      setPendingAdult(null);
      setTimeout(() => redeem(id), 0);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col items-center px-6 py-10">
      {showInApp && <InAppBanner />}

      <div className="mb-6 size-24 overflow-hidden rounded-full ring-2 ring-emerald-500/40">
        <Image
          src={profile.avatar}
          alt=""
          width={192}
          height={192}
          className="size-full object-cover"
          priority
        />
      </div>

      <h1 className="text-xl font-semibold">{profile.displayName}</h1>
      <p className="mt-1 max-w-xs text-center text-sm text-neutral-400">{profile.bio}</p>

      <div className="mt-8 flex w-full flex-col gap-3">
        {profile.links.map((l) => {
          const ready = !!data && !!data.tokens[l.id];
          return (
            <button
              key={l.id}
              type="button"
              onClick={() => go(l.id)}
              disabled={!ready}
              data-link-id={l.id}
              className="group flex w-full items-center justify-between rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-4 text-left text-sm font-medium transition hover:border-emerald-400/40 hover:bg-white/[0.06] disabled:opacity-60"
            >
              <span>{l.label}</span>
              <span className="text-neutral-500 group-hover:text-emerald-400">
                {ready ? "→" : "…"}
              </span>
            </button>
          );
        })}
      </div>

      {error && <p className="mt-6 text-xs text-red-400">{error}</p>}

      <p className="mt-10 text-[11px] text-neutral-600">
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
    <div className="mb-6 w-full rounded-xl border border-amber-400/30 bg-amber-400/10 p-3 text-xs text-amber-200">
      <div className="font-medium text-amber-100">You&apos;re in an in-app browser</div>
      <p className="mt-1 text-amber-200/80">
        Some links may not work properly. Open this page in your real browser:
      </p>
      <div className="mt-2 flex flex-wrap gap-2">
        <a
          href={intent}
          className="rounded-md bg-amber-300 px-2 py-1 font-medium text-amber-950"
        >
          Open in Chrome (Android)
        </a>
        <button
          type="button"
          onClick={() => {
            navigator.clipboard?.writeText(here);
          }}
          className="rounded-md border border-amber-300/40 px-2 py-1 text-amber-100"
        >
          Copy link
        </button>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          className="ml-auto text-amber-200/70 hover:text-amber-100"
        >
          Dismiss
        </button>
      </div>
      <p className="mt-2 text-[11px] text-amber-200/60">
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
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-6">
      <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-neutral-900 p-6">
        <h2 className="text-lg font-semibold">Age verification</h2>
        <p className="mt-2 text-sm text-neutral-400">
          The destination &quot;{label}&quot; is for adults only. By continuing you confirm you are
          18 or older.
        </p>
        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-md px-3 py-1.5 text-sm text-neutral-400 hover:text-white"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="rounded-md bg-emerald-500 px-3 py-1.5 text-sm font-medium text-neutral-950 hover:bg-emerald-400"
          >
            I&apos;m 18 or older
          </button>
        </div>
      </div>
    </div>
  );
}
