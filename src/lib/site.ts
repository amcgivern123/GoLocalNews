import fs from 'node:fs';
import { site, hub, isHub, categories } from './network.mjs';

export { hub, isHub };

const brand = `/brand/${site.id}`;
// Your own logo files (made by `npm run brand` from brand-src/), if this site has them.
const fullLogoInfo = `./public${brand}/logo-full.json`;
const fullLogo = fs.existsSync(fullLogoInfo)
  ? { src: `${brand}/logo-full.webp`, ...(JSON.parse(fs.readFileSync(fullLogoInfo, 'utf8')) as { width: number; height: number }) }
  : null;

export const SITE = {
  id: site.id as string,
  name: site.name as string,
  url: site.domain as string,
  host: new URL(site.domain).host,
  town: site.town as string,
  tagline: site.tagline as string,
  description:
    site.description ??
    `Local business news, new openings and special offers from independent businesses across ${site.town}.`,
  logo: site.logo as { words: string[]; highlight: number; initials: string; shape: string },
  colors: site.colors as { accent: string; ink: string },
  fullLogo,
  brand: {
    icon: fullLogo ? `${brand}/icon-192.png` : `${brand}/icon.svg`,
    iconType: fullLogo ? 'image/png' : 'image/svg+xml',
    icon48: `${brand}/icon-48.png`,
    appleTouch: `${brand}/apple-touch-icon.png`,
    logoPng: `${brand}/logo.png`,
  },
  defaultImage: `${brand}/og-default.png`,
  social: {
    facebook: site.social?.facebook ?? '',
    instagram: site.social?.instagram ?? '',
    linkedin: site.social?.linkedin ?? '',
  },
};

export const CATEGORIES = categories as Record<string, string>;
export type CategorySlug = string;
export const CATEGORY_SLUGS = Object.keys(CATEGORIES) as [string, ...string[]];

export function formatDate(d: Date) {
  return d.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'Europe/London',
  });
}
