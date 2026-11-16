import { getCollection, getEntry, type CollectionEntry } from 'astro:content';
import { onThisSite } from './network.mjs';
import { SITE } from './site';

export type Article = CollectionEntry<'articles'>;

/** Published articles carried by this site, newest first. Drafts and future-dated articles are hidden. */
export async function getArticles(): Promise<Article[]> {
  const now = new Date();
  const all = await getCollection('articles', (a) => !a.data.draft && a.data.date <= now && onThisSite(a));
  return all.sort((a, b) => b.data.date.getTime() - a.data.date.getTime());
}

/** Pinned, and not past its "pinned until" date. */
export function isPinnedNow(a: Article) {
  if (!a.data.pinned) return false;
  if (!a.data.pinnedUntil) return true;
  const end = new Date(a.data.pinnedUntil);
  end.setHours(23, 59, 59, 999);
  return end >= new Date();
}

/** The homepage lead: the newest pinned article, otherwise the newest article. */
export function pickLead(articles: Article[]) {
  return articles.find(isPinnedNow) ?? articles[0];
}

/** Offers carried by this site that haven't ended yet, ending soonest first. */
export async function getLiveOffers() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const all = await getCollection('offers', (o) => o.data.ends >= today && onThisSite(o));
  return all.sort((a, b) => a.data.ends.getTime() - b.data.ends.getTime());
}

/** Byline name and, if the author has a bio file, a link to their page. */
export async function authorInfo(a: Article) {
  const name = a.data.author ?? SITE.name;
  const authors = await getCollection('authors');
  const match = authors.find((x) => x.data.name.toLowerCase() === name.toLowerCase());
  return { name, url: match ? `/authors/${match.id}/` : undefined, entry: match };
}

/** This site's local intro for an article, written by the localise script. */
export async function localIntro(a: Article) {
  const intros = await getEntry('intros', a.id);
  return (intros?.data as Record<string, string> | undefined)?.[SITE.id];
}

export const articleUrl = (a: Article) => `/news/${a.id}/`;
