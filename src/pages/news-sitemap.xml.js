// Google News sitemap: stories from the last 48 hours whose canonical is on this site.
import { getArticles } from '../lib/content';
import { canonicalFor } from '../lib/network.mjs';
import { SITE } from '../lib/site';

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

export async function GET() {
  const cutoff = Date.now() - 48 * 3600 * 1000;
  const items = (await getArticles()).filter(
    (a) => a.data.date.getTime() > cutoff && canonicalFor(a).startsWith(SITE.url),
  );
  const urls = items
    .map(
      (a) =>
        `<url><loc>${esc(canonicalFor(a))}</loc><news:news><news:publication><news:name>${esc(SITE.name)}</news:name>` +
        `<news:language>en</news:language></news:publication><news:publication_date>${a.data.date.toISOString()}</news:publication_date>` +
        `<news:title>${esc(a.data.title)}</news:title></news:news></url>`,
    )
    .join('\n');
  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">\n${urls}\n</urlset>\n`,
    { headers: { 'Content-Type': 'application/xml' } },
  );
}
