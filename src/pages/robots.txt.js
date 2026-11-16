import { SITE } from '../lib/site';

export function GET() {
  return new Response(
    `User-agent: *\nAllow: /\nDisallow: /form.php\n\nSitemap: ${SITE.url}/sitemap-index.xml\nSitemap: ${SITE.url}/news-sitemap.xml\n`,
    { headers: { 'Content-Type': 'text/plain' } },
  );
}
