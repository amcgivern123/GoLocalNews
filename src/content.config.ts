import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';
import { CATEGORY_SLUGS } from './lib/site';

// One Markdown file per article in src/content/articles, shared by every site.
const articles = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/articles' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),              // standfirst + Google description
    date: z.coerce.date(),
    category: z.enum(CATEGORY_SLUGS),
    area: z.string().optional(),          // e.g. "Lisburn Road"
    author: z.string().optional(),        // blank = the site's own name
    draft: z.boolean().default(false),

    // Homepage lead story; drops off after pinnedUntil.
    pinned: z.boolean().default(false),
    pinnedUntil: z.coerce.date().optional(),

    // Syndication
    sites: z.array(z.string()).default(['all']),   // "all" or a list of site ids
    canonicalToHub: z.boolean().default(true),     // town copies point to the hub
    rankOn: z.array(z.string()).default([]),       // sites whose copy may rank on its own

    // Paid press release: labelled, business link marked sponsored.
    pressRelease: z.boolean().default(false),

    // Media
    image: z.string().optional(),         // e.g. /images/shopfront.jpg
    imageAlt: z.string().optional(),
    imageCaption: z.string().optional(),
    image2: z.string().optional(),
    image2Alt: z.string().optional(),
    image2Caption: z.string().optional(),
    youtube: z.string().optional(),       // YouTube link or video ID

    // Business details box at the foot of the article
    business: z
      .object({
        name: z.string().optional(),
        address: z.string().optional(),
        phone: z.string().optional(),
        email: z.string().optional(),
        website: z.string().optional(),
        map: z.string().optional(),       // Google Maps embed link or the whole <iframe> code
      })
      .optional(),
  }),
});

// One file per offer in src/content/offers
const offers = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/offers' }),
  schema: z.object({
    business: z.string(),
    offer: z.string(),
    area: z.string().optional(),
    ends: z.coerce.date(),
    link: z.string().optional(),
    details: z.string().optional(),
    sites: z.array(z.string()).default(['all']),
  }),
});

const authors = defineCollection({
  loader: glob({ pattern: '*.json', base: './src/content/authors' }),
  schema: z.object({ name: z.string(), role: z.string(), bio: z.string(), url: z.string().optional() }),
});

// Local intros written by `npm run localise`: { "<site-id>": "intro sentence" }
const intros = defineCollection({
  loader: glob({ pattern: '*.json', base: './src/content/intros' }),
  schema: z.record(z.string(), z.string()),
});

export const collections = { articles, offers, authors, intros };
