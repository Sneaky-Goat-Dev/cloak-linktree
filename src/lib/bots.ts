// Search-engine and SEO scrapers — get a decoy payload.
const SCRAPER_UA = /(googlebot|bingbot|yandex|baiduspider|duckduckbot|ahrefsbot|semrushbot|mj12bot|dotbot|petalbot|seznambot|sogou|exabot|gptbot|ccbot|claudebot|amazonbot|applebot|bytespider|scrapy|python-requests|curl\/|wget\/|httpclient|java\/|go-http-client|libwww-perl|node-fetch|axios)/i;

// Social link previewers — get real OG metadata so unfurls work.
// They never see destination URLs (HTML has none), so they're safe to serve real content.
const SOCIAL_UA = /(twitterbot|facebookexternalhit|facebookcatalog|linkedinbot|slackbot|discordbot|telegrambot|whatsapp|pinterest|redditbot|skypeuripreview|vkshare|line-bot|googlebot-image)/i;

// In-app browsers (Instagram, TikTok, Snapchat, etc.) — show breakout banner.
const IN_APP_UA = /(Instagram|FBAN|FBAV|FB_IAB|FBIOS|Threads|TikTok|musical_ly|BytedanceWebview|Snapchat|Line|MicroMessenger|Twitter|XiaoHongShu|Pinterest)/i;

export function isScraper(ua: string | null | undefined): boolean {
  if (!ua) return false;
  // Allow social previewers; they're not scrapers for our purposes.
  if (SOCIAL_UA.test(ua)) return false;
  return SCRAPER_UA.test(ua);
}

export function isSocialPreviewer(ua: string | null | undefined): boolean {
  if (!ua) return false;
  return SOCIAL_UA.test(ua);
}

export function isInAppBrowser(ua: string | null | undefined): boolean {
  if (!ua) return false;
  return IN_APP_UA.test(ua);
}
