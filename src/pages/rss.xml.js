import rss from '@astrojs/rss';
import { getArticles } from '../lib/content';
import { SITE } from '../lib/site';

export async function GET(context) {
  const articles = await getArticles();
  return rss({
    title: SITE.name,
    description: SITE.description,
    site: context.site,
    items: articles.slice(0, 50).map((a) => ({
      title: a.data.title,
      description: a.data.description,
      pubDate: a.data.date,
      link: `/news/${a.id}/`,
    })),
  });
}
