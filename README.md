# Cloak

A link-in-bio (Linktree-style) MVP that **does not leak destination URLs** to bots, scrapers, or referrers.

## Protections

| # | Protection | How |
|---|---|---|
| 1 | HTML contains no destination URLs | Server component strips `url` before crossing the server/client boundary; only labels render |
| 2 | Link API is POST-only | `GET /api/links` → 405; POST required |
| 3 | Bot user-agents served a decoy payload | UA matched against scraper regex; decoy profile + decoy tokens returned |
| 4 | Signed short-lived (15m) redirect tokens | `jose` HS256 JWT of `{ slug, linkId }`, `exp = 15 min` |
| 5 | Referrer policy: no-referrer | `<meta name="referrer">`, response header on `/r/*`, middleware sets it site-wide |
| 6 | noopener + noreferrer | Click handler uses `window.open(url, "_blank", "noopener,noreferrer")` |
| 7 | robots: noindex, nofollow | `robots.txt` (Disallow /), `<meta name="robots">`, `X-Robots-Tag` header |
| 8 | In-app browser breakout banner | Detects Instagram, TikTok, Snap, FB, etc.; offers Chrome `intent://` on Android, copy-link + instructions on iOS |
| 9 | 18+ age-gate modal before destination | Per-link `ageGated` flag; modal must be confirmed before token is redeemed |
| 10 | URL query string wiped on load | `history.replaceState({}, '', location.pathname)` on mount |

Plus same-origin enforcement on the link API and a double-submit CSRF token to keep simple `curl`/scripted scraping from working even with the right UA.

## How it works

1. `/[slug]` server-renders the page with **only labels** — no destination URLs in the HTML or RSC payload.
2. Middleware sets a same-site CSRF cookie.
3. The client component POSTs to `/api/links` with the cookie echoed in `x-csrf-token`. The API returns `[{ id, label, ageGated, token }]` where `token` is a 15-minute HS256 JWT.
4. Clicking a link opens `/r/<token>` in a new tab with `rel="noopener noreferrer"`. The route verifies the signature, looks up the URL server-side, and 302s with `Referrer-Policy: no-referrer`. **The destination URL never reaches the client.**
5. Known scraper user-agents (Googlebot, Ahrefs, Semrush, scrapy, curl, etc.) get a decoy profile with fake links. Social previewers (Twitterbot, Slackbot, Discordbot, etc.) get real OG metadata so unfurls work — they never see destination URLs anyway.

## Running locally

```bash
cp .env.example .env.local
openssl rand -hex 32   # paste into LINK_SIGNING_SECRET

npm install
npm run dev
# open http://localhost:3000/demo
```

## Deploying

Set `LINK_SIGNING_SECRET` in your hosting provider's env (Vercel: Project Settings → Environment Variables) before the first deploy.

## Scope of this MVP

- Single seeded demo profile at `/demo` (data in `src/lib/data.ts`).
- No admin UI, no auth, no database.
- Drop in a real DB (Postgres / KV) and an admin route to make this multi-tenant.
