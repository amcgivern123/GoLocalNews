import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import rehypeVideo from './src/plugins/rehype-video.mjs';
import { site } from './src/lib/network.mjs';

// One codebase, many sites: SITE_ID picks the domain, brand and output folder.
export default defineConfig({
  site: site.domain,
  outDir: `./dist/${site.id}`,
  trailingSlash: 'always',
  integrations: [sitemap()],
  markdown: { rehypePlugins: [rehypeVideo] },
});
