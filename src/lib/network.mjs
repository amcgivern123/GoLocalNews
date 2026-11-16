// Which site is being built (SITE_ID), plus the syndication rules.
// Plain JS so astro.config.mjs and the scripts can use it too.
import config from '../../sites.json' with { type: 'json' };

export const sites = config.sites;
export const categories = config.categories;
export const hub = sites.find((s) => s.id === config.hub);

const id = process.env.SITE_ID || config.hub;
export const site = sites.find((s) => s.id === id);
if (!site) throw new Error(`Unknown SITE_ID "${id}". Check sites.json.`);
export const isHub = site.id === hub.id;

// Is this article or offer carried by the site being built? The hub carries everything.
export function onThisSite(entry) {
  const list = entry.data.sites ?? ['all'];
  return isHub || list.includes('all') || list.includes(site.id);
}

// Canonical URL for an article on this site.
// Town copies point to the hub, unless the switch is off or this site is in rankOn.
export function canonicalFor(article) {
  const p = `/news/${article.id}/`;
  const self = isHub || !article.data.canonicalToHub || article.data.rankOn.includes(site.id);
  return new URL(p, self ? site.domain : hub.domain).href;
}
